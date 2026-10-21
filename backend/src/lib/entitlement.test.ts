import assert from "node:assert/strict";
import test from "node:test";
import { nextAccessUntil } from "./entitlement.js";

const now = new Date("2026-10-21T12:00:00Z");

test("a first purchase grants access from now", () => {
  const next = nextAccessUntil(null, 365, now);
  assert.equal(next.accessUntil, "2027-10-21T12:00:00.000Z");
  assert.equal(next.status, "active");
});

test("a second purchase stacks on the remaining time", () => {
  const next = nextAccessUntil("2027-01-01T00:00:00.000Z", 365, now);
  assert.equal(next.accessUntil, "2028-01-01T00:00:00.000Z");
});

test("an expired plan restarts from now", () => {
  const next = nextAccessUntil("2025-01-01T00:00:00.000Z", 365, now);
  assert.equal(next.accessUntil, "2027-10-21T12:00:00.000Z");
});

test("a refund removes the purchased days and cancels when nothing is left", () => {
  const next = nextAccessUntil("2027-10-21T12:00:00.000Z", -365, now);
  assert.equal(next.status, "canceled");
});

test("a refund of one of two purchases keeps the plan active", () => {
  const next = nextAccessUntil("2028-10-20T12:00:00.000Z", -365, now);
  assert.equal(next.status, "active");
  assert.equal(next.accessUntil, "2027-10-21T12:00:00.000Z");
});
