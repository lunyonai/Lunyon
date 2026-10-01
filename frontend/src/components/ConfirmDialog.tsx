import { useEffect } from "react";
import { useLocale } from "../i18n/LocaleProvider";

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
};

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  danger = true,
  busy = false,
}: ConfirmDialogProps) {
  const { t } = useLocale();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/50"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {t("app.common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {busy ? t("app.common.saving") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
