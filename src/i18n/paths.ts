import { DEFAULT_LOCALE, type Locale } from "./config";

export function homePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

export function loginPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/login" : `/${locale}/login`;
}

export function forgotPasswordPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE
    ? "/forgot-password"
    : `/${locale}/forgot-password`;
}

export function resetPasswordPath(locale: Locale): string {
  return locale === DEFAULT_LOCALE
    ? "/reset-password"
    : `/${locale}/reset-password`;
}

export function sectionHref(locale: Locale, sectionId: string): string {
  const hash = sectionId.startsWith("#") ? sectionId : `#${sectionId}`;
  return `${homePath(locale)}${hash}`;
}

export function localeSwitchPath(
  next: Locale,
  pathname: string,
  hash: string,
): string {
  if (
    pathname === "/login" ||
    pathname === "/pt/login" ||
    pathname === "/es/login"
  ) {
    return loginPath(next);
  }
  if (pathname.endsWith("/forgot-password")) {
    return forgotPasswordPath(next);
  }
  if (pathname.endsWith("/reset-password")) {
    return resetPasswordPath(next);
  }
  return `${homePath(next)}${hash}`;
}

export function unknownPathFallback(pathname: string): string {
  if (pathname.startsWith("/pt")) return "/pt";
  if (pathname.startsWith("/es")) return "/es";
  return "/";
}
