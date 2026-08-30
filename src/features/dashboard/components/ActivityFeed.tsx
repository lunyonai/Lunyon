import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Mail,
  MessageSquareText,
  Workflow,
} from "lucide-react";

import { useActivity } from "../../activity/ActivityContext";

type Filter = "all" | "prompt" | "workflow" | "employee";

function relative(date: Date) {
  const diff = Date.now() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;

  return `${Math.floor(diff / 86400000)}d`;
}

export default function ActivityFeed() {
  const { activities } = useActivity();

  const [filter, setFilter] = useState<Filter>("all");

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
            Operations Feed
          </h2>

          <p className="text-sm text-slate-400">
            Everything your AI system is doing.
          </p>

        </div>

      </div>

      <div className="mt-5 flex gap-2">

        {["all","prompt","workflow","employee"].map(item=>(

          <button
            key={item}
            onClick={()=>setFilter(item as Filter)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              filter===item
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {item}

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

          return (

            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-slate-800/60"
            >

              <div className="rounded-xl bg-slate-800 p-3">

                <Icon className="h-4 w-4 text-blue-400"/>

              </div>

              <div className="flex-1">

                <p className="text-sm font-medium text-white">
                  {activity.title}
                </p>

                <p className="text-xs text-slate-500">
                  {activity.detail}
                </p>

              </div>

              <span className="text-xs text-slate-500">
                {relative(activity.createdAt)}
              </span>

              <ArrowUpRight className="h-4 w-4 text-slate-600"/>

            </div>

          );

        })}

      </div>

    </section>
  );
}