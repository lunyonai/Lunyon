import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Badge } from "../../../components/ui/Badge";
import { cardClass, cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";

const stepKeys = ["inbox", "summarize", "draftReply", "complete"] as const;
const finalActiveIndex = 2;
const finalProgressPercent = ((finalActiveIndex + 0.55) / stepKeys.length) * 100;

export default function WorkflowPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLocale();
  const steps = stepKeys.map((key) => t(`demo.${key}`));

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setActiveIndex(1), 700),
      window.setTimeout(() => setActiveIndex(2), 1400),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const progressPercent =
    activeIndex >= finalActiveIndex
      ? finalProgressPercent
      : ((activeIndex + 0.35) / steps.length) * 100;

  return (
    <div className={cx(cardClass, "p-4")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-fg">{t("demo.inboxTriage")}</p>
        <Badge tone="primary">{t("demo.running")}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <div key={step} className="flex items-center gap-1.5">
              <motion.span
                animate={{
                  opacity: isActive || isDone ? 1 : 0.7,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cx(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  isActive
                    ? "bg-primary/10 text-primary-text"
                    : isDone
                      ? "text-fg"
                      : "text-fg-subtle",
                )}
              >
                {step}
              </motion.span>

              {index < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-fg-placeholder" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "8%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
