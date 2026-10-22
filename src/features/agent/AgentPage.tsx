import { CalendarClock, Loader2, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button, IconButton } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { buttonClass, cardClass, cx, inputClass, navItemClass } from "../../components/ui/styles";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type AgentAction,
  type AgentConversation,
  type AgentMessage,
  type AgentStatus,
} from "../../lib/api";

const ERROR_KEYS: Record<string, string> = {
  AGENT_QUOTA: "app.agent.quota",
  AGENT_NO_KEY: "app.agent.noKey",
  AGENT_NOT_READY: "app.agent.notReady",
  AI_KEY_INVALID: "app.agent.keyInvalid",
  AI_RATE_LIMITED: "app.agent.rateLimited",
};

const NEEDS_SETTINGS = new Set(["AGENT_QUOTA", "AGENT_NO_KEY", "AI_KEY_INVALID"]);

/** Limits and missing setup read as warnings; everything else is an error. */
const WARNING_CODES = new Set(["AGENT_QUOTA", "AGENT_NO_KEY", "AI_RATE_LIMITED"]);

function userTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Formats wall times (YYYY-MM-DDTHH:mm), dates and ISO timestamps from action summaries. */
function formatWhen(value: string | undefined, timezone: string | undefined, localeTag: string) {
  if (!value) return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const wall = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : wall ? `${value.slice(0, 16)}:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeTag, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
    timeZone: dateOnly || wall ? "UTC" : timezone || undefined,
  }).format(date);
}

function ActionCard({
  action,
  localeTag,
  onChange,
}: {
  action: AgentAction;
  localeTag: string;
  onChange: (next: AgentAction) => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { summary } = action;
  const kind = action.kind.replace("calendar.", "");
  const conflicts = summary.conflicts ?? [];

  async function run(confirm: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onChange(
        confirm ? await api.confirmAgentAction(action.id) : await api.cancelAgentAction(action.id),
      );
    } catch {
      setError(t("app.agent.action.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-surface-2 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-primary-text">
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        {t(`app.agent.action.${kind}`)}
      </p>
      <p className="mt-2 text-sm font-medium text-fg">{summary.title}</p>
      <p className="mt-1 text-sm text-fg-muted">
        {formatWhen(summary.start, summary.timezone, localeTag)}
        {summary.end ? ` – ${formatWhen(summary.end, summary.timezone, localeTag)}` : ""}
        {summary.calendarName ? ` · ${summary.calendarName}` : ""}
      </p>
      {(summary.attendees ?? []).length > 0 && (
        <p className="mt-1 text-xs text-fg-subtle">
          {t("app.agent.action.guests")}: {summary.attendees?.join(", ")}
        </p>
      )}
      {summary.addMeet && <p className="mt-1 text-xs text-fg-subtle">{t("app.agent.action.meet")}</p>}
      {conflicts.length > 0 && (
        <div className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-2">
          <p className="text-xs font-medium text-warning-text">{t("app.agent.action.conflicts")}</p>
          {conflicts.map((item) => (
            <p key={item.id} className="text-xs text-fg-muted">
              {item.title} · {formatWhen(item.start, undefined, localeTag)}
            </p>
          ))}
        </div>
      )}

      {action.status === "pending" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => run(true)} disabled={busy}>
            {busy ? t("app.agent.action.confirming") : t("app.agent.action.confirm")}
          </Button>
          <Button size="sm" onClick={() => run(false)} disabled={busy}>
            {t("app.agent.action.cancel")}
          </Button>
        </div>
      )}
      {action.status === "confirmed" && (
        <p className="mt-3 text-sm text-success-text">
          {t("app.agent.action.confirmed")}
          {action.result?.htmlLink && (
            <>
              {" · "}
              <a
                href={action.result.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary-text hover:underline"
              >
                {t("app.agent.action.openInCalendar")}
              </a>
            </>
          )}
        </p>
      )}
      {action.status === "canceled" && (
        <p className="mt-3 text-sm text-fg-subtle">{t("app.agent.action.canceled")}</p>
      )}
      {action.status === "expired" && (
        <p className="mt-3 text-sm text-fg-subtle">{t("app.agent.action.expired")}</p>
      )}
      {action.status === "failed" && (
        <p className="mt-3 text-sm text-danger-text">{t("app.agent.action.failed")}</p>
      )}
      {error && <p className="mt-2 text-sm text-danger-text">{error}</p>}
    </div>
  );
}

export default function AgentPage() {
  const { t, locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const localeTag = locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en";
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const localIdRef = useRef(0);

  useEffect(() => {
    api.agentStatus().then(setStatus).catch(() => setStatus(null));
    api
      .listAgentConversations()
      .then(setConversations)
      .catch((err) => {
        if (err instanceof ApiError && err.code) setErrorCode(err.code);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function openConversation(id: string) {
    setConversationId(id);
    setErrorCode(null);
    setMessages([]);
    try {
      setMessages(await api.agentMessages(id));
    } catch {
      setErrorCode("GENERIC");
    }
  }

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setErrorCode(null);
  }

  async function removeConversation(id: string) {
    try {
      await api.deleteAgentConversation(id);
      setConversations((items) => items.filter((item) => item.id !== id));
      if (id === conversationId) newChat();
    } catch {
      setErrorCode("GENERIC");
    }
  }

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setErrorCode(null);
    setInput("");
    localIdRef.current += 1;
    const optimistic: AgentMessage = {
      id: `local-${localIdRef.current}`,
      role: "user",
      content: message,
      createdAt: "",
      actions: [],
    };
    setMessages((items) => [...items, optimistic]);
    try {
      const result = await api.sendAgentMessage({
        conversationId: conversationId ?? undefined,
        message,
        timezone: userTimezone(),
        locale,
      });
      setMessages((items) => [
        ...items.filter((item) => item.id !== optimistic.id),
        result.userMessage,
        result.message,
      ]);
      if (!conversationId) {
        setConversationId(result.conversationId);
        setConversations((items) => [
          { id: result.conversationId, title: message.slice(0, 60), updatedAt: result.message.createdAt },
          ...items,
        ]);
      }
      setStatus((current) => (current ? { ...current, usedToday: current.usedToday + 1 } : current));
    } catch (err) {
      setMessages((items) => items.filter((item) => item.id !== optimistic.id));
      setInput(message);
      setErrorCode(err instanceof ApiError && err.code ? err.code : "GENERIC");
    } finally {
      setSending(false);
    }
  }

  function updateAction(next: AgentAction) {
    setMessages((items) =>
      items.map((item) => ({
        ...item,
        actions: item.actions.map((action) => (action.id === next.id ? next : action)),
      })),
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  // A question typed on the dashboard arrives as router state: send it once, then clear the
  // state so a reload or back-navigation doesn't send it again.
  const handedPrompt = useRef((location.state as { prompt?: unknown } | null)?.prompt);
  const sendHandedPrompt = useEffectEvent((prompt: string) => {
    void send(prompt);
  });
  useEffect(() => {
    const prompt = handedPrompt.current;
    if (typeof prompt !== "string" || !prompt.trim()) return;
    handedPrompt.current = undefined;
    navigate(".", { replace: true, state: null });
    sendHandedPrompt(prompt);
  }, [navigate]);

  const suggestions = [
    t("app.agent.suggestion1"),
    t("app.agent.suggestion2"),
    t("app.agent.suggestion3"),
  ];

  return (
    <AppShell>
      {/* Viewport minus the AppShell top bar (4rem) and main's vertical padding (2×1.5rem, lg 2×2rem). */}
      <section className="flex h-[calc(100svh-7rem)] min-h-[32rem] flex-col gap-5 lg:h-[calc(100svh-8rem)]">
        <PageHeader icon={Sparkles} tone="primary" title={t("app.nav.assistant")} description={t("app.agent.subtitle")} />

        <div className="flex min-h-0 flex-1 gap-6">
          <aside className={cx(cardClass, "hidden w-64 shrink-0 flex-col p-3 lg:flex")}>
            <Button variant="primary" block onClick={newChat}>
              <Plus aria-hidden="true" />
              {t("app.agent.newChat")}
            </Button>
            <p className="px-2.5 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
              {t("app.agent.conversations")}
            </p>
            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {conversations.length === 0 && (
                <p className="px-2.5 text-sm text-fg-subtle">{t("app.agent.noConversations")}</p>
              )}
              {conversations.map((item) => {
                const active = item.id === conversationId;
                return (
                  <div key={item.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => openConversation(item.id)}
                      aria-current={active ? "true" : undefined}
                      className={navItemClass(active, "w-full pr-9 text-left")}
                    >
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={t("app.agent.deleteConversation")}
                      onClick={() => removeConversation(item.id)}
                      className="absolute right-1 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-danger/10 hover:text-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group-focus-within:flex group-hover:flex"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className={cx(cardClass, "flex min-w-0 flex-1 flex-col overflow-hidden")}>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-4 py-2 sm:px-5">
              <Button variant="ghost" size="sm" onClick={newChat} className="-ml-1.5 lg:hidden">
                <Plus aria-hidden="true" />
                {t("app.agent.newChat")}
              </Button>
              <p className="ml-auto text-xs tabular-nums text-fg-subtle">
                {status?.ownKey
                  ? t("app.agent.ownKey", {
                      provider: status.ownKey.provider === "openai" ? "OpenAI" : "Gemini",
                    })
                  : status?.freeAvailable
                    ? t(status.planActive ? "app.agent.planUsage" : "app.agent.usage", {
                        used: status.usedToday,
                        limit: status.dailyLimit,
                      })
                    : ""}
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
              {messages.length === 0 && !sending && (
                <div className="mx-auto max-w-md pt-8 text-center">
                  <div className="relative mx-auto mb-5 w-fit">
                    <span
                      aria-hidden="true"
                      className="absolute -inset-6 rounded-full bg-gradient-to-br from-primary/25 to-tint-violet/20 blur-2xl"
                    />
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-tint-violet text-white shadow-overlay">
                      <Sparkles className="h-7 w-7" aria-hidden="true" />
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-fg">{t("app.agent.emptyTitle")}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{t("app.agent.emptyHint")}</p>
                  <div className="mt-6 flex flex-col gap-2">
                    {suggestions.map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => send(text)}
                        className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((item) => (
                <div
                  key={item.id}
                  className={cx("flex", item.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cx(
                      "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6",
                      item.role === "user"
                        ? "bg-primary text-primary-fg"
                        : "border border-line bg-surface text-fg shadow-card",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{item.content}</p>
                    {item.actions.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        localeTag={localeTag}
                        onChange={updateAction}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-sm text-fg-subtle">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {t("app.agent.thinking")}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {errorCode && (
              <Alert
                tone={WARNING_CODES.has(errorCode) ? "warning" : "danger"}
                className="mx-4 mb-3 sm:mx-5"
                action={
                  NEEDS_SETTINGS.has(errorCode) ? (
                    <Link to="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
                      {t("app.agent.goToSettings")}
                    </Link>
                  ) : undefined
                }
              >
                {t(ERROR_KEYS[errorCode] ?? "app.agent.error")}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-line p-3 sm:p-4">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("app.agent.placeholder")}
                aria-label={t("app.agent.placeholder")}
                maxLength={4000}
                className={cx(inputClass, "min-w-0 flex-1")}
              />
              <IconButton
                type="submit"
                variant="primary"
                disabled={sending || !input.trim()}
                aria-label={t("app.agent.send")}
              >
                <Send />
              </IconButton>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
