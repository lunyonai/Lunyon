import { useEffect, useMemo, useState } from "react";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  cx,
  hintClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "../../components/ui/styles";
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

const fieldLabel = cx(labelClass, "block");
const checkLabel = "flex items-center gap-2 text-sm text-fg";
const checkClass = "h-4 w-4 accent-primary";

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
    <Modal
      title={heading}
      description={selectedCalendar ? selectedCalendar.summary : undefined}
      onClose={onClose}
      busy={busy}
      size="lg"
      closeLabel={t("app.common.close")}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            {t("app.common.cancel")}
          </Button>
          {preview ? (
            <Button
              variant={mode === "delete" ? "danger" : "primary"}
              onClick={() => void runCommit()}
              disabled={busy}
            >
              {busy ? t("app.common.saving") : t("app.calendar.confirmWrite")}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => void runPreview()}
              disabled={busy || (mode !== "delete" && writable.length === 0)}
            >
              {busy ? t("app.common.saving") : t("app.calendar.reviewChange")}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {mode !== "delete" && (
          <>
            <label className="block space-y-1.5">
              <span className={fieldLabel}>{t("app.calendar.fieldTitle")}</span>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={fieldLabel}>{t("app.calendar.fieldCalendar")}</span>
              <select
                className={selectClass}
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
            <label className={checkLabel}>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className={checkClass}
              />
              {t("app.calendar.allDay")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className={fieldLabel}>{t("app.calendar.fieldDate")}</span>
                <input
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={fieldLabel}>{t("app.calendar.fieldEndDate")}</span>
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
              {!isAllDay && (
                <>
                  <label className="block space-y-1.5">
                    <span className={fieldLabel}>{t("app.calendar.fieldStart")}</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className={fieldLabel}>{t("app.calendar.fieldEnd")}</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
            <p className={hintClass}>
              {t("app.calendar.timezone")}: {timezone}
            </p>
            {mode !== "reschedule" && (
              <>
                <label className="block space-y-1.5">
                  <span className={fieldLabel}>{t("app.calendar.fieldLocation")}</span>
                  <input
                    className={inputClass}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={500}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabel}>{t("app.calendar.fieldDescription")}</span>
                  <textarea
                    className={textareaClass}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={4000}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={fieldLabel}>{t("app.calendar.fieldAttendees")}</span>
                  <input
                    className={inputClass}
                    value={attendees}
                    onChange={(e) => setAttendees(e.target.value)}
                    placeholder={t("app.calendar.attendeesHint")}
                  />
                </label>
                <label className={checkLabel}>
                  <input
                    type="checkbox"
                    checked={addMeet}
                    onChange={(e) => setAddMeet(e.target.checked)}
                    className={checkClass}
                  />
                  {t("app.calendar.addMeet")}
                </label>
              </>
            )}
          </>
        )}

        {mode === "delete" && event && (
          <div className="space-y-1.5 rounded-lg border border-line bg-surface-2 p-4 text-sm text-fg-muted">
            <p className="font-medium text-fg">{event.title}</p>
            <p>{event.calendarName}</p>
            <p className="tabular-nums">
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
            <legend className={cx(labelClass, "mb-2")}>{t("app.calendar.recurrence")}</legend>
            <label className={checkLabel}>
              <input
                type="radio"
                name="recurrence"
                checked={recurrence === "this"}
                onChange={() => setRecurrence("this")}
                className={checkClass}
              />
              {t("app.calendar.thisOccurrence")}
            </label>
            <label className={checkLabel}>
              <input
                type="radio"
                name="recurrence"
                checked={recurrence === "series"}
                onChange={() => setRecurrence("series")}
                className={checkClass}
              />
              {t("app.calendar.entireSeries")}
            </label>
          </fieldset>
        )}

        {preview && (
          <div className="rounded-lg border border-line bg-surface-2 p-4 text-sm text-fg-muted">
            <p className="font-medium text-fg">{t("app.calendar.confirmTitle")}</p>
            <p className="mt-2 text-fg">{preview.summary.title}</p>
            <p className="mt-1 text-xs text-fg-subtle">{preview.summary.calendarName}</p>
            <p className="mt-2 text-xs text-warning-text">{t("app.calendar.guestsNotify")}</p>
            {(preview.summary.conflicts ?? []).length > 0 && (
              <div className="mt-3 rounded-md border border-warning/25 bg-warning/10 p-3">
                <p className="text-xs font-medium text-warning-text">{t("app.calendar.conflicts")}</p>
                <ul className="mt-1 space-y-1 text-xs text-fg-muted">
                  {(preview.summary.conflicts ?? []).map((item) => (
                    <li key={item.id}>
                      {item.title} · {item.calendarName}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-fg-subtle">{t("app.calendar.conflictsHint")}</p>
              </div>
            )}
          </div>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
