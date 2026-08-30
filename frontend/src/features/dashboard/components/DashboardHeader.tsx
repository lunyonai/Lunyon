import { Sparkles, Bot, Workflow, CheckCircle2 } from "lucide-react";

export default function DashboardHeader() {
  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8">

      <div className="flex items-start justify-between">

        <div>

          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            AI OPERATING SYSTEM
          </span>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            Good afternoon, Lucas 👋
          </h1>

          <p className="mt-3 max-w-xl text-slate-400">
            Your AI workforce is online and continuously automating repetitive
            work across your business.
          </p>

        </div>

        <button
          className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 font-medium text-white transition hover:bg-blue-500"
        >
          <Sparkles className="h-4 w-4"/>
          Create Automation
        </button>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <Bot className="text-blue-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                12
              </p>

              <p className="text-sm text-slate-400">
                AI Employees Online
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <Workflow className="text-emerald-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                3
              </p>

              <p className="text-sm text-slate-400">
                Workflows Running
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <CheckCircle2 className="text-violet-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                521
              </p>

              <p className="text-sm text-slate-400">
                Tasks Completed Today
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}