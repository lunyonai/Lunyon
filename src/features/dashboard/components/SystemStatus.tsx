import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Mail,
  Sparkles,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardHeader } from "../../../components/ui/Card";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { buttonClass, cx } from "../../../components/ui/styles";
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

/** Circular progress for the onboarding checklist. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = total ? done / total : 0;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 44 44" className="h-12 w-12 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-surface-3" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-fg">
        {done}/{total}
      </span>
    </div>
  );
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

  const services: Array<{ key: string; name: string; ok: boolean; detail: string; icon: typeof Bot; tone: TileTone }> = [
    {
      key: "calendar",
      name: t("app.dashboard.serviceCalendar"),
      ok: Boolean(status?.google?.connected),
      detail: status?.google?.connected
        ? (status.google.email ?? t("app.dashboard.connected"))
        : t("app.dashboard.notConnected"),
      icon: CalendarDays,
      tone: "cyan",
    },
    {
      key: "gmail",
      name: t("app.dashboard.serviceGmail"),
      ok: Boolean(status?.gmail?.connected),
      detail: status?.gmail?.connected
        ? (status.gmail.email ?? t("app.dashboard.connected"))
        : t("app.dashboard.notConnected"),
      icon: Mail,
      tone: "rose",
    },
    {
      key: "ai",
      name: t("app.dashboard.serviceAi"),
      ok: aiReady,
      detail: aiDetail,
      icon: Bot,
      tone: "violet",
    },
    {
      key: "plan",
      name: t("app.dashboard.servicePlan"),
      ok: planActive,
      detail: planDetail,
      icon: CreditCard,
      tone: "amber",
    },
  ];
  const readyCount = services.filter((service) => service.ok).length;

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
  const done = checklist.filter((item) => item.done).length;
  const pending = checklist.length - done;

  return (
    <div className="space-y-6">
      <Card padded={false}>
        <div className="border-b border-line px-5 py-4">
          <CardHeader
            title={t("app.dashboard.statusTitle")}
            actions={
              status && (
                <Badge tone={readyCount === services.length ? "success" : "warning"} dot>
                  {readyCount}/{services.length}
                </Badge>
              )
            }
          />
        </div>

        <ul className="divide-y divide-line">
          {services.map((service) => (
            <li key={service.key}>
              <Link
                to="/settings"
                className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface-2/60"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <IconTile icon={service.icon} tone={service.tone} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{service.name}</span>
                    <span className="block truncate text-xs text-fg-subtle">
                      {status ? service.detail : t("app.common.loading")}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "h-2 w-2 rounded-full",
                      !status
                        ? "bg-surface-3"
                        : service.ok
                          ? "bg-success shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-success)_20%,transparent)]"
                          : "bg-warning shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-warning)_20%,transparent)]",
                    )}
                  />
                  <ChevronRight className="h-4 w-4 text-fg-placeholder transition group-hover:translate-x-0.5 group-hover:text-fg" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {!planActive && status && (
          <div className="border-t border-line p-4">
            <Link
              to="/settings"
              className={cx(
                buttonClass({ variant: "primary", block: true }),
                "bg-gradient-to-r from-primary to-tint-violet hover:opacity-95",
              )}
            >
              <Sparkles />
              {t("app.dashboard.upgrade")}
            </Link>
          </div>
        )}
      </Card>

      {pending > 0 && (
        <Card padded={false}>
          <div className="flex items-center gap-4 border-b border-line px-5 py-4">
            <ProgressRing done={done} total={checklist.length} />
            <CardHeader title={t("app.dashboard.gettingStarted")} />
          </div>
          <ol className="p-2">
            {checklist.map((item, index) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-surface-2"
                >
                  <span
                    className={cx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      item.done
                        ? "bg-success text-white"
                        : "border border-line-strong text-fg-muted group-hover:border-primary group-hover:text-primary-text",
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className={cx("flex-1", item.done ? "text-fg-subtle line-through" : "text-fg")}>
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-fg-placeholder opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
