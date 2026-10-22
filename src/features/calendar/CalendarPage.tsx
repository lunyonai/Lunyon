import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, Plus, Settings2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { buttonClass, cx, skeletonClass } from "../../components/ui/styles";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type CalendarEventSummary,
  type GoogleCalendarListItem,
} from "../../lib/api";
import EventFormModal, { type EventFormMode } from "./EventFormModal";

function eventDayKey(event: CalendarEventSummary) {
  if (event.isAllDay) return event.start.slice(0, 10);
  const date = new Date(event.start);
  if (Number.isNaN(date.getTime())) return event.start.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: event.timezone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDayLabel(key: string, locale: string) {
  const date = new Date(`${key}T12:00:00`);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(event: CalendarEventSummary, locale: string, field: "start" | "end") {
  if (event.isAllDay) return null;
  const date = new Date(event[field]);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone || undefined,
  }).format(date);
}

function EventRow({
  event,
  locale,
  joinLabel,
  allDayLabel,
  editLabel,
  rescheduleLabel,
  cancelLabel,
  canWrite,
  onEdit,
  onReschedule,
  onCancel,
}: {
  event: CalendarEventSummary;
  locale: string;
  joinLabel: string;
  allDayLabel: string;
  editLabel: string;
  rescheduleLabel: string;
  cancelLabel: string;
  canWrite: boolean;
  onEdit: (event: CalendarEventSummary) => void;
  onReschedule: (event: CalendarEventSummary) => void;
  onCancel: (event: CalendarEventSummary) => void;
}) {
  const start = formatTime(event, locale, "start");
  const end = formatTime(event, locale, "end");
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span
        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-surface"
        style={{ backgroundColor: event.calendarColor || "var(--color-fg-subtle)" }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">{event.title}</p>
        <p className="mt-0.5 text-xs tabular-nums text-fg-subtle">
          {event.isAllDay
            ? allDayLabel
            : [start, end].filter(Boolean).join(" – ")}
          {event.calendarName ? ` · ${event.calendarName}` : ""}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {(event.meetingUrl || (canWrite && event.canModify && event.googleEventId)) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {event.meetingUrl && (
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 text-xs font-medium text-primary-text transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
                {joinLabel}
              </a>
            )}
            {canWrite && event.canModify && event.googleEventId && (
              <>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => onEdit(event)}>
                  {editLabel}
                </Button>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => onReschedule(event)}>
                  {rescheduleLabel}
                </Button>
                <Button variant="dangerGhost" size="sm" className="h-7" onClick={() => onCancel(event)}>
                  {cancelLabel}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-2 p-5" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <li key={item} className={cx(skeletonClass, "h-14")} />
      ))}
    </ul>
  );
}

