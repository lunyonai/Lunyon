import { ArrowUpRight, Bot, Mail, Sparkles, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { cardClass, cardHoverClass, cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";

const actions: Array<{ key: string; to: string; icon: typeof Bot; tone: TileTone; title: string; body: string }> = [
  { key: "assistant", to: "/assistant", icon: Sparkles, tone: "primary", title: "app.nav.assistant", body: "app.agent.subtitle" },
  { key: "employees", to: "/employees", icon: Bot, tone: "violet", title: "app.nav.employees", body: "app.employees.subtitle" },
  { key: "workflows", to: "/workflows", icon: Workflow, tone: "orange", title: "app.nav.workflows", body: "app.workflows.subtitle" },
  { key: "mail", to: "/mail", icon: Mail, tone: "rose", title: "app.nav.mail", body: "app.mail.subtitle" },
];

export default function QuickActions() {
  const { t } = useLocale();

  return (
    <section aria-labelledby="quick-actions-title" className="space-y-3">
      <h2 id="quick-actions-title" className="text-sm font-semibold text-fg">
        {t("app.dashboard.quickTitle")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {actions.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={cx(
              cardClass,
              cardHoverClass,
              "group flex items-start gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            <IconTile icon={item.icon} tone={item.tone} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2 text-sm font-semibold text-fg">
                {t(item.title)}
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-fg-placeholder transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
                  aria-hidden="true"
                />
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-fg-subtle">{t(item.body)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
