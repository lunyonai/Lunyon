import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { getGmailMessage } from "./gmailService.js";
import {
  assertGmailSendAccess,
  getGmailConnectionStatus,
  getValidGmailAccessToken,
} from "./gmailConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";
import { buildRfc822, parseRecipientList, rfc822ToRaw } from "./gmail/mime.js";

const INTENT_TTL_MS = 10 * 60 * 1000;
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export const gmailSendDraftSchema = z.object({
  action: z.enum(["send", "reply"]),
  idempotencyKey: z.string().min(8).max(80),
  replyToMessageId: z.string().min(1).max(128).optional(),
  replyAll: z.boolean().optional(),
  to: z.array(z.string().max(254)).min(1).max(10),
  cc: z.array(z.string().max(254)).max(10).optional(),
  bcc: z.array(z.string().max(254)).max(10).optional(),
  subject: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(100_000),
});

export type GmailSendDraft = z.infer<typeof gmailSendDraftSchema>;

function dbUnavailable(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Gmail sending is not available yet", 503);
  }
  throw new AppError("Could not complete this request", 400);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isAbandonedResult(result: unknown) {
  return Boolean(
    result &&
      typeof result === "object" &&
      "abandoned" in result &&
      (result as { abandoned?: unknown }).abandoned === true,
  );
}

async function rateLimitSends(userId: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("gmail_send_intents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) dbUnavailable(error);
  if ((count ?? 0) >= 20) {
    throw new AppError("Please wait before sending more email", 429);
  }
}

async function audit(
  userId: string,
  action: string,
  recipientCount: number,
  threadId: string | null,
  messageId: string | null,
  status: "ok" | "error",
) {
  await supabaseAdmin.from("gmail_send_audit").insert({
    user_id: userId,
    action,
    recipient_count: recipientCount,
    thread_id: threadId,
    gmail_message_id: messageId,
    status,
  });
}

function replySubject(subject: string) {
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

export async function previewGmailSend(userId: string, raw: unknown) {
  await assertGmailSendAccess(userId);
  await rateLimitSends(userId);
  const draft = gmailSendDraftSchema.parse(raw);
  const status = await getGmailConnectionStatus(userId);
  const sender = status.email;
  if (!sender) throw new AppError("Gmail account email is missing", 409);

  const to = parseRecipientList(draft.to, "to");
  const cc = parseRecipientList(draft.cc, "cc");
  const bcc = parseRecipientList(draft.bcc, "bcc");

  let threadId: string | null = null;
  let inReplyTo: string | null = null;
  let references: string | null = null;
  let subject = draft.subject;

  if (draft.action === "reply") {
    if (!draft.replyToMessageId) throw new AppError("Message id is required", 400);
    const original = await getGmailMessage(userId, draft.replyToMessageId);
    threadId = original.threadId;
    inReplyTo = original.messageIdHeader;
    references = [original.references, original.messageIdHeader].filter(Boolean).join(" ").trim() || null;
    if (!draft.subject.trim()) subject = replySubject(original.subject || "Message");
  }

  const payload: GmailSendDraft = {
    ...draft,
    to,
    cc,
    bcc,
    subject,
  };

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS).toISOString();
  const fields = {
    user_id: userId,
    action: payload.action,
    payload: { ...payload, threadId, inReplyTo, references, from: sender },
    confirmation_hash: hashToken(token),
    idempotency_key: payload.idempotencyKey,
    expires_at: expiresAt,
    claimed_at: null,
    consumed_at: null,
    result: null,
  };

  const existing = await supabaseAdmin
    .from("gmail_send_intents")
    .select("id, claimed_at, consumed_at, result")
    .eq("user_id", userId)
    .eq("idempotency_key", payload.idempotencyKey)
    .maybeSingle();
  if (existing.error) dbUnavailable(existing.error);
  const row = existing.data;
  if (row?.claimed_at && !row.consumed_at) {
    throw new AppError("This send is already in progress", 409, "IDEMPOTENCY");
  }
  if (row?.consumed_at && row.result && !isAbandonedResult(row.result)) {
    throw new AppError("This message was already sent", 409, "IDEMPOTENCY");
  }

  if (row && !row.claimed_at) {
    const updated = await supabaseAdmin
      .from("gmail_send_intents")
      .update(fields)
      .eq("id", row.id)
      .eq("user_id", userId)
      .is("claimed_at", null)
      .select("id")
      .maybeSingle();
    if (updated.error) dbUnavailable(updated.error);
    if (!updated.data) throw new AppError("This send is already in progress", 409, "IDEMPOTENCY");
  } else {
    const inserted = await supabaseAdmin.from("gmail_send_intents").insert(fields);
    if (inserted.error) {
      if (inserted.error.code === "23505") {
        throw new AppError("This send is already in progress", 409, "IDEMPOTENCY");
      }
      dbUnavailable(inserted.error);
    }
  }

  return {
    confirmationToken: token,
    expiresInSeconds: 600,
    action: payload.action,
    summary: {
      from: sender,
      to,
      cc,
      bcc,
      subject,
      text: payload.text,
      threadId,
      replyToMessageId: payload.replyToMessageId ?? null,
    },
  };
}

async function executeSend(userId: string, stored: Record<string, unknown>) {
  const to = parseRecipientList(stored.to as string[], "to");
  const cc = parseRecipientList((stored.cc as string[]) ?? [], "cc");
  const bcc = parseRecipientList((stored.bcc as string[]) ?? [], "bcc");
  const from = String(stored.from ?? "");
  const rfc = buildRfc822({
    from,
    to,
    cc,
    bcc,
    subject: String(stored.subject ?? ""),
    text: String(stored.text ?? ""),
    inReplyTo: typeof stored.inReplyTo === "string" ? stored.inReplyTo : null,
    references: typeof stored.references === "string" ? stored.references : null,
  });
  const token = await getValidGmailAccessToken(userId, true);
  const body: Record<string, unknown> = { raw: rfc822ToRaw(rfc) };
  if (typeof stored.threadId === "string" && stored.threadId) body.threadId = stored.threadId;

  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) mapGoogleApiError(response.status);
  const sent = (await response.json()) as { id?: string; threadId?: string };
  return {
    gmailMessageId: sent.id ?? null,
    threadId: sent.threadId ?? (typeof stored.threadId === "string" ? stored.threadId : null),
    recipientCount: to.length + cc.length + bcc.length,
  };
}

