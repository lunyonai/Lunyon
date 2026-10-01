export const AVAILABLE_TRIGGERS = ["manual"] as const;

export const UPCOMING_TRIGGERS = [
  "schedule",
  "email_received",
  "employee_task",
  "prompt_generated",
] as const;

export type WorkflowTrigger = "manual";

export const AVAILABLE_STEPS = ["run_prompt", "run_employee"] as const;

export const UPCOMING_STEPS = [
  "send_email",
  "gmail.read_recent",
  "calendar.read_today",
] as const;

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
  steps: WorkflowStep[];
  employeeId: string | null;
  status: WorkflowStatus;
};

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
  steps?: WorkflowStep[];
  employeeId?: string | null;
  status?: string;
}): Workflow {
  return {
    id: raw.id,
    title: raw.title ?? null,
    description: raw.description ?? null,
    trigger: "manual",
    steps: (raw.steps ?? []).filter((step): step is WorkflowStep =>
      persistableSteps.has(step.type as WorkflowStepType),
    ),
    employeeId: raw.employeeId ?? null,
    status: raw.status === "active" ? "active" : "inactive",
  };
}
