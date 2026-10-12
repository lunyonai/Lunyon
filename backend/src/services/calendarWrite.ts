import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { addCalendarDays, zonedWallToIso } from "../lib/zonedTime.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  assertCalendarWriteAccess,
  getValidGoogleAccessToken,
} from "./googleConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";
import { listGoogleCalendars, listEvents } from "./calendarService.js";
import type {
  CalendarEvent,
  CalendarWriteAction,
  CalendarWriteInput,
  SendUpdatesMode,
} from "./calendar/types.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTENT_TTL_MS = 10 * 60 * 1000;

export const calendarWriteDraftSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  calendarId: z.string().min(1).max(256),
  googleEventId: z.string().min(1).max(256).optional(),
  recurrence: z.enum(["this", "series"]).optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
  idempotencyKey: z.string().min(8).max(80),
  etag: z.string().max(256).optional(),
  event: z
    .object({
      title: z.string().trim().min(1).max(200),
      description: z.string().max(4000).optional().nullable(),
      start: z.string().min(1).max(40),
      end: z.string().min(1).max(40),
      timezone: z.string().min(1).max(80),
      isAllDay: z.boolean(),
      location: z.string().max(500).optional().nullable(),
      attendees: z.array(z.string().email().max(254)).max(25).optional(),
      addMeet: z.boolean().optional(),
    })
    .optional(),
});

export type CalendarWriteDraft = z.infer<typeof calendarWriteDraftSchema>;

function dbUnavailable(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Calendar writes are not available yet", 503);
  }
  throw new AppError("Could not complete this request", 400);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function assertWritableRole(role: string | null) {
  if (role !== "owner" && role !== "writer") {
    throw new AppError("This calendar cannot be modified", 403, "CALENDAR_READ_ONLY");
  }
}

function assertTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  } catch {
    throw new AppError("Invalid timezone", 400);
  }
}

function wallToComparable(value: string, timezone: string, isEnd: boolean) {
  if (value.length <= 10) {
    const ymd = isEnd ? addCalendarDays(value, 1) : value;
    return Date.parse(zonedWallToIso(ymd, "00:00:00", timezone));
  }
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) return Date.parse(value);
  const [ymd, timePart = "00:00"] = value.split("T");
  const wall = timePart.length === 5 ? `${timePart}:00` : timePart.slice(0, 8);
  return Date.parse(zonedWallToIso(ymd, wall, timezone));
}

function googleDateTime(value: string, timezone: string) {
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return { dateTime: value, timeZone: timezone };
  }
  const [ymd, timePart = "00:00"] = value.split("T");
  const wall = timePart.length === 5 ? `${timePart}:00` : timePart.slice(0, 8);
  return { dateTime: zonedWallToIso(ymd, wall, timezone), timeZone: timezone };
}

function googleStartEnd(input: CalendarWriteInput) {
  assertTimezone(input.timezone);
  if (input.isAllDay) {
    const start = input.start.slice(0, 10);
    const inclusiveEnd = input.end.slice(0, 10);
    if (inclusiveEnd < start) throw new AppError("End must be after start", 400);
    return {
      start: { date: start },
      end: { date: addCalendarDays(inclusiveEnd, 1) },
    };
  }
  const startMs = wallToComparable(input.start, input.timezone, false);
  const endMs = wallToComparable(input.end, input.timezone, false);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new AppError("End must be after start", 400);
  }
  return {
    start: googleDateTime(input.start, input.timezone),
    end: googleDateTime(input.end, input.timezone),
  };
}

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
  timezone: string,
  aEndInclusive: boolean,
) {
  const as = wallToComparable(aStart, timezone, false);
  const ae = wallToComparable(aEnd, timezone, aEndInclusive);
  const bs = wallToComparable(bStart, timezone, false);
  const be = wallToComparable(bEnd, timezone, false);
  if ([as, ae, bs, be].some((item) => Number.isNaN(item))) return false;
  return as < be && ae > bs;
}

