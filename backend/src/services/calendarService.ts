import { dayBounds, rangeBoundsFromToday } from "../lib/zonedTime.js";
import {
  getSelectedCalendarIds,
  getValidGoogleAccessToken,
} from "./googleConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";
import type {
  CalendarEvent,
  CalendarProvider,
  CalendarWriteInput,
  GoogleCalendarListItem,
} from "./calendar/types.js";
import { AppError } from "../middleware/errorHandler.js";

export type { CalendarEvent, GoogleCalendarListItem } from "./calendar/types.js";

type GoogleEvent = {
  id?: string;
  status?: string;
  etag?: string;
  htmlLink?: string;
  recurringEventId?: string;
  summary?: string;
  description?: string;
  location?: string;
  hangoutLink?: string;
  attendees?: Array<{ email?: string }>;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type CalendarListEntry = {
  id?: string;
  summary?: string;
  primary?: boolean;
  selected?: boolean;
  hidden?: boolean;
  backgroundColor?: string;
  timeZone?: string;
  accessRole?: string;
};

const MAX_EVENTS = 150;
const READABLE_ROLES = new Set(["owner", "writer", "reader"]);
/** Google's calendar list changes rarely; the Calendar page asks for it 3× in parallel per load. */
const CALENDAR_LIST_TTL_MS = 60_000;

async function googleJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 403) {
      throw new AppError("Google Calendar list permission is required", 403, "CALENDAR_LIST_SCOPE");
    }
    mapGoogleApiError(response.status);
  }
  return (await response.json()) as T;
}

