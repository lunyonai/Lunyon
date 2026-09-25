import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
          {userInitials(user)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">{name}</p>
          <p className="truncate text-xs text-slate-500">
            {t("app.nav.personalWorkspace")}
          </p>
        </div>

        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/50"
        >
          <div className="border-b border-slate-800 px-3 py-2">
            <p className="truncate text-sm font-medium text-slate-200">{name}</p>
            {email && (
              <p className="truncate text-xs text-slate-500">{email}</p>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900"
          >
            <Settings className="h-4 w-4" />
            {t("app.account.settings")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={busy}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {busy ? t("app.account.signingOut") : t("app.account.signOut")}
          </button>
          {error && (
            <p className="px-3 pb-2 text-xs text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
