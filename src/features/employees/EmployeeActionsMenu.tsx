import { useEffect, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../i18n/LocaleProvider";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useEmployees } from "./EmployeesContext";
import type { Employee } from "./employeeTypes";
import { resolveEmployeeCopy } from "./employeeView";

type EmployeeActionsMenuProps = {
  employee: Employee;
};

export default function EmployeeActionsMenu({ employee }: EmployeeActionsMenuProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { duplicateEmployee, setStatus, deleteEmployee } = useEmployees();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const copy = resolveEmployeeCopy(employee, t);
  const linked = employee.workflowIds.length;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (!open) return;
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("app.employees.optionsFor", { name: copy.name })}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100"
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate(`/employees/${employee.id}`);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {t("app.employees.menuConfigure")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void duplicateEmployee(employee.id, copy.name, t("app.common.copySuffix"));
              setOpen(false);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {t("app.employees.menuDuplicate")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void setStatus(employee.id, employee.status === "active" ? "paused" : "active");
              setOpen(false);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {employee.status === "active"
              ? t("app.employees.menuPause")
              : t("app.employees.menuActivate")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmDelete(true);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-900"
          >
            {t("app.employees.menuDelete")}
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t("app.employees.deleteTitle")}
          body={
            linked
              ? t("app.employees.deleteBodyLinked", { count: linked })
              : t("app.employees.deleteBody")
          }
          confirmLabel={t("app.common.delete")}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void deleteEmployee(employee.id);
            setConfirmDelete(false);
          }}
        />
      )}
    </div>
  );
}
