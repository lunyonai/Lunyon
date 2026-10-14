const MAX_TEXT_CHARS = 200_000;

export type GmailMimePart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailMimePart[];
  headers?: Array<{ name?: string; value?: string }>;
};

export type DecodedGmailBody = {
  text: string | null;
  html: string | null;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
};

export function decodeBase64Url(data: string): string {
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function clip(value: string) {
  return value.length > MAX_TEXT_CHARS ? value.slice(0, MAX_TEXT_CHARS) : value;
}

function isAttachment(part: GmailMimePart) {
  if (part.body?.attachmentId) return true;
  const filename = part.filename?.trim();
  return Boolean(filename);
}

export function decodeGmailPayload(payload: GmailMimePart | undefined): DecodedGmailBody {
  const found = { text: null as string | null, html: null as string | null };
  const attachments: DecodedGmailBody["attachments"] = [];

  function walk(part: GmailMimePart | undefined, depth: number) {
    if (!part || depth > 12) return;

    if (isAttachment(part)) {
      attachments.push({
        filename: part.filename?.trim() || "attachment",
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body?.size ?? 0,
      });
      return;
    }

    const mime = (part.mimeType || "").toLowerCase();
    if (part.body?.data) {
      const decoded = clip(decodeBase64Url(part.body.data));
      if (mime.startsWith("text/plain") && !found.text) found.text = decoded;
      if (mime.startsWith("text/html") && !found.html) found.html = decoded;
    }

    if (Array.isArray(part.parts)) {
      for (const child of part.parts) walk(child, depth + 1);
    }
  }

  walk(payload, 0);

  const htmlOut = found.html;
  const textOut =
    found.text ??
    (htmlOut ? clip(htmlOut.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) : null);

  return { text: textOut, html: htmlOut, attachments: attachments.slice(0, 25) };
}

export function headerValue(
  headers: Array<{ name?: string; value?: string }> | undefined,
  name: string,
) {
  const match = headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  const value = match?.value?.trim();
  return value || null;
}
