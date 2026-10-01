import { Sparkles, Bot, Workflow, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useAuth } from "../../../hooks/useAuth";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { userDisplayName } from "../../../lib/userDisplay";

export default function DashboardHeader() {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = userDisplayName(user) || "there";
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const activeEmployees = employees.filter((item) => item.status === "active").length;
  const activeWorkflows = workflows.filter((item) => item.status === "active").length;

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
            {t("app.dashboard.kicker")}
          </span>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
            {t("app.dashboard.greeting", { name })}
          </h1>

          <p className="mt-3 max-w-xl text-slate-400">
            {t("app.dashboard.intro")}
          </p>

        </div>

        <button
          type="button"
          onClick={() => navigate("/workflows", { state: { create: true } })}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 font-medium text-white transition hover:bg-blue-500"
        >
          <Sparkles className="h-4 w-4"/>
          {t("app.dashboard.createAutomation")}
        </button>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <Bot className="text-blue-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                {activeEmployees}
              </p>

              <p className="text-sm text-slate-400">
                {t("app.dashboard.employeesOnline")}
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <Workflow className="text-emerald-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                {activeWorkflows}
              </p>

              <p className="text-sm text-slate-400">
                {t("app.dashboard.workflowsRunning")}
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">

          <div className="flex items-center gap-3">

            <CheckCircle2 className="text-violet-400"/>

            <div>

              <p className="text-3xl font-semibold text-white">
                0
              </p>

              <p className="text-sm text-slate-400">
                {t("app.dashboard.tasksToday")}
              </p>

            </div>

          </div>

        </div>

      </div>

    </header>
  );
}
