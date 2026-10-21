import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";

export default function RunResultCard({ title, output }: { title: string; output: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {title}
        </p>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-900/60"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t("app.ai.copied") : t("app.ai.copy")}
        </button>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
        {output}
      </p>
    </div>
  );
}

export function RunErrorNotice({
  errorKey,
  needsSettings,
}: {
  errorKey: string;
  needsSettings: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
      <p className="flex items-start gap-2 text-sm text-red-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        {t(errorKey)}
      </p>
      {needsSettings && (
        <Link
          to="/settings"
          className="mt-2 inline-flex text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          {t("app.ai.goToSettings")}
        </Link>
      )}
    </div>
  );
}
