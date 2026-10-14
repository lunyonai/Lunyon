export const GMAIL_FOLDERS = ["inbox", "sent", "all"] as const;

export type GmailFolder = (typeof GMAIL_FOLDERS)[number];

export function isGmailFolder(value: string): value is GmailFolder {
  return (GMAIL_FOLDERS as readonly string[]).includes(value);
}

export function parseGmailFolder(value: unknown, fallback: GmailFolder = "inbox"): GmailFolder {
  return typeof value === "string" && isGmailFolder(value) ? value : fallback;
}

/**
 * Maps Lunyon folders to Gmail users.messages.list params.
 * Inbox/Sent use official labelIds. All Mail omits labels so Gmail excludes
 * SPAM and TRASH by default (includeSpamTrash is never set).
 */
export function gmailFolderListParams(folder: GmailFolder, userQuery?: string) {
  const q = userQuery?.trim().slice(0, 500) || "";
  if (folder === "inbox") {
    return { labelIds: ["INBOX"] as string[], q };
  }
  if (folder === "sent") {
    return { labelIds: ["SENT"] as string[], q };
  }
  return { labelIds: [] as string[], q };
}

export function applyGmailFolderParams(
  params: URLSearchParams,
  folder: GmailFolder,
  userQuery?: string,
) {
  const { labelIds, q } = gmailFolderListParams(folder, userQuery);
  for (const label of labelIds) params.append("labelIds", label);
  if (q) params.set("q", q);
  return { folder, labelIds, q };
}
