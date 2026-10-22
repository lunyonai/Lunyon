import {
  Bot,
  Mail,
  MessageSquareText,
  Send,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "../../components/ui/Badge";
import type { TileTone } from "../../components/ui/IconTile";
import type { Employee, EmployeeIcon } from "./employeeTypes";

/**
 * Identity color per employee type. `color`/`background` mirror IconTile's tone classes for
 * markup that builds its own tile; prefer `<IconTile tone={entry.tone}>` in new code.
 */
export const employeeIconMap: Record<
  EmployeeIcon,
  { icon: LucideIcon; tone: TileTone; color: string; background: string }
> = {
  mail: {
    icon: Mail,
    tone: "rose",
    color: "text-tint-rose",
    background: "bg-gradient-to-br from-tint-rose/20 to-tint-rose/5 ring-1 ring-inset ring-tint-rose/20",
  },
  message: {
    icon: MessageSquareText,
    tone: "primary",
    color: "text-primary-text",
    background: "bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-inset ring-primary/20",
  },
  send: {
    icon: Send,
    tone: "cyan",
    color: "text-tint-cyan",
    background: "bg-gradient-to-br from-tint-cyan/20 to-tint-cyan/5 ring-1 ring-inset ring-tint-cyan/20",
  },
  workflow: {
    icon: Workflow,
    tone: "orange",
    color: "text-tint-orange",
    background: "bg-gradient-to-br from-tint-orange/20 to-tint-orange/5 ring-1 ring-inset ring-tint-orange/20",
  },
  bot: {
    icon: Bot,
    tone: "violet",
    color: "text-tint-violet",
    background: "bg-gradient-to-br from-tint-violet/20 to-tint-violet/5 ring-1 ring-inset ring-tint-violet/20",
  },
};

export function resolveEmployeeCopy(
  employee: Employee,
  t: (path: string, vars?: Record<string, string | number>) => string,
) {
  const kind = employee.kind === "custom" ? "custom" : employee.kind;
  return {
    name:
      employee.name?.trim() ||
      (kind === "custom" ? t("app.employees.untitled") : t(`app.employees.${kind}Name`)),
    role:
      employee.role?.trim() ||
      (kind === "custom" ? t("app.employees.customRole") : t(`app.employees.${kind}Role`)),
    description:
      employee.description?.trim() ||
      (kind === "custom"
        ? t("app.employees.customDescription")
        : t(`app.employees.${kind}Description`)),
    purpose:
      employee.purpose?.trim() ||
      (kind === "custom" ? "" : t(`app.employees.${kind}Purpose`)),
    instructions:
      employee.instructions?.trim() ||
      (kind === "custom" ? "" : t(`app.employees.${kind}Instructions`)),
  };
}

export function statusClass(status: Employee["status"]) {
  return status === "paused"
    ? "border border-warning/25 bg-warning/10 text-warning-text"
    : "border border-success/25 bg-success/10 text-success-text";
}

/** Badge tone for an employee status (use with `<Badge tone dot>`). */
export function statusTone(status: Employee["status"]): Tone {
  return status === "paused" ? "warning" : "success";
}
