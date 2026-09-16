import { Link } from "react-router-dom";
import Logo from "../auth/components/Logo";

const links = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Resources", href: "/#product" },
] as const;

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-[var(--lunyo-border)] bg-transparent py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/" aria-label="Lunyo home">
            <Logo size="small" />
          </Link>
          <p className="mt-3 text-sm text-[var(--lunyo-text-muted)]">
            Reclaim Your Time.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
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
        © Lunyo
      </p>
    </footer>
  );
}
