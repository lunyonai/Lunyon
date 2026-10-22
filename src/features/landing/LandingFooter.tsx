import { Link } from "react-router-dom";
import Logo from "../auth/components/Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { homePath, loginPath, sectionHref } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";

/** Read once at module load; the footer never needs a live clock. */
const YEAR = new Date().getFullYear();

const linkClass =
  "rounded-sm text-sm text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

export default function LandingFooter() {
  const { locale, t } = useLocale();

  const explore = [
    { label: t("nav.product"), href: sectionHref(locale, "product") },
    { label: t("nav.howItWorks"), href: sectionHref(locale, "how-it-works") },
    { label: t("nav.pricing"), href: sectionHref(locale, "pricing") },
    { label: t("nav.resources"), href: sectionHref(locale, "product") },
  ];

  return (
    <footer className="relative border-t border-line">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 -top-px mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-primary-text/40 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Link
              to={homePath(locale)}
              aria-label={t("nav.homeAria")}
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Logo size="small" />
            </Link>
            <p className="mt-4 text-sm font-medium text-fg">{t("cta.tagline")}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-fg-subtle">{t("hero.body")}</p>
          </div>

          <nav aria-label={t("nav.footerAria")}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t("nav.footerExplore")}</h2>
            <ul className="mt-4 space-y-3">
              {explore.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t("nav.footerAccount")}</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to={loginPath(locale)} className={linkClass}>
                  {t("nav.signIn")}
                </Link>
              </li>
              <li>
                <Link to={loginPath(locale)} className={linkClass}>
                  {t("hero.getStarted")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">{t("nav.language")}</h2>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-6 text-xs text-fg-subtle">
          <p>
            © {YEAR} {t("cta.brand")}
          </p>
        </div>
      </div>
    </footer>
  );
}
