const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * New access end after adding (or, for a refund, removing) `days` of access.
 * Purchases stack: time left on an active plan is kept, an expired plan restarts from now.
 */
export function nextAccessUntil(currentUntil: string | null, days: number, now = new Date()) {
  const current = currentUntil ? new Date(currentUntil).getTime() : Number.NaN;
  const base =
    days > 0
      ? Math.max(Number.isNaN(current) ? 0 : current, now.getTime())
      : Number.isNaN(current)
        ? now.getTime()
        : current;
  const until = new Date(base + days * DAY_MS);
  return {
    accessUntil: until.toISOString(),
    status: until.getTime() > now.getTime() ? ("active" as const) : ("canceled" as const),
  };
}
