import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGmailFolderParams,
  gmailFolderListParams,
  parseGmailFolder,
} from "./folder.js";

test("inbox lists INBOX-labeled messages", () => {
  const params = gmailFolderListParams("inbox");
  assert.deepEqual(params.labelIds, ["INBOX"]);
  assert.equal(params.q, "");
});

test("sent lists SENT-labeled messages", () => {
  const params = gmailFolderListParams("sent");
  assert.deepEqual(params.labelIds, ["SENT"]);
});

test("all mail does not request Spam or Trash", () => {
  const params = gmailFolderListParams("all");
  assert.deepEqual(params.labelIds, []);
  const query = new URLSearchParams({ maxResults: "20" });
  applyGmailFolderParams(query, "all");
  assert.equal(query.has("includeSpamTrash"), false);
  assert.equal(query.get("labelIds"), null);
});

test("messages with both INBOX and SENT are not stripped by sender filters", () => {
  const inbox = gmailFolderListParams("inbox");
  const sent = gmailFolderListParams("sent");
  assert.equal(inbox.labelIds.includes("INBOX"), true);
  assert.equal(sent.labelIds.includes("SENT"), true);
  assert.equal(inbox.q.includes("from:"), false);
  assert.equal(sent.q.includes("from:"), false);
});

test("search is combined with folder labels", () => {
  const inbox = gmailFolderListParams("inbox", "invoice");
  assert.deepEqual(inbox.labelIds, ["INBOX"]);
  assert.equal(inbox.q, "invoice");
  const all = gmailFolderListParams("all", "invoice");
  assert.deepEqual(all.labelIds, []);
  assert.equal(all.q, "invoice");
});

test("folder pagination tokens are not mixed in params", () => {
  const inbox = new URLSearchParams();
  applyGmailFolderParams(inbox, "inbox");
  inbox.set("pageToken", "INBOX_CURSOR");
  const sent = new URLSearchParams();
  applyGmailFolderParams(sent, "sent");
  sent.set("pageToken", "SENT_CURSOR");
  assert.equal(inbox.get("labelIds"), "INBOX");
  assert.equal(sent.get("labelIds"), "SENT");
  assert.notEqual(inbox.get("pageToken"), sent.get("pageToken"));
});

test("unknown folder falls back", () => {
  assert.equal(parseGmailFolder("trash", "inbox"), "inbox");
  assert.equal(parseGmailFolder("sent"), "sent");
});
