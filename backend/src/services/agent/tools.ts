import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AppError } from "../../middleware/errorHandler.js";
import { getUpcomingEvents, listGoogleCalendars } from "../calendarService.js";
import { previewCalendarWrite } from "../calendarWrite.js";
import { getGmailMessage, searchGmailMessages } from "../gmailService.js";
import type { AgentTool, ToolCall } from "./models.js";

export type AgentActionKind = "calendar.create" | "calendar.update" | "calendar.delete";

/** A calendar change prepared by the assistant; executed only after the user confirms. */
export type PendingProposal = {
  id: string;
  kind: AgentActionKind;
  summary: Record<string, unknown>;
  confirmationToken: string;
  expiresAt: string;
};

export type ToolContext = {
  userId: string;
  timezone: string;
  proposals: PendingProposal[];
};

const MAX_EMAIL_BODY = 4000;

const eventFields = {
  title: { type: "string", description: "Event title" },
  start: {
    type: "string",
    description: "Local start in the user's timezone: YYYY-MM-DDTHH:mm, or YYYY-MM-DD when allDay",
  },
  end: {
    type: "string",
    description:
      "Local end in the user's timezone: YYYY-MM-DDTHH:mm, or YYYY-MM-DD (inclusive) when allDay",
  },
  allDay: { type: "boolean", description: "True for all-day events" },
  description: { type: "string", description: "Optional notes" },
  location: { type: "string", description: "Optional location" },
  attendees: {
    type: "array",
    items: { type: "string" },
    description: "Guest email addresses. Only use addresses the user gave or that appear in their data.",
  },
  addMeet: { type: "boolean", description: "Add a Google Meet link" },
} as const;

const recurrenceField = {
  type: "string",
  enum: ["this", "series"],
  description: "Required for recurring events: change only this occurrence or the whole series",
} as const;

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "list_calendars",
    description: "List the user's Google calendars and whether each can be edited.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "list_events",
    description: "List the user's calendar events from today through the next N days.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Number of days ahead, 1-31. Default 7." },
      },
    },
  },
  {
    name: "search_emails",
    description:
      "Search the user's Gmail. Supports Gmail search syntax (from:, subject:, newer_than:2d, is:unread).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Gmail search query" },
        limit: { type: "integer", description: "Max results, 1-10. Default 5." },
      },
      required: ["query"],
    },
  },
  {
    name: "read_email",
    description: "Read one email by id (from search_emails).",
    parameters: {
      type: "object",
      properties: { id: { type: "string", description: "Message id" } },
      required: ["id"],
    },
  },
  {
    name: "propose_create_event",
    description:
      "Prepare a new calendar event. Nothing is saved until the user confirms it in the interface.",
    parameters: {
      type: "object",
      properties: {
        calendarId: {
          type: "string",
          description: "Calendar id from list_calendars. Omit to use the primary calendar.",
        },
        ...eventFields,
      },
      required: ["title", "start", "end"],
    },
  },
  {
    name: "propose_update_event",
    description:
      "Prepare changes to an existing event (send the full event, not only changed fields). The user must confirm it.",
    parameters: {
      type: "object",
      properties: {
        calendarId: { type: "string", description: "calendarId from list_events" },
        googleEventId: { type: "string", description: "googleEventId from list_events" },
        recurrence: recurrenceField,
        ...eventFields,
      },
      required: ["calendarId", "googleEventId", "title", "start", "end"],
    },
  },
  {
    name: "propose_delete_event",
    description: "Prepare the removal of an event. The user must confirm it.",
    parameters: {
      type: "object",
      properties: {
        calendarId: { type: "string", description: "calendarId from list_events" },
        googleEventId: { type: "string", description: "googleEventId from list_events" },
        recurrence: recurrenceField,
      },
      required: ["calendarId", "googleEventId"],
    },
  },
];

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? Math.trunc(value) : Number.NaN;
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

async function defaultCalendarId(userId: string) {
  const calendars = await listGoogleCalendars(userId);
  const writable = calendars.filter((item) => item.writable);
  const calendar = writable.find((item) => item.primary) ?? writable[0];
  if (!calendar) throw new AppError("No editable calendar is available", 403, "CALENDAR_READ_ONLY");
  return calendar.id;
}

