import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";

export const EMPLOYEE_KINDS = [
  "email",
  "meeting",
  "content",
  "workflow",
  "analyst",
  "custom",
] as const;

export const EMPLOYEE_ICONS = [
  "mail",
  "message",
  "send",
  "workflow",
  "bot",
] as const;

export const EMPLOYEE_CAPABILITIES = [
  "run_task",
  "run_prompt",
  "run_workflow",
  "gmail.read",
  "calendar.read",
] as const;

export const KIND_DEFAULT_ICON: Record<(typeof EMPLOYEE_KINDS)[number], (typeof EMPLOYEE_ICONS)[number]> =
  {
    email: "mail",
    meeting: "message",
    content: "send",
    workflow: "workflow",
    analyst: "workflow",
    custom: "bot",
  };

export type EmployeeRow = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  description: string | null;
  purpose: string | null;
  instructions: string | null;
  kind: (typeof EMPLOYEE_KINDS)[number];
  icon: string | null;
  status: "active" | "paused";
  capabilities: unknown;
  config: unknown;
  created_at: string;
  updated_at: string;
};

export type EmployeePublic = {
  id: string;
  kind: (typeof EMPLOYEE_KINDS)[number];
  icon: (typeof EMPLOYEE_ICONS)[number];
  name: string;
  role: string;
  description: string | null;
  purpose: string | null;
  instructions: string | null;
  capabilities: string[];
  workflowIds: string[];
  status: "active" | "paused";
  extra: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

type EmployeeConfig = {
  extra?: Record<string, string>;
  workflowIds?: string[];
};

function dbError(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("Employees are not available yet", 503);
  }
  throw new AppError("Could not complete this request", 400);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asExtra(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const extra: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") extra[key] = item;
  }
  return extra;
}

function parseConfig(value: unknown): EmployeeConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    extra: asExtra(record.extra),
    workflowIds: asStringArray(record.workflowIds),
  };
}

function iconOrDefault(
  kind: (typeof EMPLOYEE_KINDS)[number],
  icon: string | null | undefined,
): (typeof EMPLOYEE_ICONS)[number] {
  if (icon && (EMPLOYEE_ICONS as readonly string[]).includes(icon)) {
    return icon as (typeof EMPLOYEE_ICONS)[number];
  }
  return KIND_DEFAULT_ICON[kind];
}

export function toPublicEmployee(row: EmployeeRow): EmployeePublic {
  const config = parseConfig(row.config);
  const kind = (EMPLOYEE_KINDS as readonly string[]).includes(row.kind)
    ? row.kind
    : "custom";
  return {
    id: row.id,
    kind,
    icon: iconOrDefault(kind, row.icon),
    name: row.name,
    role: row.role,
    description: row.description,
    purpose: row.purpose,
    instructions: row.instructions,
    capabilities: asStringArray(row.capabilities).filter((item) =>
      (EMPLOYEE_CAPABILITIES as readonly string[]).includes(item),
    ),
    workflowIds: config.workflowIds ?? [],
    status: row.status === "paused" ? "paused" : "active",
    extra: config.extra ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildConfig(params: {
  extra?: Record<string, string>;
  workflowIds?: string[];
  existing?: unknown;
}): EmployeeConfig {
  const current = parseConfig(params.existing);
  return {
    extra: params.extra ?? current.extra ?? {},
    workflowIds: params.workflowIds ?? current.workflowIds ?? [],
  };
}

export async function listEmployees(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("ai_employees")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) dbError(error);
  return ((data ?? []) as EmployeeRow[]).map(toPublicEmployee);
}

export async function getEmployee(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("ai_employees")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) dbError(error);
  if (!data) throw new AppError("Employee not found", 404);
  return toPublicEmployee(data as EmployeeRow);
}

export async function assertOwnedEmployee(userId: string, employeeId: string) {
  try {
    await getEmployee(userId, employeeId);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      throw new AppError("Employee not found", 400);
    }
    throw err;
  }
}

export async function createEmployee(
  userId: string,
  input: {
    name: string;
    role: string;
    description?: string | null;
    purpose?: string | null;
    instructions?: string | null;
    kind: (typeof EMPLOYEE_KINDS)[number];
    icon?: (typeof EMPLOYEE_ICONS)[number];
    status?: "active" | "paused";
    capabilities?: string[];
    extra?: Record<string, string>;
    workflowIds?: string[];
  },
) {
  const kind = input.kind;
  const { data, error } = await supabaseAdmin
    .from("ai_employees")
    .insert({
      user_id: userId,
      name: input.name,
      role: input.role,
      description: input.description ?? null,
      purpose: input.purpose ?? null,
      instructions: input.instructions ?? null,
      kind,
      icon: input.icon ?? KIND_DEFAULT_ICON[kind],
      status: input.status ?? "active",
      capabilities: input.capabilities ?? ["run_task"],
      config: buildConfig({
        extra: input.extra ?? {},
        workflowIds: input.workflowIds ?? [],
      }),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublicEmployee(data as EmployeeRow);
}

export async function updateEmployee(
  userId: string,
  id: string,
  patch: {
    name?: string;
    role?: string;
    description?: string | null;
    purpose?: string | null;
    instructions?: string | null;
    kind?: (typeof EMPLOYEE_KINDS)[number];
    icon?: (typeof EMPLOYEE_ICONS)[number];
    status?: "active" | "paused";
    capabilities?: string[];
    extra?: Record<string, string>;
    workflowIds?: string[];
  },
) {
  const { data: existing, error: loadError } = await supabaseAdmin
    .from("ai_employees")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (loadError) dbError(loadError);
  if (!existing) throw new AppError("Employee not found", 404);

  const row = existing as EmployeeRow;
  const nextKind = patch.kind ?? row.kind;
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.purpose !== undefined) payload.purpose = patch.purpose;
  if (patch.instructions !== undefined) payload.instructions = patch.instructions;
  if (patch.kind !== undefined) payload.kind = patch.kind;
  if (patch.icon !== undefined) payload.icon = patch.icon;
  else if (patch.kind) payload.icon = KIND_DEFAULT_ICON[nextKind];
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.capabilities !== undefined) payload.capabilities = patch.capabilities;
  if (patch.extra !== undefined || patch.workflowIds !== undefined) {
    payload.config = buildConfig({
      extra: patch.extra,
      workflowIds: patch.workflowIds,
      existing: row.config,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("ai_employees")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) dbError(error);
  return toPublicEmployee(data as EmployeeRow);
}

export async function deleteEmployee(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("ai_employees")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) dbError(error);
  if (!data) throw new AppError("Employee not found", 404);
}

export async function duplicateEmployee(
  userId: string,
  id: string,
  name: string,
) {
  const source = await getEmployee(userId, id);
  return createEmployee(userId, {
    name,
    role: source.role,
    description: source.description,
    purpose: source.purpose,
    instructions: source.instructions,
    kind: source.kind,
    icon: source.icon,
    status: source.status,
    capabilities: source.capabilities,
    extra: source.extra,
    workflowIds: [],
  });
}
