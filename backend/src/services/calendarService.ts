import { getValidGoogleAccessToken } from "./googleConnectionService.js";
import { mapGoogleApiError } from "./googleOAuth.js";

export type CalendarRange = "today" | "next7";

export type CalendarEventSummary = {
  id: string;
  title: string | null;
  start: string | null;
  end: string | null;
  location: string | null;
  organizer: string | null;
  attendees: string[];
  description: string | null;
};

function rangeBounds(range: CalendarRange) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (range === "today") {
    end.setDate(end.getDate() + 1);
  } else {
    end.setDate(end.getDate() + 7);
  }
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export async function listCalendarEvents(userId: string, range: CalendarRange) {
  const token = await getValidGoogleAccessToken(userId);
  const { timeMin, timeMax } = rangeBounds(range);
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "25",
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) mapGoogleApiError(response.status);

  const body = (await response.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      location?: string;
      organizer?: { email?: string; displayName?: string };
      attendees?: Array<{ email?: string }>;
      description?: string;
    }>;
  };

  return (body.items ?? [])
    .filter((item) => item.id)
    .map((item): CalendarEventSummary => ({
      id: item.id as string,
      title: item.summary ?? null,
      start: item.start?.dateTime ?? item.start?.date ?? null,
      end: item.end?.dateTime ?? item.end?.date ?? null,
      location: item.location ?? null,
      organizer: item.organizer?.displayName ?? item.organizer?.email ?? null,
      attendees: (item.attendees ?? [])
        .map((attendee) => attendee.email)
        .filter((email): email is string => Boolean(email))
        .slice(0, 20),
      description: item.description ? item.description.slice(0, 2000) : null,
    }));
}
