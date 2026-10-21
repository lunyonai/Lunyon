import { useEffect, useRef, useState, type FormEvent } from "react";
import { Inbox, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type GmailFolder,
  type GmailMessageDetail,
  type GmailMessageSummary,
} from "../../lib/api";
import ComposeMailModal, { type ComposeMode } from "./ComposeMailModal";

const FOLDERS: Array<{ id: GmailFolder; icon: typeof Inbox; labelKey: string }> = [
  { id: "inbox", icon: Inbox, labelKey: "app.mail.folderInbox" },
  { id: "sent", icon: Send, labelKey: "app.mail.folderSent" },
  { id: "all", icon: Mail, labelKey: "app.mail.folderAll" },
];

const THREAD_CACHE_TTL_MS = 2 * 60_000;
const PREFETCH_DELAY_MS = 150;

type CachedList = { messages: GmailMessageSummary[]; nextPage: string | null };
type CachedThread = { messages: GmailMessageDetail[]; fetchedAt: number };

function listKey(folder: GmailFolder, search: string) {
  return `${folder}|${search.trim()}`;
}

function threadKey(item: GmailMessageSummary) {
  return item.threadId ? `thread:${item.threadId}` : `message:${item.id}`;
}

function cachedThread(messages: GmailMessageDetail[]): CachedThread {
  return { messages, fetchedAt: Date.now() };
}

function isFresh(entry: CachedThread | undefined): entry is CachedThread {
  return Boolean(entry && Date.now() - entry.fetchedAt < THREAD_CACHE_TTL_MS);
}

