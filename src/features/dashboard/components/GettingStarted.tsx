import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader } from "../../../components/ui/Card";
import { cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useActivity } from "../../activity/ActivityContext";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import type { WorkspaceStatus } from "../useWorkspaceStatus";

/** Circular progress for the onboarding checklist. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total ? done / total : 0;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-surface-3" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-fg">
        {done}/{total}
      </span>
    </div>
  );
}

/** Onboarding checklist; renders nothing once every step is done. */
export default function GettingStarted({ status }: { status: WorkspaceStatus | null }) {
  const { t } = useLocale();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { stats } = useActivity();

  const checklist = [
    {
      key: "google",
      label: t("app.dashboard.stepConnect"),
      done: Boolean(status?.google?.connected || status?.gmail?.connected),
      to: "/settings",
    },
    { key: "employee", label: t("app.dashboard.stepEmployee"), done: employees.length > 0, to: "/employees" },
    { key: "workflow", label: t("app.dashboard.stepWorkflow"), done: workflows.length > 0, to: "/workflows" },
    {
      key: "run",
      label: t("app.dashboard.stepRun"),
      done: Boolean(stats && stats.totals.prompt + stats.totals.employee + stats.totals.workflow > 0),
      to: "/prompts",
    },
  ];
  const done = checklist.filter((item) => item.done).length;
  if (done === checklist.length) return null;

  return (
    <Card padded={false}>
      <div className="flex items-center gap-4 border-b border-line px-5 py-4">
        <ProgressRing done={done} total={checklist.length} />
        <CardHeader title={t("app.dashboard.gettingStarted")} />
      </div>
      <ol className="grid gap-1 p-2 sm:grid-cols-2">
        {checklist.map((item, index) => (
          <li key={item.key}>
            <Link
              to={item.to}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-2"
            >
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                  item.done
                    ? "bg-success text-white"
                    : "border border-line-strong text-fg-muted group-hover:border-primary group-hover:text-primary-text",
                )}
              >
                {item.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cx("flex-1", item.done ? "text-fg-subtle line-through" : "text-fg")}>
                {item.label}
              </span>
              <ChevronRight className="h-4 w-4 text-fg-placeholder opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
