import type { WorkflowSchedule } from "./workflowTypes";

type Translate = (path: string, vars?: Record<string, string | number>) => string;

export function scheduleLabel(schedule: WorkflowSchedule, t: Translate) {
  if (schedule.frequency === "weekly") {
    return t("app.workflows.scheduleSummary.weekly", {
      day: t(`app.workflows.weekday.d${schedule.weekday ?? 1}`),
      time: schedule.time,
    });
  }
  return t(`app.workflows.scheduleSummary.${schedule.frequency}`, { time: schedule.time });
}

export function formatDateTime(value: string, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
