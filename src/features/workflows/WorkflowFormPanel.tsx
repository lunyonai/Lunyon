import { useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import { useEmployees } from "../employees/EmployeesContext";
import { resolveEmployeeCopy } from "../employees/employeeView";
import { useWorkflows } from "./WorkflowsContext";
import {
  AVAILABLE_STEPS,
  AVAILABLE_TRIGGERS,
  UPCOMING_STEPS,
  UPCOMING_TRIGGERS,
  type Workflow,
  type WorkflowStep,
  type WorkflowStepType,
} from "./workflowTypes";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

type WorkflowFormPanelProps = {
  onClose: () => void;
  workflow?: Workflow;
};

export default function WorkflowFormPanel({ onClose, workflow }: WorkflowFormPanelProps) {
  const { t } = useLocale();
  const { addWorkflow, updateWorkflow } = useWorkflows();
  const { employees } = useEmployees();
  const [title, setTitle] = useState(workflow?.title ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [steps, setSteps] = useState<WorkflowStep[]>(
    workflow?.steps?.length
      ? workflow.steps
      : [{ id: crypto.randomUUID(), type: "run_prompt" }],
  );
  const [employeeId, setEmployeeId] = useState<string>(workflow?.employeeId ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(
    workflow?.status ?? "inactive",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const missingEmployee =
    Boolean(employeeId) && !employees.some((item) => item.id === employeeId);

  function addStep(type: WorkflowStepType) {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type,
        employeeId: type === "run_employee" ? employeeId || null : null,
        params: {},
      },
    ]);
  }

  async function handleSave() {
    if (saving) return;
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("app.workflows.nameRequired");
    if (steps.length === 0) nextErrors.steps = t("app.workflows.stepsRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const draft = {
      title: title.trim(),
      description: description.trim(),
      trigger: "manual" as const,
      steps: steps.map((step) => ({
        ...step,
        employeeId:
          step.type === "run_employee" ? employeeId || step.employeeId || null : null,
        params: step.params ?? {},
      })),
      employeeId: employeeId || null,
      status,
    };

    try {
      if (workflow) {
        await updateWorkflow(workflow.id, draft);
      } else {
        await addWorkflow(draft);
      }
      onClose();
    } catch {
      setErrors({ form: t("app.workflows.saveError") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-base font-semibold text-white">
              {workflow ? t("app.workflows.editTitle") : t("app.workflows.createTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {t("app.workflows.createSubtitle")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("app.common.close")}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <label className="block text-sm font-medium text-white">
            {t("app.workflows.fieldName")}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClass}
            />
          </label>
          {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}

          <label className="block text-sm font-medium text-white">
            {t("app.workflows.fieldDescription")}
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldClass} min-h-20 resize-none`}
            />
          </label>

          <div>
            <p className="text-sm font-medium text-white">
              {t("app.workflows.triggerLabel")}
            </p>
            <div className="mt-2 space-y-2">
              {AVAILABLE_TRIGGERS.map((id) => (
                <label
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200"
                >
                  <input
                    type="radio"
                    name="trigger"
                    checked
                    readOnly
                    className="accent-blue-500"
                  />
                  {t(`app.workflows.triggerOption.${id}`)}
                </label>
              ))}
              {UPCOMING_TRIGGERS.map((id) => (
                <label
                  key={id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-500"
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" disabled className="accent-blue-500" />
                    {t(`app.workflows.triggerOption.${id}`)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {t("app.common.comingLater")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white">
              {t("app.workflows.stepsLabel")}
            </p>
            <div className="mt-2 space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200"
                >
                  <span>
                    {index + 1}. {t(`app.workflows.step.${step.type}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSteps((current) => current.filter((item) => item.id !== step.id))
                    }
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    {t("app.common.remove")}
                  </button>
                </div>
              ))}
            </div>
            {errors.steps && (
              <p className="mt-1 text-xs text-red-400">{errors.steps}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {AVAILABLE_STEPS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addStep(type)}
                  className="rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900"
                >
                  {t("app.workflows.addStep")}: {t(`app.workflows.step.${type}`)}
                </button>
              ))}
              {UPCOMING_STEPS.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled
                  className="rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-600"
                >
                  {t(`app.workflows.step.${type}`)} · {t("app.common.comingLater")}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-white">
            {t("app.workflows.employeeLabel")}
            <select
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className={fieldClass}
            >
              <option value="">{t("app.workflows.employeeNone")}</option>
              {missingEmployee && (
                <option value={employeeId}>{t("app.workflows.employeeMissing")}</option>
              )}
              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {resolveEmployeeCopy(item, t).name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-white">
              {t("app.workflows.statusLabel")}
            </p>
            <div className="mt-2 flex gap-2">
              {(["active", "inactive"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    status === value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {t(
                    value === "active"
                      ? "app.workflows.statusActive"
                      : "app.workflows.statusInactive",
                  )}
                </button>
              ))}
            </div>
          </div>

          {errors.form && <p className="text-xs text-red-400">{errors.form}</p>}
        </div>

        <div className="flex gap-2 border-t border-slate-800 p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-800 text-sm font-medium text-slate-300 transition hover:bg-slate-900"
          >
            {t("app.common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? t("app.common.saving") : t("app.common.save")}
          </button>
        </div>
      </aside>
    </div>
  );
}
