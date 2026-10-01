import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  STORAGE_KEY,
  isPublicPath,
  localeFromPathname,
  localeMeta,
  readStoredLocale,
  type Locale,
} from "./config";
import { dictionaries, interpolate } from "./dictionaries";
import { homePath, loginPath } from "./paths";
import type { Messages } from "./en";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function setLinkTag(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let tag = document.head.querySelector<HTMLLinkElement>(selector);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    if (hreflang) tag.hreflang = hreflang;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function applyDocumentMeta(locale: Locale, messages: Messages, pathname: string) {
  const origin = window.location.origin;
  const onLogin =
    pathname === "/login" ||
    pathname === "/pt/login" ||
    pathname === "/es/login";
  const publicPath = isPublicPath(pathname);

  document.documentElement.lang = localeMeta[locale].htmlLang;
  document.title = publicPath ? messages.meta.title : "Lunyon";

  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement("meta");
    description.setAttribute("name", "description");
    document.head.appendChild(description);
  }
  description.setAttribute("content", messages.meta.description);

  if (!publicPath) return;

  const canonicalPath = onLogin ? loginPath(locale) : homePath(locale);
  setLinkTag("canonical", `${origin}${canonicalPath}`);
  setLinkTag(
    "alternate",
    `${origin}${onLogin ? loginPath("en") : homePath("en")}`,
    "en",
  );
  setLinkTag(
    "alternate",
    `${origin}${onLogin ? loginPath("pt") : homePath("pt")}`,
    "pt",
  );
  setLinkTag(
    "alternate",
    `${origin}${onLogin ? loginPath("es") : homePath("es")}`,
    "es",
  );
  setLinkTag(
    "alternate",
    `${origin}${onLogin ? "/login" : "/"}`,
    "x-default",
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const urlLocale = isPublicPath(pathname) ? localeFromPathname(pathname) : null;
  const [preference, setPreference] = useState<Locale>(readStoredLocale);
  const locale = urlLocale ?? preference;
  const messages = dictionaries[locale];

  const setLocale = useCallback((next: Locale) => {
    setPreference(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages,
      setLocale,
      t: (path, vars) => {
        const raw = path.split(".").reduce<unknown>((current, key) => {
          if (typeof current !== "object" || current === null) return undefined;
          return (current as Record<string, unknown>)[key];
        }, messages);
        if (typeof raw !== "string") return path;
        return interpolate(raw, vars);
      },
    }),
    [locale, messages, setLocale],
  );

  useEffect(() => {
    if (urlLocale) {
      setPreference(urlLocale);
      try {
        window.localStorage.setItem(STORAGE_KEY, urlLocale);
      } catch {
        // ignore unavailable storage
      }
    }
    applyDocumentMeta(locale, messages, pathname);
  }, [locale, messages, pathname, urlLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
