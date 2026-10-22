import { Bot, CalendarDays, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { buttonClass, cardClass, cx } from "../../../components/ui/styles";
import { localeMeta, type Locale } from "../../../i18n/config";
import { useLocale } from "../../../i18n/LocaleProvider";
import { useAuth } from "../../../hooks/useAuth";
import { useEmployees } from "../../employees/EmployeesContext";
import { useWorkflows } from "../../workflows/WorkflowsContext";
import { userDisplayName } from "../../../lib/userDisplay";
import { useActivity } from "../../activity/ActivityContext";

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "app.dashboard.greetingMorning";
  if (hour < 18) return "app.dashboard.greeting";
  return "app.dashboard.greetingEvening";
}

function todayLabel(locale: Locale) {
  const label = new Intl.DateTimeFormat(localeMeta[locale].htmlLang, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DashboardHeader() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = userDisplayName(user) || "there";
  const { employees } = useEmployees();
  const { workflows } = useWorkflows();
  const { stats } = useActivity();
  const activeEmployees = employees.filter((item) => item.status === "active").length;
  const activeWorkflows = workflows.filter((item) => item.status === "active").length;

  const summary = [
    { key: "employees", value: activeEmployees, label: t("app.dashboard.employeesOnline"), dot: "bg-tint-violet" },
    { key: "workflows", value: activeWorkflows, label: t("app.dashboard.workflowsRunning"), dot: "bg-tint-orange" },
    { key: "today", value: stats?.today ?? 0, label: t("app.dashboard.tasksToday"), dot: "bg-success" },
  ];

  return (
    <section className={cx(cardClass, "relative isolate flex flex-col justify-center overflow-hidden p-6 sm:p-8")}>
      {/* Decorative brand layers: color wash + fading grid. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 90% at 0% 0%, color-mix(in srgb, var(--ui-primary) 16%, transparent), transparent 70%), radial-gradient(ellipse 45% 80% at 100% 100%, color-mix(in srgb, var(--ui-tint-violet) 14%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--ui-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-line) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 60% 100% at 100% 0%, #000 10%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 100% at 100% 0%, #000 10%, transparent 75%)",
        }}
      />

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-2.5 py-1 text-xs font-medium text-fg-muted backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
            {todayLabel(locale)}
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {t(greetingKey(), { name })}
          </h1>
          <p className="mt-2 text-sm leading-6 text-fg-muted sm:text-base">{t("app.dashboard.intro")}</p>

          <dl className="mt-5 flex flex-wrap gap-2">
            {summary.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-sm backdrop-blur"
              >
                <span className={`h-2 w-2 rounded-full ${item.dot}`} aria-hidden="true" />
                <dt className="order-2 text-fg-muted">{item.label}</dt>
                <dd className="order-1 font-semibold tabular-nums text-fg">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/employees" className={buttonClass({ variant: "secondary", size: "lg" })}>
            <Bot className="text-tint-violet" />
            {t("app.nav.employees")}
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/workflows", { state: { create: true } })}
          >
            <Plus />
            {t("app.dashboard.createAutomation")}
          </Button>
        </div>
      </div>
    </section>
  );
}
