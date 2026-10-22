import {
  Bot,
  Clock3,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { StatCard } from "../../../components/ui/StatCard";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useActivity } from "../../activity/ActivityContext";
import { formatDuration } from "../../activity/activityView";
import { buildDayBuckets, dayOverDay, seriesFor } from "../activitySeries";

export default function StatsGrid() {
  const { t, locale } = useLocale();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { activities, stats: activityStats } = useActivity();
  const activeWorkflows = workflows.filter((item) => item.status === "active").length;

  const buckets = useMemo(() => buildDayBuckets(activities, locale), [activities, locale]);
  const promptTrend = seriesFor(buckets, "prompt");
  const workflowTrend = seriesFor(buckets, "workflow");
  const employeeTrend = seriesFor(buckets, "employee");

  function deltaFor(series: number[]) {
    const { delta, label } = dayOverDay(series);
    return {
      label: t("app.dashboard.vsYesterday", { delta: label }),
      direction: delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("flat" as const),
    };
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        label={t("app.dashboard.statEmployees")}
        value={employees.length}
        hint={t("app.dashboard.statEmployeesSub")}
        icon={Bot}
        tone="violet"
        trend={employeeTrend}
      />
      <StatCard
        label={t("app.dashboard.statPrompts")}
        value={activityStats ? activityStats.totals.prompt : "—"}
        hint={t("app.dashboard.statPromptsSub")}
        icon={Sparkles}
        tone="primary"
        trend={promptTrend}
        delta={deltaFor(promptTrend)}
      />
      <StatCard
        label={t("app.dashboard.statWorkflows")}
        value={activityStats ? activityStats.totals.workflow : "—"}
        hint={t("app.dashboard.statWorkflowsSub", { active: activeWorkflows })}
        icon={Workflow}
        tone="orange"
        trend={workflowTrend}
        delta={deltaFor(workflowTrend)}
      />
      <StatCard
        label={t("app.dashboard.statRuntime")}
        value={formatDuration(activityStats?.avgDurationMs)}
        hint={t("app.dashboard.statRuntimeSub")}
        icon={Clock3}
        tone="cyan"
      />
    </section>
  );
}
