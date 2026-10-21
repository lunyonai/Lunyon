import { addCalendarDays, calendarYmd, zonedWallToIso } from "./zonedTime.js";

export type ScheduleFrequency = "daily" | "weekdays" | "weekly";

export type WorkflowSchedule = {
  frequency: ScheduleFrequency;
  /** Local wall time HH:mm in `timezone`. */
  time: string;
  /** 0 = Sunday … 6 = Saturday. Required for weekly. */
  weekday?: number;
  timezone: string;
  locale: "en" | "pt" | "es";
};

export function isValidTimezone(timezone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function weekdayOf(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function matchesDay(schedule: WorkflowSchedule, ymd: string) {
  const weekday = weekdayOf(ymd);
  if (schedule.frequency === "weekdays") return weekday >= 1 && weekday <= 5;
  if (schedule.frequency === "weekly") return weekday === (schedule.weekday ?? 1);
  return true;
}

/** First occurrence strictly after `after`, as a UTC Date. */
export function computeNextRun(schedule: WorkflowSchedule, after: Date): Date {
  const timezone = isValidTimezone(schedule.timezone) ? schedule.timezone : "UTC";
  const today = calendarYmd(after, timezone);
  // Starts yesterday so a local day that began before `after` in UTC is not skipped.
  for (let offset = -1; offset <= 8; offset += 1) {
    const ymd = addCalendarDays(today, offset);
    if (!matchesDay(schedule, ymd)) continue;
    const candidate = new Date(zonedWallToIso(ymd, `${schedule.time}:00`, timezone));
    if (candidate.getTime() > after.getTime()) return candidate;
  }
  // Unreachable for valid schedules; keeps the workflow from firing in a loop.
  return new Date(after.getTime() + 24 * 60 * 60 * 1000);
}
