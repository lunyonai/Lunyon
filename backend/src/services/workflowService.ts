import { computeNextRun, type WorkflowSchedule } from "../lib/schedule.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertOwnedEmployee } from "./employeeService.js";

export const WORKFLOW_TRIGGERS = ["manual", "schedule"] as const;
export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];

export const WORKFLOW_STEP_TYPES = [
  "run_employee",
  "run_prompt",
  "gmail.read_recent",
  "calendar.read_today",
] as const;

export type WorkflowStep = {
  id: string;
  type: (typeof WORKFLOW_STEP_TYPES)[number];
  employeeId?: string | null;
  params?: Record<string, string | number | boolean | null>;
};

export type WorkflowPublic = {
  id: string;
  title: string;
  description: string | null;
  trigger: WorkflowTrigger;
  schedule: WorkflowSchedule | null;
  steps: WorkflowStep[];
  employeeId: string | null;
  status: "active" | "inactive";
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: "succeeded" | "failed" | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRow = {
  id: string;
  user_id: string;
  employee_id: string | null;
  title: string;
  description: string | null;
  trigger: string;
  steps: unknown;
  status: "active" | "inactive";
  schedule?: unknown;
  next_run_at?: string | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
  created_at: string;
  updated_at: string;
};

type WorkflowInput = {
  title: string;
  description?: string | null;
  trigger?: WorkflowTrigger;
  schedule?: WorkflowSchedule | null;
  steps: WorkflowStep[];
  employeeId?: string | null;
  status?: "active" | "inactive";
};

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Workflows are not available yet", 503, "WORKFLOWS_NOT_READY");
  }
  throw new AppError("Could not complete this request", 400);
}

function parseSteps(value: unknown): WorkflowStep[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(WORKFLOW_STEP_TYPES);
  const steps: WorkflowStep[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.type !== "string") continue;
    if (!allowed.has(record.type)) continue;
    const params =
      record.params && typeof record.params === "object" && !Array.isArray(record.params)
        ? (record.params as Record<string, string | number | boolean | null>)
        : {};
    steps.push({
      id: record.id,
      type: record.type as WorkflowStep["type"],
      employeeId: typeof record.employeeId === "string" ? record.employeeId : null,
      params,
    });
  }
  return steps;
}

export function parseSchedule(value: unknown): WorkflowSchedule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const frequency = record.frequency;
  if (frequency !== "daily" && frequency !== "weekdays" && frequency !== "weekly") return null;
  if (typeof record.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return null;
  const locale = record.locale === "pt" || record.locale === "es" ? record.locale : "en";
  return {
    frequency,
    time: record.time,
    weekday:
      typeof record.weekday === "number" && record.weekday >= 0 && record.weekday <= 6
        ? record.weekday
        : undefined,
    timezone: typeof record.timezone === "string" ? record.timezone : "UTC",
    locale,
  };
}

export function toPublicWorkflow(row: WorkflowRow): WorkflowPublic {
  const schedule = parseSchedule(row.schedule);
  const trigger: WorkflowTrigger = row.trigger === "schedule" && schedule ? "schedule" : "manual";
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    trigger,
    schedule,
    steps: parseSteps(row.steps),
    employeeId: row.employee_id,
    status: row.status === "active" ? "active" : "inactive",
    nextRunAt: trigger === "schedule" ? (row.next_run_at ?? null) : null,
    lastRunAt: row.last_run_at ?? null,
    lastRunStatus:
      row.last_run_status === "succeeded" || row.last_run_status === "failed"
        ? row.last_run_status
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveEmployeeId(userId: string, employeeId: string | null | undefined) {
  if (!employeeId) return null;
  await assertOwnedEmployee(userId, employeeId);
  return employeeId;
}

/**
 * Trigger columns for an insert/update. The scheduling columns are only written when a
 * schedule is involved, so manual workflows keep working before the runtime migration.
 */
function triggerColumns(
  trigger: WorkflowTrigger,
  schedule: WorkflowSchedule | null | undefined,
  previousTrigger?: string,
) {
  if (trigger === "schedule") {
    if (!schedule) throw new AppError("A schedule is required for scheduled workflows", 400);
    return {
      trigger,
      schedule,
      next_run_at: computeNextRun(schedule, new Date()).toISOString(),
    };
  }
  if (previousTrigger === "schedule") {
    return { trigger, schedule: null, next_run_at: null };
  }
  return { trigger };
}

export async function listWorkflows(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) dbError(error);
  return ((data ?? []) as WorkflowRow[]).map(toPublicWorkflow);
}

export async function getWorkflowRow(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) dbError(error);
  if (!data) throw new AppError("Workflow not found", 404);
  return data as WorkflowRow;
}

export async function getWorkflow(userId: string, id: string) {
  return toPublicWorkflow(await getWorkflowRow(userId, id));
}

export async function createWorkflow(userId: string, input: WorkflowInput) {
  const employeeId = await resolveEmployeeId(userId, input.employeeId);
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .insert({
      user_id: userId,
      employee_id: employeeId,
      title: input.title,
      description: input.description ?? null,
      ...triggerColumns(input.trigger ?? "manual", input.schedule),
      steps: input.steps,
      status: input.status ?? "inactive",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublicWorkflow(data as WorkflowRow);
}

export async function updateWorkflow(userId: string, id: string, patch: Partial<WorkflowInput>) {
  const current = await getWorkflowRow(userId, id);
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.steps !== undefined) payload.steps = patch.steps;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.employeeId !== undefined) {
    payload.employee_id = await resolveEmployeeId(userId, patch.employeeId);
  }

  const currentTrigger = toPublicWorkflow(current).trigger;
  const nextTrigger = patch.trigger ?? currentTrigger;
  // Recompute the next run whenever the trigger, schedule or status changes so a workflow
  // re-activated after days does not fire immediately for a missed slot.
  if (patch.trigger !== undefined || patch.schedule !== undefined || patch.status !== undefined) {
    if (nextTrigger === "schedule" || currentTrigger === "schedule") {
      Object.assign(
        payload,
        triggerColumns(
          nextTrigger,
          patch.schedule === undefined ? parseSchedule(current.schedule) : patch.schedule,
          current.trigger,
        ),
      );
    } else if (patch.trigger !== undefined) {
      payload.trigger = nextTrigger;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("workflows")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublicWorkflow(data as WorkflowRow);
}

export async function deleteWorkflow(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) dbError(error);
  if (!data) throw new AppError("Workflow not found", 404);
}

export async function duplicateWorkflow(userId: string, id: string, title: string) {
  const source = await getWorkflow(userId, id);
  return createWorkflow(userId, {
    title,
    description: source.description,
    trigger: source.trigger,
    schedule: source.schedule,
    steps: source.steps,
    employeeId: source.employeeId,
    // A scheduled copy starts inactive so the same slot does not fire twice by surprise.
    status: source.trigger === "schedule" ? "inactive" : source.status,
  });
}
