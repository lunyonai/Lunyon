import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeGmailHtml } from "./sanitize.js";

test("strips scripts, images, and event handlers", () => {
  const dirty =
    '<p onclick="steal()">Hi</p><script>alert(1)</script><img src="https://tracker.example/pixel.gif">';
  const clean = sanitizeGmailHtml(dirty);
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("img"), false);
  assert.equal(clean.includes("Hi"), true);
});

test("blocks javascript urls on links", () => {
  const clean = sanitizeGmailHtml('<a href="javascript:alert(1)">x</a>');
  assert.equal(clean.includes("javascript:"), false);
  assert.equal(clean.includes('href="#"'), true);
});
