export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  timezone: string;
  description: string | null;
  location: string | null;
  meetingUrl: string | null;
  calendarSource: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string | null;
  googleEventId: string;
  recurringEventId: string | null;
  htmlLink: string | null;
  etag: string | null;
  attendees: string[];
  canModify: boolean;
};

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary: boolean;
  selected: boolean;
  enabled: boolean;
  backgroundColor: string | null;
  timeZone: string | null;
  accessRole: string | null;
  writable: boolean;
};

export type CalendarWriteInput = {
  calendarId: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  timezone: string;
  isAllDay: boolean;
  location: string | null;
  attendees: string[];
  addMeet: boolean;
};

export type CalendarWriteAction = "create" | "update" | "delete";
export type RecurrenceMode = "this" | "series";
export type SendUpdatesMode = "all" | "externalOnly" | "none";

export type CalendarProvider = {
  listEvents(userId: string, options?: { days?: number }): Promise<CalendarEvent[]>;
  getTodayEvents(userId: string): Promise<CalendarEvent[]>;
  getUpcomingEvents(userId: string, days?: number): Promise<CalendarEvent[]>;
  createEvent(userId: string, input: CalendarWriteInput): Promise<CalendarEvent>;
  updateEvent(
    userId: string,
    eventId: string,
    changes: CalendarWriteInput,
  ): Promise<CalendarEvent>;
  deleteEvent(userId: string, eventId: string): Promise<void>;
};
