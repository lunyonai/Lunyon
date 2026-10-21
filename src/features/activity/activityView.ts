import type { ActivityRecord } from "../../lib/api";

type Translate = (path: string, vars?: Record<string, string | number>) => string;

const PROMPT_IDS = new Set(["followUp", "notes", "weekly"]);

/** Localized title; `name` overrides the stored subject with the current employee/workflow name. */
export function activityTitle(item: ActivityRecord, t: Translate, name?: string | null) {
  const subject = name?.trim() || item.subject;
  if (item.type === "prompt") {
    const title =
      item.refId && PROMPT_IDS.has(item.refId) ? t(`app.prompts.${item.refId}Title`) : subject;
    return t("app.prompts.activityTitle", { title });
  }
  if (item.type === "employee") {
    return t("app.employees.activityTitle", { name: subject });
  }
  return item.status === "failed"
    ? t("app.workflows.activityFailed", { title: subject })
    : t("app.workflows.activityTitle", { title: subject });
}

export function relativeTime(value: string | Date, justNow: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();

  if (diff < 60000) return justNow;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;

  return `${Math.floor(diff / 86400000)}d`;
}

export function formatDuration(ms: number | null | undefined) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}
