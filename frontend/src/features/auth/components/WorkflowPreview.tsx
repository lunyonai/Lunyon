import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const steps = ["Inbox", "Summarize", "Draft reply", "Complete"] as const;
const finalActiveIndex = 2;
const finalProgressPercent = ((finalActiveIndex + 0.55) / steps.length) * 100;

export default function WorkflowPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

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
    <div
      className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] p-3.5"
      style={{ backgroundColor: "var(--lunyo-surface)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--lunyo-text)]/90">
          Inbox triage
        </p>
        <span
          className="rounded-md border border-[var(--lunyo-primary)]/20 px-2 py-0.5 text-[10px] font-medium text-[var(--lunyo-primary)]"
          style={{ backgroundColor: "var(--lunyo-primary-soft)" }}
        >
          Running
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <div key={step} className="flex items-center gap-1.5">
              <motion.span
                animate={{
                  opacity: isActive || isDone ? 1 : 0.55,
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                  isActive
                    ? "bg-[var(--lunyo-primary-soft)] text-[var(--lunyo-primary)]"
                    : isDone
                      ? "text-[var(--lunyo-text)]/85"
                      : "text-slate-600"
                }`}
              >
                {step}
              </motion.span>

              {index < steps.length - 1 && (
                <ArrowRight
                  className="h-3 w-3 text-slate-600"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full rounded-full bg-[var(--lunyo-primary)]/70"
          initial={{ width: "8%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
