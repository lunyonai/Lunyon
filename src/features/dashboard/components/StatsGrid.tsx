import {
  Bot,
  Clock3,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useActivity } from "../../activity/ActivityContext";
import { formatDuration } from "../../activity/activityView";

export default function StatsGrid() {
  const { t } = useLocale();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { stats: activityStats } = useActivity();

  const stats = useMemo(() => {
    return [
      {
        key: "employees",
        title: t("app.dashboard.statEmployees"),
        value: employees.length,
        subtitle: t("app.dashboard.statEmployeesSub"),
        icon: Bot,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        key: "prompts",
        title: t("app.dashboard.statPrompts"),
        value: activityStats ? activityStats.totals.prompt : "—",
        subtitle: t("app.dashboard.statPromptsSub"),
        icon: Sparkles,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        key: "workflows",
        title: t("app.dashboard.statWorkflows"),
        value: activityStats ? activityStats.totals.workflow : "—",
        subtitle: t("app.dashboard.statWorkflowsSub", {
          active: workflows.filter((item) => item.status === "active").length,
        }),
        icon: Workflow,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        key: "runtime",
        title: t("app.dashboard.statRuntime"),
        value: formatDuration(activityStats?.avgDurationMs),
        subtitle: t("app.dashboard.statRuntimeSub"),
        icon: Clock3,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
      },
    ];
  }, [activityStats, employees.length, t, workflows]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.key}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/30"
          >
            <div className="flex justify-between">

              <div className={`rounded-2xl p-3 ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>


            </div>

            <p className="mt-8 text-4xl font-semibold text-white">
              {card.value}
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {card.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {card.subtitle}
            </p>

          </article>
        );
      })}
    </section>
  );
}
