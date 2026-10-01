import { useEffect, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import ConfirmDialog from "../../components/ConfirmDialog";
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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={t("app.workflows.moreAria", { title })}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
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
              onEdit();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {t("app.workflows.menuEdit")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void duplicateWorkflow(workflow.id, `${title}${t("app.common.copySuffix")}`);
              setOpen(false);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {t("app.workflows.menuDuplicate")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void setStatus(
                workflow.id,
                workflow.status === "active" ? "inactive" : "active",
              );
              setOpen(false);
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-900"
          >
            {workflow.status === "active"
              ? t("app.workflows.menuDeactivate")
              : t("app.workflows.menuActivate")}
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
