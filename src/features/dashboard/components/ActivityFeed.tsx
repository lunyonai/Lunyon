import { useMemo, useState } from "react";
import {
  Activity,
  Mail,
  MessageSquareText,
  Workflow,
  XCircle,
} from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Card, CardHeader } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { cx, skeletonClass } from "../../../components/ui/styles";
import { useActivity } from "../../activity/ActivityContext";
import { activityTitle, relativeTime } from "../../activity/activityView";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { useLocale } from "../../../i18n/LocaleProvider";

type Filter = "all" | "prompt" | "workflow" | "employee";

/** Same identity colors as the activity chart and stat cards. */
const typeTones: Record<Exclude<Filter, "all">, TileTone> = {
  prompt: "primary",
  workflow: "orange",
  employee: "violet",
};

export default function ActivityFeed() {
  const { activities, loading, unavailable } = useActivity();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { t } = useLocale();

  const [filter, setFilter] = useState<Filter>("all");

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t("app.dashboard.filterAll") },
    { value: "prompt", label: t("app.dashboard.filterPrompt") },
    { value: "workflow", label: t("app.dashboard.filterWorkflow") },
    { value: "employee", label: t("app.dashboard.filterEmployee") },
  ];

  const names = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((item) => {
      if (item.name) map.set(`employee:${item.id}`, item.name);
    });
    workflows.forEach((item) => {
      if (item.title) map.set(`workflow:${item.id}`, item.title);
    });
    return map;
  }, [employees, workflows]);

  const data = useMemo(() => {
    return activities
      .filter((a) => filter === "all" || a.type === filter)
      .slice(0, 8);
  }, [activities, filter]);

  return (
    <Card padded={false}>
      <div className="border-b border-line px-5 py-4">
        <CardHeader
          title={t("app.dashboard.feedTitle")}
          description={t("app.dashboard.feedSubtitle")}
          actions={
            <SegmentedControl
              size="sm"
              ariaLabel={t("app.dashboard.feedTitle")}
              options={filters}
              value={filter}
              onChange={setFilter}
            />
          }
        />
      </div>

      {data.length === 0 ? (
        loading ? (
          <ul className="space-y-3 p-5" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <li key={item} className={cx(skeletonClass, "h-10")} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Activity}
            tone="primary"
            title={unavailable ? t("app.dashboard.feedUnavailable") : t("app.dashboard.feedEmpty")}
          />
        )
      ) : (
        <ul className="divide-y divide-line">
          {data.map((activity) => {
            const failed = activity.status === "failed";
            const Icon = failed
              ? XCircle
              : activity.type === "workflow"
                ? Workflow
                : activity.type === "employee"
                  ? Mail
                  : MessageSquareText;
            const name = activity.refId ? names.get(`${activity.type}:${activity.refId}`) : null;

            return (
              <li key={activity.id} className="flex items-center gap-3 px-5 py-3">
                <IconTile icon={Icon} tone={failed ? "rose" : typeTones[activity.type]} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {activityTitle(activity, t, name)}
                  </p>
                  {activity.detail && (
                    <p className="truncate text-xs text-fg-subtle">{activity.detail}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {failed && (
                    <Badge tone="danger" dot>
                      {t("app.dashboard.statusFailed")}
                    </Badge>
                  )}
                  <span className="text-xs tabular-nums text-fg-subtle">
                    {relativeTime(activity.createdAt, t("app.dashboard.justNow"))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
