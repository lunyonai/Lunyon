import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Loader2, MinusCircle, X, XCircle } from "lucide-react";
import { localeMeta } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { api, type WorkflowRun, type WorkflowRunStep } from "../../lib/api";
import { stepErrorKey } from "../../lib/aiErrors";
import { formatDuration } from "../activity/activityView";
import { formatDateTime } from "./workflowView";

const POLL_MS = 2000;

type WorkflowRunsPanelProps = {
  workflowId: string;
  title: string;
  onClose: () => void;
  /** Called when a run that was running has finished. */
  onSettled: () => void;
};

function StepIcon({ status }: { status: WorkflowRunStep["status"] }) {
  if (status === "succeeded") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
  if (status === "skipped") return <MinusCircle className="h-4 w-4 text-slate-600" />;
  return <Circle className="h-4 w-4 text-slate-600" />;
}

export default function WorkflowRunsPanel({
  workflowId,
  title,
  onClose,
  onSettled,
}: WorkflowRunsPanelProps) {
  const { t, locale } = useLocale();
  const localeTag = localeMeta[locale].htmlLang;
  const [runs, setRuns] = useState<WorkflowRun[] | null>(null);
  const [error, setError] = useState(false);
  const wasRunning = useRef(false);

  const apply = useCallback(
    (next: WorkflowRun[]) => {
      setRuns(next);
      setError(false);
      const running = next.some((run) => run.status === "running");
      if (wasRunning.current && !running) onSettled();
      wasRunning.current = running;
    },
    [onSettled],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .workflowRuns(workflowId, 10)
      .then((next) => {
        if (!cancelled) apply(next);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apply, workflowId]);

  const hasRunning = Boolean(runs?.some((run) => run.status === "running"));
  useEffect(() => {
    if (!hasRunning) return;
    const timer = window.setInterval(() => {
      api
        .workflowRuns(workflowId, 10)
        .then(apply)
        .catch(() => setError(true));
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [apply, hasRunning, workflowId]);

  function stepDetail(step: WorkflowRunStep) {
    if (step.status === "failed") {
      const key = stepErrorKey(step.errorCode);
      return <p className="mt-1 text-xs text-red-300">{key ? t(key) : step.error}</p>;
    }
    if (typeof step.count === "number") {
      return (
        <p className="mt-1 text-xs text-slate-500">
          {t(
            step.type === "gmail.read_recent"
              ? "app.workflows.runEmailsRead"
              : "app.workflows.runEventsRead",
            { count: step.count },
          )}
        </p>
      );
    }
    if (step.output) {
      return (
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">
          {step.output}
        </p>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm text-slate-400">{t("app.workflows.runsTitle")}</p>
          </div>
          <button
            type="button"
            aria-label={t("app.common.close")}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {runs === null && !error && (
            <p className="text-sm text-slate-500">{t("app.common.loading")}</p>
          )}
          {error && <p className="text-sm text-red-400">{t("app.workflows.runsError")}</p>}
          {runs?.length === 0 && (
            <p className="text-sm text-slate-500">{t("app.workflows.runsEmpty")}</p>
          )}

          {runs?.map((run) => (
            <section key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    run.status === "succeeded"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : run.status === "failed"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {t(`app.workflows.runStatus.${run.status}`)}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(run.startedAt, localeTag)} ·{" "}
                  {t(`app.workflows.triggerOption.${run.trigger}`)}
                  {run.finishedAt &&
                    ` · ${formatDuration(
                      new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime(),
                    )}`}
                </span>
              </div>

              <ol className="mt-4 space-y-3">
                {run.steps.map((step, index) => (
                  <li key={`${run.id}-${step.id}`} className="flex gap-3">
                    <span className="mt-0.5">
                      <StepIcon status={step.status} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200">
                        {index + 1}. {t(`app.workflows.step.${step.type}`)}
                      </p>
                      {stepDetail(step)}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
