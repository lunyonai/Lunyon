import { useEffect, useRef, useState, type FormEvent } from "react";
import { Inbox, Mail, PenSquare, Reply, ReplyAll, Search, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  buttonClass,
  cx,
  inputClass,
  navItemClass,
  skeletonClass,
} from "../../components/ui/styles";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import { useTheme } from "../../theme/themeContext";
import {
  api,
  ApiError,
  type GmailFolder,
  type GmailListPage,
  type GmailMessageDetail,
  type GmailMessageSummary,
} from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import ComposeMailModal, { type ComposeMode } from "./ComposeMailModal";
import {
  dropCachedThreads,
  fetchMailPage,
  getCachedList,
  loadFirstPage,
  loadThread,
  storeList,
} from "./mailCache";

const FOLDERS: Array<{ id: GmailFolder; icon: typeof Inbox; labelKey: string }> = [
  { id: "inbox", icon: Inbox, labelKey: "app.mail.folderInbox" },
  { id: "sent", icon: Send, labelKey: "app.mail.folderSent" },
  { id: "all", icon: Mail, labelKey: "app.mail.folderAll" },
];

const PREFETCH_DELAY_MS = 150;

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
  const { resolved } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const bodyTextColor = resolved === "dark" ? "#e2e8f0" : "#0f172a";
  const bodyLinkColor = resolved === "dark" ? "#60a5fa" : "#1d4ed8";
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
  // Lists and threads live in the app-wide mailCache: revisits render instantly and refresh
  // in the background; the sidebar and dashboard can warm the inbox before this page opens.
  const prefetchTimer = useRef<number | null>(null);

  const focused = thread?.find((item) => item.id === selectedId) ?? thread?.[0] ?? null;

  useEffect(() => () => {
    if (prefetchTimer.current !== null) window.clearTimeout(prefetchTimer.current);
  }, []);

  function applyPage(target: GmailFolder, page: GmailListPage) {
    if (page.folder !== target) return;
    setMessages(page.messages);
    setNextPage(page.nextPageToken);
  }

  /** Shows the cached list (if any) right away; returns true when it did. */
  function showCachedList(target: GmailFolder, search: string) {
    const cached = getCachedList(userId, target, search);
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

  /** Folder switches and searches always revalidate (maxAge 0), but join an in-flight load. */
  async function loadFolder(target: GmailFolder, search: string, seq: number) {
    const page = await loadFirstPage(userId, target, search, 0);
    if (seq !== requestSeq.current) return;
    applyPage(target, page);
  }

  async function bootstrap(target = folderRef.current, search = activeQuery, maxAgeMs?: number) {
    const seq = ++requestSeq.current;
    setError("");
    setNeedsConnect(false);
    clearSelection();
    const hadCache = showCachedList(target, search);
    try {
      // Status and the first page are independent; the list endpoint answers 409 when
      // Gmail is not connected, so its result is only used once status says we can read.
      // A page warmed moments ago (sidebar hover, dashboard widget) is reused, not refetched.
      const [statusResult, pageResult] = await Promise.allSettled([
        api.gmailStatus(),
        loadFirstPage(userId, target, search, maxAgeMs),
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
      applyPage(target, pageResult.value);
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
      const page = await fetchMailPage(target, search, token);
      if (seq !== requestSeq.current || page.folder !== target) return;
      const seen = new Set(base.map((item) => item.id));
      const merged = [...base, ...page.messages.filter((item) => !seen.has(item.id))];
      storeList(userId, target, search, merged, page.nextPageToken);
      setMessages(merged);
      setNextPage(page.nextPageToken);
    } catch {
      setError(t("app.mail.loadError"));
    } finally {
      setLoadingMore(false);
    }
  }

  function schedulePrefetch(item: GmailMessageSummary) {
    cancelPrefetch();
    prefetchTimer.current = window.setTimeout(() => {
      prefetchTimer.current = null;
      loadThread(userId, item).catch(() => undefined);
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
      const next = await loadThread(userId, item);
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
    <nav aria-label={t("app.mail.folders")} className="flex gap-1 lg:flex-col lg:gap-0.5">
      {FOLDERS.map((item) => {
        const Icon = item.icon;
        const active = folder === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => void selectFolder(item.id)}
            className={navItemClass(active, "w-full flex-1 justify-center lg:flex-none lg:justify-start")}
            aria-current={active ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <AppShell>
      <section className="space-y-6">
        <PageHeader
          icon={Mail}
          tone="rose"
          title={t("app.mail.title")}
          description={t("app.mail.subtitle")}
          actions={
            canSend && (
              <Button variant="primary" onClick={() => setComposer("compose")}>
                <PenSquare aria-hidden="true" />
                {t("app.mail.compose")}
              </Button>
            )
          }
        />

        {(success || error || (connected && canRead && !canSend)) && (
          <div className="space-y-3">
            {success && <Alert tone="success">{success}</Alert>}
            {error && <Alert tone="danger">{error}</Alert>}
            {connected && canRead && !canSend && <Alert tone="info">{t("app.mail.sendRequired")}</Alert>}
          </div>
        )}

        {needsConnect && !loading && (
          <Alert
            tone="info"
            action={
              <Link to="/settings" className={buttonClass({ variant: "primary", size: "sm" })}>
                {t("app.mail.connectCta")}
              </Link>
            }
          >
            {t("app.mail.connectHint")}
          </Alert>
        )}

        {connected && canRead && (
          <>
            <form onSubmit={(event) => void handleSearch(event)} className="flex gap-2">
              <label className="sr-only" htmlFor="mail-search">
                {t("app.mail.search")}
              </label>
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
                  aria-hidden="true"
                />
                <input
                  id="mail-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("app.mail.searchPlaceholder")}
                  className={cx(inputClass, "pl-9")}
                />
              </div>
              <Button type="submit">{t("app.mail.search")}</Button>
            </form>

            <Card padded={false} className="p-1.5 lg:hidden">
              {folderNav}
            </Card>

            <div className="grid items-start gap-4 lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.15fr)]">
              <Card as="aside" padded={false} className="hidden p-2 lg:block">
                {folderNav}
              </Card>

              <Card as="div" padded={false} className="overflow-hidden">
                {loading ? (
                  <ul className="space-y-2 p-4" aria-hidden="true">
                    {[0, 1, 2, 3].map((item) => (
                      <li key={item} className={cx(skeletonClass, "h-16")} />
                    ))}
                  </ul>
                ) : messages.length === 0 ? (
                  <EmptyState tone="rose" icon={folder === "sent" ? Send : Inbox} title={t(emptyKey)} />
                ) : (
                  <ul className="divide-y divide-line">
                    {messages.map((item) => {
                      const selected = selectedId === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => void openMessage(item)}
                            onMouseEnter={() => schedulePrefetch(item)}
                            onMouseLeave={cancelPrefetch}
                            aria-current={selected ? "true" : undefined}
                            className={cx(
                              "flex w-full flex-col items-start gap-1 border-l-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:bg-surface-2",
                            )}
                          >
                            <div className="flex w-full items-center gap-2">
                              {item.unread && (
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full bg-primary"
                                  aria-label={t("app.mail.unread")}
                                />
                              )}
                              <p
                                className={cx(
                                  "min-w-0 flex-1 truncate text-sm",
                                  item.unread ? "font-semibold text-fg" : "text-fg-muted",
                                )}
                              >
                                {listParty(item, folder, t)}
                              </p>
                              <p className="shrink-0 text-xs tabular-nums text-fg-subtle">
                                {formatMailDate(item.date, localeTag)}
                              </p>
                            </div>
                            <p
                              className={cx(
                                "w-full truncate text-sm",
                                item.unread ? "font-medium text-fg" : "text-fg-muted",
                              )}
                            >
                              {item.subject || t("app.mail.noSubject")}
                            </p>
                            <p className="w-full truncate text-xs text-fg-subtle">{item.snippet}</p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {nextPage && !loading && (
                  <div className="border-t border-line p-3">
                    <Button block onClick={() => void handleMore()} disabled={loadingMore}>
                      {loadingMore ? t("app.common.loading") : t("app.mail.loadMore")}
                    </Button>
                  </div>
                )}
              </Card>

              <Card as="article" className="min-h-80">
                {!selectedId && !detailLoading && (
                  <EmptyState tone="rose" icon={Mail} title={t("app.mail.selectHint")} />
                )}
                {detailLoading && (
                  <div className="space-y-3" role="status">
                    <p className="text-sm text-fg-subtle">{t("app.common.loading")}</p>
                    <div className={cx(skeletonClass, "h-5 w-2/3")} aria-hidden="true" />
                    <div className={cx(skeletonClass, "h-4 w-1/3")} aria-hidden="true" />
                    <div className={cx(skeletonClass, "h-48")} aria-hidden="true" />
                  </div>
                )}
                {thread && focused && !detailLoading && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-base font-semibold text-fg">
                        {focused.subject || t("app.mail.noSubject")}
                      </h2>
                      {thread.length > 1 && (
                        <p className="mt-1 text-xs text-fg-subtle">
                          {t("app.mail.threadCount", { count: String(thread.length) })}
                        </p>
                      )}
                    </div>
                    {canSend && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => setComposer("reply")}>
                          <Reply aria-hidden="true" />
                          {t("app.mail.reply")}
                        </Button>
                        <Button size="sm" onClick={() => setComposer("replyAll")}>
                          <ReplyAll aria-hidden="true" />
                          {t("app.mail.replyAll")}
                        </Button>
                      </div>
                    )}
                    <div className="space-y-3">
                      {thread.map((item) => (
                        <section
                          key={item.id}
                          className={cx(
                            "rounded-lg border p-4",
                            item.id === focused.id ? "border-line-strong bg-surface-2" : "border-line",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            <p className="text-sm font-medium text-fg">{item.from}</p>
                            {item.to && (
                              <p className="text-xs text-fg-subtle">{t("app.mail.toLine", { address: item.to })}</p>
                            )}
                            <p className="text-xs tabular-nums text-fg-subtle">{formatMailDate(item.date, localeTag)}</p>
                          </button>
                          {item.attachments.length > 0 && (
                            <p className="mt-2 text-xs text-fg-subtle">{t("app.mail.attachmentsHidden")}</p>
                          )}
                          {item.bodyHtml ? (
                            <iframe
                              title={t("app.mail.body")}
                              sandbox="allow-popups allow-popups-to-escape-sandbox"
                              referrerPolicy="no-referrer"
                              srcDoc={`<base target="_blank" /><style>:root{color-scheme:${resolved};}body{font-family:system-ui,sans-serif;color:${bodyTextColor};background:transparent;}a{color:${bodyLinkColor};}</style>${item.bodyHtml}`}
                              className="mt-3 h-64 w-full rounded-lg border border-line bg-surface"
                            />
                          ) : (
                            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-fg-muted">
                              {item.bodyText || item.snippet || t("app.mail.emptyBody")}
                            </pre>
                          )}
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
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
            dropCachedThreads();
            void bootstrap(folder, activeQuery, 0);
          }}
        />
      )}
    </AppShell>
  );
}
