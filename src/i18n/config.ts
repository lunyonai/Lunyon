export const LOCALES = ["en", "pt", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const STORAGE_KEY = "lunyo.locale";

export const localeMeta: Record<
  Locale,
  { htmlLang: string; shortLabel: string }
> = {
  en: { htmlLang: "en", shortLabel: "EN" },
  pt: { htmlLang: "pt-BR", shortLabel: "PT" },
  es: { htmlLang: "es", shortLabel: "ES" },
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/pt" || pathname.startsWith("/pt/")) return "pt";
  if (pathname === "/es" || pathname.startsWith("/es/")) return "es";
  return "en";
}

export function isLoginPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/pt/login" ||
    pathname === "/es/login"
  );
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/pt" ||
    pathname === "/es" ||
    isLoginPath(pathname)
  );
}

export function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    // ignore unavailable storage
  }
  return DEFAULT_LOCALE;
}