function eventDraft(args: Record<string, unknown>, timezone: string) {
  const allDay = args.allDay === true;
  return {
    title: str(args.title) ?? "",
    description: str(args.description) ?? null,
    start: str(args.start) ?? "",
    end: str(args.end) ?? "",
    timezone,
    isAllDay: allDay,
    location: str(args.location) ?? null,
    attendees: Array.isArray(args.attendees)
      ? args.attendees.filter((item): item is string => typeof item === "string")
      : [],
    addMeet: args.addMeet === true,
  };
}

async function propose(
  ctx: ToolContext,
  action: "create" | "update" | "delete",
  args: Record<string, unknown>,
) {
  const calendarId = str(args.calendarId) ?? (await defaultCalendarId(ctx.userId));
  const recurrence = args.recurrence === "this" || args.recurrence === "series" ? args.recurrence : undefined;
  const preview = await previewCalendarWrite(ctx.userId, {
    action,
    calendarId,
    googleEventId: str(args.googleEventId),
    recurrence,
    idempotencyKey: `agent-${randomUUID()}`,
    event: action === "delete" ? undefined : eventDraft(args, ctx.timezone),
  });

  const proposal: PendingProposal = {
    id: randomUUID(),
    kind: `calendar.${action}`,
    summary: { ...preview.summary, timezone: ctx.timezone },
    confirmationToken: preview.confirmationToken,
    expiresAt: new Date(Date.now() + preview.expiresInSeconds * 1000).toISOString(),
  };
  ctx.proposals.push(proposal);

  const { title, start, end, calendarName, conflicts } = preview.summary as Record<string, unknown>;
  return {
    status: "awaiting_user_confirmation",
    note: "Shown to the user as a card with a Confirm button. It is NOT saved yet.",
    title,
    start,
    end,
    calendarName,
    conflicts,
  };
}

async function runTool(ctx: ToolContext, call: ToolCall): Promise<unknown> {
  const { args } = call;
  switch (call.name) {
    case "list_calendars": {
      const calendars = await listGoogleCalendars(ctx.userId);
      return calendars.map((item) => ({
        id: item.id,
        name: item.summary,
        primary: item.primary,
        editable: item.writable,
      }));
    }
    case "list_events": {
      const events = await getUpcomingEvents(ctx.userId, clampInt(args.days, 1, 31, 7));
      return events.map((item) => ({
        title: item.title,
        start: item.start,
        end: item.end,
        allDay: item.isAllDay,
        location: item.location,
        attendees: item.attendees,
        calendarId: item.calendarId,
        calendarName: item.calendarName,
        googleEventId: item.googleEventId,
        recurring: Boolean(item.recurringEventId),
        editable: item.canModify,
      }));
    }
    case "search_emails": {
      const page = await searchGmailMessages(ctx.userId, str(args.query) ?? "", {
        limit: clampInt(args.limit, 1, 10, 5),
      });
      return page.messages.map((item) => ({
        id: item.id,
        from: item.from,
        subject: item.subject,
        date: item.date,
        snippet: item.snippet,
        unread: item.unread,
      }));
    }
    case "read_email": {
      const message = await getGmailMessage(ctx.userId, str(args.id) ?? "");
      return {
        from: message.from,
        to: message.to,
        cc: message.cc,
        subject: message.subject,
        date: message.date,
        body: (message.bodyText ?? message.snippet ?? "").slice(0, MAX_EMAIL_BODY),
      };
    }
    case "propose_create_event":
      return propose(ctx, "create", args);
    case "propose_update_event":
      return propose(ctx, "update", args);
    case "propose_delete_event":
      return propose(ctx, "delete", args);
    default:
      return { error: `Unknown tool ${call.name}` };
  }
}

/** Runs a tool and turns failures into data the model can explain to the user. */
export async function executeTool(ctx: ToolContext, call: ToolCall): Promise<unknown> {
  try {
    return await runTool(ctx, call);
  } catch (err) {
    if (err instanceof AppError) {
      return { error: err.message, ...(err.code ? { code: err.code } : {}) };
    }
    if (err instanceof ZodError) {
      return { error: "Invalid arguments for this tool" };
    }
    return { error: "This tool failed" };
  }
}
