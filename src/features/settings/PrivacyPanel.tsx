import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLocale } from "../../i18n/LocaleProvider";
import { loginPath } from "../../i18n/paths";
import { api } from "../../lib/api";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10";

export default function PrivacyPanel() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-base font-semibold text-white">{t("app.privacy.section")}</h2>
      <p className="mt-2 text-sm text-slate-400">{t("app.privacy.exportHint")}</p>
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={exporting}
        className="mt-4 flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
      >
        {exporting ? t("app.privacy.exporting") : t("app.privacy.export")}
      </button>
      {exportError && <p className="mt-2 text-sm text-red-400">{exportError}</p>}

      <div className="mt-6 border-t border-slate-800 pt-6">
        <p className="text-sm font-medium text-red-300">{t("app.privacy.deleteTitle")}</p>
        <p className="mt-2 text-sm text-slate-400">{t("app.privacy.deleteHint")}</p>
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 flex h-10 items-center rounded-xl border border-red-500/30 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            {t("app.privacy.delete")}
          </button>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-white">
              {t("app.privacy.confirmLabel", { email: user?.email ?? "" })}
              <input
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                autoComplete="off"
                className={fieldClass}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setConfirmEmail("");
                }}
                disabled={deleting}
                className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
              >
                {t("app.common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!emailMatches || deleting}
                className="flex h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? t("app.privacy.deleting") : t("app.privacy.confirmDelete")}
              </button>
            </div>
          </div>
        )}
        {deleteError && <p className="mt-2 text-sm text-red-400">{deleteError}</p>}
      </div>
    </section>
  );
}
