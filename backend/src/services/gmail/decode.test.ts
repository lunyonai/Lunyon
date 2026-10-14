import assert from "node:assert/strict";
import test from "node:test";
import { decodeBase64Url, decodeGmailPayload, headerValue } from "./decode.js";

test("decodes Gmail base64url bodies", () => {
  const encoded = Buffer.from("Hello Lunyon", "utf8").toString("base64url");
  assert.equal(decodeBase64Url(encoded), "Hello Lunyon");
});

test("decodes multipart MIME preferring plain text", () => {
  const plain = Buffer.from("Plain body", "utf8").toString("base64url");
  const html = Buffer.from("<p>HTML body</p>", "utf8").toString("base64url");
  const decoded = decodeGmailPayload({
    mimeType: "multipart/alternative",
    parts: [
      { mimeType: "text/plain", body: { data: plain } },
      { mimeType: "text/html", body: { data: html } },
    ],
  });
  assert.equal(decoded.text, "Plain body");
  assert.equal(decoded.html, "<p>HTML body</p>");
});

test("does not expose attachment payloads", () => {
  const decoded = decodeGmailPayload({
    mimeType: "multipart/mixed",
    parts: [
      { mimeType: "text/plain", body: { data: Buffer.from("Hi", "utf8").toString("base64url") } },
      {
        mimeType: "application/pdf",
        filename: "secret.pdf",
        body: { attachmentId: "ATT123", size: 2048, data: "SHOULD_NOT_DECODE" },
      },
    ],
  });
  assert.equal(decoded.text, "Hi");
  assert.equal(decoded.attachments.length, 1);
  assert.equal(decoded.attachments[0]?.filename, "secret.pdf");
  assert.ok(!JSON.stringify(decoded).includes("SHOULD_NOT_DECODE"));
});

test("reads headers safely when missing", () => {
  assert.equal(headerValue(undefined, "Subject"), null);
  assert.equal(headerValue([{ name: "From", value: "Ada <ada@example.com>" }], "from"), "Ada <ada@example.com>");
});
