import { CalendarDays, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { IconTile } from "../../../components/ui/IconTile";
import { buttonClass, cx, skeletonClass } from "../../../components/ui/styles";
import { localeMeta } from "../../../i18n/config";
import { useLocale } from "../../../i18n/LocaleProvider";
import { api, ApiError, type CalendarEventSummary } from "../../../lib/api";

type AgendaState =
  | { kind: "loading" }
  | { kind: "ready"; events: CalendarEventSummary[] }
  | { kind: "disconnected" }
  | { kind: "error" };

const MAX_EVENTS = 4;

export default function TodayAgenda() {
  const { t, locale } = useLocale();
  const [state, setState] = useState<AgendaState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    api
      .calendarToday()
      .then((events) => {
        if (!cancelled) setState({ kind: "ready", events });
      })
      .catch((err) => {
        if (cancelled) return;
        const disconnected = err instanceof ApiError && (err.status === 409 || err.status === 401);
        setState({ kind: disconnected ? "disconnected" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const timeFmt = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { hour: "2-digit", minute: "2-digit" });

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <IconTile icon={CalendarDays} tone="cyan" size="sm" />
          <CardHeader title={t("app.calendar.todayTitle")} />
        </div>
        <Link to="/calendar" className="text-xs font-medium text-primary-text hover:text-fg">
          {t("app.dashboard.viewAll")}
        </Link>
      </div>

      {state.kind === "loading" && (
        <div className="space-y-2 p-4" aria-hidden="true">
          {[0, 1].map((item) => (
            <div key={item} className={cx(skeletonClass, "h-12")} />
          ))}
        </div>
      )}

      {state.kind === "disconnected" && (
        <EmptyState
          tone="cyan"
          icon={CalendarDays}
          title={t("app.dashboard.calendarConnectHint")}
          action={
            <Link to="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
              {t("app.settings.googleConnect")}
            </Link>
          }
          className="py-8"
        />
      )}

      {state.kind === "error" && (
        <p className="px-5 py-6 text-sm text-fg-subtle">{t("app.calendar.loadError")}</p>
      )}

      {state.kind === "ready" && state.events.length === 0 && (
        <EmptyState tone="cyan" icon={CalendarDays} title={t("app.calendar.todayEmpty")} className="py-8" />
      )}

      {state.kind === "ready" && state.events.length > 0 && (
        <ul className="space-y-1 p-2">
          {state.events.slice(0, MAX_EVENTS).map((event) => (
            <li key={event.id} className="flex items-stretch gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2/60">
              <span
                aria-hidden="true"
                className="w-1 shrink-0 rounded-full"
                style={{ backgroundColor: event.calendarColor || "var(--ui-tint-cyan)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{event.title}</p>
                <p className="text-xs tabular-nums text-fg-subtle">
                  {event.isAllDay
                    ? t("app.calendar.allDay")
                    : `${timeFmt.format(new Date(event.start))} – ${timeFmt.format(new Date(event.end))}`}
                </p>
              </div>
              {event.meetingUrl && (
                <a
                  href={event.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t("app.calendar.join")}
                  title={t("app.calendar.join")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-primary-text transition-colors hover:bg-primary/10"
                >
                  <Video className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
