import type { WorkflowSchedule } from "../../lib/api";

export type { WorkflowSchedule };

export const AVAILABLE_TRIGGERS = ["manual", "schedule"] as const;

export const UPCOMING_TRIGGERS = [
  "email_received",
  "employee_task",
  "prompt_generated",
] as const;

export type WorkflowTrigger = (typeof AVAILABLE_TRIGGERS)[number];

export const AVAILABLE_STEPS = [
  "gmail.read_recent",
  "calendar.read_today",
  "run_prompt",
  "run_employee",
] as const;

export const UPCOMING_STEPS = ["send_email"] as const;

export const PROMPT_TEMPLATE_IDS = ["followUp", "notes", "weekly"] as const;

export type WorkflowStepType =
  | "run_prompt"
  | "run_employee"
  | "gmail.read_recent"
  | "calendar.read_today";

export type WorkflowStatus = "active" | "inactive";

export type WorkflowStep = {
  id: string;
  type: WorkflowStepType;
  employeeId?: string | null;
  params?: Record<string, string | number | boolean | null>;
};

export type Workflow = {
  id: string;
  title: string | null;
  description: string | null;
  trigger: WorkflowTrigger;
  schedule: WorkflowSchedule | null;
  steps: WorkflowStep[];
  employeeId: string | null;
  status: WorkflowStatus;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: "succeeded" | "failed" | null;
};

export type WorkflowDraft = Omit<Workflow, "id" | "nextRunAt" | "lastRunAt" | "lastRunStatus">;

const persistableSteps = new Set<WorkflowStepType>([
  "run_prompt",
  "run_employee",
  "gmail.read_recent",
  "calendar.read_today",
]);

export function normalizeWorkflow(raw: {
  id: string;
  title?: string | null;
  description?: string | null;
  trigger?: string;
  schedule?: WorkflowSchedule | null;
  steps?: WorkflowStep[];
  employeeId?: string | null;
  status?: string;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
}): Workflow {
  const schedule = raw.schedule ?? null;
  return {
    id: raw.id,
    title: raw.title ?? null,
    description: raw.description ?? null,
    trigger: raw.trigger === "schedule" && schedule ? "schedule" : "manual",
    schedule,
    steps: (raw.steps ?? []).filter((step): step is WorkflowStep =>
      persistableSteps.has(step.type as WorkflowStepType),
    ),
    employeeId: raw.employeeId ?? null,
    status: raw.status === "active" ? "active" : "inactive",
    nextRunAt: raw.nextRunAt ?? null,
    lastRunAt: raw.lastRunAt ?? null,
    lastRunStatus:
      raw.lastRunStatus === "succeeded" || raw.lastRunStatus === "failed"
        ? raw.lastRunStatus
        : null,
  };
}
