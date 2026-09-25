import {
  Bot,
  Mail,
  MessageSquareText,
  Send,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Employee, EmployeeIcon } from "./employeeTypes";

export const employeeIconMap: Record<
  EmployeeIcon,
  { icon: LucideIcon; color: string; background: string }
> = {
  mail: {
    icon: Mail,
    color: "text-blue-400",
    background: "bg-blue-500/10",
  },
  message: {
    icon: MessageSquareText,
    color: "text-violet-400",
    background: "bg-violet-500/10",
  },
  send: {
    icon: Send,
    color: "text-amber-400",
    background: "bg-amber-500/10",
  },
  workflow: {
    icon: Workflow,
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
  },
  bot: {
    icon: Bot,
    color: "text-blue-400",
    background: "bg-blue-500/10",
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
    ? "bg-amber-500/10 text-amber-400"
    : "bg-emerald-500/10 text-emerald-400";
}
