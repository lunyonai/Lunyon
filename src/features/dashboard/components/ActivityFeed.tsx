import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Mail,
  MessageSquareText,
  Workflow,
} from "lucide-react";

import { useActivity } from "../../activity/ActivityContext";
import { useLocale } from "../../../i18n/LocaleProvider";

type Filter = "all" | "prompt" | "workflow" | "employee";

const seedCopy: Record<string, { title: string; detail: string }> = {
  "initial-1": {
    title: "app.activity.seed1Title",
    detail: "app.activity.seed1Detail",
  },
  "initial-2": {
    title: "app.activity.seed2Title",
    detail: "app.activity.seed2Detail",
  },
  "initial-3": {
    title: "app.activity.seed3Title",
    detail: "app.activity.seed3Detail",
  },
};

function relative(date: Date, justNow: string) {
  const diff = Date.now() - date.getTime();

  if (diff < 60000) return justNow;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;

  return `${Math.floor(diff / 86400000)}d`;
}

export default function ActivityFeed() {
  const { activities } = useActivity();
  const { t } = useLocale();

  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("app.dashboard.filterAll") },
    { id: "prompt", label: t("app.dashboard.filterPrompt") },
    { id: "workflow", label: t("app.dashboard.filterWorkflow") },
    { id: "employee", label: t("app.dashboard.filterEmployee") },
  ];

  const data = useMemo(() => {

    return activities
      .filter(a => filter === "all" || a.type === filter)
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

        {filters.map(item=>(

          <button
            key={item.id}
            onClick={()=>setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              filter===item.id
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {item.label}

          </button>

        ))}

      </div>

      <div className="mt-6 space-y-2">

        {data.map(activity=>{

          const Icon =
            activity.type==="workflow"
              ? Workflow
              : activity.type==="employee"
              ? Mail
              : MessageSquareText;

          const copy = seedCopy[activity.id];

          return (

            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-slate-800/60"
            >

              <div className="rounded-xl bg-slate-800 p-3">

                <Icon className="h-4 w-4 text-blue-400"/>

              </div>

              <div className="min-w-0 flex-1">

                <p className="text-sm font-medium text-white">
                  {copy ? t(copy.title) : activity.title}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {copy ? t(copy.detail) : activity.detail}
                </p>

              </div>

              <span className="shrink-0 text-xs text-slate-500">
                {relative(activity.createdAt, t("app.dashboard.justNow"))}
              </span>

              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600"/>

            </div>

          );

        })}

      </div>

    </section>
  );
}
