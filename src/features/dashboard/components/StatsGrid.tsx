import {
  Bot,
  Clock3,
  Sparkles,
  Workflow,
} from "lucide-react";
import { StatCard } from "../../../components/ui/StatCard";
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
  const activeWorkflows = workflows.filter((item) => item.status === "active").length;

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        label={t("app.dashboard.statEmployees")}
        value={employees.length}
        hint={t("app.dashboard.statEmployeesSub")}
        icon={Bot}
        tone="violet"
      />
      <StatCard
        label={t("app.dashboard.statPrompts")}
        value={activityStats ? activityStats.totals.prompt : "—"}
        hint={t("app.dashboard.statPromptsSub")}
        icon={Sparkles}
        tone="primary"
      />
      <StatCard
        label={t("app.dashboard.statWorkflows")}
        value={activityStats ? activityStats.totals.workflow : "—"}
        hint={t("app.dashboard.statWorkflowsSub", { active: activeWorkflows })}
        icon={Workflow}
        tone="orange"
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