async function googleFetch<T>(
  url: string,
  token: string,
  init?: RequestInit,
  okStatuses: number[] = [],
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (okStatuses.includes(response.status)) {
    if (response.status === 204 || response.status === 404 || response.status === 410) {
      return {} as T;
    }
  }
  if (!response.ok) mapGoogleApiError(response.status);
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function calendarIcalUid(idempotencyKey: string) {
  const compact = idempotencyKey.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  return `${compact || "lunyon"}@lunyo.calendar`;
}

async function loadWritableCalendar(userId: string, calendarId: string) {
  const calendars = await listGoogleCalendars(userId);
  const calendar = calendars.find((item) => item.id === calendarId);
  if (!calendar) throw new AppError("Calendar not found", 404);
  assertWritableRole(calendar.accessRole);
  return calendar;
}

function toWriteInput(draft: CalendarWriteDraft): CalendarWriteInput {
  const event = draft.event;
  if (!event) throw new AppError("Event details are required", 400);
  const attendees = (event.attendees ?? []).map((email) => email.trim().toLowerCase());
  if (attendees.some((email) => !EMAIL_RE.test(email))) {
    throw new AppError("One or more attendee emails are invalid", 400);
  }
  return {
    calendarId: draft.calendarId,
    title: event.title,
    description: event.description?.trim() || null,
    start: event.start,
    end: event.end,
    timezone: event.timezone,
    isAllDay: event.isAllDay,
    location: event.location?.trim() || null,
    attendees: [...new Set(attendees)],
    addMeet: Boolean(event.addMeet),
  };
}

async function findConflicts(
  userId: string,
  input: CalendarWriteInput,
  ignoreEventId?: string,
) {
  const events = await listEvents(userId, { days: 14 });
  return events
    .filter((item) => item.googleEventId !== ignoreEventId)
    .filter((item) =>
      overlaps(
        input.start,
        input.end,
        item.start,
        item.end,
        input.timezone || item.timezone,
        input.isAllDay,
      ),
    )
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      start: item.start,
      end: item.end,
      calendarName: item.calendarName,
    }));
}

async function rateLimitWrites(userId: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("calendar_write_intents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) dbUnavailable(error);
  if ((count ?? 0) >= 30) {
    throw new AppError("Please wait before making more calendar changes", 429);
  }
}

async function audit(userId: string, action: string, calendarId: string, eventId: string | null, status: "ok" | "error") {
  await supabaseAdmin.from("calendar_mutation_audit").insert({
    user_id: userId,
    action,
    calendar_id: calendarId,
    google_event_id: eventId,
    status,
  });
}

export async function previewCalendarWrite(userId: string, raw: unknown) {
  await assertCalendarWriteAccess(userId);
  await rateLimitWrites(userId);
  const draft = calendarWriteDraftSchema.parse(raw);
  const calendar = await loadWritableCalendar(userId, draft.calendarId);
  const sendUpdates: SendUpdatesMode = draft.sendUpdates ?? "all";

  if (draft.action === "delete") {
    if (!draft.googleEventId) throw new AppError("Event id is required", 400);
    const token = await getValidGoogleAccessToken(userId);
    const current = await googleFetch<{
      id?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      attendees?: Array<{ email?: string }>;
      recurringEventId?: string;
      etag?: string;
      htmlLink?: string;
    }>(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(draft.calendarId)}/events/${encodeURIComponent(draft.googleEventId)}`,
      token,
    );
    return persistIntent(userId, draft, {
      calendarName: calendar.summary,
      title: current.summary ?? "Untitled event",
      start: current.start?.dateTime ?? current.start?.date,
      end: current.end?.dateTime ?? current.end?.date,
      attendees: (current.attendees ?? []).map((item) => item.email).filter(Boolean),
      recurring: Boolean(current.recurringEventId),
      sendUpdates,
      conflicts: [],
      htmlLink: current.htmlLink ?? null,
      etag: current.etag ?? draft.etag ?? null,
    });
  }

  const input = toWriteInput(draft);
  googleStartEnd(input);
  if (draft.action === "update" && !draft.googleEventId) {
    throw new AppError("Event id is required", 400);
  }
  if (draft.action === "update") {
    const token = await getValidGoogleAccessToken(userId);
    const current = await googleFetch<{ etag?: string; recurringEventId?: string }>(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(draft.calendarId)}/events/${encodeURIComponent(draft.googleEventId as string)}`,
      token,
    );
    if (draft.etag && current.etag && draft.etag !== current.etag) {
      throw new AppError("This event changed. Review it again before saving.", 409, "EVENT_CHANGED");
    }
    if (current.recurringEventId && !draft.recurrence) {
      throw new AppError("Choose this occurrence or the entire series", 400, "RECURRENCE_REQUIRED");
    }
  }

  const conflicts = await findConflicts(
    userId,
    input,
    draft.action === "update" ? draft.googleEventId : undefined,
  );

  return persistIntent(userId, draft, {
    calendarName: calendar.summary,
    title: input.title,
    start: input.start,
    end: input.end,
    attendees: input.attendees,
    recurring: false,
    sendUpdates,
    conflicts,
    htmlLink: null,
    etag: draft.etag ?? null,
    addMeet: input.addMeet,
    guestsNotified: sendUpdates !== "none" && input.attendees.length > 0,
  });
}

