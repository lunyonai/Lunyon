import { AppError } from "../middleware/errorHandler.js";
import { decodeGmailPayload, headerValue, type GmailMimePart } from "./gmail/decode.js";
import { applyGmailFolderParams, type GmailFolder } from "./gmail/folder.js";
import { sanitizeGmailHtml } from "./gmail/sanitize.js";
import { getGmailConnectionStatus, getValidGmailAccessToken } from "./gmailConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const METADATA_CONCURRENCY = 10;

export type GmailMessageSummary = {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  internalDate: string | null;
  snippet: string | null;
  unread: boolean;
  labelIds: string[];
};

export type GmailMessageDetail = GmailMessageSummary & {
  cc: string | null;
  messageIdHeader: string | null;
  references: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
};

export type GmailListPage = {
  folder: GmailFolder;
  messages: GmailMessageSummary[];
  nextPageToken: string | null;
  resultSizeEstimate: number | null;
};

export type GmailThreadDetail = {
  id: string;
  messages: GmailMessageDetail[];
};

export { getGmailConnectionStatus };

export async function getGmailProfile(userId: string) {
  const token = await getValidGmailAccessToken(userId);
  return gmailJson<{ emailAddress?: string; messagesTotal?: number; threadsTotal?: number }>(
    `${GMAIL_BASE}/profile`,
    token,
  );
}

async function gmailJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) mapGoogleApiError(response.status);
  return (await response.json()) as T;
}

// Runs fn over items with at most `limit` in flight, preserving input order.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function summarize(body: {
  id?: string;
  threadId?: string;
  snippet?: string;
  labelIds?: string[];
  internalDate?: string;
  payload?: { headers?: Array<{ name?: string; value?: string }> };
}): GmailMessageSummary | null {
  if (!body.id) return null;
  const labelIds = Array.isArray(body.labelIds) ? body.labelIds.slice(0, 20) : [];
  return {
    id: body.id,
    threadId: body.threadId ?? null,
    subject: headerValue(body.payload?.headers, "Subject"),
    from: headerValue(body.payload?.headers, "From"),
    to: headerValue(body.payload?.headers, "To"),
    date: headerValue(body.payload?.headers, "Date"),
    internalDate: body.internalDate ?? null,
    snippet: body.snippet?.slice(0, 500) ?? null,
    unread: labelIds.includes("UNREAD"),
    labelIds,
  };
}

function toDetail(
  body: {
    id?: string;
    threadId?: string;
    snippet?: string;
    labelIds?: string[];
    internalDate?: string;
    payload?: GmailMimePart;
  },
): GmailMessageDetail | null {
  const summary = summarize(body);
  if (!summary) return null;
  const decoded = decodeGmailPayload(body.payload);
  const headers = body.payload?.headers;
  return {
    ...summary,
    cc: headerValue(headers, "Cc"),
    messageIdHeader: headerValue(headers, "Message-ID") ?? headerValue(headers, "Message-Id"),
    references: headerValue(headers, "References"),
    bodyText: decoded.text,
    bodyHtml: decoded.html ? sanitizeGmailHtml(decoded.html) : null,
    attachments: decoded.attachments,
  };
}

export async function listGmailMessages(
  userId: string,
  options: {
    limit?: number;
    pageToken?: string;
    query?: string;
    folder?: GmailFolder;
  } = {},
): Promise<GmailListPage> {
  const token = await getValidGmailAccessToken(userId);
  const folder = options.folder ?? "all";
  const maxResults = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (options.pageToken) params.set("pageToken", options.pageToken.slice(0, 1024));
  applyGmailFolderParams(params, folder, options.query);

  const list = await gmailJson<{
    messages?: Array<{ id: string; threadId?: string }>;
    nextPageToken?: string;
    resultSizeEstimate?: number;
  }>(`${GMAIL_BASE}/messages?${params.toString()}`, token);

  const ids = (list.messages ?? []).slice(0, maxResults);
  const details = await mapWithConcurrency(ids, METADATA_CONCURRENCY, (item) =>
    gmailJson<{
      id?: string;
      threadId?: string;
      snippet?: string;
      labelIds?: string[];
      internalDate?: string;
      payload?: { headers?: Array<{ name?: string; value?: string }> };
    }>(
      `${GMAIL_BASE}/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
      token,
    ),
  );
  const messages = details
    .map((detail) => summarize(detail))
    .filter((summary): summary is GmailMessageSummary => summary !== null);

  return {
    folder,
    messages,
    nextPageToken: list.nextPageToken ?? null,
    resultSizeEstimate: list.resultSizeEstimate ?? null,
  };
}

export async function searchGmailMessages(
  userId: string,
  query: string,
  options: { limit?: number; pageToken?: string; folder?: GmailFolder } = {},
) {
  return listGmailMessages(userId, { ...options, query });
}

export async function listGmailThreads(
  userId: string,
  options: { limit?: number; pageToken?: string; query?: string } = {},
) {
  const token = await getValidGmailAccessToken(userId);
  const maxResults = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (options.pageToken) params.set("pageToken", options.pageToken.slice(0, 1024));
  if (options.query?.trim()) params.set("q", options.query.trim().slice(0, 500));
  return gmailJson<{
    threads?: Array<{ id?: string; snippet?: string; historyId?: string }>;
    nextPageToken?: string;
  }>(`${GMAIL_BASE}/threads?${params.toString()}`, token);
}

export async function getGmailMessage(userId: string, messageId: string): Promise<GmailMessageDetail> {
  if (!/^[a-zA-Z0-9_-]+$/.test(messageId) || messageId.length > 128) {
    throw new AppError("Invalid message id", 400);
  }

  const token = await getValidGmailAccessToken(userId);
  const body = await gmailJson<{
    id?: string;
    threadId?: string;
    snippet?: string;
    labelIds?: string[];
    internalDate?: string;
    payload?: GmailMimePart;
  }>(`${GMAIL_BASE}/messages/${encodeURIComponent(messageId)}?format=full`, token);

  const detail = toDetail(body);
  if (!detail) throw new AppError("Message not found", 404);
  return detail;
}

export async function getGmailThread(userId: string, threadId: string): Promise<GmailThreadDetail> {
  if (!/^[a-zA-Z0-9_-]+$/.test(threadId) || threadId.length > 128) {
    throw new AppError("Invalid thread id", 400);
  }

  const token = await getValidGmailAccessToken(userId);
  const body = await gmailJson<{
    id?: string;
    messages?: Array<{
      id?: string;
      threadId?: string;
      snippet?: string;
      labelIds?: string[];
      internalDate?: string;
      payload?: GmailMimePart;
    }>;
  }>(`${GMAIL_BASE}/threads/${encodeURIComponent(threadId)}?format=full`, token);

  const seen = new Set<string>();
  const messages = (body.messages ?? [])
    .map((item) => toDetail(item))
    .filter((item): item is GmailMessageDetail => {
      if (!item || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0))
    .slice(0, 40);

  if (!body.id || messages.length === 0) throw new AppError("Thread not found", 404);
  return { id: body.id, messages };
}
