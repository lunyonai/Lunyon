import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Play,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import AppShell from "../../layouts/AppShell";
import { useEmployees } from "../employees/EmployeesContext";
import { resolveEmployeeCopy } from "../employees/employeeView";
import { useLocale } from "../../i18n/LocaleProvider";
import { useWorkflows } from "./WorkflowsContext";
import WorkflowActionsMenu from "./WorkflowActionsMenu";
import WorkflowFormPanel from "./WorkflowFormPanel";
import type { Workflow as WorkflowRecord } from "./workflowTypes";

function workflowCopy(
  workflow: WorkflowRecord,
  t: (path: string, vars?: Record<string, string | number>) => string,
) {
  return {
    title: workflow.title?.trim() || t("app.workflows.untitled"),
    description: workflow.description ?? "",
    triggerLabel: t(`app.workflows.triggerOption.${workflow.trigger}`),
  };
}

export default function WorkflowsPage() {
  const { t } = useLocale();
  const location = useLocation();
  const { workflows, loading, error } = useWorkflows();
  const { employees } = useEmployees();
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

  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">{t("app.workflows.kicker")}</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {t("app.workflows.title")}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {t("app.workflows.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("app.workflows.create")}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Workflow className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {String(activeCount).padStart(2, "0")}
            </p>

            <p className="mt-1 text-sm text-slate-400">{t("app.workflows.activeCount")}</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">0</p>

            <p className="mt-1 text-sm text-slate-400">
              {t("app.workflows.tasksThisWeek")}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Clock3 className="h-5 w-5 text-violet-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">—</p>

            <p className="mt-1 text-sm text-slate-400">{t("app.workflows.timeSaved")}</p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                {t("app.workflows.listTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("app.workflows.listSubtitle")}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {loading && (
              <p className="p-5 text-sm text-slate-500">{t("app.common.loading")}</p>
            )}
            {!loading && error && (
              <p className="p-5 text-sm text-red-400">{t("app.workflows.loadError")}</p>
            )}
            {!loading && !error && workflows.length === 0 && (
              <p className="p-5 text-sm text-slate-500">{t("app.workflows.empty")}</p>
            )}
            {views.map((item) => {
              const paused = item.workflow.status === "inactive";

              return (
                <article
                  key={item.workflow.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-800/40 sm:flex-row sm:items-center"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">
                        {item.title}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          paused
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {t(
                          paused
                            ? "app.workflows.statusInactive"
                            : "app.workflows.statusActive",
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{t("app.workflows.trigger", { value: item.triggerLabel })}</span>
                      {item.employeeName && (
                        <span>
                          {t("app.workflows.employeeValue", { name: item.employeeName })}
                        </span>
                      )}
                      <span>{t("app.workflows.lastRun", { value: t("app.workflows.neverRun") })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      aria-label={t("app.workflows.runAria", { title: item.title })}
                      disabled
                      title={t("app.workflows.executionComing")}
                      className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 text-xs font-medium text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>{t("app.workflows.executionComing")}</span>
                    </button>

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
        </section>

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-slate-900/60 to-violet-500/10 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {t("app.workflows.nextTitle")}
                </p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                  {t("app.workflows.nextBody")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              {t("app.workflows.getSuggestions")}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </section>

      {creating && <WorkflowFormPanel onClose={() => setCreating(false)} />}
      {editing && (
        <WorkflowFormPanel workflow={editing} onClose={() => setEditing(null)} />
      )}
    </AppShell>
  );
}