function isAbandonedResult(result: unknown) {
  return Boolean(
    result &&
      typeof result === "object" &&
      "abandoned" in result &&
      (result as { abandoned?: unknown }).abandoned === true,
  );
}

async function persistIntent(
  userId: string,
  draft: CalendarWriteDraft,
  summary: Record<string, unknown>,
) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INTENT_TTL_MS).toISOString();
  const fields = {
    user_id: userId,
    action: draft.action,
    payload: draft,
    confirmation_hash: hashToken(token),
    idempotency_key: draft.idempotencyKey,
    etag: typeof summary.etag === "string" ? summary.etag : null,
    expires_at: expiresAt,
    claimed_at: null,
    consumed_at: null,
    result: null,
  };

  const existing = await supabaseAdmin
    .from("calendar_write_intents")
    .select("id, claimed_at, consumed_at, result")
    .eq("user_id", userId)
    .eq("idempotency_key", draft.idempotencyKey)
    .maybeSingle();
  if (existing.error) dbUnavailable(existing.error);

  const row = existing.data;
  if (row?.claimed_at && !row.consumed_at) {
    throw new AppError("This change is already in progress", 409, "IDEMPOTENCY");
  }
  if (row?.consumed_at && row.result && !isAbandonedResult(row.result)) {
    throw new AppError("This change was already completed", 409, "IDEMPOTENCY");
  }

  if (row && !row.claimed_at) {
    const updated = await supabaseAdmin
      .from("calendar_write_intents")
      .update(fields)
      .eq("id", row.id)
      .eq("user_id", userId)
      .is("claimed_at", null)
      .select("id")
      .maybeSingle();
    if (updated.error) dbUnavailable(updated.error);
    if (!updated.data) {
      throw new AppError("This change is already in progress", 409, "IDEMPOTENCY");
    }
  } else {
    const inserted = await supabaseAdmin.from("calendar_write_intents").insert(fields);
    if (inserted.error) {
      if (inserted.error.message.toLowerCase().includes("duplicate") || inserted.error.code === "23505") {
        throw new AppError("This change is already in progress", 409, "IDEMPOTENCY");
      }
      dbUnavailable(inserted.error);
    }
  }

  return {
    confirmationToken: token,
    expiresInSeconds: 600,
    action: draft.action,
    summary,
  };
}

