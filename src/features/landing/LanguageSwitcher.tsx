import { Link, useLocation } from "react-router-dom";
import { LOCALES, localeMeta, isPublicPath } from "../../i18n/config";
import { homePath, loginPath } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, t, setLocale } = useLocale();
  const { pathname, hash } = useLocation();
  const publicPath = isPublicPath(pathname);

  function targetFor(next: (typeof LOCALES)[number]) {
    if (pathname === "/login" || pathname === "/pt/login" || pathname === "/es/login") {
      return loginPath(next);
    }
    return {
      pathname: homePath(next),
      hash: hash.replace(/^#/, ""),
    };
  }

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide"
      role="group"
      aria-label={t("nav.language")}
    >
      {LOCALES.map((item, index) => {
        const active = item === locale;
        const className = `transition ${
          active
            ? "text-[var(--lunyo-text)]"
            : "text-[var(--lunyo-text-muted)] hover:text-[var(--lunyo-text)]"
        }`;

        return (
          <span key={item} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-[var(--lunyo-text-muted)]/35" aria-hidden="true">
                ·
              </span>
            )}
            {publicPath ? (
              <Link
                to={targetFor(item)}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {localeMeta[item].shortLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setLocale(item)}
                aria-pressed={active}
                className={className}
              >
                {localeMeta[item].shortLabel}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
