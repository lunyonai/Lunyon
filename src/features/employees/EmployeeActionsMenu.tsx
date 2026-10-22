import { useEffect, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../i18n/LocaleProvider";
import ConfirmDialog from "../../components/ConfirmDialog";
import { IconButton } from "../../components/ui/Button";
import { cx, dangerMenuItemClass, menuItemClass, popoverClass } from "../../components/ui/styles";
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
      <IconButton
        size="sm"
        aria-label={t("app.employees.optionsFor", { name: copy.name })}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "group-hover:opacity-100 focus-visible:opacity-100",
          open ? "bg-surface-2 opacity-100" : "opacity-0",
        )}
      >
        <Ellipsis />
      </IconButton>

      {open && (
        <div
          role="menu"
          className={cx(popoverClass, "absolute right-0 z-20 mt-1 w-44")}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate(`/employees/${employee.id}`);
            }}
            className={menuItemClass}
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
            className={menuItemClass}
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
            className={menuItemClass}
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
            className={dangerMenuItemClass}
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
