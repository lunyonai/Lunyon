import assert from "node:assert/strict";
import test from "node:test";
import { hasCalendarWriteScope, hasGmailReadScope, hasGmailSendScope } from "./googleOAuth.js";

test("gmail readonly does not imply calendar write", () => {
  const gmail = ["https://www.googleapis.com/auth/gmail.readonly"];
  assert.equal(hasGmailReadScope(gmail), true);
  assert.equal(hasGmailSendScope(gmail), false);
  assert.equal(hasCalendarWriteScope(gmail), false);
});

test("gmail send does not replace readonly", () => {
  const send = ["https://www.googleapis.com/auth/gmail.send"];
  assert.equal(hasGmailSendScope(send), true);
  assert.equal(hasGmailReadScope(send), false);
});

test("calendar scopes do not imply gmail read", () => {
  const calendar = [
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  ];
  assert.equal(hasGmailReadScope(calendar), false);
  assert.equal(hasCalendarWriteScope(calendar), false);
});
