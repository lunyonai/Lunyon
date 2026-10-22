import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Logo from "../auth/components/Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import { buttonClass, cx } from "../../components/ui/styles";
import { isAuthPath } from "../../i18n/config";
import { homePath, loginPath, sectionHref } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";

const ease = [0.22, 1, 0.36, 1] as const;

/** Glass surface shared by the bar and the mobile panel; tokens only so light/dark both work. */
const glass =
  "border border-line/80 bg-surface/70 shadow-[0_8px_32px_-12px_rgb(0_0_0/0.25)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-surface/60";

/**
 * Floating top bar for the landing and the auth screens. Fits inside the 3.5rem (pt-14)
 * the auth layouts reserve: 0.5rem inset + 3rem bar.
 */
export default function TopNav() {
  const { pathname } = useLocation();
  const { locale, t } = useLocale();
  const reduceMotion = useReducedMotion();
  const onAuth = isAuthPath(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close the mobile menu on navigation (derived during render, no effect needed).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  const navLinks = [
    { label: t("nav.product"), href: sectionHref(locale, "product") },
    { label: t("nav.pricing"), href: sectionHref(locale, "pricing") },
    { label: t("nav.resources"), href: sectionHref(locale, "product") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const accountHref = onAuth ? homePath(locale) : loginPath(locale);
  const accountLabel = onAuth ? t("nav.backHome") : t("nav.signIn");

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-2 sm:px-4"
    >
      <nav
        className={cx(
          "relative mx-auto flex h-12 max-w-6xl items-center justify-between rounded-xl pl-3 pr-2 transition-[background-color,box-shadow,border-color] duration-300 sm:pl-4",
          glass,
          scrolled && "border-line-strong/70 bg-surface/80 shadow-overlay",
        )}
      >
        <Link
          to={homePath(locale)}
          className="relative z-10 flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={t("nav.homeAria")}
        >
          <Logo size="small" />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-2/70 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <div className="mr-1 hidden md:block">
            <LanguageSwitcher />
          </div>
          <span className="hidden h-4 w-px bg-line md:block" aria-hidden="true" />
          <Link
            to={accountHref}
            className="hidden rounded-lg px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:inline-flex"
          >
            {accountLabel}
          </Link>
          {!onAuth && (
            <Link to={loginPath(locale)} className={cx(buttonClass({ variant: "primary", size: "md" }), "group h-8 px-3")}>
              {t("hero.getStarted")}
              <ArrowRight className="hidden transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className="mx-auto mt-2 max-w-6xl origin-top rounded-xl border border-line/80 bg-surface/95 shadow-overlay backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-0.5 p-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to={accountHref}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
                onClick={() => setMobileOpen(false)}
              >
                {accountLabel}
              </Link>
              <div className="mt-1 flex items-center justify-between border-t border-line px-3 pb-1 pt-3">
                <span className="text-xs text-fg-subtle">{t("nav.language")}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
