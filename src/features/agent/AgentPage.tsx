import { CalendarClock, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
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
    <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-300">
        <CalendarClock className="h-4 w-4" />
        {t(`app.agent.action.${kind}`)}
      </p>
      <p className="mt-2 text-sm font-medium text-white">{summary.title}</p>
      <p className="mt-1 text-sm text-slate-400">
        {formatWhen(summary.start, summary.timezone, localeTag)}
        {summary.end ? ` – ${formatWhen(summary.end, summary.timezone, localeTag)}` : ""}
        {summary.calendarName ? ` · ${summary.calendarName}` : ""}
      </p>
      {(summary.attendees ?? []).length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          {t("app.agent.action.guests")}: {summary.attendees?.join(", ")}
        </p>
      )}
      {summary.addMeet && <p className="mt-1 text-xs text-slate-500">{t("app.agent.action.meet")}</p>}
      {conflicts.length > 0 && (
        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
          <p className="text-xs font-medium text-amber-200">{t("app.agent.action.conflicts")}</p>
          {conflicts.map((item) => (
            <p key={item.id} className="text-xs text-amber-100/80">
              {item.title} · {formatWhen(item.start, undefined, localeTag)}
            </p>
          ))}
        </div>
      )}

      {action.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => run(true)}
            disabled={busy}
            className="flex h-9 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {busy ? t("app.agent.action.confirming") : t("app.agent.action.confirm")}
          </button>
          <button
            type="button"
            onClick={() => run(false)}
            disabled={busy}
            className="flex h-9 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {t("app.agent.action.cancel")}
          </button>
        </div>
      )}
      {action.status === "confirmed" && (
        <p className="mt-3 text-sm text-emerald-400">
          {t("app.agent.action.confirmed")}
          {action.result?.htmlLink && (
            <>
              {" · "}
              <a
                href={action.result.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {t("app.agent.action.openInCalendar")}
              </a>
            </>
          )}
        </p>
      )}
      {action.status === "canceled" && (
        <p className="mt-3 text-sm text-slate-500">{t("app.agent.action.canceled")}</p>
      )}
      {action.status === "expired" && (
        <p className="mt-3 text-sm text-slate-500">{t("app.agent.action.expired")}</p>
      )}
      {action.status === "failed" && (
        <p className="mt-3 text-sm text-red-400">{t("app.agent.action.failed")}</p>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default function AgentPage() {
  const { t, locale } = useLocale();
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

  const suggestions = [
    t("app.agent.suggestion1"),
    t("app.agent.suggestion2"),
    t("app.agent.suggestion3"),
  ];

  return (
    <AppShell>
      <section className="mx-auto flex h-[calc(100vh-10rem)] max-w-6xl gap-6">
        <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-3 lg:flex">
          <button
            type="button"
            onClick={newChat}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("app.agent.newChat")}
          </button>
          <p className="px-2 pb-2 pt-5 text-xs font-semibold tracking-wider text-slate-500">
            {t("app.agent.conversations")}
          </p>
          <div className="flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 && (
              <p className="px-2 text-sm text-slate-500">{t("app.agent.noConversations")}</p>
            )}
            {conversations.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center rounded-xl ${
                  item.id === conversationId ? "bg-blue-500/10" : "hover:bg-slate-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openConversation(item.id)}
                  className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-sm ${
                    item.id === conversationId ? "text-blue-300" : "text-slate-400"
                  }`}
                >
                  {item.title}
                </button>
                <button
                  type="button"
                  aria-label={t("app.agent.deleteConversation")}
                  onClick={() => removeConversation(item.id)}
                  className="mr-1 hidden h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 group-hover:flex"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
            <button
              type="button"
              onClick={newChat}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 lg:hidden"
            >
              <Plus className="h-4 w-4" />
              {t("app.agent.newChat")}
            </button>
            <p className="ml-auto text-xs text-slate-500">
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

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
            {messages.length === 0 && !sending && (
              <div className="mx-auto max-w-md pt-10 text-center">
                <h2 className="text-xl font-semibold text-white">{t("app.agent.emptyTitle")}</h2>
                <p className="mt-2 text-sm text-slate-400">{t("app.agent.emptyHint")}</p>
                <div className="mt-6 flex flex-col gap-2">
                  {suggestions.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => send(text)}
                      className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
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
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    item.role === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-800 bg-slate-950/40 text-slate-200"
                  }`}
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
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("app.agent.thinking")}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {errorCode && (
            <div className="mx-5 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {t(ERROR_KEYS[errorCode] ?? "app.agent.error")}
              {NEEDS_SETTINGS.has(errorCode) && (
                <>
                  {" "}
                  <Link to="/settings" className="font-medium text-blue-300 hover:text-blue-200">
                    {t("app.agent.goToSettings")}
                  </Link>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-800 p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("app.agent.placeholder")}
              maxLength={4000}
              className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={t("app.agent.send")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
