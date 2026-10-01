export const EMPLOYEE_KINDS = [
  "email",
  "meeting",
  "content",
  "workflow",
  "analyst",
  "custom",
] as const;

export type EmployeeKind = (typeof EMPLOYEE_KINDS)[number];

export const EMPLOYEE_ICONS = [
  "mail",
  "message",
  "send",
  "workflow",
  "bot",
] as const;

export type EmployeeIcon = (typeof EMPLOYEE_ICONS)[number];

export const AVAILABLE_CAPABILITIES = ["run_task", "run_prompt", "run_workflow"] as const;

export const UPCOMING_CAPABILITIES = ["gmail.read", "calendar.read"] as const;

export type CapabilityId =
  | (typeof AVAILABLE_CAPABILITIES)[number]
  | (typeof UPCOMING_CAPABILITIES)[number];

export type EmployeeStatus = "active" | "paused";

export type Employee = {
  id: string;
  kind: EmployeeKind;
  icon: EmployeeIcon;
  name: string | null;
  role: string | null;
  description: string | null;
  purpose: string | null;
  instructions: string | null;
  capabilities: CapabilityId[];
  workflowIds: string[];
  status: EmployeeStatus;
  extra: Record<string, string>;
};

export const KIND_DEFAULT_ICON: Record<EmployeeKind, EmployeeIcon> = {
  email: "mail",
  meeting: "message",
  content: "send",
  workflow: "workflow",
  analyst: "workflow",
  custom: "bot",
};

export const extraFieldCatalog: Record<
  EmployeeKind,
  { key: string; labelKey: string }[]
> = {
  email: [
    { key: "tone", labelKey: "app.employees.extraTone" },
    { key: "replyStyle", labelKey: "app.employees.extraReply" },
    { key: "signature", labelKey: "app.employees.extraSignature" },
    { key: "escalation", labelKey: "app.employees.extraEscalation" },
  ],
  meeting: [
    { key: "summaryFormat", labelKey: "app.employees.extraSummary" },
    { key: "extractActionItems", labelKey: "app.employees.extraActions" },
    { key: "decisions", labelKey: "app.employees.extraDecisions" },
  ],
  content: [
    { key: "tone", labelKey: "app.employees.extraWritingTone" },
    { key: "targetAudience", labelKey: "app.employees.extraAudience" },
    { key: "format", labelKey: "app.employees.extraFormat" },
    { key: "guidelines", labelKey: "app.employees.extraGuidelines" },
  ],
  workflow: [
    { key: "execution", labelKey: "app.employees.extraExecution" },
    { key: "failure", labelKey: "app.employees.extraFailure" },
    { key: "approval", labelKey: "app.employees.extraApproval" },
  ],
  analyst: [
    { key: "execution", labelKey: "app.employees.extraExecution" },
    { key: "failure", labelKey: "app.employees.extraFailure" },
    { key: "approval", labelKey: "app.employees.extraApproval" },
  ],
  custom: [],
};

const capabilitySet = new Set<string>([
  ...AVAILABLE_CAPABILITIES,
  ...UPCOMING_CAPABILITIES,
]);

export function normalizeEmployee(raw: {
  id: string;
  kind: string;
  icon?: string;
  name?: string | null;
  role?: string | null;
  description?: string | null;
  purpose?: string | null;
  instructions?: string | null;
  capabilities?: string[];
  workflowIds?: string[];
  status?: string;
  extra?: Record<string, string>;
}): Employee {
  const kind = (EMPLOYEE_KINDS as readonly string[]).includes(raw.kind)
    ? (raw.kind as EmployeeKind)
    : "custom";
  const icon =
    raw.icon && (EMPLOYEE_ICONS as readonly string[]).includes(raw.icon)
      ? (raw.icon as EmployeeIcon)
      : KIND_DEFAULT_ICON[kind];

  return {
    id: raw.id,
    kind,
    icon,
    name: raw.name ?? null,
    role: raw.role ?? null,
    description: raw.description ?? null,
    purpose: raw.purpose ?? null,
    instructions: raw.instructions ?? null,
    capabilities: (raw.capabilities ?? []).filter((item): item is CapabilityId =>
      capabilitySet.has(item),
    ),
    workflowIds: raw.workflowIds ?? [],
    status: raw.status === "paused" ? "paused" : "active",
    extra: raw.extra ?? {},
  };
}
