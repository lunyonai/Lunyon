import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Plus,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { useActivity } from "../activity/ActivityContext";
import { useLocale } from "../../i18n/LocaleProvider";
import { useEmployees } from "./EmployeesContext";
import EmployeeActionsMenu from "./EmployeeActionsMenu";
import EmployeeFormPanel from "./EmployeeFormPanel";
import { employeeIconMap, resolveEmployeeCopy, statusClass } from "./employeeView";

export default function EmployeesPage() {
  const { t } = useLocale();
  const { employees, loading, error } = useEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { addActivity, activities } = useActivity();

  const views = useMemo(
    () =>
      employees.map((employee) => {
        const copy = resolveEmployeeCopy(employee, t);
        const visual = employeeIconMap[employee.icon];
        const kindKey = employee.kind === "custom" ? null : employee.kind;
        return {
          employee,
          ...copy,
          icon: visual.icon,
          iconColor: visual.color,
          iconBackground: visual.background,
          statusLabel: t(
            employee.status === "active"
              ? "app.employees.statusActive"
              : "app.employees.statusPaused",
          ),
          statusClass: statusClass(employee.status),
          completed: kindKey
            ? t(`app.employees.${kindKey}Completed`)
            : t("app.employees.customCompleted"),
          taskLabel: kindKey
            ? t(`app.employees.${kindKey}TaskLabel`)
            : t("app.employees.runTask"),
          taskPlaceholder: kindKey
            ? t(`app.employees.${kindKey}Placeholder`)
            : t("app.employees.customPlaceholder"),
        };
      }),
    [employees, t],
  );

  const selectedEmployee =
    views.find((item) => item.employee.id === selectedEmployeeId) ?? null;

  const activeCount = employees.filter((item) => item.status === "active").length;
  const roleCount = new Set(views.map((item) => item.role)).size;
  const taskCount = activities.filter((item) => item.type === "employee").length;
  const workingCount = employees.filter((item) => item.status === "active").length;

  function closePanel() {
    setSelectedEmployeeId(null);
    setTask("");
    setResult(null);
    setIsRunning(false);
  }

  function handleOpenEmployee(id: string) {
    setSelectedEmployeeId(id);
    setTask("");
    setResult(null);
    setIsRunning(false);
  }

  function handleRunTask() {
    if (!selectedEmployee || !task.trim() || isRunning) return;

    const submittedTask = task.trim();
    const employeeName = selectedEmployee.name;

    setIsRunning(true);
    setResult(null);

    window.setTimeout(() => {
      setIsRunning(false);

      setResult(t("app.employees.result", { name: employeeName }));

      addActivity({
        title: t("app.employees.activityTitle", { name: employeeName }),
        detail: submittedTask.slice(0, 48),
        type: "employee",
      });
    }, 1400);
  }

  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">{t("app.employees.kicker")}</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {t("app.employees.title")}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {t("app.employees.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            {t("app.employees.add")}
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {String(employees.length).padStart(2, "0")}
            </p>

            <p className="mt-1 text-sm text-slate-400">{t("app.employees.countLabel")}</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {taskCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">{t("app.employees.tasksCompleted")}</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {workingCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">{t("app.employees.workingNow")}</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <UserRound className="h-5 w-5 text-amber-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              {roleCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">{t("app.employees.rolesCovered")}</p>
          </article>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">
                {t("app.employees.teamTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("app.employees.teamSubtitle")}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400">
              {t("app.employees.activeCount", { count: activeCount })}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {loading && (
              <p className="text-sm text-slate-500 md:col-span-2">
                {t("app.common.loading")}
              </p>
            )}
            {!loading && error && (
              <p className="text-sm text-red-400 md:col-span-2">
                {t("app.employees.loadError")}
              </p>
            )}
            {!loading && !error && employees.length === 0 && (
              <p className="text-sm text-slate-500 md:col-span-2">
                {t("app.employees.emptyTeam")}
              </p>
            )}
            {views.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.employee.id}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBackground}`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>

                    <EmployeeActionsMenu employee={item.employee} />
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {item.name}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${item.statusClass}`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-blue-400">
                      {item.role}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-xs text-slate-500">
                      {item.completed}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEmployee(item.employee.id)}
                      className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                    >
                      {t("app.employees.open")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {creating && <EmployeeFormPanel onClose={() => setCreating(false)} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("app.employees.closePanel")}
            onClick={closePanel}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${selectedEmployee.iconBackground}`}
                >
                  <selectedEmployee.icon
                    className={`h-5 w-5 ${selectedEmployee.iconColor}`}
                  />
                </div>

                <div>
                  <p className="text-base font-semibold text-white">
                    {selectedEmployee.name}
                  </p>
                  <p className="mt-1 text-sm text-blue-400">
                    {selectedEmployee.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label={t("app.employees.close")}
                onClick={closePanel}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${selectedEmployee.statusClass}`}
              >
                {selectedEmployee.statusLabel}
              </span>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {selectedEmployee.description}
              </p>

              <div className="mt-8">
                <label className="text-sm font-semibold text-white">
                  {selectedEmployee.taskLabel}
                </label>

                <textarea
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder={selectedEmployee.taskPlaceholder}
                  className="mt-3 min-h-36 w-full resize-none rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {result && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-300">
                      {t("app.employees.taskCompleted")}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {result}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 p-6">
              <button
                type="button"
                onClick={handleRunTask}
                disabled={!task.trim() || isRunning || selectedEmployee.employee.status === "paused"}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  {isRunning ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}

                  <span>{isRunning ? t("app.employees.working") : t("app.employees.runTask")}</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
