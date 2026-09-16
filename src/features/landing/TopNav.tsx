import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../auth/components/Logo";

const navLinks = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Resources", href: "/#product" },
] as const;

export default function TopNav() {
  const { pathname } = useLocation();
  const onLogin = pathname === "/login";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled
          ? "border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/90"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="relative z-10 flex shrink-0 items-center" aria-label="Lunyo home">
          <Logo size="medium" />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-[var(--lunyo-text-muted)] transition hover:text-[var(--lunyo-text)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to={onLogin ? "/" : "/login"}
            className="hidden text-sm font-medium text-[var(--lunyo-text-muted)] transition hover:text-[var(--lunyo-text)] md:inline-flex"
          >
            {onLogin ? "Back to home" : "Sign in"}
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] text-[var(--lunyo-text-muted)] transition hover:text-[var(--lunyo-text)] md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-[var(--lunyo-border)] bg-[var(--lunyo-bg)] md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-[var(--lunyo-radius)] px-3 py-2.5 text-sm text-[var(--lunyo-text-muted)] transition hover:bg-[var(--lunyo-surface)] hover:text-[var(--lunyo-text)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to={onLogin ? "/" : "/login"}
                className="mt-1 rounded-[var(--lunyo-radius)] px-3 py-2.5 text-sm font-medium text-[var(--lunyo-text)] transition hover:bg-[var(--lunyo-surface)]"
                onClick={() => setMobileOpen(false)}
              >
                {onLogin ? "Back to home" : "Sign in"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
