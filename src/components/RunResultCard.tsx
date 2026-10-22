import { useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";

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
    <div className="mt-5 rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success-text" aria-hidden="true" />
          {title}
        </p>
        <Button variant="ghost" size="sm" onClick={() => void handleCopy()}>
          {copied ? <Check className="text-success-text" /> : <Copy />}
          {copied ? t("app.ai.copied") : t("app.ai.copy")}
        </Button>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2 p-3 font-mono text-xs leading-5 text-fg">
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
    <Alert
      tone="danger"
      className="mt-5"
      action={
        needsSettings ? (
          <Link
            to="/settings"
            className="inline-flex text-xs font-medium text-primary-text underline-offset-2 hover:underline"
          >
            {t("app.ai.goToSettings")}
          </Link>
        ) : undefined
      }
    >
      {t(errorKey)}
    </Alert>
  );
}
