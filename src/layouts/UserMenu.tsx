import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cx, menuItemClass, popoverClass } from "../components/ui/styles";
import { useAuth } from "../hooks/useAuth";
import { useLocale } from "../i18n/LocaleProvider";
import { loginPath } from "../i18n/paths";
import { userDisplayName, userInitials } from "../lib/userDisplay";

export default function UserMenu() {
  const { t, locale } = useLocale();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const name = userDisplayName(user) || t("app.account.account");
  const email = user?.email ?? "";

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (!open) return;
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await logout();
      navigate(loginPath(locale), { replace: true });
    } catch {
      setError(t("app.account.signOutError"));
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("app.account.menu")}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "bg-surface-2",
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-fg">
          {userInitials(user)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{name}</p>
          <p className="truncate text-xs text-fg-subtle">{t("app.nav.personalWorkspace")}</p>
        </div>

        <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-subtle" />
      </button>

      {open && (
        <div role="menu" className={cx(popoverClass, "absolute bottom-full left-0 right-0 z-50 mb-2")}>
          <div className="border-b border-line px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-fg">{name}</p>
            {email && <p className="truncate text-xs text-fg-subtle">{email}</p>}
          </div>
          <div className="pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className={menuItemClass}
            >
              <Settings />
              {t("app.account.settings")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={busy}
              className={menuItemClass}
            >
              <LogOut />
              {busy ? t("app.account.signingOut") : t("app.account.signOut")}
            </button>
          </div>
          {error && <p className="px-2.5 pb-1.5 pt-1 text-xs text-danger-text">{error}</p>}
        </div>
      )}
    </div>
  );
}
