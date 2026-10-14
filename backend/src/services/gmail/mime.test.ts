import assert from "node:assert/strict";
import test from "node:test";
import { buildRfc822, extractEmails, parseRecipientList, rfc822ToRaw } from "./mime.js";

test("rejects header injection in recipients", () => {
  assert.throws(() => parseRecipientList(["ok@example.com\r\nBcc: hidden@x.com"], "to"));
});

test("rejects invalid addresses", () => {
  assert.throws(() => parseRecipientList(["not-an-email"], "to"));
});

test("extracts emails from From headers", () => {
  assert.deepEqual(extractEmails('Ada Lovelace <ada@example.com>, bob@example.com'), [
    "ada@example.com",
    "bob@example.com",
  ]);
});

test("builds a base64url-safe MIME message", () => {
  const rfc = buildRfc822({
    from: "me@example.com",
    to: ["you@example.com"],
    cc: [],
    bcc: [],
    subject: "Hello",
    text: "Hi there",
  });
  assert.equal(rfc.includes("\r\nBcc:"), false);
  assert.equal(rfc.includes("Hi there"), true);
  assert.equal(rfc.includes("To: you@example.com"), true);
  const raw = rfc822ToRaw(rfc);
  assert.equal(raw.includes("+"), false);
  assert.equal(raw.includes("/"), false);
});
