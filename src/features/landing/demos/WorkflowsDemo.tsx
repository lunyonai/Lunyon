import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";

const stepKeys = ["inbox", "summarize", "draftReply", "followUp"] as const;
/** One extra tick shows the run as complete before it loops. */
const TICKS = stepKeys.length + 1;

export default function WorkflowsDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLocale();

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % (TICKS + 1));
    }, 1300);
    return () => window.clearInterval(id);
  }, []);

  const done = activeIndex >= stepKeys.length;
  const progress = Math.min(100, ((activeIndex + (done ? 0 : 0.5)) / stepKeys.length) * 100);

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-fg">{t("demo.inboxTriage")}</p>
        <span
          className={cx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
            done ? "border-success/25 bg-success/10 text-success-text" : "border-primary/25 bg-primary/10 text-primary-text",
          )}
        >
          <span className={cx("h-1.5 w-1.5 rounded-full", done ? "bg-success" : "bg-primary-text")} aria-hidden="true" />
          {t("demo.running")}
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-3">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-tint-violet"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="relative mt-4 space-y-1">
        <span className="absolute bottom-4 left-[15px] top-4 w-px bg-line" aria-hidden="true" />
        {stepKeys.map((key, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <li
              key={key}
              className={cx(
                "relative flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                isActive && "bg-surface-2/80",
              )}
            >
              <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-canvas">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-success-text" aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-text motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 text-fg-subtle/60" aria-hidden="true" />
                )}
              </span>
              <span className={cx("text-sm", isDone || isActive ? "text-fg" : "text-fg-subtle")}>{t(`demo.${key}`)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
