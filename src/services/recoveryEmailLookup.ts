import { supabase } from "../lib/supabase";

export type RecoveryEmailLookup =
  | "registered"
  | "unregistered"
  | "rate_limited"
  | "invalid_email"
  | "unavailable";

function statusFromUnknown(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const context = (error as { context?: { status?: number } }).context;
  return typeof context?.status === "number" ? context.status : undefined;
}

async function errorPayload(error: unknown): Promise<{ error?: string } | null> {
  if (!error || typeof error !== "object") return null;
  const context = (error as { context?: Response }).context;
  if (!context || typeof context.json !== "function") return null;
  try {
    return (await context.json()) as { error?: string };
  } catch {
    return null;
  }
}

export function normalizeRecoveryEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidRecoveryEmail(email: string) {
  const normalized = normalizeRecoveryEmail(email);
  return (
    normalized.length > 0 &&
    normalized.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  );
}

export async function lookupRecoveryEmail(
  email: string,
): Promise<RecoveryEmailLookup> {
  if (!isValidRecoveryEmail(email)) return "invalid_email";

  try {
    const { data, error } = await supabase.functions.invoke(
      "check-recovery-email",
      { body: { email: normalizeRecoveryEmail(email) } },
    );

    if (error) {
      const status = statusFromUnknown(error);
      const payload = await errorPayload(error);
      if (status === 429 || payload?.error === "rate_limited") {
        return "rate_limited";
      }
      if (status === 400 || payload?.error === "invalid_email") {
        return "invalid_email";
      }
      return "unavailable";
    }

    if (data && typeof data === "object" && data.registered === true) {
      return "registered";
    }
    if (data && typeof data === "object" && data.registered === false) {
      return "unregistered";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
