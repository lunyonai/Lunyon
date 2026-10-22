import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  History,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button, IconButton } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { StatCard } from "../../components/ui/StatCard";
import { cx, skeletonClass } from "../../components/ui/styles";
import AppShell from "../../layouts/AppShell";
import { useActivity } from "../activity/ActivityContext";
import { relativeTime } from "../activity/activityView";
import { useEmployees } from "../employees/EmployeesContext";
import { resolveEmployeeCopy } from "../employees/employeeView";
import { localeMeta } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { api } from "../../lib/api";
import { aiErrorInfo } from "../../lib/aiErrors";
import { useWorkflows } from "./WorkflowsContext";
import WorkflowActionsMenu from "./WorkflowActionsMenu";
import WorkflowFormPanel from "./WorkflowFormPanel";
import WorkflowRunsPanel from "./WorkflowRunsPanel";
import type { Workflow as WorkflowRecord } from "./workflowTypes";
import { formatDateTime, scheduleLabel } from "./workflowView";

function workflowCopy(
  workflow: WorkflowRecord,
  t: (path: string, vars?: Record<string, string | number>) => string,
) {
  return {
    title: workflow.title?.trim() || t("app.workflows.untitled"),
    description: workflow.description ?? "",
    triggerLabel:
      workflow.trigger === "schedule" && workflow.schedule
        ? scheduleLabel(workflow.schedule, t)
        : t(`app.workflows.triggerOption.${workflow.trigger}`),
  };
}

