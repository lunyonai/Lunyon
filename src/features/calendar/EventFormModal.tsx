import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import {
  api,
  ApiError,
  type CalendarEventSummary,
  type CalendarWritePreview,
  type GoogleCalendarListItem,
} from "../../lib/api";

export type EventFormMode = "create" | "edit" | "reschedule" | "delete";

type EventFormModalProps = {
  mode: EventFormMode;
  event?: CalendarEventSummary | null;
  calendars: GoogleCalendarListItem[];
  onClose: () => void;
  onDone: (message: string, htmlLink?: string | null) => void;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function addDays(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return utc.toISOString().slice(0, 10);
}

function ymdInZone(value: string, timeZone: string) {
  if (value.length <= 10) return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hmInZone(value: string, timeZone: string) {
  if (value.length <= 10) return "09:00";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "09:00";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "09";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function newKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function EventFormModal({
  mode,
  event,
  calendars,
  onClose,
  onDone,
}: EventFormModalProps) {
  const { t } = useLocale();
  const writable = calendars.filter((item) => item.writable);
  const defaultCalendar =
    writable.find((item) => item.id === event?.calendarId) ??
    writable.find((item) => item.primary) ??
    writable[0];
  const timezone =
    event?.timezone ||
    defaultCalendar?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const initialStart = event
    ? ymdInZone(event.start, timezone)
    : ymdInZone(new Date().toISOString(), timezone);
  const googleExclusiveEnd =
    event?.isAllDay && event.end.length <= 10 ? addDays(event.end.slice(0, 10), -1) : null;
  const initialEnd = event
    ? event.isAllDay
      ? googleExclusiveEnd && googleExclusiveEnd >= initialStart
        ? googleExclusiveEnd
        : initialStart
      : ymdInZone(event.end, timezone)
    : initialStart;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [attendees, setAttendees] = useState((event?.attendees ?? []).join(", "));
  const [calendarId, setCalendarId] = useState(defaultCalendar?.id ?? "");
  const [isAllDay, setIsAllDay] = useState(Boolean(event?.isAllDay));
  const [date, setDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [startTime, setStartTime] = useState(event ? hmInZone(event.start, timezone) : "09:00");
  const [endTime, setEndTime] = useState(event ? hmInZone(event.end, timezone) : "10:00");
  const [addMeet, setAddMeet] = useState(Boolean(event?.meetingUrl));
  const [recurrence, setRecurrence] = useState<"this" | "series">(
    event?.recurringEventId ? "this" : "this",
  );
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [preview, setPreview] = useState<CalendarWritePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const heading =
    mode === "create"
      ? t("app.calendar.newEvent")
      : mode === "delete"
        ? t("app.calendar.cancelEvent")
        : mode === "reschedule"
          ? t("app.calendar.reschedule")
          : t("app.calendar.editEvent");

  const recurring = Boolean(event?.recurringEventId);
  const selectedCalendar = calendars.find((item) => item.id === calendarId);

  const draftEvent = useMemo(
    () => ({
      title: title.trim() || "Untitled",
      description: description.trim() || null,
      start: isAllDay ? date : `${date}T${startTime}`,
      end: isAllDay ? endDate : `${endDate}T${endTime}`,
      timezone,
      isAllDay,
      location: location.trim() || null,
      attendees: attendees
        .split(/[,;\s]+/)
        .map((email) => email.trim())
        .filter(Boolean),
      addMeet,
    }),
    [addMeet, attendees, date, description, endDate, endTime, isAllDay, location, startTime, timezone, title],
  );

  useEffect(() => {
    setPreview(null);
    setIdempotencyKey(newKey());
  }, [draftEvent, calendarId, recurrence]);

  async function runPreview() {
    if (busy) return;
    if (mode !== "delete" && !title.trim()) {
      setError(t("app.common.required"));
      return;
    }
    if (mode !== "delete" && !calendarId) {
      setError(t("app.calendar.noWritable"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const action = mode === "delete" ? "delete" : mode === "create" ? "create" : "update";
      const next = await api.previewCalendarEvent({
        action,
        calendarId: calendarId || event?.calendarId || "",
        googleEventId: event?.googleEventId,
        recurrence: recurring ? recurrence : undefined,
        sendUpdates: "all",
        idempotencyKey,
        etag: event?.etag ?? undefined,
        event: mode === "delete" ? undefined : draftEvent,
      });
      setPreview(next);
    } catch (err) {
      setPreview(null);
      if (err instanceof ApiError && err.code === "CALENDAR_WRITE_SCOPE") {
        setError(t("app.calendar.writeRequired"));
      } else if (err instanceof ApiError && err.code === "CALENDAR_READ_ONLY") {
        setError(t("app.calendar.readOnlyCalendar"));
      } else if (err instanceof ApiError && err.code === "RECURRENCE_REQUIRED") {
        setError(t("app.calendar.recurrenceRequired"));
      } else if (err instanceof ApiError && err.code === "EVENT_CHANGED") {
        setError(t("app.calendar.eventChanged"));
      } else {
        setError(t("app.calendar.writeError"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!preview || busy) return;
    setBusy(true);
    setError("");
    try {
      const token = preview.confirmationToken;
      let result;
      if (mode === "delete" && event?.googleEventId) {
        result = await api.commitCalendarDelete(event.googleEventId, token);
      } else if (mode === "create") {
        result = await api.commitCalendarCreate(token);
      } else if (event?.googleEventId) {
        result = await api.commitCalendarUpdate(event.googleEventId, token);
      } else {
        throw new Error("missing event");
      }
      if (!result.ok && !result.replayed) {
        setError(t("app.calendar.writeError"));
        return;
      }
      const message =
        mode === "delete"
          ? t("app.calendar.cancelSuccess")
          : mode === "create"
            ? t("app.calendar.createSuccess")
            : t("app.calendar.updateSuccess");
      onDone(message, result.htmlLink ?? preview.summary.htmlLink);
    } catch {
      setError(t("app.calendar.writeError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-base font-semibold text-white">{heading}</h2>
            {selectedCalendar && (
              <p className="mt-1 text-xs text-slate-500">{selectedCalendar.summary}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-900 hover:text-white disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {mode !== "delete" && (
            <>
              <label className="block text-sm text-slate-300">
                {t("app.calendar.fieldTitle")}
                <input
                  className={fieldClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
              </label>
              <label className="block text-sm text-slate-300">
                {t("app.calendar.fieldCalendar")}
                <select
                  className={fieldClass}
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  disabled={mode !== "create"}
                >
                  {writable.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.summary}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 accent-[var(--lunyo-primary)]"
                />
                {t("app.calendar.allDay")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-slate-300">
                  {t("app.calendar.fieldDate")}
                  <input
                    type="date"
                    className={fieldClass}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  {t("app.calendar.fieldEndDate")}
                  <input
                    type="date"
                    className={fieldClass}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
                {!isAllDay && (
                  <>
                    <label className="block text-sm text-slate-300">
                      {t("app.calendar.fieldStart")}
                      <input
                        type="time"
                        className={fieldClass}
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </label>
                    <label className="block text-sm text-slate-300">
                      {t("app.calendar.fieldEnd")}
                      <input
                        type="time"
                        className={fieldClass}
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {t("app.calendar.timezone")}: {timezone}
              </p>
              {mode !== "reschedule" && (
                <>
                  <label className="block text-sm text-slate-300">
                    {t("app.calendar.fieldLocation")}
                    <input
                      className={fieldClass}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      maxLength={500}
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    {t("app.calendar.fieldDescription")}
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={4000}
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    {t("app.calendar.fieldAttendees")}
                    <input
                      className={fieldClass}
                      value={attendees}
                      onChange={(e) => setAttendees(e.target.value)}
                      placeholder={t("app.calendar.attendeesHint")}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={addMeet}
                      onChange={(e) => setAddMeet(e.target.checked)}
                      className="h-4 w-4 accent-[var(--lunyo-primary)]"
                    />
                    {t("app.calendar.addMeet")}
                  </label>
                </>
              )}
            </>
          )}

          {mode === "delete" && event && (
            <div className="space-y-2 text-sm text-slate-300">
              <p className="font-medium text-white">{event.title}</p>
              <p>{event.calendarName}</p>
              <p>
                {event.isAllDay
                  ? t("app.calendar.allDay")
                  : `${ymdInZone(event.start, timezone)} ${hmInZone(event.start, timezone)}`}
              </p>
              {event.attendees.length > 0 && (
                <p>
                  {t("app.calendar.fieldAttendees")}: {event.attendees.join(", ")}
                </p>
              )}
            </div>
          )}

          {recurring && (
            <fieldset className="space-y-2">
              <legend className="text-sm text-slate-300">{t("app.calendar.recurrence")}</legend>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name="recurrence"
                  checked={recurrence === "this"}
                  onChange={() => setRecurrence("this")}
                />
                {t("app.calendar.thisOccurrence")}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name="recurrence"
                  checked={recurrence === "series"}
                  onChange={() => setRecurrence("series")}
                />
                {t("app.calendar.entireSeries")}
              </label>
            </fieldset>
          )}

          {preview && (
            <div className="rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
              <p className="font-medium text-white">{t("app.calendar.confirmTitle")}</p>
              <p className="mt-2">{preview.summary.title}</p>
              <p className="mt-1 text-xs text-slate-500">{preview.summary.calendarName}</p>
              <p className="mt-2 text-xs text-amber-200/90">{t("app.calendar.guestsNotify")}</p>
              {(preview.summary.conflicts ?? []).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-200">{t("app.calendar.conflicts")}</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-400">
                    {(preview.summary.conflicts ?? []).map((item) => (
                      <li key={item.id}>
                        {item.title} · {item.calendarName}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs text-slate-500">{t("app.calendar.conflictsHint")}</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {t("app.common.cancel")}
          </button>
          {preview ? (
            <button
              type="button"
              onClick={() => void runCommit()}
              disabled={busy}
              className={`flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-60 ${
                mode === "delete" ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {busy ? t("app.common.saving") : t("app.calendar.confirmWrite")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={busy || (mode !== "delete" && writable.length === 0)}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {busy ? t("app.common.saving") : t("app.calendar.reviewChange")}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
