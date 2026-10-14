import assert from "node:assert/strict";
import test from "node:test";
import { signOAuthState, verifyOAuthState } from "./tokenCrypto.js";

test("signs and verifies calendar and gmail OAuth state", () => {
  const calendar = verifyOAuthState(signOAuthState("user-a", "calendar"));
  const gmail = verifyOAuthState(signOAuthState("user-a", "gmail"));
  assert.equal(calendar.userId, "user-a");
  assert.equal(calendar.purpose, "calendar");
  assert.equal(gmail.purpose, "gmail");
  assert.equal(verifyOAuthState(signOAuthState("user-a", "gmail_send")).purpose, "gmail_send");
});

test("rejects tampered OAuth state", () => {
  const token = signOAuthState("user-a", "gmail");
  assert.throws(() => verifyOAuthState(`${token}x`));
});

test("does not treat a gmail grant as a calendar grant", () => {
  const gmail = verifyOAuthState(signOAuthState("user-b", "gmail"));
  assert.notEqual(gmail.purpose, "calendar");
});
