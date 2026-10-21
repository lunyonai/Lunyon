import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Circle,
  CreditCard,
  Mail,
  Sparkles,
} from "lucide-react";
import { useLocale } from "../../../i18n/LocaleProvider";
import { localeMeta } from "../../../i18n/config";
import {
  api,
  type AgentStatus,
  type EntitlementResponse,
  type GmailStatus,
  type GoogleStatus,
} from "../../../lib/api";
import { useActivity } from "../../activity/ActivityContext";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";

type WorkspaceStatus = {
  google: GoogleStatus | null;
  gmail: GmailStatus | null;
  ai: AgentStatus | null;
  plan: EntitlementResponse | null;
};

function settledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

export default function SystemStatus() {
  const { t, locale } = useLocale();
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { stats } = useActivity();
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.googleStatus(),
      api.gmailStatus(),
      api.agentStatus(),
      api.entitlement(),
    ]).then(([google, gmail, ai, plan]) => {
      if (cancelled) return;
      setStatus({
        google: settledValue(google),
        gmail: settledValue(gmail),
        ai: settledValue(ai),
        plan: settledValue(plan),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ai = status?.ai;
  const aiReady = Boolean(ai?.ownKey || ai?.freeAvailable);
  const aiDetail = !ai
    ? "—"
    : ai.ownKey
      ? t("app.dashboard.aiOwnKey")
      : ai.freeAvailable
        ? t("app.dashboard.aiUsage", { used: ai.usedToday, limit: ai.dailyLimit })
        : t("app.dashboard.aiMissing");

  const planActive = Boolean(status?.plan?.active);
  const planDetail = planActive && status?.plan?.accessUntil
    ? t("app.dashboard.planUntil", {
        date: new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { dateStyle: "medium" }).format(
          new Date(status.plan.accessUntil),
        ),
      })
    : t("app.dashboard.planFree");

  const services = [
    {
      key: "calendar",
      name: t("app.dashboard.serviceCalendar"),
      ok: Boolean(status?.google?.connected),
      detail: status?.google?.connected
        ? (status.google.email ?? t("app.dashboard.connected"))
        : t("app.dashboard.notConnected"),
      icon: CalendarDays,
    },
    {
      key: "gmail",
      name: t("app.dashboard.serviceGmail"),
      ok: Boolean(status?.gmail?.connected),
      detail: status?.gmail?.connected
        ? (status.gmail.email ?? t("app.dashboard.connected"))
        : t("app.dashboard.notConnected"),
      icon: Mail,
    },
    {
      key: "ai",
      name: t("app.dashboard.serviceAi"),
      ok: aiReady,
      detail: aiDetail,
      icon: Bot,
    },
    {
      key: "plan",
      name: t("app.dashboard.servicePlan"),
      ok: planActive,
      detail: planDetail,
      icon: CreditCard,
    },
  ];

  const checklist = [
    {
      key: "google",
      label: t("app.dashboard.stepConnect"),
      done: Boolean(status?.google?.connected || status?.gmail?.connected),
      to: "/settings",
    },
    { key: "employee", label: t("app.dashboard.stepEmployee"), done: employees.length > 0, to: "/employees" },
    { key: "workflow", label: t("app.dashboard.stepWorkflow"), done: workflows.length > 0, to: "/workflows" },
    {
      key: "run",
      label: t("app.dashboard.stepRun"),
      done: Boolean(stats && stats.totals.prompt + stats.totals.employee + stats.totals.workflow > 0),
      to: "/prompts",
    },
  ];
  const pending = checklist.filter((item) => !item.done).length;

  return (
    <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
        {t("app.dashboard.systemKicker")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{t("app.dashboard.statusTitle")}</h2>

      <ul className="mt-6 space-y-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <li key={service.key} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="min-w-0">
                  <span className="block text-sm text-white">{service.name}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {status ? service.detail : t("app.common.loading")}
                  </span>
                </span>
              </span>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  !status ? "bg-slate-600" : service.ok ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </li>
          );
        })}
      </ul>

      {!planActive && status && (
        <Link
          to="/settings"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
        >
          <Sparkles className="h-4 w-4" />
          {t("app.dashboard.upgrade")}
        </Link>
      )}

      {pending > 0 && (
        <div className="mt-8">
          <p className="text-sm font-semibold text-white">{t("app.dashboard.gettingStarted")}</p>
          <ul className="mt-3 space-y-2">
            {checklist.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition hover:bg-slate-800/60"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                  )}
                  <span className={item.done ? "text-slate-500 line-through" : "text-slate-200"}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
