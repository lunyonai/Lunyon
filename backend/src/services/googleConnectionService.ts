import { supabaseAdmin } from "../lib/supabase.js";
import { decryptSecret, encryptSecret } from "../lib/tokenCrypto.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  exchangeGoogleCode,
  GOOGLE_SCOPES,
  refreshGoogleAccessToken,
  revokeGoogleToken,
} from "./googleOAuth.js";

const PROVIDER = "google";

type ConnectionRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string | null;
  provider_email: string | null;
  status: "disconnected" | "connected" | "error";
  scopes: string[] | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
};

export type GoogleStatus = {
  connected: boolean;
  status: "disconnected" | "connected" | "error";
  email: string | null;
  capabilities: string[];
};

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Integrations are not available yet", 503);
  }
  throw new AppError("Could not complete this request", 400);
}

function publicStatus(row: ConnectionRow | null): GoogleStatus {
  if (!row || row.status !== "connected") {
    return {
      connected: false,
      status: row?.status === "error" ? "error" : "disconnected",
      email: null,
      capabilities: [],
    };
  }

  const scopes = row.scopes ?? [];
  const capabilities: string[] = [];
  if (scopes.some((scope) => scope.includes("gmail.readonly"))) {
    capabilities.push("gmail.read");
  }
  if (scopes.some((scope) => scope.includes("calendar.readonly"))) {
    capabilities.push("calendar.read");
  }

  return {
    connected: true,
    status: "connected",
    email: row.provider_email,
    capabilities,
  };
}

async function loadConnection(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("integration_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error) dbError(error);
  return (data as ConnectionRow | null) ?? null;
}

export async function getGoogleStatus(userId: string): Promise<GoogleStatus> {
  return publicStatus(await loadConnection(userId));
}

async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new AppError("Could not read Google account", 502);
  }
  const profile = (await response.json()) as { id?: string; email?: string };
  return {
    id: profile.id ?? null,
    email: profile.email ?? null,
  };
}

export async function completeGoogleOAuth(userId: string, code: string) {
  const tokens = await exchangeGoogleCode(code);
  const profile = await fetchGoogleProfile(tokens.access_token as string);
  const existing = await loadConnection(userId);
  const refreshToken =
    tokens.refresh_token ??
    (existing?.refresh_token_encrypted
      ? decryptSecret(existing.refresh_token_encrypted)
      : null);

  if (!refreshToken) {
    throw new AppError("Google did not return a refresh token. Reconnect and grant access.", 400);
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : new Date(Date.now() + 45 * 60 * 1000).toISOString();

  const payload = {
    user_id: userId,
    provider: PROVIDER,
    provider_account_id: profile.id,
    provider_email: profile.email,
    status: "connected",
    scopes: [...GOOGLE_SCOPES],
    access_token_encrypted: encryptSecret(tokens.access_token as string),
    refresh_token_encrypted: encryptSecret(refreshToken),
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabaseAdmin
        .from("integration_connections")
        .update(payload)
        .eq("user_id", userId)
        .eq("provider", PROVIDER)
    : await supabaseAdmin.from("integration_connections").insert(payload);

  if (error) dbError(error);
}

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const row = await loadConnection(userId);
  if (!row || row.status !== "connected" || !row.access_token_encrypted) {
    throw new AppError("Google is not connected", 409);
  }

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const fresh = expiresAt - 60_000 > Date.now();
  if (fresh) {
    return decryptSecret(row.access_token_encrypted);
  }

  if (!row.refresh_token_encrypted) {
    throw new AppError("Google reconnection required", 401);
  }

  try {
    const refreshed = await refreshGoogleAccessToken(
      decryptSecret(row.refresh_token_encrypted),
    );
    const nextExpiry = refreshed.expiry_date
      ? new Date(refreshed.expiry_date).toISOString()
      : new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const nextRefresh =
      refreshed.refresh_token ?? decryptSecret(row.refresh_token_encrypted);

    const { error } = await supabaseAdmin
      .from("integration_connections")
      .update({
        access_token_encrypted: encryptSecret(refreshed.access_token as string),
        refresh_token_encrypted: encryptSecret(nextRefresh),
        token_expires_at: nextExpiry,
        status: "connected",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", PROVIDER);

    if (error) dbError(error);
    return refreshed.access_token as string;
  } catch {
    await supabaseAdmin
      .from("integration_connections")
      .update({
        status: "error",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", PROVIDER);
    throw new AppError("Google reconnection required", 401);
  }
}

export async function disconnectGoogle(userId: string) {
  const row = await loadConnection(userId);
  if (!row) return publicStatus(null);

  const candidates = [
    row.access_token_encrypted,
    row.refresh_token_encrypted,
  ].filter((item): item is string => Boolean(item));

  for (const encrypted of candidates) {
    try {
      await revokeGoogleToken(decryptSecret(encrypted));
    } catch {
      // continue
    }
  }

  const { error } = await supabaseAdmin
    .from("integration_connections")
    .update({
      status: "disconnected",
      provider_account_id: null,
      provider_email: null,
      scopes: [],
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", PROVIDER);

  if (error) dbError(error);
  return publicStatus({ ...row, status: "disconnected", provider_email: null });
}
