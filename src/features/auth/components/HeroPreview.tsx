import { motion } from "framer-motion";
import ActivityItem from "./ActivityItem";
import PreviewMetric from "./PreviewMetric";
import TimeTrend from "./TimeTrend";
import WorkflowPreview from "./WorkflowPreview";
import { cardClass, cx } from "../../../components/ui/styles";
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
            <p className="text-sm font-semibold text-fg">{t("preview.workspace")}</p>
            <p className="mt-0.5 text-xs text-fg-subtle">{t("preview.today")}</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 shadow-card">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium text-fg-muted">{t("preview.working")}</span>
          </div>
        </motion.header>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.45, delay: 0.06, ease }}
          className={cx(cardClass, "p-5 sm:p-6")}
        >
          <p className="text-sm font-medium text-fg-muted">{t("preview.timeReclaimed")}</p>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease }}
            className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-fg"
          >
            1h 42m
          </motion.p>

          <p className="mt-1 text-xs text-success-text">{t("preview.vsYesterday")}</p>

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
            <motion.div key={metric.label} variants={fadeUp} transition={{ duration: 0.35, ease }}>
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
          <section className={cx(cardClass, "p-4 xl:col-span-3")}>
            <p className="text-sm font-semibold text-fg">{t("preview.recentActivity")}</p>
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.38 },
                },
              }}
              className="mt-2 divide-y divide-line"
            >
              {recentActivity.map((item) => (
                <ActivityItem key={item.title} title={item.title} time={item.time} />
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