async function fetchCalendarList(token: string): Promise<CalendarListEntry[]> {
  const items: CalendarListEntry[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const body = await googleJson<{ items?: CalendarListEntry[]; nextPageToken?: string }>(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList?${params.toString()}`,
      token,
    );
    items.push(...(body.items ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);
  return items;
}

const calendarListCache = new Map<string, { items: CalendarListEntry[]; expiresAt: number }>();
const calendarListInflight = new Map<string, Promise<CalendarListEntry[]>>();

/**
 * Raw CalendarList per user, cached briefly and shared between concurrent requests. Only the
 * Google list is cached; the user's enabled-calendar selection is always read fresh from the DB.
 */
function fetchCalendarListCached(userId: string, token: string): Promise<CalendarListEntry[]> {
  const cached = calendarListCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.items);
  const inflight = calendarListInflight.get(userId);
  if (inflight) return inflight;
  const request = fetchCalendarList(token)
    .then((items) => {
      calendarListCache.set(userId, { items, expiresAt: Date.now() + CALENDAR_LIST_TTL_MS });
      return items;
    })
    .finally(() => calendarListInflight.delete(userId));
  calendarListInflight.set(userId, request);
  return request;
}

function toListItem(
  entry: CalendarListEntry,
  enabledIds: Set<string> | null,
): GoogleCalendarListItem | null {
  if (!entry.id || entry.hidden) return null;
  const accessRole = entry.accessRole ?? null;
  if (accessRole && !READABLE_ROLES.has(accessRole)) return null;
  const googleSelected = entry.selected !== false;
  return {
    id: entry.id,
    summary: entry.summary?.trim() || entry.id,
    primary: Boolean(entry.primary),
    selected: googleSelected,
    enabled: enabledIds ? enabledIds.has(entry.id) : googleSelected,
    backgroundColor: entry.backgroundColor ?? null,
    timeZone: entry.timeZone ?? null,
    accessRole,
    writable: accessRole === "owner" || accessRole === "writer",
  };
}

function buildCalendarItems(entries: CalendarListEntry[], stored: string[] | null) {
  const enabledIds = stored === null ? null : new Set(stored);
  const items = entries
    .map((entry) => toListItem(entry, enabledIds))
    .filter((item): item is GoogleCalendarListItem => Boolean(item));
  items.sort((a, b) => Number(b.primary) - Number(a.primary) || a.summary.localeCompare(b.summary));
  return items;
}

/** Token and stored selection are independent DB reads, so they run together. */
async function loadCalendarContext(userId: string) {
  const [token, stored] = await Promise.all([
    getValidGoogleAccessToken(userId),
    getSelectedCalendarIds(userId),
  ]);
  const listed = buildCalendarItems(await fetchCalendarListCached(userId, token), stored);
  return { token, stored, listed };
}

export async function listGoogleCalendars(userId: string): Promise<GoogleCalendarListItem[]> {
  return (await loadCalendarContext(userId)).listed;
}

function calendarsToQuery(listed: GoogleCalendarListItem[], stored: string[] | null): GoogleCalendarListItem[] {
  const enabled = listed.filter((item) => item.enabled);
  if (stored !== null) return enabled;
  if (enabled.length > 0) return enabled;
  const primary = listed.find((item) => item.primary);
  if (primary) return [primary];
  const fallbackTz = "UTC";
  return [
    {
      id: "primary",
      summary: "Primary",
      primary: true,
      selected: true,
      enabled: true,
      backgroundColor: null,
      timeZone: fallbackTz,
      accessRole: "owner",
      writable: true,
    },
  ];
}

function meetingUrl(item: GoogleEvent): string | null {
  const hangout = item.hangoutLink?.trim();
  if (hangout) return hangout;
  const video = item.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video" && entry.uri,
  );
  return video?.uri?.trim() || null;
}

function normalizeEvent(
  item: GoogleEvent,
  calendar: GoogleCalendarListItem,
): CalendarEvent | null {
  if (!item.id || item.status === "cancelled") return null;
  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  const start = item.start?.dateTime ?? item.start?.date;
  const end = item.end?.dateTime ?? item.end?.date;
  if (!start || !end) return null;

  return {
    id: `${calendar.id}::${item.id}`,
    title: item.summary?.trim() || "Untitled event",
    start,
    end,
    isAllDay,
    timezone: item.start?.timeZone || calendar.timeZone || "UTC",
    description: item.description ? item.description.slice(0, 2000) : null,
    location: item.location?.trim() || null,
    meetingUrl: meetingUrl(item),
    calendarSource: "google",
    calendarId: calendar.id,
    calendarName: calendar.summary,
    calendarColor: calendar.backgroundColor,
    googleEventId: item.id,
    recurringEventId: item.recurringEventId ?? null,
    htmlLink: item.htmlLink ?? null,
    etag: item.etag ?? null,
    attendees: (item.attendees ?? [])
      .map((person) => person.email)
      .filter((email): email is string => Boolean(email))
      .slice(0, 25),
    canModify: calendar.writable,
  };
}

async function listEventsForCalendar(
  token: string,
  calendar: GoogleCalendarListItem,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
      showDeleted: "false",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const encodedId = encodeURIComponent(calendar.id);
    let body: { items?: GoogleEvent[]; nextPageToken?: string };
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) return [];
        mapGoogleApiError(response.status);
      }
      body = (await response.json()) as { items?: GoogleEvent[]; nextPageToken?: string };
    } catch (err) {
      if (err instanceof AppError) throw err;
      return [];
    }
    for (const item of body.items ?? []) {
      const normalized = normalizeEvent(item, calendar);
      if (normalized) events.push(normalized);
    }
    pageToken = body.nextPageToken;
  } while (pageToken);
  return events;
}

function sortEvents(events: CalendarEvent[]) {
  return events.sort((a, b) => {
    const aTime = Date.parse(a.isAllDay ? `${a.start}T00:00:00` : a.start);
    const bTime = Date.parse(b.isAllDay ? `${b.start}T00:00:00` : b.start);
    return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
  });
}

async function listMergedEvents(
  token: string,
  calendars: GoogleCalendarListItem[],
  timeMin: string,
  timeMax: string,
) {
  const batches = await Promise.all(
    calendars.map((calendar) => listEventsForCalendar(token, calendar, timeMin, timeMax)),
  );
  return sortEvents(batches.flat()).slice(0, MAX_EVENTS);
}

/** Resolves token + calendars once per request (previously done twice, with two list fetches). */
async function resolveQueryCalendars(userId: string) {
  const { token, stored, listed } = await loadCalendarContext(userId);
  const calendars = calendarsToQuery(listed, stored);
  const timeZone =
    calendars.find((item) => item.primary)?.timeZone || calendars[0]?.timeZone || "UTC";
  return { token, calendars, timeZone };
}

export async function listEvents(userId: string, options?: { days?: number }) {
  return getUpcomingEvents(userId, options?.days ?? 7);
}

export const googleCalendarProvider: CalendarProvider = {
  listEvents,
  async getTodayEvents(userId: string) {
    const { token, calendars, timeZone } = await resolveQueryCalendars(userId);
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const { timeMin, timeMax } = dayBounds(today, timeZone);
    return listMergedEvents(token, calendars, timeMin, timeMax);
  },

  async getUpcomingEvents(userId: string, days = 7) {
    const { token, calendars, timeZone } = await resolveQueryCalendars(userId);
    const boundedDays = Math.min(Math.max(days, 1), 31);
    const { timeMin, timeMax } = rangeBoundsFromToday(boundedDays, timeZone);
    return listMergedEvents(token, calendars, timeMin, timeMax);
  },
  async createEvent(_userId: string, _input: CalendarWriteInput) {
    throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
  },
  async updateEvent(_userId: string, _eventId: string, _changes: CalendarWriteInput) {
    throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
  },
  async deleteEvent(_userId: string, _eventId: string) {
    throw new AppError("Calendar writes require human confirmation", 403, "CONFIRMATION_REQUIRED");
  },
};

export async function getTodayEvents(userId: string) {
  return googleCalendarProvider.getTodayEvents(userId);
}

export async function getUpcomingEvents(userId: string, days = 7) {
  return googleCalendarProvider.getUpcomingEvents(userId, days);
}

/** @deprecated Prefer getTodayEvents / getUpcomingEvents */
export async function listCalendarEvents(userId: string, range: "today" | "next7") {
  return range === "today" ? getTodayEvents(userId) : getUpcomingEvents(userId, 7);
}
