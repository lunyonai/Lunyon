import assert from "node:assert/strict";
import test from "node:test";

test("page tokens are treated as opaque cursors", () => {
  const page = { messages: [{ id: "a" }], nextPageToken: "CURSOR" };
  assert.equal(page.nextPageToken, "CURSOR");
  assert.equal(page.messages.length, 1);
});
