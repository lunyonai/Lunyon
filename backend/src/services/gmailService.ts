import { AppError } from "../middleware/errorHandler.js";
import { getValidGoogleAccessToken } from "./googleConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  snippet: string | null;
};

function header(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string,
) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())
    ?.value ?? null;
}

function extractText(payload: unknown, depth = 0): string | null {
  if (!payload || typeof payload !== "object" || depth > 8) return null;
  const part = payload as {
    mimeType?: string;
    body?: { data?: string };
    parts?: unknown[];
  };

  if (part.mimeType?.startsWith("text/plain") && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf8").slice(0, 20000);
  }

  if (Array.isArray(part.parts)) {
    for (const child of part.parts) {
      const text = extractText(child, depth + 1);
      if (text) return text;
    }
  }

  if (part.mimeType?.startsWith("text/html") && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf8").slice(0, 20000);
  }

  return null;
}

export async function listGmailMessages(userId: string, limit: number) {
  const token = await getValidGoogleAccessToken(userId);
  const maxResults = Math.min(Math.max(limit, 1), 15);
  const listResponse = await fetch(
    `${GMAIL_BASE}/messages?maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listResponse.ok) mapGoogleApiError(listResponse.status);

  const list = (await listResponse.json()) as {
    messages?: Array<{ id: string; threadId?: string }>;
  };
  const ids = (list.messages ?? []).slice(0, maxResults);

  const messages: GmailMessageSummary[] = [];
  for (const item of ids) {
    const detail = await fetch(
      `${GMAIL_BASE}/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!detail.ok) continue;
    const body = (await detail.json()) as {
      id: string;
      threadId?: string;
      snippet?: string;
      payload?: { headers?: Array<{ name?: string; value?: string }> };
    };
    messages.push({
      id: body.id,
      threadId: body.threadId ?? item.threadId ?? null,
      subject: header(body.payload?.headers, "Subject"),
      from: header(body.payload?.headers, "From"),
      to: header(body.payload?.headers, "To"),
      date: header(body.payload?.headers, "Date"),
      snippet: body.snippet ?? null,
    });
  }

  return messages;
}

export async function getGmailMessage(userId: string, messageId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(messageId) || messageId.length > 128) {
    throw new AppError("Invalid message id", 400);
  }

  const token = await getValidGoogleAccessToken(userId);
  const response = await fetch(
    `${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) mapGoogleApiError(response.status);

  const body = (await response.json()) as {
    id: string;
    threadId?: string;
    snippet?: string;
    payload?: {
      headers?: Array<{ name?: string; value?: string }>;
      mimeType?: string;
      body?: { data?: string };
      parts?: unknown[];
    };
  };

  return {
    id: body.id,
    threadId: body.threadId ?? null,
    subject: header(body.payload?.headers, "Subject"),
    from: header(body.payload?.headers, "From"),
    to: header(body.payload?.headers, "To"),
    date: header(body.payload?.headers, "Date"),
    snippet: body.snippet ?? null,
    bodyText: extractText(body.payload),
  };
}
