import { useMemo, useState } from "react";
import {
  Mail,
  MessageSquareText,
  Workflow,
  XCircle,
} from "lucide-react";

import { useActivity } from "../../activity/ActivityContext";
import { activityTitle, relativeTime } from "../../activity/activityView";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { useLocale } from "../../../i18n/LocaleProvider";

type Filter = "all" | "prompt" | "workflow" | "employee";

export default function ActivityFeed() {
  const { activities, loading, unavailable } = useActivity();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { t } = useLocale();

  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("app.dashboard.filterAll") },
    { id: "prompt", label: t("app.dashboard.filterPrompt") },
    { id: "workflow", label: t("app.dashboard.filterWorkflow") },
    { id: "employee", label: t("app.dashboard.filterEmployee") },
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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t("app.dashboard.feedTitle")}
          </h2>

          <p className="text-sm text-slate-400">
            {t("app.dashboard.feedSubtitle")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              filter === item.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {data.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
            {loading
              ? t("app.common.loading")
              : unavailable
                ? t("app.dashboard.feedUnavailable")
                : t("app.dashboard.feedEmpty")}
          </p>
        )}

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
            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-slate-800/60"
            >
              <div className="rounded-xl bg-slate-800 p-3">
                <Icon className={`h-4 w-4 ${failed ? "text-red-400" : "text-blue-400"}`} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  {activityTitle(activity, t, name)}
                </p>

                {activity.detail && (
                  <p className="truncate text-xs text-slate-500">{activity.detail}</p>
                )}
              </div>

              <span className="shrink-0 text-xs text-slate-500">
                {relativeTime(activity.createdAt, t("app.dashboard.justNow"))}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
