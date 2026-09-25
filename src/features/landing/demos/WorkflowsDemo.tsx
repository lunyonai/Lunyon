import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocale } from "../../../i18n/LocaleProvider";

const stepKeys = ["inbox", "summarize", "draftReply", "followUp"] as const;
const finalIndex = 2;

export default function WorkflowsDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLocale();
  const steps = stepKeys.map((key) => t(`demo.${key}`));

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setActiveIndex(1), 600),
      window.setTimeout(() => setActiveIndex(2), 1200),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const progress =
    activeIndex >= finalIndex
      ? ((finalIndex + 0.55) / steps.length) * 100
      : ((activeIndex + 0.35) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--lunyo-text)]">
          {t("demo.inboxTriage")}
        </p>
        <span
          className="rounded-md border border-[var(--lunyo-primary)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--lunyo-primary)]"
          style={{ backgroundColor: "var(--lunyo-primary-soft)" }}
        >
          {t("demo.running")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          return (
            <div key={step} className="flex items-center gap-1.5">
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  isActive
                    ? "bg-[var(--lunyo-primary-soft)] text-[var(--lunyo-primary)]"
                    : isDone
                      ? "text-[var(--lunyo-text)]/85"
                      : "text-[var(--lunyo-text-muted)]"
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-slate-600" aria-hidden />
              )}
            </div>
          );
        })}
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-[var(--lunyo-primary)]/70"
          initial={{ width: "8%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <p className="text-xs leading-5 text-[var(--lunyo-text-muted)]">
        {t("demo.workflowBody")}
      </p>
    </div>
  );
}
