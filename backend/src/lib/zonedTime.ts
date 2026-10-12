function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function calendarYmd(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    return now.toISOString().slice(0, 10);
  }
  return `${year}-${month}-${day}`;
}

export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

function offsetAt(date: Date, timeZone: string): string {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "numeric",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!name || name === "GMT" || name === "UTC") return "+00:00";
  const match = name.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return "+00:00";
  return `${match[1]}${match[2].padStart(2, "0")}:${(match[3] ?? "00").padStart(2, "0")}`;
}

export function zonedWallToIso(ymd: string, wallTime: string, timeZone: string): string {
  const first = new Date(`${ymd}T${wallTime}Z`);
  const offset = offsetAt(first, timeZone);
  const withOffset = new Date(`${ymd}T${wallTime}${offset}`);
  const adjusted = offsetAt(withOffset, timeZone);
  return `${ymd}T${wallTime}${adjusted}`;
}

export function dayBounds(ymd: string, timeZone: string) {
  return {
    timeMin: zonedWallToIso(ymd, "00:00:00", timeZone),
    timeMax: zonedWallToIso(addCalendarDays(ymd, 1), "00:00:00", timeZone),
  };
}

export function rangeBoundsFromToday(days: number, timeZone: string, now = new Date()) {
  const start = calendarYmd(now, timeZone);
  return {
    timeMin: zonedWallToIso(start, "00:00:00", timeZone),
    timeMax: zonedWallToIso(addCalendarDays(start, days), "00:00:00", timeZone),
  };
}
