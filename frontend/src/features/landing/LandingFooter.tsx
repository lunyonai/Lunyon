import { Link } from "react-router-dom";
import Logo from "../auth/components/Logo";
import { homePath, sectionHref } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";

export default function LandingFooter() {
  const { locale, t } = useLocale();

  const links = [
    { label: t("nav.product"), href: sectionHref(locale, "product") },
    { label: t("nav.pricing"), href: sectionHref(locale, "pricing") },
    { label: t("nav.resources"), href: sectionHref(locale, "product") },
  ];

  return (
    <footer className="relative border-t border-[var(--lunyo-border)] bg-transparent py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to={homePath(locale)} aria-label={t("nav.homeAria")}>
            <Logo size="small" />
          </Link>
          <p className="mt-3 text-sm text-[var(--lunyo-text-muted)]">
            {t("cta.tagline")}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label={t("nav.footerAria")}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[var(--lunyo-text-muted)] transition hover:text-[var(--lunyo-text)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl px-6 text-xs text-[var(--lunyo-text-muted)]">
        © {t("cta.brand")}
      </p>
    </footer>
  );
}
