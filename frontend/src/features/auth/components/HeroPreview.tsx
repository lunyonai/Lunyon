import { motion } from "framer-motion";
import ActivityItem from "./ActivityItem";
import PreviewMetric from "./PreviewMetric";
import TimeTrend from "./TimeTrend";
import WorkflowPreview from "./WorkflowPreview";
import { useLocale } from "../../../i18n/LocaleProvider";

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function HeroPreview() {
  const { t } = useLocale();
  const supportingMetrics = [
    { label: t("preview.tasksCompleted"), value: "14" },
    { label: t("preview.emailsHandled"), value: "8" },
    { label: t("preview.summariesCreated"), value: "3" },
  ];

  const recentActivity = [
    { title: t("preview.weeklyReport"), time: "2m" },
    { title: t("preview.clientFollowUp"), time: "11m" },
    { title: t("preview.meetingNotes"), time: "28m" },
    { title: t("preview.researchBrief"), time: "1h" },
  ];

  return (
    <div className="flex h-full w-full items-center overflow-hidden px-8 py-8 xl:px-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-medium text-[var(--lunyo-text)]">
              {t("preview.workspace")}
            </p>
            <p className="mt-0.5 text-xs text-[var(--lunyo-text-muted)]">
              {t("preview.today")}
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-md border border-[var(--lunyo-border)] px-2.5 py-1.5"
            style={{ backgroundColor: "var(--lunyo-surface)" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lunyo-primary)]/50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lunyo-primary)]" />
            </span>
            <span className="text-[11px] font-medium text-[var(--lunyo-text-muted)]">
              {t("preview.working")}
            </span>
          </div>
        </motion.header>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.06, ease }}
          className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] p-5"
          style={{ backgroundColor: "var(--lunyo-surface)" }}
        >
          <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--lunyo-text-muted)]">
            {t("preview.timeReclaimed")}
          </p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease }}
            className="mt-2 text-5xl font-semibold tracking-tight text-[var(--lunyo-text)] xl:text-6xl"
          >
            1h 42m
          </motion.p>

          <p className="mt-2 text-xs text-[var(--lunyo-success)]/80">
            {t("preview.vsYesterday")}
          </p>

          <TimeTrend />
        </motion.section>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.07, delayChildren: 0.22 },
            },
          }}
          className="grid grid-cols-3 gap-3"
        >
          {supportingMetrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={fadeUp}
              transition={{ duration: 0.35, ease }}
            >
              <PreviewMetric label={metric.label} value={metric.value} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.4, delay: 0.3, ease }}
          className="grid gap-3 xl:grid-cols-5"
        >
          <section
            className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] p-3.5 xl:col-span-3"
            style={{ backgroundColor: "var(--lunyo-surface)" }}
          >
            <p className="text-[11px] font-medium tracking-[0.06em] text-[var(--lunyo-text-muted)]">
              {t("preview.recentActivity")}
            </p>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.38 },
                },
              }}
              className="mt-2"
            >
              {recentActivity.map((item) => (
                <ActivityItem
                  key={item.title}
                  title={item.title}
                  time={item.time}
                />
              ))}
            </motion.ul>
          </section>

          <div className="xl:col-span-2">
            <WorkflowPreview />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
