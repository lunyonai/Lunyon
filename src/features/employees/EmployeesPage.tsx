import { useId, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Plus,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button, IconButton } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import type { TileTone } from "../../components/ui/IconTile";
import { StatCard } from "../../components/ui/StatCard";
import { cx, skeletonClass, textareaClass } from "../../components/ui/styles";
import { useActivity } from "../activity/ActivityContext";
import { useLocale } from "../../i18n/LocaleProvider";
import { api } from "../../lib/api";
import { aiErrorInfo } from "../../lib/aiErrors";
import RunResultCard, { RunErrorNotice } from "../../components/RunResultCard";
import { useEmployees } from "./EmployeesContext";
import EmployeeActionsMenu from "./EmployeeActionsMenu";
import EmployeeFormPanel from "./EmployeeFormPanel";
import { employeeIconMap, resolveEmployeeCopy, statusClass, statusTone } from "./employeeView";

export default function EmployeesPage() {
  const { t, locale } = useLocale();
  const { employees, loading, error } = useEmployees();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<{ key: string; needsSettings: boolean } | null>(null);
  const { stats, refresh: refreshActivity } = useActivity();
  const panelTitleId = useId();
  const taskFieldId = useId();

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
          statusTone: statusTone(employee.status),
          completed: t("app.employees.tasksDone", {
            count: stats?.byRef[`employee:${employee.id}`] ?? 0,
          }),
          taskLabel: kindKey
            ? t(`app.employees.${kindKey}TaskLabel`)
            : t("app.employees.runTask"),
          taskPlaceholder: kindKey
            ? t(`app.employees.${kindKey}Placeholder`)
            : t("app.employees.customPlaceholder"),
        };
      }),
    [employees, stats, t],
  );

  const selectedEmployee =
    views.find((item) => item.employee.id === selectedEmployeeId) ?? null;

  const activeCount = employees.filter((item) => item.status === "active").length;
  const roleCount = new Set(views.map((item) => item.role)).size;
  const taskCount = stats?.totals.employee ?? 0;
  const workingCount = employees.filter((item) => item.status === "active").length;

  function closePanel() {
    setSelectedEmployeeId(null);
    setTask("");
    setResult(null);
    setRunError(null);
    setIsRunning(false);
  }

  function handleOpenEmployee(id: string) {
    setSelectedEmployeeId(id);
    setTask("");
    setResult(null);
    setRunError(null);
    setIsRunning(false);
  }

  async function handleRunTask() {
    if (!selectedEmployee || !task.trim() || isRunning) return;

    setIsRunning(true);
    setResult(null);
    setRunError(null);

    try {
      const run = await api.runEmployee(selectedEmployee.employee.id, task.trim(), locale);
      setResult(run.output);
      void refreshActivity();
    } catch (err) {
      setRunError(aiErrorInfo(err));
    } finally {
      setIsRunning(false);
    }
  }

  const summary: Array<{ key: string; label: string; value: string | number; icon: typeof Bot; tone: TileTone }> = [
    {
      key: "count",
      label: t("app.employees.countLabel"),
      value: String(employees.length),
      icon: Bot,
      tone: "violet",
    },
    {
      key: "tasks",
      label: t("app.employees.tasksCompleted"),
      value: taskCount,
      icon: CheckCircle2,
      tone: "emerald",
    },
    {
      key: "working",
      label: t("app.employees.workingNow"),
      value: workingCount,
      icon: Sparkles,
      tone: "primary",
    },
    {
      key: "roles",
      label: t("app.employees.rolesCovered"),
      value: roleCount,
      icon: UserRound,
      tone: "amber",
    },
  ];

  return (
    <AppShell>
      <section className="space-y-6">
        <PageHeader
          icon={Bot}
          tone="violet"
          title={t("app.employees.title")}
          description={t("app.employees.subtitle")}
          actions={
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus />
              {t("app.employees.add")}
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {summary.map((card) => (
            <StatCard key={card.key} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
          ))}
        </div>

        <section className="space-y-4">
          <CardHeader
            title={t("app.employees.teamTitle")}
            description={t("app.employees.teamSubtitle")}
            actions={
              <Badge className="tabular-nums">
                {t("app.employees.activeCount", { count: activeCount })}
              </Badge>
            }
          />

          {loading && (
            <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
              <span className="sr-only">{t("app.common.loading")}</span>
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className={cx(skeletonClass, "h-52 rounded-xl")}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {!loading && error && <Alert tone="danger">{t("app.employees.loadError")}</Alert>}

          {!loading && !error && employees.length === 0 && (
            <Card padded={false}>
              <EmptyState tone="violet"
                icon={Bot}
                title={t("app.employees.emptyTeam")}
                action={
                  <Button variant="primary" onClick={() => setCreating(true)}>
                    <Plus />
                    {t("app.employees.add")}
                  </Button>
                }
              />
            </Card>
          )}

          {views.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {views.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.employee.id}
                    as="article"
                    padded={false}
                    className="group flex flex-col p-5 transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cx(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          item.iconBackground,
                        )}
                      >
                        <Icon className={cx("h-5 w-5", item.iconColor)} aria-hidden="true" />
                      </div>

                      <EmployeeActionsMenu employee={item.employee} />
                    </div>

                    <div className="mt-4 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-fg">{item.name}</h3>
                        <Badge tone={item.statusTone} dot>
                          {item.statusLabel}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm text-primary-text">{item.role}</p>

                      <p className="mt-3 text-sm leading-6 text-fg-muted">{item.description}</p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                      <span className="text-xs tabular-nums text-fg-subtle">{item.completed}</span>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="-mr-2"
                        onClick={() => handleOpenEmployee(item.employee.id)}
                      >
                        {t("app.employees.open")}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {creating && <EmployeeFormPanel onClose={() => setCreating(false)} />}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("app.employees.closePanel")}
            onClick={closePanel}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
          />

          <aside
            aria-labelledby={panelTitleId}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-overlay"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    selectedEmployee.iconBackground,
                  )}
                >
                  <selectedEmployee.icon
                    className={cx("h-5 w-5", selectedEmployee.iconColor)}
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <p id={panelTitleId} className="truncate text-base font-semibold text-fg">
                    {selectedEmployee.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-primary-text">
                    {selectedEmployee.role}
                  </p>
                </div>
              </div>

              <IconButton
                size="sm"
                className="-mr-1.5"
                aria-label={t("app.employees.close")}
                onClick={closePanel}
              >
                <X />
              </IconButton>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <div className="space-y-3">
                <Badge tone={selectedEmployee.statusTone} dot>
                  {selectedEmployee.statusLabel}
                </Badge>

                <p className="text-sm leading-6 text-fg-muted">{selectedEmployee.description}</p>
              </div>

              <Field label={selectedEmployee.taskLabel} htmlFor={taskFieldId}>
                <textarea
                  id={taskFieldId}
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder={selectedEmployee.taskPlaceholder}
                  className={cx(textareaClass, "min-h-36 resize-none")}
                />
              </Field>

              {result && (
                <RunResultCard title={t("app.employees.taskCompleted")} output={result} />
              )}

              {runError && (
                <RunErrorNotice errorKey={runError.key} needsSettings={runError.needsSettings} />
              )}
            </div>

            <div className="border-t border-line bg-surface-2/60 px-5 py-4">
              <Button
                variant="primary"
                size="lg"
                block
                loading={isRunning}
                onClick={() => void handleRunTask()}
                disabled={!task.trim() || selectedEmployee.employee.status === "paused"}
              >
                {!isRunning && <Sparkles />}
                {isRunning ? t("app.employees.working") : t("app.employees.runTask")}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
