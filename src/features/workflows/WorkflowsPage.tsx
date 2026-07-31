import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Ellipsis,
  Mail,
  MessageSquareText,
  Play,
  Plus,
  Sparkles,
  Workflow,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { useActivity } from "../activity/ActivityContext";

const workflows = [
  {
    title: "Client follow-up assistant",
    description:
      "Draft a follow-up email after each completed client meeting.",
    trigger: "Meeting completed",
    lastRun: "8 minutes ago",
    runs: "124 runs",
    icon: Mail,
    iconColor: "text-blue-400",
    iconBackground: "bg-blue-500/10",
    status: "Active",
    statusClass: "bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Meeting notes to actions",
    description:
      "Extract decisions, owners, and next steps from meeting notes.",
    trigger: "Notes added",
    lastRun: "24 minutes ago",
    runs: "89 runs",
    icon: MessageSquareText,
    iconColor: "text-violet-400",
    iconBackground: "bg-violet-500/10",
    status: "Active",
    statusClass: "bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Weekly team update",
    description:
      "Compile completed work and send a weekly summary to your team.",
    trigger: "Every Friday at 4 PM",
    lastRun: "3 days ago",
    runs: "12 runs",
    icon: Clock3,
    iconColor: "text-amber-400",
    iconBackground: "bg-amber-500/10",
    status: "Scheduled",
    statusClass: "bg-amber-500/10 text-amber-400",
  },
];

export default function WorkflowsPage() {
  const [runningWorkflow, setRunningWorkflow] = useState<string | null>(null);
  const [completedWorkflow, setCompletedWorkflow] = useState<string | null>(null);
  const { addActivity } = useActivity();

  function handleRunWorkflow(workflowName: string) {
    if (runningWorkflow) return;

    setRunningWorkflow(workflowName);
    setCompletedWorkflow(null);

    window.setTimeout(() => {
      setRunningWorkflow(null);
      setCompletedWorkflow(workflowName);

      addActivity({
        title: `${workflowName} completed`,
        detail: "Triggered from Workflows page",
        type: "workflow",
      });

      window.setTimeout(() => {
        setCompletedWorkflow((current) =>
          current === workflowName ? null : current,
        );
      }, 1800);
    }, 1400);
  }

  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">AUTOMATION LAB</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Workflows
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Let your AI team handle repetitive work automatically.
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create workflow
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Workflow className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              08
            </p>

            <p className="mt-1 text-sm text-slate-400">Active workflows</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              225
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Tasks completed this week
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Clock3 className="h-5 w-5 text-violet-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              32.4h
            </p>

            <p className="mt-1 text-sm text-slate-400">Time saved this week</p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Your automations
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Workflows that are currently helping your team.
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              View activity
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              const isRunning = runningWorkflow === workflow.title;
              const isCompleted = completedWorkflow === workflow.title;

              return (
                <article
                  key={workflow.title}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-800/40 sm:flex-row sm:items-center"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${workflow.iconBackground}`}
                  >
                    <Icon className={`h-5 w-5 ${workflow.iconColor}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">
                        {workflow.title}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${workflow.statusClass}`}
                      >
                        {workflow.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {workflow.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Trigger: {workflow.trigger}</span>
                      <span>Last run: {workflow.lastRun}</span>
                      <span>{workflow.runs}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      aria-label={`Run ${workflow.title}`}
                      onClick={() => handleRunWorkflow(workflow.title)}
                      disabled={runningWorkflow !== null}
                      className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 text-xs font-medium text-slate-300 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex items-center gap-2" translate="no">
                        {isRunning ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}

                        <span>
                          {isRunning
                            ? "Running"
                            : isCompleted
                              ? "Completed"
                              : "Run now"}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`More options for ${workflow.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-slate-900/60 to-violet-500/10 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Find your next automation
                </p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
                  Tell us what repetitive task is taking time from your team,
                  and we will help you turn it into a workflow.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Get suggestions
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </section>
    </AppShell>
  );
}