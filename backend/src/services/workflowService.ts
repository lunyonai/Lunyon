import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import { assertOwnedEmployee } from "./employeeService.js";

export const WORKFLOW_TRIGGERS = ["manual"] as const;

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
  trigger: "manual";
  steps: WorkflowStep[];
  employeeId: string | null;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

type WorkflowRow = {
  id: string;
  user_id: string;
  employee_id: string | null;
  title: string;
  description: string | null;
  trigger: string;
  steps: unknown;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Workflows are not available yet", 503);
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

function toPublic(row: WorkflowRow): WorkflowPublic {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    trigger: "manual",
    steps: parseSteps(row.steps),
    employeeId: row.employee_id,
    status: row.status === "active" ? "active" : "inactive",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveEmployeeId(userId: string, employeeId: string | null | undefined) {
  if (!employeeId) return null;
  await assertOwnedEmployee(userId, employeeId);
  return employeeId;
}

export async function listWorkflows(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) dbError(error);
  return ((data ?? []) as WorkflowRow[]).map(toPublic);
}

export async function getWorkflow(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) dbError(error);
  if (!data) throw new AppError("Workflow not found", 404);
  return toPublic(data as WorkflowRow);
}

export async function createWorkflow(
  userId: string,
  input: {
    title: string;
    description?: string | null;
    trigger?: "manual";
    steps: WorkflowStep[];
    employeeId?: string | null;
    status?: "active" | "inactive";
  },
) {
  const employeeId = await resolveEmployeeId(userId, input.employeeId);
  const { data, error } = await supabaseAdmin
    .from("workflows")
    .insert({
      user_id: userId,
      employee_id: employeeId,
      title: input.title,
      description: input.description ?? null,
      trigger: "manual",
      steps: input.steps,
      status: input.status ?? "inactive",
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublic(data as WorkflowRow);
}

export async function updateWorkflow(
  userId: string,
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    trigger?: "manual";
    steps?: WorkflowStep[];
    employeeId?: string | null;
    status?: "active" | "inactive";
  },
) {
  await getWorkflow(userId, id);
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.trigger !== undefined) payload.trigger = "manual";
  if (patch.steps !== undefined) payload.steps = patch.steps;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.employeeId !== undefined) {
    payload.employee_id = await resolveEmployeeId(userId, patch.employeeId);
  }

  const { data, error } = await supabaseAdmin
    .from("workflows")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublic(data as WorkflowRow);
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
    trigger: "manual",
    steps: source.steps,
    employeeId: source.employeeId,
    status: source.status,
  });
}
