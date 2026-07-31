import {
  Bot,
  Clock3,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";
import { useActivity } from "../../activity/ActivityContext";

export default function StatsGrid() {
  const { activities } = useActivity();

  const stats = useMemo(() => {
    const prompts = activities.filter(a => a.type === "prompt").length;
    const workflows = activities.filter(a => a.type === "workflow").length;
    const employees = activities.filter(a => a.type === "employee").length;

    return [
      {
        title: "AI Employees",
        value: employees,
        subtitle: "Running autonomously",
        icon: Bot,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      {
        title: "Prompt Executions",
        value: prompts,
        subtitle: "Completed successfully",
        icon: Sparkles,
        color: "text-violet-400",
        bg: "bg-violet-500/10",
      },
      {
        title: "Workflow Runs",
        value: workflows,
        subtitle: "Automation pipeline",
        icon: Workflow,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      {
        title: "Average Runtime",
        value: "1.8s",
        subtitle: "Execution speed",
        icon: Clock3,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
      },
    ];
  }, [activities]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-blue-500/30"
          >
            <div className="flex justify-between">

              <div className={`rounded-2xl p-3 ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>

              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

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