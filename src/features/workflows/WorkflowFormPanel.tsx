import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import { userTimezone } from "../../lib/aiErrors";
import { useEmployees } from "../employees/EmployeesContext";
import { resolveEmployeeCopy } from "../employees/employeeView";
import { useWorkflows } from "./WorkflowsContext";
import {
  AVAILABLE_STEPS,
  PROMPT_TEMPLATE_IDS,
  UPCOMING_STEPS,
  UPCOMING_TRIGGERS,
  type Workflow,
  type WorkflowSchedule,
  type WorkflowStep,
  type WorkflowStepType,
  type WorkflowTrigger,
} from "./workflowTypes";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

type WorkflowFormPanelProps = {
  onClose: () => void;
  workflow?: Workflow;
};

function defaultParams(type: WorkflowStepType): WorkflowStep["params"] {
  if (type === "run_prompt") return { promptId: PROMPT_TEMPLATE_IDS[0], input: "" };
  if (type === "run_employee") return { task: "" };
  if (type === "gmail.read_recent") return { limit: 5, query: "" };
  return {};
}

function textParam(step: WorkflowStep, key: string) {
  const value = step.params?.[key];
  return typeof value === "string" ? value : "";
}

export default function WorkflowFormPanel({ onClose, workflow }: WorkflowFormPanelProps) {
  const { t, locale } = useLocale();
  const { addWorkflow, updateWorkflow } = useWorkflows();
  const { employees } = useEmployees();
  const [title, setTitle] = useState(workflow?.title ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [trigger, setTrigger] = useState<WorkflowTrigger>(workflow?.trigger ?? "manual");
  const [frequency, setFrequency] = useState<WorkflowSchedule["frequency"]>(
    workflow?.schedule?.frequency ?? "weekdays",
  );
  const [time, setTime] = useState(workflow?.schedule?.time ?? "09:00");
  const [weekday, setWeekday] = useState<number>(workflow?.schedule?.weekday ?? 1);
  const [steps, setSteps] = useState<WorkflowStep[]>(
    workflow?.steps?.length
      ? workflow.steps
      : [{ id: crypto.randomUUID(), type: "run_prompt", params: defaultParams("run_prompt") }],
  );
  const [employeeId, setEmployeeId] = useState<string>(workflow?.employeeId ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(
    workflow?.status ?? "inactive",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const timezone = userTimezone();
  const missingEmployee =
    Boolean(employeeId) && !employees.some((item) => item.id === employeeId);

  function addStep(type: WorkflowStepType) {
    setSteps((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type,
        employeeId: type === "run_employee" ? employeeId || null : null,
        params: defaultParams(type),
      },
    ]);
  }

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
  }

  function setStepParam(step: WorkflowStep, key: string, value: string | number) {
    updateStep(step.id, { params: { ...(step.params ?? {}), [key]: value } });
  }

  function moveStep(index: number, delta: number) {
    setSteps((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t("app.workflows.nameRequired");
    if (steps.length === 0) nextErrors.steps = t("app.workflows.stepsRequired");
    steps.forEach((step, index) => {
      if (step.type === "run_employee" && !(step.employeeId || employeeId)) {
        nextErrors[step.id] = t("app.workflows.stepEmployeeRequired");
      }
      // Later steps can work on the previous steps' results; the first one needs input text.
      if (step.type === "run_prompt" && index === 0 && !textParam(step, "input").trim()) {
        nextErrors[step.id] = t("app.workflows.stepInputRequired");
      }
    });
    if (trigger === "schedule" && !/^\d{2}:\d{2}$/.test(time)) {
      nextErrors.schedule = t("app.workflows.scheduleTimeRequired");
    }
    return nextErrors;
  }

  async function handleSave() {
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const schedule: WorkflowSchedule | null =
      trigger === "schedule"
        ? {
            frequency,
            time,
            ...(frequency === "weekly" ? { weekday } : {}),
            timezone,
            locale,
          }
        : null;
    const draft = {
      title: title.trim(),
      description: description.trim(),
      trigger,
      schedule,
      steps: steps.map((step) => ({
        ...step,
        employeeId:
          step.type === "run_employee" ? step.employeeId || employeeId || null : null,
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

  function renderStepFields(step: WorkflowStep, index: number) {
    if (step.type === "gmail.read_recent") {
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-medium text-slate-400">
            {t("app.workflows.paramLimit")}
            <input
              type="number"
              min={1}
              max={20}
              value={Number(step.params?.limit ?? 5)}
              onChange={(event) => setStepParam(step, "limit", Number(event.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="block text-xs font-medium text-slate-400 sm:col-span-2">
            {t("app.workflows.paramQuery")}
            <input
              value={textParam(step, "query")}
              onChange={(event) => setStepParam(step, "query", event.target.value)}
              placeholder="is:unread newer_than:1d"
              className={fieldClass}
            />
          </label>
        </div>
      );
    }
    if (step.type === "calendar.read_today") {
      return <p className="mt-2 text-xs text-slate-500">{t("app.workflows.calendarStepHint")}</p>;
    }
    if (step.type === "run_prompt") {
      return (
        <div className="mt-3 space-y-3">
          <label className="block text-xs font-medium text-slate-400">
            {t("app.workflows.paramPrompt")}
            <select
              value={textParam(step, "promptId") || PROMPT_TEMPLATE_IDS[0]}
              onChange={(event) => setStepParam(step, "promptId", event.target.value)}
              className={fieldClass}
            >
              {PROMPT_TEMPLATE_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`app.prompts.${id}Title`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-400">
            {index === 0 ? t("app.workflows.paramInput") : t("app.workflows.paramInputOptional")}
            <textarea
              value={textParam(step, "input")}
              onChange={(event) => setStepParam(step, "input", event.target.value)}
              className={`${fieldClass} min-h-20 resize-none`}
            />
          </label>
        </div>
      );
    }
    return (
      <div className="mt-3 space-y-3">
        <label className="block text-xs font-medium text-slate-400">
          {t("app.workflows.paramEmployee")}
          <select
            value={step.employeeId ?? ""}
            onChange={(event) => updateStep(step.id, { employeeId: event.target.value || null })}
            className={fieldClass}
          >
            <option value="">{t("app.workflows.paramEmployeeDefault")}</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {resolveEmployeeCopy(item, t).name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-400">
          {t("app.workflows.paramTask")}
          <textarea
            value={textParam(step, "task")}
            onChange={(event) => setStepParam(step, "task", event.target.value)}
            placeholder={t("app.workflows.paramTaskPlaceholder")}
            className={`${fieldClass} min-h-20 resize-none`}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
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
              {(["manual", "schedule"] as const).map((id) => (
                <label
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200"
                >
                  <input
                    type="radio"
                    name="trigger"
                    checked={trigger === id}
                    onChange={() => setTrigger(id)}
                    className="accent-blue-500"
                  />
                  {t(`app.workflows.triggerOption.${id}`)}
                </label>
              ))}

              {trigger === "schedule" && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-slate-400">
                      {t("app.workflows.scheduleFrequency")}
                      <select
                        value={frequency}
                        onChange={(event) =>
                          setFrequency(event.target.value as WorkflowSchedule["frequency"])
                        }
                        className={fieldClass}
                      >
                        <option value="daily">{t("app.workflows.frequency.daily")}</option>
                        <option value="weekdays">{t("app.workflows.frequency.weekdays")}</option>
                        <option value="weekly">{t("app.workflows.frequency.weekly")}</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-400">
                      {t("app.workflows.scheduleTime")}
                      <input
                        type="time"
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        className={fieldClass}
                      />
                    </label>
                    {frequency === "weekly" && (
                      <label className="block text-xs font-medium text-slate-400 sm:col-span-2">
                        {t("app.workflows.scheduleWeekday")}
                        <select
                          value={weekday}
                          onChange={(event) => setWeekday(Number(event.target.value))}
                          className={fieldClass}
                        >
                          {WEEKDAYS.map((day) => (
                            <option key={day} value={day}>
                              {t(`app.workflows.weekday.d${day}`)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {t("app.workflows.scheduleHint", { timezone })}
                  </p>
                  {errors.schedule && (
                    <p className="mt-1 text-xs text-red-400">{errors.schedule}</p>
                  )}
                </div>
              )}

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
            <p className="mt-1 text-xs text-slate-500">{t("app.workflows.stepsHint")}</p>
            <div className="mt-3 space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="rounded-xl border border-slate-800 px-3 py-3 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {index + 1}. {t(`app.workflows.step.${step.type}`)}
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t("app.workflows.moveUp")}
                        disabled={index === 0}
                        onClick={() => moveStep(index, -1)}
                        className="rounded-md p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("app.workflows.moveDown")}
                        disabled={index === steps.length - 1}
                        onClick={() => moveStep(index, 1)}
                        className="rounded-md p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSteps((current) => current.filter((item) => item.id !== step.id))
                        }
                        className="ml-1 text-xs text-slate-500 hover:text-slate-300"
                      >
                        {t("app.common.remove")}
                      </button>
                    </span>
                  </div>
                  {renderStepFields(step, index)}
                  {errors[step.id] && (
                    <p className="mt-2 text-xs text-red-400">{errors[step.id]}</p>
                  )}
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
            {trigger === "schedule" && (
              <p className="mt-2 text-xs text-slate-500">{t("app.workflows.statusScheduleHint")}</p>
            )}
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