export default function CalendarPage() {
  const { t, locale } = useLocale();
  const localeTag = locale === "pt" ? "pt-BR" : locale === "es" ? "es" : "en";
  const [today, setToday] = useState<CalendarEventSummary[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEventSummary[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendarListItem[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [success, setSuccess] = useState("");
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    mode: EventFormMode;
    event?: CalendarEventSummary;
  } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    setNeedsReconnect(false);
    setNotConfigured(false);
    try {
      // Status and data are fetched together (the data endpoints answer 409/401 when Google
      // isn't connected); data results are only used once status says the calendar is usable.
      const [statusResult, todayResult, weekResult, calendarsResult] = await Promise.allSettled([
        api.googleStatus(),
        api.calendarToday(),
        api.calendarUpcoming(7),
        api.googleCalendars(),
      ]);
      if (statusResult.status === "rejected") throw statusResult.reason;
      const status = statusResult.value;
      setCanWrite(Boolean(status.canWrite));
      if (!status.connected) {
        setToday([]);
        setUpcoming([]);
        setCalendars([]);
        setNeedsReconnect(true);
        return;
      }
      if (status.needsReauth) {
        setToday([]);
        setUpcoming([]);
        setCalendars([]);
        setNeedsReconnect(true);
        setError(t("app.calendar.grantList"));
        return;
      }
      for (const result of [todayResult, weekResult, calendarsResult]) {
        if (result.status === "rejected") throw result.reason;
      }
      setToday(todayResult.status === "fulfilled" ? todayResult.value : []);
      setUpcoming(weekResult.status === "fulfilled" ? weekResult.value : []);
      setCalendars(calendarsResult.status === "fulfilled" ? calendarsResult.value : []);
    } catch (err) {
      setToday([]);
      setUpcoming([]);
      if (err instanceof ApiError && (err.status === 503 || err.code === "API_UNCONFIGURED")) {
        setNotConfigured(true);
        setError(t("app.settings.googleNotConfigured"));
      } else if (err instanceof ApiError && (err.status === 403 || err.code === "CALENDAR_LIST_SCOPE")) {
        setNeedsReconnect(true);
        setError(t("app.calendar.grantList"));
      } else if (err instanceof ApiError && (err.status === 401 || err.status === 409)) {
        setNeedsReconnect(true);
        setError(t("app.calendar.reconnectHint"));
      } else {
        setError(t("app.calendar.loadError"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const groupedUpcoming = useMemo(() => {
    const groups = new Map<string, CalendarEventSummary[]>();
    for (const event of upcoming) {
      const key = eventDayKey(event);
      const list = groups.get(key) ?? [];
      list.push(event);
      groups.set(key, list);
    }
    return [...groups.entries()];
  }, [upcoming]);

  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const rowProps = {
    locale: localeTag,
    joinLabel: t("app.calendar.join"),
    allDayLabel: t("app.calendar.allDay"),
    editLabel: t("app.calendar.editEvent"),
    rescheduleLabel: t("app.calendar.reschedule"),
    cancelLabel: t("app.calendar.cancelEvent"),
    canWrite,
    onEdit: (item: CalendarEventSummary) => setEditor({ mode: "edit", event: item }),
    onReschedule: (item: CalendarEventSummary) => setEditor({ mode: "reschedule", event: item }),
    onCancel: (item: CalendarEventSummary) => setEditor({ mode: "delete", event: item }),
  };

  return (
    <AppShell>
      <section className="space-y-6">
        <PageHeader
          icon={CalendarDays}
          tone="cyan"
          title={t("app.calendar.title")}
          description={t("app.calendar.subtitle")}
          actions={
            <>
              <Link to="/settings" className={buttonClass({ variant: "secondary" })}>
                <Settings2 aria-hidden="true" />
                {t("app.calendar.manage")}
              </Link>
              {canWrite && calendars.some((item) => item.writable) && (
                <Button variant="primary" onClick={() => setEditor({ mode: "create" })}>
                  <Plus aria-hidden="true" />
                  {t("app.calendar.newEvent")}
                </Button>
              )}
            </>
          }
        />

        <div className="space-y-3 empty:hidden">
          {success && (
            <Alert tone="success">
              {success}
              {successLink && (
                <>
                  {" "}
                  <a
                    href={successLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-text underline-offset-2 hover:underline"
                  >
                    {t("app.calendar.openInGoogle")}
                  </a>
                </>
              )}
            </Alert>
          )}
          {error && <Alert tone="danger">{error}</Alert>}
          {!canWrite && !loading && !needsReconnect && !notConfigured && (
            <Alert tone="info">{t("app.calendar.writeRequired")}</Alert>
          )}
          {(needsReconnect || notConfigured) && !loading && (
            <Link to="/settings" className={buttonClass({ variant: "primary" })}>
              {notConfigured
                ? t("app.settings.googleNotConfigured")
                : t("app.calendar.reconnect")}
            </Link>
          )}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-5">
          <Card padded={false} className="xl:col-span-2">
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg"
                aria-hidden="true"
              >
                <span className="text-base font-semibold leading-none tabular-nums">
                  {Number(todayKey.slice(8, 10))}
                </span>
              </div>
              <CardHeader
                className="min-w-0 flex-1"
                title={t("app.calendar.todayTitle")}
                description={<span className="capitalize">{todayLabel}</span>}
              />
            </div>
            {loading ? (
              <SkeletonList />
            ) : error ? null : today.length === 0 ? (
              <EmptyState tone="cyan" icon={CalendarCheck} title={t("app.calendar.todayEmpty")} />
            ) : (
              <ul className="divide-y divide-line">
                {today.map((event) => (
                  <EventRow key={event.id} event={event} {...rowProps} />
                ))}
              </ul>
            )}
          </Card>

          <Card padded={false} className="xl:col-span-3">
            <div className="border-b border-line px-5 py-4">
              <CardHeader title={t("app.calendar.weekTitle")} />
            </div>
            {loading ? (
              <SkeletonList />
            ) : error ? null : groupedUpcoming.length === 0 ? (
              <EmptyState tone="cyan" icon={CalendarDays} title={t("app.calendar.weekEmpty")} />
            ) : (
              <div className="divide-y divide-line">
                {groupedUpcoming.map(([day, events]) => {
                  const isToday = day === todayKey;
                  return (
                    <div key={day}>
                      <div className="flex items-center gap-2.5 bg-surface-2 px-5 py-2">
                        <span
                          className={cx(
                            "flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-semibold tabular-nums",
                            isToday ? "bg-primary text-primary-fg" : "border border-line bg-surface text-fg-muted",
                          )}
                          aria-hidden="true"
                        >
                          {Number(day.slice(8, 10)) || ""}
                        </span>
                        <p
                          className={cx(
                            "text-xs font-medium capitalize",
                            isToday ? "text-primary-text" : "text-fg-muted",
                          )}
                        >
                          {formatDayLabel(day, localeTag)}
                        </p>
                      </div>
                      <ul className="divide-y divide-line">
                        {events.map((event) => (
                          <EventRow key={event.id} event={event} {...rowProps} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </section>
      {editor && (
        <EventFormModal
          mode={editor.mode}
          event={editor.event}
          calendars={calendars}
          onClose={() => setEditor(null)}
          onDone={(message, htmlLink) => {
            setEditor(null);
            setSuccess(message);
            setSuccessLink(htmlLink ?? null);
            void load();
          }}
        />
      )}
    </AppShell>
  );
}
