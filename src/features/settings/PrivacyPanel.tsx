import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { cx, inputClass } from "../../components/ui/styles";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath } from "../../i18n/paths";
import { api } from "../../lib/api";

export default function PrivacyPanel() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const confirmId = useId();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const data = await api.exportAccount();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lunyon-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(t("app.privacy.exportError"));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteAccount(confirmEmail.trim());
      try {
        await logout();
      } catch {
        // The session is gone with the user; continue to the login page.
      }
      navigate(loginPath(locale), { replace: true });
    } catch {
      setDeleteError(t("app.privacy.deleteError"));
      setDeleting(false);
    }
  }

  const emailMatches =
    Boolean(user?.email) && confirmEmail.trim().toLowerCase() === user?.email?.toLowerCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t("app.privacy.section")} description={t("app.privacy.exportHint")} />
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          {exportError && <p className="text-sm text-danger-text">{exportError}</p>}
          <Button onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? t("app.privacy.exporting") : t("app.privacy.export")}
          </Button>
        </div>
      </Card>

      <Card className="border-danger/25">
        <CardHeader
          title={<span className="text-danger-text">{t("app.privacy.deleteTitle")}</span>}
          description={t("app.privacy.deleteHint")}
        />
        {!confirming ? (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            {deleteError && <p className="text-sm text-danger-text">{deleteError}</p>}
            <Button
              variant="dangerGhost"
              onClick={() => setConfirming(true)}
              className="border border-danger/25"
            >
              {t("app.privacy.delete")}
            </Button>
          </div>
        ) : (
          <div className="mt-5">
            <Field
              label={t("app.privacy.confirmLabel", { email: user?.email ?? "" })}
              htmlFor={confirmId}
            >
              <input
                id={confirmId}
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                autoComplete="off"
                className={cx(inputClass, "focus:border-danger focus:ring-danger/15")}
              />
            </Field>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {deleteError && <p className="text-sm text-danger-text">{deleteError}</p>}
              <Button
                onClick={() => {
                  setConfirming(false);
                  setConfirmEmail("");
                }}
                disabled={deleting}
              >
                {t("app.common.cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                disabled={!emailMatches || deleting}
              >
                {deleting ? t("app.privacy.deleting") : t("app.privacy.confirmDelete")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
