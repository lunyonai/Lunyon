import { AppError } from "../../middleware/errorHandler.js";

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const HEADER_UNSAFE = /[\r\n\0]/;

export function normalizeEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  const angled = trimmed.match(/<([^>]+)>/);
  return (angled?.[1] ?? trimmed).trim();
}

export function extractEmails(header: string | null | undefined) {
  if (!header?.trim()) return [];
  return header
    .split(",")
    .map(normalizeEmail)
    .filter((email) => EMAIL_RE.test(email));
}

export function assertSafeHeader(name: string, value: string) {
  if (HEADER_UNSAFE.test(name) || HEADER_UNSAFE.test(value)) {
    throw new AppError("Invalid email header", 400);
  }
}

export function parseRecipientList(values: string[] | undefined, field: string) {
  const unique = [...new Set((values ?? []).map(normalizeEmail).filter(Boolean))];
  if (unique.length > 10) {
    throw new AppError(`Too many ${field} recipients`, 400);
  }
  for (const email of unique) {
    if (!EMAIL_RE.test(email) || HEADER_UNSAFE.test(email)) {
      throw new AppError(`Invalid ${field} address`, 400);
    }
  }
  return unique;
}

function encodeSubject(subject: string) {
  assertSafeHeader("Subject", subject);
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type MimeInput = {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string;
  inReplyTo?: string | null;
  references?: string | null;
};

export function buildRfc822(input: MimeInput) {
  if (input.to.length < 1) throw new AppError("At least one recipient is required", 400);
  const all = [...input.to, ...input.cc, ...input.bcc];
  if (all.length > 25) throw new AppError("Too many recipients", 400);
  if (input.text.length > 100_000) throw new AppError("Message is too long", 400);
  assertSafeHeader("From", input.from);

  if (input.inReplyTo) assertSafeHeader("In-Reply-To", input.inReplyTo);
  if (input.references) assertSafeHeader("References", input.references);

  const boundary = `lunyon_${Date.now().toString(16)}`;
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`;
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
    input.cc.length ? `Cc: ${input.cc.join(", ")}` : null,
    input.bcc.length ? `Bcc: ${input.bcc.join(", ")}` : null,
    `Subject: ${encodeSubject(input.subject.slice(0, 200))}`,
    input.inReplyTo ? `In-Reply-To: ${input.inReplyTo}` : null,
    input.references ? `References: ${input.references}` : null,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
    "",
  ].filter((line) => line !== null);

  return lines.join("\r\n");
}

export function rfc822ToRaw(rfc822: string) {
  return Buffer.from(rfc822, "utf8").toString("base64url");
}
