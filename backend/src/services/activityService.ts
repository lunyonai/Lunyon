import { calendarYmd, zonedWallToIso } from "../lib/zonedTime.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export type ActivityType = "prompt" | "employee" | "workflow";
export type ActivityStatus = "succeeded" | "failed";

export type ActivityPublic = {
  id: string;
  type: ActivityType;
  refId: string | null;
  subject: string;
  detail: string | null;
  status: ActivityStatus;
  durationMs: number | null;
  createdAt: string;
};

type ActivityRow = {
  id: string;
  type: ActivityType;
  ref_id: string | null;
  subject: string;
  detail: string | null;
  status: ActivityStatus;
  duration_ms: number | null;
  created_at: string;
};

const DETAIL_MAX = 120;
const STATS_ROW_LIMIT = 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Activity is not available yet", 503, "ACTIVITY_NOT_READY");
  }
  throw new AppError("Could not complete this request", 400);
}

function toPublic(row: ActivityRow): ActivityPublic {
  return {
    id: row.id,
    type: row.type,
    refId: row.ref_id,
    subject: row.subject,
    detail: row.detail,
    status: row.status,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  };
}

/** Records a finished action. Never throws: activity must not break the action itself. */
export async function recordActivity(
  userId: string,
  event: {
    type: ActivityType;
    refId?: string | null;
    subject: string;
    detail?: string | null;
    status?: ActivityStatus;
    durationMs?: number | null;
  },
): Promise<ActivityPublic | null> {
  const detail = event.detail?.replace(/\s+/g, " ").trim().slice(0, DETAIL_MAX) || null;
  const { data, error } = await supabaseAdmin
    .from("activity_events")
    .insert({
      user_id: userId,
      type: event.type,
      ref_id: event.refId ?? null,
      subject: event.subject.slice(0, 200),
      detail,
      status: event.status ?? "succeeded",
      duration_ms: event.durationMs ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[lunyon-api] activity not recorded:", error.message);
    return null;
  }
  return toPublic(data as ActivityRow);
}

export async function listActivity(
  userId: string,
  options: { limit?: number; type?: ActivityType; refId?: string } = {},
) {
  let query = supabaseAdmin
    .from("activity_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(options.limit ?? 20, 1), 100));
  if (options.type) query = query.eq("type", options.type);
  if (options.refId) query = query.eq("ref_id", options.refId);
  const { data, error } = await query;
  if (error) dbError(error);
  return ((data ?? []) as ActivityRow[]).map(toPublic);
}

export type ActivityStats = {
  totals: Record<ActivityType, number>;
  today: number;
  week: number;
  workflowRunsWeek: number;
  workflowFailuresWeek: number;
  avgDurationMs: number | null;
  /** Successful runs per `${type}:${refId}`, all time. */
  byRef: Record<string, number>;
};

type StatsRow = Pick<ActivityRow, "type" | "ref_id" | "status" | "duration_ms" | "created_at">;

export function summarizeActivity(rows: StatsRow[], startOfToday: Date, now = new Date()): ActivityStats {
  const weekAgo = now.getTime() - 7 * DAY_MS;
  const monthAgo = now.getTime() - 30 * DAY_MS;
  const stats: ActivityStats = {
    totals: { prompt: 0, employee: 0, workflow: 0 },
    today: 0,
    week: 0,
    workflowRunsWeek: 0,
    workflowFailuresWeek: 0,
    avgDurationMs: null,
    byRef: {},
  };
  let durationSum = 0;
  let durationCount = 0;

  for (const row of rows) {
    const at = new Date(row.created_at).getTime();
    const recentWeek = at >= weekAgo;
    if (row.type === "workflow" && recentWeek) {
      stats.workflowRunsWeek += 1;
      if (row.status === "failed") stats.workflowFailuresWeek += 1;
    }
    if (row.status !== "succeeded") continue;

    stats.totals[row.type] += 1;
    if (row.ref_id) {
      const key = `${row.type}:${row.ref_id}`;
      stats.byRef[key] = (stats.byRef[key] ?? 0) + 1;
    }
    if (at >= startOfToday.getTime()) stats.today += 1;
    if (recentWeek) stats.week += 1;
    if (at >= monthAgo && typeof row.duration_ms === "number") {
      durationSum += row.duration_ms;
      durationCount += 1;
    }
  }

  if (durationCount > 0) stats.avgDurationMs = Math.round(durationSum / durationCount);
  return stats;
}

export async function getActivityStats(userId: string, timezone: string) {
  const { data, error } = await supabaseAdmin
    .from("activity_events")
    .select("type, ref_id, status, duration_ms, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(STATS_ROW_LIMIT);
  if (error) dbError(error);

  const now = new Date();
  const startOfToday = new Date(zonedWallToIso(calendarYmd(now, timezone), "00:00:00", timezone));
  return summarizeActivity((data ?? []) as StatsRow[], startOfToday, now);
}
