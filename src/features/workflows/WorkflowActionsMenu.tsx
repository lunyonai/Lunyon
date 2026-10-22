import { useEffect, useRef, useState } from "react";
import { Copy, Ellipsis, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import ConfirmDialog from "../../components/ConfirmDialog";
import { IconButton } from "../../components/ui/Button";
import { cx, dangerMenuItemClass, menuItemClass, popoverClass } from "../../components/ui/styles";
import { useWorkflows } from "./WorkflowsContext";
import type { Workflow } from "./workflowTypes";

type WorkflowActionsMenuProps = {
  workflow: Workflow;
  title: string;
  onEdit: () => void;
};

export default function WorkflowActionsMenu({
  workflow,
  title,
  onEdit,
}: WorkflowActionsMenuProps) {
  const { t } = useLocale();
  const { duplicateWorkflow, setStatus, deleteWorkflow } = useWorkflows();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const active = workflow.status === "active";

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        aria-label={t("app.workflows.moreAria", { title })}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={open ? "bg-surface-2" : undefined}
      >
        <Ellipsis />
      </IconButton>

      {open && (
        <div role="menu" className={cx(popoverClass, "absolute right-0 z-20 mt-1 w-44")}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className={menuItemClass}
          >
            <Pencil aria-hidden="true" />
            {t("app.workflows.menuEdit")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void duplicateWorkflow(workflow.id, `${title}${t("app.common.copySuffix")}`);
              setOpen(false);
            }}
            className={menuItemClass}
          >
            <Copy aria-hidden="true" />
            {t("app.workflows.menuDuplicate")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void setStatus(workflow.id, active ? "inactive" : "active");
              setOpen(false);
            }}
            className={menuItemClass}
          >
            {active ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {active ? t("app.workflows.menuDeactivate") : t("app.workflows.menuActivate")}
          </button>
          <div className="my-1 border-t border-line" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmDelete(true);
            }}
            className={dangerMenuItemClass}
          >
            <Trash2 aria-hidden="true" />
            {t("app.workflows.menuDelete")}
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t("app.workflows.deleteTitle")}
          body={t("app.workflows.deleteBody")}
          confirmLabel={t("app.common.delete")}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            void deleteWorkflow(workflow.id);
            setConfirmDelete(false);
          }}
        />
      )}
    </div>
  );
}