function formatMailDate(value: string | null, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function listParty(
  item: GmailMessageSummary,
  folder: GmailFolder,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (folder === "sent") {
    return t("app.mail.toLine", { address: item.to || t("app.mail.unknownRecipient") });
  }
  return item.from || t("app.mail.unknownSender");
}

export default function MailPage() {
  const { t, locale } = useLocale();
  const localeTag = locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en";
  const [connected, setConnected] = useState(false);
  const [canRead, setCanRead] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const [sender, setSender] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [composer, setComposer] = useState<ComposeMode | null>(null);
  const [folder, setFolder] = useState<GmailFolder>("inbox");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [needsConnect, setNeedsConnect] = useState(false);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<GmailMessageDetail[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const requestSeq = useRef(0);
  const detailSeq = useRef(0);
  const folderRef = useRef(folder);
  folderRef.current = folder;
  // Per-visit caches: lists render instantly on revisit and refresh in the background;
  // threads are reused for a short TTL and shared with hover prefetches.
  const listCache = useRef(new Map<string, CachedList>());
  const threadCache = useRef(new Map<string, CachedThread>());
  const threadInflight = useRef(new Map<string, Promise<GmailMessageDetail[]>>());
  const prefetchTimer = useRef<number | null>(null);

  const focused = thread?.find((item) => item.id === selectedId) ?? thread?.[0] ?? null;

  useEffect(() => () => {
    if (prefetchTimer.current !== null) window.clearTimeout(prefetchTimer.current);
  }, []);

  async function fetchPage(target: GmailFolder, search: string, pageToken?: string) {
    const options = { pageToken, limit: 20, folder: target };
    return search.trim()
      ? api.gmailSearch(search.trim(), options)
      : api.gmailInbox(options);
  }

  function applyPage(target: GmailFolder, search: string, page: Awaited<ReturnType<typeof fetchPage>>) {
    if (page.folder !== target) return;
    listCache.current.set(listKey(target, search), {
      messages: page.messages,
      nextPage: page.nextPageToken,
    });
    setMessages(page.messages);
    setNextPage(page.nextPageToken);
  }

  /** Shows the cached list (if any) right away; returns true when it did. */
  function showCachedList(target: GmailFolder, search: string) {
    const cached = listCache.current.get(listKey(target, search));
    setMessages(cached?.messages ?? []);
    setNextPage(cached?.nextPage ?? null);
    setLoading(!cached);
    return Boolean(cached);
  }

  /** Clears the open message and discards any detail request still in flight. */
  function clearSelection() {
    detailSeq.current += 1;
    setSelectedId(null);
    setThread(null);
    setDetailLoading(false);
  }

  async function loadFolder(target: GmailFolder, search: string, seq: number) {
    const page = await fetchPage(target, search);
    if (seq !== requestSeq.current) return;
    applyPage(target, search, page);
  }

  async function bootstrap(target = folderRef.current, search = activeQuery) {
    const seq = ++requestSeq.current;
    setError("");
    setNeedsConnect(false);
    clearSelection();
    const hadCache = showCachedList(target, search);
    try {
      // Status and the first page are independent; the list endpoint answers 409 when
      // Gmail is not connected, so its result is only used once status says we can read.
      const [statusResult, pageResult] = await Promise.allSettled([
        api.gmailStatus(),
        fetchPage(target, search),
      ]);
      if (seq !== requestSeq.current) return;
      if (statusResult.status === "rejected") throw statusResult.reason;
      const status = statusResult.value;
      setConnected(status.connected);
      setCanRead(status.canRead);
      setCanSend(Boolean(status.canSend));
      setSender(status.email);
      if (!status.connected || !status.canRead) {
        setMessages([]);
        setNeedsConnect(true);
        return;
      }
      if (pageResult.status === "rejected") throw pageResult.reason;
      applyPage(target, search, pageResult.value);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      if (err instanceof ApiError && (err.status === 409 || err.code === "GMAIL_NOT_CONNECTED")) {
        setMessages([]);
        setNeedsConnect(true);
      } else if (err instanceof ApiError && (err.status === 401 || err.code === "GMAIL_READ_SCOPE")) {
        setMessages([]);
        setNeedsConnect(true);
        setError(t("app.mail.reconnectHint"));
      } else {
        // Keep a cached list on screen when only the background refresh failed.
        if (!hadCache) setMessages([]);
        setError(
          err instanceof ApiError && err.status === 429 ? t("app.mail.rateLimited") : t("app.mail.loadError"),
        );
      }
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap("inbox", "");
  }, []);

  async function selectFolder(next: GmailFolder) {
    if (next === folder && !loading) return;
    setFolder(next);
    const seq = ++requestSeq.current;
    setError("");
    clearSelection();
    const hadCache = showCachedList(next, activeQuery);
    try {
      await loadFolder(next, activeQuery, seq);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      if (!hadCache) setMessages([]);
      if (err instanceof ApiError && err.status === 429) setError(t("app.mail.rateLimited"));
      else setError(t("app.mail.loadError"));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const search = query.trim();
    setActiveQuery(search);
    const seq = ++requestSeq.current;
    setError("");
    clearSelection();
    const hadCache = showCachedList(folder, search);
    try {
      await loadFolder(folder, search, seq);
    } catch {
      if (seq !== requestSeq.current) return;
      if (!hadCache) setMessages([]);
      setError(t("app.mail.loadError"));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }

  async function handleMore() {
    if (!nextPage || loadingMore) return;
    // Bumping the sequence also drops any background refresh of the first page, which
    // would otherwise replace the list and throw away the page appended here.
    const seq = ++requestSeq.current;
    const token = nextPage;
    const target = folder;
    const search = activeQuery;
    const base = messages;
    setLoadingMore(true);
    try {
      const page = await fetchPage(target, search, token);
      if (seq !== requestSeq.current || page.folder !== target) return;
      const seen = new Set(base.map((item) => item.id));
      const merged = [...base, ...page.messages.filter((item) => !seen.has(item.id))];
      listCache.current.set(listKey(target, search), { messages: merged, nextPage: page.nextPageToken });
      setMessages(merged);
      setNextPage(page.nextPageToken);
    } catch {
      setError(t("app.mail.loadError"));
    } finally {
      setLoadingMore(false);
    }
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
  function loadThread(item: GmailMessageSummary): Promise<GmailMessageDetail[]> {
    const key = threadKey(item);
    const cached = threadCache.current.get(key);
    if (isFresh(cached)) {
      return Promise.resolve(cached.messages);
    }
    const inflight = threadInflight.current.get(key);
    if (inflight) return inflight;
    const request = fetchThread(item)
      .then((result) => {
        threadCache.current.set(key, cachedThread(result));
        return result;
      })
      .finally(() => threadInflight.current.delete(key));
    threadInflight.current.set(key, request);
    return request;
  }

  function schedulePrefetch(item: GmailMessageSummary) {
    cancelPrefetch();
    prefetchTimer.current = window.setTimeout(() => {
      prefetchTimer.current = null;
      loadThread(item).catch(() => undefined);
    }, PREFETCH_DELAY_MS);
  }

  function cancelPrefetch() {
    if (prefetchTimer.current === null) return;
    window.clearTimeout(prefetchTimer.current);
    prefetchTimer.current = null;
  }

  async function openMessage(item: GmailMessageSummary) {
    cancelPrefetch();
    const seq = ++detailSeq.current;
    setSelectedId(item.id);
    setDetailLoading(true);
    setThread(null);
    try {
      const next = await loadThread(item);
      if (seq !== detailSeq.current) return;
      setThread(next);
      setSelectedId(item.id);
    } catch {
      if (seq === detailSeq.current) setError(t("app.mail.detailError"));
    } finally {
      if (seq === detailSeq.current) setDetailLoading(false);
    }
  }

  const emptyKey =
    folder === "sent" ? "app.mail.emptySent" : folder === "all" ? "app.mail.emptyAll" : "app.mail.emptyInbox";

  const folderNav = (
    <nav aria-label={t("app.mail.folders")} className="flex gap-1 lg:flex-col">
      {FOLDERS.map((item) => {
        const Icon = item.icon;
        const active = folder === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => void selectFolder(item.id)}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition lg:flex-none lg:justify-start ${
              active
                ? "bg-[var(--lunyo-primary-soft)] text-white"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">{t("app.mail.title")}</h1>
            <p className="mt-1 text-sm text-slate-400">{t("app.mail.subtitle")}</p>
          </div>
          {canSend && (
            <button
              type="button"
              onClick={() => setComposer("compose")}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {t("app.mail.compose")}
            </button>
          )}
        </div>

        {success && <p className="text-sm text-[var(--lunyo-success)]">{success}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {connected && canRead && !canSend && (
          <p className="text-sm text-slate-400">{t("app.mail.sendRequired")}</p>
        )}

        {needsConnect && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm text-slate-300">{t("app.mail.connectHint")}</p>
            <Link
              to="/settings"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {t("app.mail.connectCta")}
            </Link>
          </div>
        )}

        {connected && canRead && (
          <>
            <form onSubmit={(event) => void handleSearch(event)} className="flex gap-2">
              <label className="sr-only" htmlFor="mail-search">
                {t("app.mail.search")}
              </label>
              <input
                id="mail-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("app.mail.searchPlaceholder")}
                className="h-10 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
              <button
                type="submit"
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t("app.mail.search")}
              </button>
            </form>

            <div className="lg:hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
              {folderNav}
            </div>

            <div className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.15fr)]">
              <aside className="hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-2 lg:block">
                {folderNav}
              </aside>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
                {loading ? (
                  <ul className="space-y-2 p-4" aria-hidden="true">
                    {[0, 1, 2, 3].map((item) => (
                      <li key={item} className="h-16 animate-pulse rounded-xl bg-slate-800/80" />
                    ))}
                  </ul>
                ) : messages.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">{t(emptyKey)}</p>
                ) : (
                  <ul className="divide-y divide-slate-800">
                    {messages.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => void openMessage(item)}
                          onMouseEnter={() => schedulePrefetch(item)}
                          onMouseLeave={cancelPrefetch}
                          className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-slate-900 ${
                            selectedId === item.id ? "bg-blue-500/10" : ""
                          }`}
                        >
                          <div className="flex w-full items-center gap-2">
                            {item.unread && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-[var(--lunyo-primary)]"
                                aria-label={t("app.mail.unread")}
                              />
                            )}
                            <p
                              className={`min-w-0 flex-1 truncate text-sm ${
                                item.unread ? "font-semibold text-white" : "text-slate-200"
                              }`}
                            >
                              {listParty(item, folder, t)}
                            </p>
                            <p className="shrink-0 text-xs text-slate-500">
                              {formatMailDate(item.date, localeTag)}
                            </p>
                          </div>
                          <p className="w-full truncate text-sm text-slate-300">
                            {item.subject || t("app.mail.noSubject")}
                          </p>
                          <p className="w-full truncate text-xs text-slate-500">{item.snippet}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {nextPage && !loading && (
                  <div className="border-t border-slate-800 p-3">
                    <button
                      type="button"
                      onClick={() => void handleMore()}
                      disabled={loadingMore}
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-800 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
                    >
                      {loadingMore ? t("app.common.loading") : t("app.mail.loadMore")}
                    </button>
                  </div>
                )}
              </div>

              <article className="min-h-80 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                {!selectedId && !detailLoading && (
                  <p className="text-sm text-slate-500">{t("app.mail.selectHint")}</p>
                )}
                {detailLoading && <p className="text-sm text-slate-500">{t("app.common.loading")}</p>}
                {thread && focused && !detailLoading && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-white">
                        {focused.subject || t("app.mail.noSubject")}
                      </h2>
                      {thread.length > 1 && (
                        <p className="mt-1 text-xs text-slate-500">
                          {t("app.mail.threadCount", { count: String(thread.length) })}
                        </p>
                      )}
                    </div>
                    {canSend && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setComposer("reply")}
                          className="flex h-9 items-center rounded-xl border border-slate-800 px-3 text-xs font-medium text-slate-200"
                        >
                          {t("app.mail.reply")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposer("replyAll")}
                          className="flex h-9 items-center rounded-xl border border-slate-800 px-3 text-xs font-medium text-slate-200"
                        >
                          {t("app.mail.replyAll")}
                        </button>
                      </div>
                    )}
                    <div className="space-y-4">
                      {thread.map((item) => (
                        <section
                          key={item.id}
                          className={`rounded-xl border p-4 ${
                            item.id === focused.id ? "border-slate-700 bg-slate-950/80" : "border-slate-800"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="w-full text-left"
                          >
                            <p className="text-sm text-slate-300">{item.from}</p>
                            {item.to && <p className="text-xs text-slate-500">{t("app.mail.toLine", { address: item.to })}</p>}
                            <p className="text-xs text-slate-500">{formatMailDate(item.date, localeTag)}</p>
                          </button>
                          {item.attachments.length > 0 && (
                            <p className="mt-2 text-xs text-slate-500">{t("app.mail.attachmentsHidden")}</p>
                          )}
                          {item.bodyHtml ? (
                            <iframe
                              title={t("app.mail.body")}
                              sandbox="allow-popups allow-popups-to-escape-sandbox"
                              referrerPolicy="no-referrer"
                              srcDoc={`<base target="_blank" /><style>body{font-family:system-ui,sans-serif;color:#e2e8f0;background:transparent;}</style>${item.bodyHtml}`}
                              className="mt-3 h-64 w-full rounded-xl border border-slate-800 bg-slate-950"
                            />
                          ) : (
                            <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                              {item.bodyText || item.snippet || t("app.mail.emptyBody")}
                            </pre>
                          )}
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
          </>
        )}
      </section>
      {composer && (
        <ComposeMailModal
          mode={composer}
          sender={sender}
          original={composer === "compose" ? null : focused}
          onClose={() => setComposer(null)}
          onSent={(message) => {
            setComposer(null);
            setSuccess(message);
            // A send or reply changes threads; the list cache still shows instantly and refreshes.
            threadCache.current.clear();
            void bootstrap(folder, activeQuery);
          }}
        />
      )}
    </AppShell>
  );
}