export async function commitGmailSend(
  userId: string,
  confirmationToken: string,
  expectedReplyId?: string,
) {
  await assertGmailSendAccess(userId);
  if (!confirmationToken) throw new AppError("Confirmation is required", 400);
  const { data, error } = await supabaseAdmin
    .from("gmail_send_intents")
    .select("*")
    .eq("user_id", userId)
    .eq("confirmation_hash", hashToken(confirmationToken))
    .maybeSingle();
  if (error) dbUnavailable(error);
  if (!data || isAbandonedResult(data.result)) {
    throw new AppError("Confirmation is invalid or expired", 400);
  }
  if (data.consumed_at && data.result) {
    return { ok: true, replayed: true, ...(data.result as object) };
  }
  if (data.claimed_at) {
    throw new AppError("This send is already in progress", 409, "IDEMPOTENCY");
  }
  const expired = new Date(data.expires_at).getTime() < Date.now();
  if (expired) {
    throw new AppError("Confirmation expired. Review the message again.", 400);
  }

  const claim = await supabaseAdmin
    .from("gmail_send_intents")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", data.id)
    .eq("user_id", userId)
    .is("claimed_at", null)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();
  if (claim.error) dbUnavailable(claim.error);
  if (!claim.data) {
    const again = await supabaseAdmin
      .from("gmail_send_intents")
      .select("consumed_at, result")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (again.data?.consumed_at && again.data.result) {
      return { ok: true, replayed: true, ...(again.data.result as object) };
    }
    throw new AppError("This send is already in progress", 409, "IDEMPOTENCY");
  }

  const payload = data.payload as Record<string, unknown>;
  if (expectedReplyId && payload.replyToMessageId !== expectedReplyId) {
    throw new AppError("Confirmation does not match this message", 400);
  }
  try {
    const result = await executeSend(userId, payload);
    const saved = await supabaseAdmin
      .from("gmail_send_intents")
      .update({
        consumed_at: new Date().toISOString(),
        result,
        payload: {
          redacted: true,
          action: payload.action ?? "send",
          threadId: result.threadId,
        },
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (saved.error) throw new AppError("Could not record the send confirmation", 503);
    await audit(
      userId,
      String(payload.action ?? "send"),
      result.recipientCount,
      result.threadId,
      result.gmailMessageId,
      "ok",
    );
    return { ok: true, action: payload.action, ...result };
  } catch (err) {
    await audit(
      userId,
      String(payload.action ?? "send"),
      Array.isArray(payload.to) ? payload.to.length : 0,
      typeof payload.threadId === "string" ? payload.threadId : null,
      null,
      "error",
    );
    const retryable = !(err instanceof AppError) || err.statusCode >= 500 || err.statusCode === 429;
    if (!retryable) {
      await supabaseAdmin
        .from("gmail_send_intents")
        .update({ claimed_at: null })
        .eq("id", data.id)
        .eq("user_id", userId)
        .is("consumed_at", null);
    }
    throw err;
  }
}

/** Confirmed send only. Do not call from unattended AI. */
export async function sendGmailMessage(userId: string, input: { confirmationToken: string }) {
  return commitGmailSend(userId, input.confirmationToken);
}

export async function replyToGmailMessage(
  userId: string,
  messageId: string,
  input: { confirmationToken: string },
) {
  return commitGmailSend(userId, input.confirmationToken, messageId);
}

export { replySubject };
