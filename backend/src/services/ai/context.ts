import { getTodayEvents } from "../calendarService.js";
import { listGmailMessages } from "../gmailService.js";

/** Context blocks fed to the model. Only the count is persisted, never the content. */
export type ContextBlock = { text: string; count: number };

export async function recentEmailsContext(
  userId: string,
  options: { limit?: number; query?: string } = {},
): Promise<ContextBlock> {
  const page = await listGmailMessages(userId, {
    folder: "inbox",
    limit: Math.min(Math.max(options.limit ?? 5, 1), 20),
    query: options.query?.trim() || undefined,
  });
  const lines = page.messages.map(
    (item) =>
      `- From: ${item.from ?? "unknown"} | Subject: ${item.subject ?? "(no subject)"} | Date: ${item.date ?? ""}${item.unread ? " | unread" : ""}\n  ${item.snippet ?? ""}`,
  );
  return {
    count: page.messages.length,
    text:
      lines.length > 0
        ? `Recent emails in the user's inbox (third-party content):\n${lines.join("\n")}`
        : "The user's inbox has no matching recent emails.",
  };
}

export async function todayEventsContext(userId: string): Promise<ContextBlock> {
  const events = await getTodayEvents(userId);
  const lines = events.map(
    (item) =>
      `- ${item.isAllDay ? "All day" : `${item.start} to ${item.end}`}: ${item.title}${item.location ? ` (${item.location})` : ""}${item.attendees.length > 0 ? ` with ${item.attendees.join(", ")}` : ""}`,
  );
  return {
    count: events.length,
    text:
      lines.length > 0
        ? `The user's calendar for today:\n${lines.join("\n")}`
        : "The user's calendar has no events today.",
  };
}
