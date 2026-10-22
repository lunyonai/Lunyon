import { Inbox, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardHeader } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { IconTile } from "../../../components/ui/IconTile";
import { buttonClass, cx, skeletonClass } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useAuth } from "../../../hooks/useAuth";
import { ApiError, type GmailMessageSummary } from "../../../lib/api";
import { loadFirstPage } from "../../mail/mailCache";
import { relativeTime } from "../../activity/activityView";

type InboxState =
  | { kind: "loading" }
  | { kind: "ready"; messages: GmailMessageSummary[] }
  | { kind: "disconnected" }
  | { kind: "error" };

const MAX_MESSAGES = 5;

/** Avatar palette; picked by a stable hash of the sender so a person keeps their color. */
const avatarTones = [
  "bg-primary/15 text-primary-text",
  "bg-tint-violet/15 text-tint-violet",
  "bg-tint-orange/15 text-tint-orange",
  "bg-tint-cyan/15 text-tint-cyan",
  "bg-tint-rose/15 text-tint-rose",
  "bg-tint-emerald/15 text-tint-emerald",
];

function senderName(from: string | null) {
  if (!from) return "";
  const match = from.match(/^\s*"?([^"<]+?)"?\s*<.+>\s*$/);
  return (match ? match[1] : from).trim();
}

function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function avatarTone(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return avatarTones[hash % avatarTones.length];
}

function messageTime(message: GmailMessageSummary) {
  if (message.internalDate) return new Date(Number(message.internalDate)).toISOString();
  return message.date ? new Date(message.date).toISOString() : null;
}

export default function InboxWidget() {
  const { t } = useLocale();
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<InboxState>({ kind: "loading" });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // Loads the Mail page's first inbox page through the shared cache: the widget shows the
    // top few and opening Mail afterwards is instant.
    loadFirstPage(userId, "inbox", "")
      .then((page) => {
        if (!cancelled) setState({ kind: "ready", messages: page.messages });
      })
      .catch((err) => {
        if (cancelled) return;
        const disconnected =
          err instanceof ApiError &&
          (err.status === 409 || err.status === 401 || err.code === "GMAIL_NOT_CONNECTED" || err.code === "GMAIL_READ_SCOPE");
        setState({ kind: disconnected ? "disconnected" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const unread = state.kind === "ready" ? state.messages.filter((message) => message.unread).length : 0;

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <IconTile icon={Mail} tone="rose" size="sm" />
          <CardHeader title={t("app.mail.folderInbox")} />
          {unread > 0 && (
            <Badge tone="primary" className="tabular-nums">
              {t("app.dashboard.unreadCount", { count: unread })}
            </Badge>
          )}
        </div>
        <Link to="/mail" className="text-xs font-medium text-primary-text hover:text-fg">
          {t("app.dashboard.viewAll")}
        </Link>
      </div>

      {state.kind === "loading" && (
        <div className="space-y-2 p-4" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className={cx(skeletonClass, "h-11")} />
          ))}
        </div>
      )}

      {state.kind === "disconnected" && (
        <EmptyState
          tone="rose"
          icon={Mail}
          title={t("app.mail.connectHint")}
          action={
            <Link to="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
              {t("app.mail.connectCta")}
            </Link>
          }
          className="py-8"
        />
      )}

      {state.kind === "error" && <p className="px-5 py-6 text-sm text-fg-subtle">{t("app.mail.loadError")}</p>}

      {state.kind === "ready" && state.messages.length === 0 && (
        <EmptyState tone="rose" icon={Inbox} title={t("app.dashboard.inboxEmpty")} className="py-8" />
      )}

      {state.kind === "ready" && state.messages.length > 0 && (
        <ul className="divide-y divide-line">
          {state.messages.slice(0, MAX_MESSAGES).map((message) => {
            const name = senderName(message.from) || t("app.mail.unknownSender");
            const time = messageTime(message);
            return (
              <li key={message.id}>
                <Link
                  to="/mail"
                  className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-surface-2/60"
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      avatarTone(name),
                    )}
                  >
                    {initials(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cx("truncate text-sm", message.unread ? "font-semibold text-fg" : "text-fg-muted")}>
                        {name}
                      </span>
                      {time && (
                        <span className="shrink-0 text-[11px] tabular-nums text-fg-subtle">
                          {relativeTime(time, t("app.dashboard.justNow"))}
                        </span>
                      )}
                    </span>
                    <span className={cx("block truncate text-xs", message.unread ? "text-fg" : "text-fg-subtle")}>
                      {message.subject || t("app.mail.noSubject")}
                    </span>
                  </span>
                  {message.unread && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t("app.mail.unread")} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
