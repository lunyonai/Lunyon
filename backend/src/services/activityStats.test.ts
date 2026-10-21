import assert from "node:assert/strict";
import test from "node:test";
import { summarizeActivity } from "./activityService.js";

const now = new Date("2026-10-21T15:00:00Z");
const startOfToday = new Date("2026-10-21T03:00:00Z");

function row(
  type: "prompt" | "employee" | "workflow",
  createdAt: string,
  status: "succeeded" | "failed" = "succeeded",
  ref: string | null = null,
  durationMs: number | null = null,
) {
  return { type, ref_id: ref, status, duration_ms: durationMs, created_at: createdAt };
}

test("counts successes by type, today, week and reference", () => {
  const stats = summarizeActivity(
    [
      row("prompt", "2026-10-21T14:00:00Z", "succeeded", "notes", 1000),
      row("prompt", "2026-10-21T02:00:00Z", "succeeded", "notes", 3000),
      row("employee", "2026-10-10T10:00:00Z", "succeeded", "emp-1"),
      row("workflow", "2026-10-20T10:00:00Z", "failed", "wf-1"),
      row("workflow", "2026-10-19T10:00:00Z", "succeeded", "wf-1"),
    ],
    startOfToday,
    now,
  );
  assert.deepEqual(stats.totals, { prompt: 2, employee: 1, workflow: 1 });
  assert.equal(stats.today, 1);
  assert.equal(stats.week, 3);
  assert.equal(stats.workflowRunsWeek, 2);
  assert.equal(stats.workflowFailuresWeek, 1);
  assert.equal(stats.byRef["prompt:notes"], 2);
  assert.equal(stats.byRef["workflow:wf-1"], 1);
  assert.equal(stats.avgDurationMs, 2000);
});

test("empty activity has no average", () => {
  assert.equal(summarizeActivity([], startOfToday, now).avgDurationMs, null);
});
