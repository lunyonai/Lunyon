import { Link } from "react-router-dom";
import {
  Bot,
  CalendarDays,
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
import type { WorkspaceStatus } from "../useWorkspaceStatus";

export default function SystemStatus({ status }: { status: WorkspaceStatus | null }) {
  const { t, locale } = useLocale();

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

  return (
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
  );
}
