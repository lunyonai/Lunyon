import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, History, Loader2, MinusCircle, XCircle } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge, type Tone } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { cx, skeletonClass } from "../../components/ui/styles";
import { localeMeta } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { api, type WorkflowRun, type WorkflowRunStep } from "../../lib/api";
import { stepErrorKey } from "../../lib/aiErrors";
import { formatDuration } from "../activity/activityView";
import { formatDateTime } from "./workflowView";

const POLL_MS = 2000;

const RUN_TONES: Record<WorkflowRun["status"], Tone> = {
  succeeded: "success",
  failed: "danger",
  running: "primary",
};

type WorkflowRunsPanelProps = {
  workflowId: string;
  title: string;
  onClose: () => void;
  /** Called when a run that was running has finished. */
  onSettled: () => void;
};

function StepIcon({ status }: { status: WorkflowRunStep["status"] }) {
  if (status === "succeeded") return <CheckCircle2 className="h-4 w-4 text-success-text" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-danger-text" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary-text" />;
  if (status === "skipped") return <MinusCircle className="h-4 w-4 text-fg-placeholder" />;
  return <Circle className="h-4 w-4 text-fg-placeholder" />;
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
      return <p className="mt-1 text-xs text-danger-text">{key ? t(key) : step.error}</p>;
    }
    if (typeof step.count === "number") {
      return (
        <p className="mt-1 text-xs text-fg-subtle">
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
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2 p-3 font-mono text-xs leading-5 text-fg-muted">
          {step.output}
        </p>
      );
    }
    return null;
  }

  return (
    <Modal
      title={title}
      description={t("app.workflows.runsTitle")}
      onClose={onClose}
      size="lg"
      closeLabel={t("app.common.close")}
    >
      <div className="space-y-4">
        {runs === null && !error && (
          <div className="space-y-3" role="status" aria-label={t("app.common.loading")}>
            {[0, 1].map((item) => (
              <div key={item} className={cx(skeletonClass, "h-24")} />
            ))}
          </div>
        )}
        {error && <Alert tone="danger">{t("app.workflows.runsError")}</Alert>}
        {runs?.length === 0 && (
          <EmptyState tone="orange" icon={History} title={t("app.workflows.runsEmpty")} className="py-8" />
        )}

        {runs?.map((run) => (
          <section key={run.id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone={RUN_TONES[run.status]} dot>
                {t(`app.workflows.runStatus.${run.status}`)}
              </Badge>
              <span className="text-xs tabular-nums text-fg-subtle">
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
                    <p className="text-sm text-fg">
                      <span className="tabular-nums text-fg-subtle">{index + 1}.</span>{" "}
                      {t(`app.workflows.step.${step.type}`)}
                    </p>
                    {stepDetail(step)}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </Modal>
  );
}
