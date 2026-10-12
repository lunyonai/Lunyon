import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    <li className="rounded-xl border border-slate-800 px-3 py-3">
      <div className="flex items-start gap-2">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: event.calendarColor || "#64748b" }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-white">{event.title}</p>
      <p className="mt-1 text-xs text-slate-500">
        {event.isAllDay
          ? allDayLabel
          : [start, end].filter(Boolean).join(" – ")}
        {event.calendarName ? ` · ${event.calendarName}` : ""}
        {event.location ? ` · ${event.location}` : ""}
      </p>
      {event.meetingUrl && (
        <a
          href={event.meetingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs font-medium text-[var(--lunyo-primary)] hover:brightness-125"
        >
            {joinLabel}
          </a>
      )}
      {canWrite && event.canModify && event.googleEventId && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(event)}
            className="text-xs font-medium text-slate-300 hover:text-white"
          >
            {editLabel}
          </button>
          <button
            type="button"
            onClick={() => onReschedule(event)}
            className="text-xs font-medium text-slate-300 hover:text-white"
          >
            {rescheduleLabel}
          </button>
          <button
            type="button"
            onClick={() => onCancel(event)}
            className="text-xs font-medium text-red-400 hover:text-red-300"
          >
            {cancelLabel}
          </button>
        </div>
      )}
        </div>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="mt-3 space-y-2" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <li
          key={item}
          className="h-16 animate-pulse rounded-xl border border-slate-800 bg-slate-900/80"
        />
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
      const status = await api.googleStatus();
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
      const [todayEvents, weekEvents, nextCalendars] = await Promise.all([
        api.calendarToday(),
        api.calendarUpcoming(7),
        api.googleCalendars(),
      ]);
      setToday(todayEvents);
      setUpcoming(weekEvents);
      setCalendars(nextCalendars);
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

  const todayLabel = new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">{t("app.calendar.title")}</h1>
            <p className="mt-1 text-sm text-slate-400">{t("app.calendar.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite && calendars.some((item) => item.writable) && (
              <button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t("app.calendar.newEvent")}
              </button>
            )}
            <Link
              to="/settings"
              className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
            >
              {t("app.calendar.manage")}
            </Link>
          </div>
        </div>

        {success && (
          <p className="text-sm text-[var(--lunyo-success)]">
            {success}
            {successLink && (
              <>
                {" "}
                <a
                  href={successLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--lunyo-primary)] hover:brightness-125"
                >
                  {t("app.calendar.openInGoogle")}
                </a>
              </>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!canWrite && !loading && !needsReconnect && !notConfigured && (
          <p className="text-sm text-slate-400">{t("app.calendar.writeRequired")}</p>
        )}
        {(needsReconnect || notConfigured) && !loading && (
          <Link
            to="/settings"
            className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {notConfigured
              ? t("app.settings.googleNotConfigured")
              : t("app.calendar.reconnect")}
          </Link>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">
            {t("app.calendar.todayTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{todayLabel}</p>
          {loading ? (
            <SkeletonList />
          ) : error ? null : today.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t("app.calendar.todayEmpty")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {today.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  locale={localeTag}
                  joinLabel={t("app.calendar.join")}
                  allDayLabel={t("app.calendar.allDay")}
                  editLabel={t("app.calendar.editEvent")}
                  rescheduleLabel={t("app.calendar.reschedule")}
                  cancelLabel={t("app.calendar.cancelEvent")}
                  canWrite={canWrite}
                  onEdit={(item) => setEditor({ mode: "edit", event: item })}
                  onReschedule={(item) => setEditor({ mode: "reschedule", event: item })}
                  onCancel={(item) => setEditor({ mode: "delete", event: item })}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">
            {t("app.calendar.weekTitle")}
          </h2>
          {loading ? (
            <SkeletonList />
          ) : error ? null : groupedUpcoming.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{t("app.calendar.weekEmpty")}</p>
          ) : (
            <div className="mt-4 space-y-5">
              {groupedUpcoming.map(([day, events]) => (
                <div key={day}>
                  <p className="text-xs font-semibold tracking-wider text-slate-500">
                    {formatDayLabel(day, localeTag)}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {events.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        locale={localeTag}
                        joinLabel={t("app.calendar.join")}
                        allDayLabel={t("app.calendar.allDay")}
                        editLabel={t("app.calendar.editEvent")}
                        rescheduleLabel={t("app.calendar.reschedule")}
                        cancelLabel={t("app.calendar.cancelEvent")}
                        canWrite={canWrite}
                        onEdit={(item) => setEditor({ mode: "edit", event: item })}
                        onReschedule={(item) => setEditor({ mode: "reschedule", event: item })}
                        onCancel={(item) => setEditor({ mode: "delete", event: item })}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
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
