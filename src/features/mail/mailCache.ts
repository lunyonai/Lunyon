import {
  api,
  type GmailFolder,
  type GmailListPage,
  type GmailMessageDetail,
  type GmailMessageSummary,
} from "../../lib/api";

/**
 * App-wide Gmail cache, so the Mail page renders instantly when revisited and can be warmed
 * ahead of time (sidebar hover, dashboard inbox widget). Entries belong to one user: using a
 * different user id, or calling clearMailCache() on sign-out, drops everything.
 */

export const MAIL_PAGE_SIZE = 20;
/** A first page younger than this is reused as-is instead of being fetched again. */
const LIST_FRESH_MS = 20_000;
const THREAD_TTL_MS = 2 * 60_000;

type ListEntry = { messages: GmailMessageSummary[]; nextPage: string | null; fetchedAt: number };
type ThreadEntry = { messages: GmailMessageDetail[]; fetchedAt: number };

let owner: string | null = null;
const lists = new Map<string, ListEntry>();
const listInflight = new Map<string, Promise<GmailListPage>>();
const threads = new Map<string, ThreadEntry>();
const threadInflight = new Map<string, Promise<GmailMessageDetail[]>>();

export function clearMailCache() {
  owner = null;
  lists.clear();
  listInflight.clear();
  threads.clear();
  threadInflight.clear();
}

function scope(userId: string) {
  if (owner !== userId) {
    clearMailCache();
    owner = userId;
  }
}

function listKey(folder: GmailFolder, search: string) {
  return `${folder}|${search.trim()}`;
}

export function fetchMailPage(folder: GmailFolder, search: string, pageToken?: string) {
  const options = { pageToken, limit: MAIL_PAGE_SIZE, folder };
  return search.trim() ? api.gmailSearch(search.trim(), options) : api.gmailInbox(options);
}

export function getCachedList(userId: string, folder: GmailFolder, search: string) {
  scope(userId);
  return lists.get(listKey(folder, search)) ?? null;
}

export function storeList(
  userId: string,
  folder: GmailFolder,
  search: string,
  messages: GmailMessageSummary[],
  nextPage: string | null,
) {
  scope(userId);
  lists.set(listKey(folder, search), { messages, nextPage, fetchedAt: Date.now() });
}

/**
 * First page of a folder/search. Reuses a page younger than `maxAgeMs` and joins a request
 * already in flight (e.g. a hover prefetch), so warming and opening never fetch twice.
 */
export function loadFirstPage(
  userId: string,
  folder: GmailFolder,
  search: string,
  maxAgeMs = LIST_FRESH_MS,
): Promise<GmailListPage> {
  scope(userId);
  const key = listKey(folder, search);
  const cached = lists.get(key);
  if (cached && Date.now() - cached.fetchedAt < maxAgeMs) {
    return Promise.resolve({
      folder,
      messages: cached.messages,
      nextPageToken: cached.nextPage,
      resultSizeEstimate: null,
    });
  }
  const inflight = listInflight.get(key);
  if (inflight) return inflight;
  const request = fetchMailPage(folder, search)
    .then((page) => {
      if (owner === userId && page.folder === folder) {
        lists.set(key, { messages: page.messages, nextPage: page.nextPageToken, fetchedAt: Date.now() });
      }
      return page;
    })
    .finally(() => listInflight.delete(key));
  listInflight.set(key, request);
  return request;
}

/** Fire-and-forget warm-up of the inbox (errors are ignored; the page shows them). */
export function prefetchInbox(userId: string) {
  loadFirstPage(userId, "inbox", "").catch(() => undefined);
}

function threadKey(item: GmailMessageSummary) {
  return item.threadId ? `thread:${item.threadId}` : `message:${item.id}`;
}

async function fetchThread(item: GmailMessageSummary): Promise<GmailMessageDetail[]> {
  if (item.threadId) {
    try {
      return (await api.gmailThread(item.threadId)).messages;
    } catch {
      // Fall back to the single message below.
    }
  }
  return [await api.gmailMessage(item.id)];
}

/** Cached, de-duplicated thread load shared by clicks and hover prefetches. */
export function loadThread(userId: string, item: GmailMessageSummary): Promise<GmailMessageDetail[]> {
  scope(userId);
  const key = threadKey(item);
  const cached = threads.get(key);
  if (cached && Date.now() - cached.fetchedAt < THREAD_TTL_MS) return Promise.resolve(cached.messages);
  const inflight = threadInflight.get(key);
  if (inflight) return inflight;
  const request = fetchThread(item)
    .then((result) => {
      if (owner === userId) threads.set(key, { messages: result, fetchedAt: Date.now() });
      return result;
    })
    .finally(() => threadInflight.delete(key));
  threadInflight.set(key, request);
  return request;
}

/** Sending or replying changes threads; drop them so the next open refetches. */
export function dropCachedThreads() {
  threads.clear();
}
