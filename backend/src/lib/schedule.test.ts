import assert from "node:assert/strict";
import test from "node:test";
import { computeNextRun, type WorkflowSchedule } from "./schedule.js";

const base: WorkflowSchedule = {
  frequency: "daily",
  time: "09:00",
  timezone: "America/Sao_Paulo",
  locale: "pt",
};

test("daily runs later the same local day when the time has not passed", () => {
  // 08:00 in São Paulo (UTC-3)
  const next = computeNextRun(base, new Date("2026-10-21T11:00:00Z"));
  assert.equal(next.toISOString(), "2026-10-21T12:00:00.000Z");
});

test("daily moves to the next day once the time has passed", () => {
  const next = computeNextRun(base, new Date("2026-10-21T12:00:00Z"));
  assert.equal(next.toISOString(), "2026-10-22T12:00:00.000Z");
});

test("uses the local date, not the UTC date, near midnight", () => {
  // 2026-10-21 23:30 in São Paulo is already the 22nd in UTC.
  const next = computeNextRun({ ...base, time: "23:45" }, new Date("2026-10-22T02:30:00Z"));
  assert.equal(next.toISOString(), "2026-10-22T02:45:00.000Z");
});

test("weekdays skips Saturday and Sunday", () => {
  // Friday 2026-10-23 after 09:00 local -> Monday 2026-10-26
  const next = computeNextRun(
    { ...base, frequency: "weekdays" },
    new Date("2026-10-23T15:00:00Z"),
  );
  assert.equal(next.toISOString(), "2026-10-26T12:00:00.000Z");
});

test("weekly runs on the chosen weekday", () => {
  // Wednesday 2026-10-21 -> Friday (5) 2026-10-23
  const next = computeNextRun(
    { ...base, frequency: "weekly", weekday: 5 },
    new Date("2026-10-21T15:00:00Z"),
  );
  assert.equal(next.toISOString(), "2026-10-23T12:00:00.000Z");
});

test("an invalid timezone falls back to UTC", () => {
  const next = computeNextRun({ ...base, timezone: "Mars/Base" }, new Date("2026-10-21T08:00:00Z"));
  assert.equal(next.toISOString(), "2026-10-21T09:00:00.000Z");
});
