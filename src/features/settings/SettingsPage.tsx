import { Monitor, Moon, Settings, Sun } from "lucide-react";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { inputClass } from "../../components/ui/styles";
import { LOCALES, localeMeta, type Locale } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath } from "../../i18n/paths";
import { useAuth } from "../../hooks/useAuth";
import AppShell from "../../layouts/AppShell";
import { userFullName } from "../../lib/userDisplay";
import { useTheme, type ThemePreference } from "../../theme/themeContext";
import AiKeyPanel from "./AiKeyPanel";
import GoogleIntegrationsPanel from "./GoogleIntegrationsPanel";
import PlanPanel from "./PlanPanel";
import PrivacyPanel from "./PrivacyPanel";

export default function SettingsPage() {
  const { t, locale, setLocale } = useLocale();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword, resetPassword, logout } = useAuth();
  const fieldId = useId();
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

  const themeOptions: ReadonlyArray<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
    { value: "light", label: t("app.settings.themeLight"), icon: Sun },
    { value: "dark", label: t("app.settings.themeDark"), icon: Moon },
    { value: "system", label: t("app.settings.themeSystem"), icon: Monitor },
  ];

  const localeOptions = LOCALES.map((item) => ({
    value: item,
    label: `${t(`app.settings.lang.${item}`)} (${localeMeta[item].shortLabel})`,
  }));

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          icon={Settings}
          tone="neutral"
          title={t("app.settings.title")}
          description={t("app.settings.subtitle")}
        />

        <Card>
          <CardHeader title={t("app.settings.accountSection")} />
          <div className="mt-5 space-y-4">
            <Field label={t("app.settings.name")} htmlFor={`${fieldId}-name`}>
              <input
                id={`${fieldId}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label={t("app.settings.email")}
              htmlFor={`${fieldId}-email`}
              hint={t("app.settings.emailLocked")}
            >
              <input
                id={`${fieldId}-email`}
                value={user?.email ?? ""}
                disabled
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {profileMessage && <p className="text-sm text-success-text">{profileMessage}</p>}
            {profileError && <p className="text-sm text-danger-text">{profileError}</p>}
            <Button variant="primary" onClick={handleSaveProfile} disabled={profileBusy}>
              {profileBusy ? t("app.common.saving") : t("app.settings.saveProfile")}
            </Button>
          </div>
        </Card>

        <GoogleIntegrationsPanel />

        <PlanPanel />

        <AiKeyPanel />

        <Card>
          <CardHeader
            title={t("app.settings.appearanceSection")}
            description={t("app.settings.appearanceHint")}
          />
          <SegmentedControl
            className="mt-4"
            ariaLabel={t("app.settings.appearanceSection")}
            options={themeOptions}
            value={preference}
            onChange={setPreference}
          />
        </Card>

        <Card>
          <CardHeader
            title={t("app.settings.languageSection")}
            description={t("app.settings.languageHint")}
          />
          <SegmentedControl
            className="mt-4 max-w-full flex-wrap"
            ariaLabel={t("app.settings.languageSection")}
            options={localeOptions}
            value={locale}
            onChange={(item) => setLocale(item as Locale)}
          />
        </Card>

        <Card>
          <CardHeader title={t("app.settings.securitySection")} />
          <div className="mt-5 space-y-4">
            <Field label={t("app.settings.newPassword")} htmlFor={`${fieldId}-password`}>
              <input
                id={`${fieldId}-password`}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label={t("app.settings.confirmPassword")} htmlFor={`${fieldId}-confirm`}>
              <input
                id={`${fieldId}-confirm`}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {passwordMessage && <p className="text-sm text-success-text">{passwordMessage}</p>}
            {resetMessage && <p className="text-sm text-success-text">{resetMessage}</p>}
            {passwordError && <p className="text-sm text-danger-text">{passwordError}</p>}
            {resetError && <p className="text-sm text-danger-text">{resetError}</p>}
            <Button onClick={handleResetEmail} disabled={resetBusy}>
              {resetBusy ? t("app.common.saving") : t("app.settings.resetPassword")}
            </Button>
            <Button variant="primary" onClick={handlePassword} disabled={passwordBusy}>
              {passwordBusy ? t("app.common.saving") : t("app.settings.updatePassword")}
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
            {signOutError && <p className="text-sm text-danger-text">{signOutError}</p>}
            <Button variant="secondary" onClick={handleSignOut} disabled={signOutBusy}>
              {signOutBusy ? t("app.account.signingOut") : t("app.account.signOut")}
            </Button>
          </div>
        </Card>

        <PrivacyPanel />
      </section>
    </AppShell>
  );
}