export default function WorkflowsPage() {
  const { t, locale } = useLocale();
  const localeTag = localeMeta[locale].htmlLang;
  const location = useLocation();
  const { workflows, loading, error, reloadWorkflow } = useWorkflows();
  const { employees } = useEmployees();
  const { stats, refresh: refreshActivity } = useActivity();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [runErrors, setRunErrors] = useState<
    Record<string, { key: string; needsSettings: boolean }>
  >({});
  const [historyFor, setHistoryFor] = useState<{ id: string; title: string } | null>(null);
  const [creating, setCreating] = useState(
    Boolean((location.state as { create?: boolean } | null)?.create),
  );
  const [editing, setEditing] = useState<WorkflowRecord | null>(null);

  const views = useMemo(
    () =>
      workflows.map((workflow) => {
        const employee = workflow.employeeId
          ? employees.find((item) => item.id === workflow.employeeId)
          : null;
        return {
          workflow,
          ...workflowCopy(workflow, t),
          employeeName: employee
            ? resolveEmployeeCopy(employee, t).name
            : workflow.employeeId
              ? t("app.workflows.employeeMissing")
              : null,
        };
      }),
    [employees, t, workflows],
  );

  const activeCount = workflows.filter((item) => item.status === "active").length;

  const statCards: Array<{ key: string; label: string; value: string | number; icon: typeof Workflow; tone: TileTone }> = [
    {
      key: "active",
      label: t("app.workflows.activeCount"),
      value: String(activeCount),
      icon: Workflow,
      tone: "orange",
    },
    {
      key: "runs",
      label: t("app.workflows.tasksThisWeek"),
      value: stats?.workflowRunsWeek ?? 0,
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      key: "failures",
      label: t("app.workflows.failuresThisWeek"),
      value: stats?.workflowFailuresWeek ?? 0,
      icon: AlertTriangle,
      tone: "rose",
    },
  ];

  async function handleRun(workflow: WorkflowRecord, title: string) {
    if (startingId) return;
    setStartingId(workflow.id);
    setRunErrors((current) => {
      const next = { ...current };
      delete next[workflow.id];
      return next;
    });
    try {
      await api.runWorkflow(workflow.id, locale);
      setHistoryFor({ id: workflow.id, title });
    } catch (err) {
      setRunErrors((current) => ({ ...current, [workflow.id]: aiErrorInfo(err) }));
    } finally {
      setStartingId(null);
    }
  }

  const handleRunSettled = useCallback(() => {
    void refreshActivity();
    if (historyFor) void reloadWorkflow(historyFor.id);
  }, [historyFor, refreshActivity, reloadWorkflow]);

  function closeHistory() {
    handleRunSettled();
    setHistoryFor(null);
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <PageHeader
          icon={Workflow}
          tone="orange"
          title={t("app.workflows.title")}
          description={t("app.workflows.subtitle")}
          actions={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus />
              {t("app.workflows.create")}
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {statCards.map((card) => (
            <StatCard key={card.key} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
          ))}
        </div>

        <Card padded={false}>
          <div className="border-b border-line px-5 py-4">
            <CardHeader
              title={t("app.workflows.listTitle")}
              description={t("app.workflows.listSubtitle")}
            />
          </div>

          {loading && views.length === 0 && (
            <div className="space-y-3 p-5" role="status" aria-label={t("app.common.loading")}>
              {[0, 1, 2].map((item) => (
                <div key={item} className={cx(skeletonClass, "h-16")} />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="p-5">
              <Alert tone="danger">{t("app.workflows.loadError")}</Alert>
            </div>
          )}
          {!loading && !error && workflows.length === 0 && (
            <EmptyState tone="orange"
              icon={Workflow}
              title={t("app.workflows.empty")}
              action={
                <Button onClick={() => setCreating(true)}>
                  <Plus />
                  {t("app.workflows.create")}
                </Button>
              }
            />
          )}

          {views.length > 0 && (
            <div className="divide-y divide-line">
              {views.map((item) => {
                const paused = item.workflow.status === "inactive";
                const runError = runErrors[item.workflow.id];
                const starting = startingId === item.workflow.id;
                const lastRunFailed = item.workflow.lastRunStatus === "failed";
                const lastRun = item.workflow.lastRunAt
                  ? `${relativeTime(item.workflow.lastRunAt, t("app.dashboard.justNow"))}${
                      lastRunFailed ? ` · ${t("app.workflows.runStatus.failed")}` : ""
                    }`
                  : t("app.workflows.neverRun");

                return (
                  <article
                    key={item.workflow.id}
                    className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50 sm:flex-row sm:items-center"
                  >
                    <IconTile icon={Workflow} tone="orange" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
                        <Badge tone={paused ? "neutral" : "success"} dot={!paused}>
                          {t(
                            paused
                              ? "app.workflows.statusInactive"
                              : "app.workflows.statusActive",
                          )}
                        </Badge>
                      </div>

                      {item.description && (
                        <p className="mt-1 text-sm text-fg-muted">{item.description}</p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-subtle">
                        <span>{t("app.workflows.trigger", { value: item.triggerLabel })}</span>
                        {item.employeeName && (
                          <span>
                            {t("app.workflows.employeeValue", { name: item.employeeName })}
                          </span>
                        )}
                        <span className={lastRunFailed ? "text-danger-text" : undefined}>
                          {t("app.workflows.lastRun", { value: lastRun })}
                        </span>
                        {item.workflow.nextRunAt && !paused && (
                          <span className="tabular-nums">
                            {t("app.workflows.nextRun", {
                              value: formatDateTime(item.workflow.nextRunAt, localeTag),
                            })}
                          </span>
                        )}
                      </div>

                      {runError && (
                        <p className="mt-2 text-xs text-danger-text">
                          {t(runError.key)}{" "}
                          {runError.needsSettings && (
                            <Link
                              to="/settings"
                              className="font-medium text-primary-text underline-offset-2 hover:underline"
                            >
                              {t("app.ai.goToSettings")}
                            </Link>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <IconButton
                        variant="secondary"
                        aria-label={t("app.workflows.historyAria", { title: item.title })}
                        title={t("app.workflows.runsTitle")}
                        onClick={() => setHistoryFor({ id: item.workflow.id, title: item.title })}
                      >
                        <History />
                      </IconButton>
                      <Button
                        aria-label={t("app.workflows.runAria", { title: item.title })}
                        aria-busy={starting || undefined}
                        disabled={Boolean(startingId)}
                        onClick={() => void handleRun(item.workflow, item.title)}
                        className="min-w-24"
                      >
                        {starting ? <Loader2 className="animate-spin" /> : <Play />}
                        <span>{t("app.workflows.runNow")}</span>
                      </Button>

                      <WorkflowActionsMenu
                        workflow={item.workflow}
                        title={item.title}
                        onEdit={() => setEditing(item.workflow)}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>

        <Card padded={false} className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary-text">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </div>

              <div>
                <p className="text-sm font-semibold text-fg">{t("app.workflows.nextTitle")}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-fg-muted">
                  {t("app.workflows.nextBody")}
                </p>
              </div>
            </div>

            <Button onClick={() => setCreating(true)}>
              {t("app.workflows.getSuggestions")}
              <ArrowUpRight />
            </Button>
          </div>
        </Card>
      </section>

      {creating && <WorkflowFormPanel onClose={() => setCreating(false)} />}
      {editing && (
        <WorkflowFormPanel workflow={editing} onClose={() => setEditing(null)} />
      )}
      {historyFor && (
        <WorkflowRunsPanel
          workflowId={historyFor.id}
          title={historyFor.title}
          onClose={closeHistory}
          onSettled={handleRunSettled}
        />
      )}
    </AppShell>
  );
}
