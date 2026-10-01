import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export function assertGoogleConfigured() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new AppError("Google is not configured", 503);
  }
}

export function createGoogleClient() {
  assertGoogleConfigured();
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function googleAuthUrl(state: string) {
  const client = createGoogleClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: false,
    scope: [...GOOGLE_SCOPES],
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = createGoogleClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token) {
    throw new AppError("Google authorization failed", 400);
  }
  return tokens;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const client = createGoogleClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new AppError("Google reconnection required", 401);
  }
  return credentials;
}

export async function revokeGoogleToken(token: string) {
  try {
    const client = createGoogleClient();
    await client.revokeToken(token);
  } catch {
    // Revoke is best-effort; local disconnect still proceeds.
  }
}

export function mapGoogleApiError(status: number): never {
  if (status === 401) throw new AppError("Google reconnection required", 401);
  if (status === 403) throw new AppError("Google permission was denied", 403);
  if (status === 429) throw new AppError("Google is rate limiting requests", 429);
  throw new AppError("Google request failed", 502);
}
