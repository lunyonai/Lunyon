import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useLocale } from "../../i18n/LocaleProvider";

const ease = [0.22, 1, 0.36, 1] as const;

export default function ProductPreview() {
  const { t } = useLocale();

  const metrics = [
    { label: t("preview.tasksCompleted"), value: "14" },
    { label: t("preview.emailsHandled"), value: "8" },
    { label: t("preview.summariesCreated"), value: "3" },
  ];

  const activity = [
    { title: t("preview.weeklyReport"), time: "2m" },
    { title: t("preview.clientFollowUp"), time: "11m" },
    { title: t("preview.meetingNotes"), time: "28m" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28, ease }}
      className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-primary)]/25 p-5 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(11, 18, 32, 0.82)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--lunyo-text)]">
            {t("preview.workspace")}
          </p>
          <p className="mt-0.5 text-xs text-[var(--lunyo-text-muted)]">
            {t("preview.today")}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-md border border-[var(--lunyo-border)] px-2.5 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lunyo-primary)]/50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lunyo-primary)]" />
          </span>
          <span className="text-[11px] font-medium text-[var(--lunyo-text-muted)]">
            {t("preview.working")}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--lunyo-text-muted)]">
          {t("preview.timeReclaimed")}
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--lunyo-text)] sm:text-5xl">
          1h 42m
        </p>
        <p className="mt-2 text-xs text-[var(--lunyo-success)]/80">
          {t("preview.vsYesterday")}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] px-3 py-2.5"
            style={{ backgroundColor: "rgba(2, 6, 23, 0.65)" }}
          >
            <p className="text-[10px] text-[var(--lunyo-text-muted)]">
              {metric.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--lunyo-text)]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-1.5 border-t border-[var(--lunyo-border)] pt-4">
        {activity.map((item) => (
          <li
            key={item.title}
            className="flex items-center justify-between gap-3 py-1"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Check
                className="h-3.5 w-3.5 shrink-0 text-[var(--lunyo-success)]/80"
                strokeWidth={2.25}
                aria-hidden="true"
              />
              <p className="truncate text-sm text-[var(--lunyo-text)]/85">
                {item.title}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-[var(--lunyo-text-muted)]">
              {item.time}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
