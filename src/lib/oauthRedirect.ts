const AUTH_CALLBACK_PATH = "/auth/callback";
const OAUTH_PENDING_KEY = "lunyon.oauthPending";

export function oauthCallbackPath() {
  return AUTH_CALLBACK_PATH;
}

/** Same-origin callback only. Never accepts a user-supplied URL. */
export function oauthRedirectTo() {
  return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
}

export function markOAuthPending() {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
  } catch {
    // ignore unavailable storage
  }
}

export function hasOAuthPending() {
  try {
    return sessionStorage.getItem(OAUTH_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearOAuthPending() {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // ignore unavailable storage
  }
}

export function isLandingPath(pathname: string) {
  return pathname === "/" || pathname === "/pt" || pathname === "/es";
}

export function oauthErrorFromParams(search: string, hash: string) {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fragment = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );
  const error = query.get("error") || fragment.get("error");
  if (!error) return null;
  if (error === "access_denied") return "google_cancelled" as const;
  return "google" as const;
}
