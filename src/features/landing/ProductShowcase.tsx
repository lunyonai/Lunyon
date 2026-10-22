import { motion } from "framer-motion";
import { Bot, Mail, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { cx } from "../../components/ui/styles";
import { useLocale } from "../../i18n/LocaleProvider";
import GlowCard from "./GlowCard";
import { reveal } from "./landingMotion";
import PromptLibraryDemo from "./demos/PromptLibraryDemo";
import WorkflowsDemo from "./demos/WorkflowsDemo";
import EmployeesDemo from "./demos/EmployeesDemo";
import AssistantDemo from "./demos/AssistantDemo";

type BentoCardProps = {
  icon: LucideIcon;
  tone: TileTone;
  title: ReactNode;
  description: ReactNode;
  className?: string;
  delay?: number;
  children: ReactNode;
};

function BentoCard({ icon, tone, title, description, className, delay = 0, children }: BentoCardProps) {
  return (
    <motion.div {...reveal(delay, 20)} className={cx("min-w-0", className)}>
      <GlowCard className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <IconTile icon={icon} tone={tone} size="md" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-fg">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-fg-muted">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex-1">{children}</div>
      </GlowCard>
    </motion.div>
  );
}

/** Bento grid: mixed-size cards, each with a small live vignette of the product. */
export default function ProductShowcase() {
  const { t } = useLocale();

  return (
    <div className="mt-14 grid gap-4 sm:mt-16 lg:grid-cols-3">
      <BentoCard
        icon={Sparkles}
        tone="primary"
        title={t("product.tabPrompts")}
        description={t("app.prompts.subtitle")}
        className="lg:col-span-2"
      >
        <PromptLibraryDemo />
      </BentoCard>

      <BentoCard
        icon={Workflow}
        tone="orange"
        title={t("product.tabWorkflows")}
        description={t("demo.workflowBody")}
        delay={0.06}
      >
        <WorkflowsDemo />
      </BentoCard>

      <BentoCard
        icon={Bot}
        tone="violet"
        title={t("product.tabEmployees")}
        description={t("demo.employeesBody")}
        delay={0.04}
      >
        <EmployeesDemo />
      </BentoCard>

      <BentoCard
        icon={Mail}
        tone="cyan"
        title={`${t("app.dashboard.serviceGmail")} · ${t("app.dashboard.serviceCalendar")}`}
        description={t("app.mail.subtitle")}
        className="lg:col-span-2"
        delay={0.1}
      >
        <AssistantDemo />
      </BentoCard>
    </div>
  );
}
