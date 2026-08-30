import { useState } from "react";
import {
  Bot,
  CheckCircle2,
  Ellipsis,
  Mail,
  MessageSquareText,
  Plus,
  Send,
  Sparkles,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { useActivity } from "../activity/ActivityContext";

const employees = [
  {
    name: "Email Assistant",
    role: "Communication",
    description:
      "Drafts client emails, follow-ups, and replies using your preferred tone.",
    icon: Mail,
    iconColor: "text-blue-400",
    iconBackground: "bg-blue-500/10",
    status: "Online",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    completed: "248 tasks completed",
    taskLabel: "Draft a client follow-up",
    taskPlaceholder: "Example: Follow up with Sarah about the project timeline.",
  },
  {
    name: "Meeting Assistant",
    role: "Productivity",
    description:
      "Turns meetings into concise summaries, decisions, and actionable next steps.",
    icon: MessageSquareText,
    iconColor: "text-violet-400",
    iconBackground: "bg-violet-500/10",
    status: "Working",
    statusClass: "bg-blue-500/10 text-blue-400",
    completed: "126 tasks completed",
    taskLabel: "Summarize meeting notes",
    taskPlaceholder: "Paste meeting notes or describe the meeting to summarize.",
  },
  {
    name: "Content Assistant",
    role: "Marketing",
    description:
      "Creates social posts, content ideas, and campaign variations for your brand.",
    icon: Send,
    iconColor: "text-amber-400",
    iconBackground: "bg-amber-500/10",
    status: "Online",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    completed: "94 tasks completed",
    taskLabel: "Create content",
    taskPlaceholder: "Example: Write three LinkedIn posts about workflow automation.",
  },
  {
    name: "Workflow Analyst",
    role: "Operations",
    description:
      "Finds repetitive work and recommends automations for your business.",
    icon: Workflow,
    iconColor: "text-emerald-400",
    iconBackground: "bg-emerald-500/10",
    status: "Online",
    statusClass: "bg-emerald-500/10 text-emerald-400",
    completed: "52 recommendations",
    taskLabel: "Analyze a process",
    taskPlaceholder: "Describe a repetitive process you want to improve.",
  },
];

type Employee = (typeof employees)[number];

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [task, setTask] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { addActivity } = useActivity();

  function closePanel() {
    setSelectedEmployee(null);
    setTask("");
    setResult(null);
    setIsRunning(false);
  }

  function handleOpenEmployee(employee: Employee) {
    setSelectedEmployee(employee);
    setTask("");
    setResult(null);
    setIsRunning(false);
  }

  function handleRunTask() {
    if (!selectedEmployee || !task.trim() || isRunning) return;

    const submittedTask = task.trim();
    const employeeName = selectedEmployee.name;

    setIsRunning(true);
    setResult(null);

    window.setTimeout(() => {
      setIsRunning(false);

      setResult(
        `${employeeName} completed the task successfully. A first draft is ready for review.`,
      );

      addActivity({
        title: `${employeeName} completed a task`,
        detail: submittedTask.slice(0, 48),
        type: "employee",
      });
    }, 1400);
  }

  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">AI TEAM</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              AI Employees
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Specialized AI teammates ready to help your business move faster.
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add AI employee
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              12
            </p>

            <p className="mt-1 text-sm text-slate-400">AI employees</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              520
            </p>

            <p className="mt-1 text-sm text-slate-400">Tasks completed</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              3
            </p>

            <p className="mt-1 text-sm text-slate-400">Working now</p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <UserRound className="h-5 w-5 text-amber-400" />
            </div>

            <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
              4
            </p>

            <p className="mt-1 text-sm text-slate-400">Roles covered</p>
          </article>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Your AI team
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Manage the AI employees available in your workspace.
              </p>
            </div>

            <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400">
              4 active
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {employees.map((employee) => {
              const Icon = employee.icon;

              return (
                <article
                  key={employee.name}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${employee.iconBackground}`}
                    >
                      <Icon className={`h-5 w-5 ${employee.iconColor}`} />
                    </div>

                    <button
                      type="button"
                      aria-label={`Options for ${employee.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100"
                    >
                      <Ellipsis className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {employee.name}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${employee.statusClass}`}
                      >
                        {employee.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-blue-400">
                      {employee.role}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {employee.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <span className="text-xs text-slate-500">
                      {employee.completed}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEmployee(employee)}
                      className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                    >
                      Open employee
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close employee panel"
            onClick={closePanel}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${selectedEmployee.iconBackground}`}
                >
                  <selectedEmployee.icon
                    className={`h-5 w-5 ${selectedEmployee.iconColor}`}
                  />
                </div>

                <div>
                  <p className="text-base font-semibold text-white">
                    {selectedEmployee.name}
                  </p>
                  <p className="mt-1 text-sm text-blue-400">
                    {selectedEmployee.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close panel"
                onClick={closePanel}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${selectedEmployee.statusClass}`}
              >
                {selectedEmployee.status}
              </span>

              <p className="mt-4 text-sm leading-6 text-slate-400">
                {selectedEmployee.description}
              </p>

              <div className="mt-8">
                <label className="text-sm font-semibold text-white">
                  {selectedEmployee.taskLabel}
                </label>

                <textarea
                  value={task}
                  onChange={(event) => setTask(event.target.value)}
                  placeholder={selectedEmployee.taskPlaceholder}
                  className="mt-3 min-h-36 w-full resize-none rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {result && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-300">
                      Task completed
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {result}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 p-6">
              <button
                type="button"
                onClick={handleRunTask}
                disabled={!task.trim() || isRunning}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2" translate="no">
                  {isRunning ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}

                  <span>{isRunning ? "Working..." : "Run task"}</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}