type GoogleEventWriteResult = {
  id?: string;
  htmlLink?: string;
  summary?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

async function insertGoogleEvent(
  encodedCal: string,
  token: string,
  sendUpdates: string,
  meetQuery: string,
  body: Record<string, unknown>,
  icalUid: string,
): Promise<GoogleEventWriteResult> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events?sendUpdates=${sendUpdates}${meetQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (response.status === 409) {
    const listed = await googleFetch<{ items?: GoogleEventWriteResult[] }>(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events?iCalUID=${encodeURIComponent(icalUid)}&maxResults=1`,
      token,
    );
    const found = listed.items?.[0];
    if (found?.id) return found;
  }
  if (!response.ok) mapGoogleApiError(response.status);
  return (await response.json()) as GoogleEventWriteResult;
}

function googleBody(input: CalendarWriteInput, idempotencyKey: string) {
  const bounds = googleStartEnd(input);
  const body: Record<string, unknown> = {
    summary: input.title,
    description: input.description,
    location: input.location,
    start: bounds.start,
    end: bounds.end,
    attendees: input.attendees.map((email) => ({ email })),
  };
  if (input.addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: idempotencyKey.slice(0, 36),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

async function executeGoogle(
  userId: string,
  draft: CalendarWriteDraft,
): Promise<{ event?: CalendarEvent; htmlLink: string | null; googleEventId: string | null }> {
  const token = await getValidGoogleAccessToken(userId);
  const calendar = await loadWritableCalendar(userId, draft.calendarId);
  const encodedCal = encodeURIComponent(draft.calendarId);
  const sendUpdates = draft.sendUpdates ?? "all";

  if (draft.action === "delete") {
    const current = await googleFetch<{ id?: string; recurringEventId?: string }>(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodeURIComponent(draft.googleEventId as string)}`,
      token,
      undefined,
      [404, 410],
    );
    if (!current.id && !current.recurringEventId) {
      return { htmlLink: null, googleEventId: draft.googleEventId ?? null };
    }
    const targetId =
      draft.recurrence === "series"
        ? current.recurringEventId || current.id || draft.googleEventId
        : draft.googleEventId;
    await googleFetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodeURIComponent(targetId as string)}?sendUpdates=${sendUpdates}`,
      token,
      { method: "DELETE" },
      [204, 404, 410],
    );
    return { htmlLink: null, googleEventId: targetId ?? null };
  }

  const input = toWriteInput(draft);
  const body = googleBody(input, draft.idempotencyKey);
  const meetQuery = input.addMeet ? "&conferenceDataVersion=1" : "";

  if (draft.action === "create") {
    const icalUid = calendarIcalUid(draft.idempotencyKey);
    body.iCalUID = icalUid;
    const created = await insertGoogleEvent(
      encodedCal,
      token,
      sendUpdates,
      meetQuery,
      body,
      icalUid,
    );
    return {
      htmlLink: created.htmlLink ?? null,
      googleEventId: created.id ?? null,
      event: {
        id: `${calendar.id}::${created.id}`,
        title: created.summary ?? input.title,
        start: created.start?.dateTime ?? created.start?.date ?? input.start,
        end: created.end?.dateTime ?? created.end?.date ?? input.end,
        isAllDay: input.isAllDay,
        timezone: input.timezone,
        description: input.description,
        location: input.location,
        meetingUrl: created.hangoutLink ?? null,
        calendarSource: "google",
        calendarId: calendar.id,
        calendarName: calendar.summary,
        calendarColor: calendar.backgroundColor,
        googleEventId: created.id ?? "",
        recurringEventId: null,
        htmlLink: created.htmlLink ?? null,
        etag: null,
        attendees: input.attendees,
        canModify: true,
      },
    };
  }

  const current = await googleFetch<{
    id?: string;
    recurringEventId?: string;
    etag?: string;
  }>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodeURIComponent(draft.googleEventId as string)}`,
    token,
  );
  if (draft.etag && current.etag && draft.etag !== current.etag) {
    throw new AppError("This event changed. Review it again before saving.", 409, "EVENT_CHANGED");
  }
  if (current.recurringEventId && !draft.recurrence) {
    throw new AppError("Choose this occurrence or the entire series", 400, "RECURRENCE_REQUIRED");
  }
  const patchId =
    draft.recurrence === "series"
      ? current.recurringEventId || current.id || draft.googleEventId
      : draft.googleEventId;
  const updated = await googleFetch<{
    id?: string;
    htmlLink?: string;
    summary?: string;
    hangoutLink?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
  }>(
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodeURIComponent(patchId as string)}?sendUpdates=${sendUpdates}${meetQuery}`,
    token,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return {
    htmlLink: updated.htmlLink ?? null,
    googleEventId: updated.id ?? patchId ?? null,
    event: {
      id: `${calendar.id}::${updated.id ?? patchId}`,
      title: updated.summary ?? input.title,
      start: updated.start?.dateTime ?? updated.start?.date ?? input.start,
      end: updated.end?.dateTime ?? updated.end?.date ?? input.end,
      isAllDay: input.isAllDay,
      timezone: input.timezone,
      description: input.description,
      location: input.location,
      meetingUrl: updated.hangoutLink ?? null,
      calendarSource: "google",
      calendarId: calendar.id,
      calendarName: calendar.summary,
      calendarColor: calendar.backgroundColor,
      googleEventId: updated.id ?? patchId ?? "",
      recurringEventId: null,
      htmlLink: updated.htmlLink ?? null,
      etag: null,
      attendees: input.attendees,
      canModify: true,
    },
  };
}

export async function commitCalendarWrite(
  userId: string,
  confirmationToken: string,
  expected?: { action?: CalendarWriteAction; googleEventId?: string },
) {
  await assertCalendarWriteAccess(userId);
  if (!confirmationToken) throw new AppError("Confirmation is required", 400);
  const { data, error } = await supabaseAdmin
    .from("calendar_write_intents")
    .select("*")
    .eq("user_id", userId)
    .eq("confirmation_hash", hashToken(confirmationToken))
    .maybeSingle();
  if (error) dbUnavailable(error);
  if (!data) throw new AppError("Confirmation is invalid or expired", 400);
  if (isAbandonedResult(data.result)) {
    throw new AppError("Confirmation is invalid or expired", 400);
  }
  if (data.consumed_at && data.result) {
    return { ok: true, replayed: true, ...(data.result ?? {}) };
  }

  const draft = calendarWriteDraftSchema.parse(data.payload);
  if (expected?.action && draft.action !== expected.action) {
    throw new AppError("Confirmation does not match this request", 400);
  }
  if (expected?.googleEventId && draft.googleEventId !== expected.googleEventId) {
    throw new AppError("Confirmation does not match this event", 400);
  }

  const expired = new Date(data.expires_at).getTime() < Date.now();
  if (expired && !data.claimed_at) {
    throw new AppError("Confirmation expired. Review the change again.", 400);
  }

  if (!data.claimed_at) {
    const claim = await supabaseAdmin
      .from("calendar_write_intents")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId)
      .eq("confirmation_hash", hashToken(confirmationToken))
      .is("claimed_at", null)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (claim.error) dbUnavailable(claim.error);
    if (!claim.data) {
      const again = await supabaseAdmin
        .from("calendar_write_intents")
        .select("consumed_at, result, claimed_at")
        .eq("id", data.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (again.error) dbUnavailable(again.error);
      if (again.data?.consumed_at && again.data.result && !isAbandonedResult(again.data.result)) {
        return { ok: true, replayed: true, ...(again.data.result ?? {}) };
      }
      throw new AppError("This change is already in progress", 409, "IDEMPOTENCY");
    }
  }

  try {
    const result = await executeGoogle(userId, draft);
    const consumed = await supabaseAdmin
      .from("calendar_write_intents")
      .update({
        consumed_at: new Date().toISOString(),
        result,
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (consumed.error) {
      throw new AppError("Could not record the calendar confirmation", 503);
    }
    await audit(userId, draft.action, draft.calendarId, result.googleEventId, "ok");
    return { ok: true, action: draft.action, ...result };
  } catch (err) {
    await audit(userId, draft.action, draft.calendarId, draft.googleEventId ?? null, "error");
    const retryable =
      !(err instanceof AppError) || err.statusCode >= 500 || err.statusCode === 429;
    if (!retryable) {
      await supabaseAdmin
        .from("calendar_write_intents")
        .update({ claimed_at: null })
        .eq("id", data.id)
        .eq("user_id", userId)
        .is("consumed_at", null);
    }
    throw err;
  }
}

/** Provider interface: AI must not call this unattended. */
export async function createEvent(_userId: string, _input: CalendarWriteInput): Promise<CalendarEvent> {
  throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
}

export async function updateEvent(
  _userId: string,
  _eventId: string,
  _changes: CalendarWriteInput,
): Promise<CalendarEvent> {
  throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
}

export async function deleteEvent(_userId: string, _eventId: string): Promise<void> {
  throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
}
