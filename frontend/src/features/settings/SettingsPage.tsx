import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOCALES, localeMeta, type Locale } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath } from "../../i18n/paths";
import { useAuth } from "../../hooks/useAuth";
import AppShell from "../../layouts/AppShell";
import { userFullName } from "../../lib/userDisplay";
import GoogleIntegrationsPanel from "./GoogleIntegrationsPanel";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70";

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword, resetPassword, logout } = useAuth();
  const [name, setName] = useState(userFullName(user));
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function handleSaveProfile() {
    if (profileBusy) return;
    setProfileBusy(true);
    setProfileError("");
    setProfileMessage("");
    try {
      await updateProfile(name.trim());
      setProfileMessage(t("app.settings.saved"));
    } catch {
      setProfileError(t("app.settings.saveError"));
    } finally {
      setProfileBusy(false);
    }
  }

  async function handlePassword() {
    if (passwordBusy) return;
    setPasswordError("");
    setPasswordMessage("");
    if (password.length < 8) {
      setPasswordError(t("app.settings.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setPasswordError(t("app.settings.passwordMismatch"));
      return;
    }
    setPasswordBusy(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setPasswordMessage(t("app.settings.passwordUpdated"));
    } catch {
      setPasswordError(t("app.settings.passwordError"));
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleResetEmail() {
    if (resetBusy || !user?.email) return;
    setResetBusy(true);
    setResetError("");
    setResetMessage("");
    try {
      await resetPassword(user.email);
      setResetMessage(t("app.settings.resetSent"));
    } catch {
      setResetError(t("app.settings.resetError"));
    } finally {
      setResetBusy(false);
    }
  }

  async function handleSignOut() {
    if (signOutBusy) return;
    setSignOutBusy(true);
    setSignOutError("");
    try {
      await logout();
      navigate(loginPath(locale), { replace: true });
    } catch {
      setSignOutError(t("app.account.signOutError"));
      setSignOutBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-sm font-medium text-blue-400">{t("app.settings.kicker")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {t("app.settings.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-400">{t("app.settings.subtitle")}</p>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">
            {t("app.settings.accountSection")}
          </h2>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.settings.name")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.settings.email")}
            <input value={user?.email ?? ""} disabled className={fieldClass} />
          </label>
          <p className="mt-2 text-xs text-slate-500">{t("app.settings.emailLocked")}</p>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={profileBusy}
            className="mt-5 flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {profileBusy ? t("app.common.saving") : t("app.settings.saveProfile")}
          </button>
          {profileMessage && (
            <p className="mt-2 text-sm text-emerald-400">{profileMessage}</p>
          )}
          {profileError && <p className="mt-2 text-sm text-red-400">{profileError}</p>}
        </section>

        <GoogleIntegrationsPanel />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">
            {t("app.settings.languageSection")}
          </h2>
          <p className="mt-2 text-sm text-slate-400">{t("app.settings.languageHint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LOCALES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLocale(item as Locale)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  locale === item
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t(`app.settings.lang.${item}`)} ({localeMeta[item].shortLabel})
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-semibold text-white">
            {t("app.settings.securitySection")}
          </h2>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.settings.newPassword")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.settings.confirmPassword")}
            <input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePassword}
              disabled={passwordBusy}
              className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {passwordBusy ? t("app.common.saving") : t("app.settings.updatePassword")}
            </button>
            <button
              type="button"
              onClick={handleResetEmail}
              disabled={resetBusy}
              className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
            >
              {resetBusy ? t("app.common.saving") : t("app.settings.resetPassword")}
            </button>
          </div>
          {passwordMessage && (
            <p className="mt-2 text-sm text-emerald-400">{passwordMessage}</p>
          )}
          {resetMessage && (
            <p className="mt-2 text-sm text-emerald-400">{resetMessage}</p>
          )}
          {passwordError && <p className="mt-2 text-sm text-red-400">{passwordError}</p>}
          {resetError && <p className="mt-2 text-sm text-red-400">{resetError}</p>}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signOutBusy}
            className="mt-6 flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {signOutBusy ? t("app.account.signingOut") : t("app.account.signOut")}
          </button>
          {signOutError && <p className="mt-2 text-sm text-red-400">{signOutError}</p>}
        </section>
      </section>
    </AppShell>
  );
}
