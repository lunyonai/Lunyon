import { useId, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button, IconButton } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import {
  cx,
  hintClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "../../components/ui/styles";
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

const textareaFieldClass = cx(textareaClass, "min-h-20 resize-none");

const optionRowClass =
  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors";

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
  const baseId = useId();
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
    const fieldId = (key: string) => `${baseId}-${step.id}-${key}`;

    if (step.type === "gmail.read_recent") {
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label={t("app.workflows.paramLimit")} htmlFor={fieldId("limit")}>
            <input
              id={fieldId("limit")}
              type="number"
              min={1}
              max={20}
              value={Number(step.params?.limit ?? 5)}
              onChange={(event) => setStepParam(step, "limit", Number(event.target.value))}
              className={cx(inputClass, "tabular-nums")}
            />
          </Field>
          <Field
            label={t("app.workflows.paramQuery")}
            htmlFor={fieldId("query")}
            className="sm:col-span-2"
          >
            <input
              id={fieldId("query")}
              value={textParam(step, "query")}
              onChange={(event) => setStepParam(step, "query", event.target.value)}
              placeholder="is:unread newer_than:1d"
              className={inputClass}
            />
          </Field>
        </div>
      );
    }
    if (step.type === "calendar.read_today") {
      return <p className={cx(hintClass, "mt-2")}>{t("app.workflows.calendarStepHint")}</p>;
    }
    if (step.type === "run_prompt") {
      return (
        <div className="mt-3 space-y-3">
          <Field label={t("app.workflows.paramPrompt")} htmlFor={fieldId("prompt")}>
            <select
              id={fieldId("prompt")}
              value={textParam(step, "promptId") || PROMPT_TEMPLATE_IDS[0]}
              onChange={(event) => setStepParam(step, "promptId", event.target.value)}
              className={selectClass}
            >
              {PROMPT_TEMPLATE_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`app.prompts.${id}Title`)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              index === 0 ? t("app.workflows.paramInput") : t("app.workflows.paramInputOptional")
            }
            htmlFor={fieldId("input")}
          >
            <textarea
              id={fieldId("input")}
              value={textParam(step, "input")}
              onChange={(event) => setStepParam(step, "input", event.target.value)}
              className={textareaFieldClass}
            />
          </Field>
        </div>
      );
    }
    return (
      <div className="mt-3 space-y-3">
        <Field label={t("app.workflows.paramEmployee")} htmlFor={fieldId("employee")}>
          <select
            id={fieldId("employee")}
            value={step.employeeId ?? ""}
            onChange={(event) => updateStep(step.id, { employeeId: event.target.value || null })}
            className={selectClass}
          >
            <option value="">{t("app.workflows.paramEmployeeDefault")}</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {resolveEmployeeCopy(item, t).name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("app.workflows.paramTask")} htmlFor={fieldId("task")}>
          <textarea
            id={fieldId("task")}
            value={textParam(step, "task")}
            onChange={(event) => setStepParam(step, "task", event.target.value)}
            placeholder={t("app.workflows.paramTaskPlaceholder")}
            className={textareaFieldClass}
          />
        </Field>
      </div>
    );
  }

  return (
    <Modal
      title={workflow ? t("app.workflows.editTitle") : t("app.workflows.createTitle")}
      description={t("app.workflows.createSubtitle")}
      onClose={onClose}
      busy={saving}
      size="lg"
      closeLabel={t("app.common.close")}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            {t("app.common.cancel")}
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
            {saving ? t("app.common.saving") : t("app.common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field label={t("app.workflows.fieldName")} htmlFor={`${baseId}-title`} error={errors.title}>
          <input
            id={`${baseId}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={errors.title ? true : undefined}
            className={inputClass}
          />
        </Field>

        <Field label={t("app.workflows.fieldDescription")} htmlFor={`${baseId}-description`}>
          <textarea
            id={`${baseId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaFieldClass}
          />
        </Field>

        <div className="space-y-2">
          <p className={labelClass}>{t("app.workflows.triggerLabel")}</p>
          <div className="space-y-2">
            {(["manual", "schedule"] as const).map((id) => (
              <label
                key={id}
                className={cx(
                  optionRowClass,
                  "cursor-pointer text-fg",
                  trigger === id
                    ? "border-primary/40 bg-primary/5"
                    : "border-line hover:bg-surface-2",
                )}
              >
                <input
                  type="radio"
                  name="trigger"
                  checked={trigger === id}
                  onChange={() => setTrigger(id)}
                  className="accent-primary"
                />
                {t(`app.workflows.triggerOption.${id}`)}
              </label>
            ))}

            {trigger === "schedule" && (
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={t("app.workflows.scheduleFrequency")}
                    htmlFor={`${baseId}-frequency`}
                  >
                    <select
                      id={`${baseId}-frequency`}
                      value={frequency}
                      onChange={(event) =>
                        setFrequency(event.target.value as WorkflowSchedule["frequency"])
                      }
                      className={selectClass}
                    >
                      <option value="daily">{t("app.workflows.frequency.daily")}</option>
                      <option value="weekdays">{t("app.workflows.frequency.weekdays")}</option>
                      <option value="weekly">{t("app.workflows.frequency.weekly")}</option>
                    </select>
                  </Field>
                  <Field label={t("app.workflows.scheduleTime")} htmlFor={`${baseId}-time`}>
                    <input
                      id={`${baseId}-time`}
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      aria-invalid={errors.schedule ? true : undefined}
                      className={cx(inputClass, "tabular-nums")}
                    />
                  </Field>
                  {frequency === "weekly" && (
                    <Field
                      label={t("app.workflows.scheduleWeekday")}
                      htmlFor={`${baseId}-weekday`}
                      className="sm:col-span-2"
                    >
                      <select
                        id={`${baseId}-weekday`}
                        value={weekday}
                        onChange={(event) => setWeekday(Number(event.target.value))}
                        className={selectClass}
                      >
                        {WEEKDAYS.map((day) => (
                          <option key={day} value={day}>
                            {t(`app.workflows.weekday.d${day}`)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
                <p className={cx(hintClass, "mt-3")}>
                  {t("app.workflows.scheduleHint", { timezone })}
                </p>
                {errors.schedule && (
                  <p className="mt-1 text-xs text-danger-text">{errors.schedule}</p>
                )}
              </div>
            )}

            {UPCOMING_TRIGGERS.map((id) => (
              <label
                key={id}
                className={cx(optionRowClass, "justify-between border-line text-fg-subtle")}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" disabled className="accent-primary" />
                  {t(`app.workflows.triggerOption.${id}`)}
                </span>
                <Badge>{t("app.common.comingLater")}</Badge>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className={labelClass}>{t("app.workflows.stepsLabel")}</p>
          <p className={cx(hintClass, "mt-1")}>{t("app.workflows.stepsHint")}</p>
          <div className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="rounded-lg border border-line p-3 text-sm text-fg">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md bg-surface-2 px-1 text-xs tabular-nums text-fg-muted">
                      {index + 1}
                    </span>
                    {t(`app.workflows.step.${step.type}`)}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <IconButton
                      size="sm"
                      aria-label={t("app.workflows.moveUp")}
                      disabled={index === 0}
                      onClick={() => moveStep(index, -1)}
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      size="sm"
                      aria-label={t("app.workflows.moveDown")}
                      disabled={index === steps.length - 1}
                      onClick={() => moveStep(index, 1)}
                    >
                      <ArrowDown />
                    </IconButton>
                    <Button
                      variant="dangerGhost"
                      size="sm"
                      onClick={() =>
                        setSteps((current) => current.filter((item) => item.id !== step.id))
                      }
                    >
                      {t("app.common.remove")}
                    </Button>
                  </span>
                </div>
                {renderStepFields(step, index)}
                {errors[step.id] && (
                  <p className="mt-2 text-xs text-danger-text">{errors[step.id]}</p>
                )}
              </div>
            ))}
          </div>
          {errors.steps && <p className="mt-1 text-xs text-danger-text">{errors.steps}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {AVAILABLE_STEPS.map((type) => (
              <Button key={type} size="sm" onClick={() => addStep(type)}>
                {t("app.workflows.addStep")}: {t(`app.workflows.step.${type}`)}
              </Button>
            ))}
            {UPCOMING_STEPS.map((type) => (
              <Button key={type} size="sm" disabled>
                {t(`app.workflows.step.${type}`)} · {t("app.common.comingLater")}
              </Button>
            ))}
          </div>
        </div>

        <Field label={t("app.workflows.employeeLabel")} htmlFor={`${baseId}-employee`}>
          <select
            id={`${baseId}-employee`}
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className={selectClass}
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
        </Field>

        <div className="space-y-2">
          <p className={labelClass}>{t("app.workflows.statusLabel")}</p>
          <SegmentedControl
            ariaLabel={t("app.workflows.statusLabel")}
            options={[
              { value: "active", label: t("app.workflows.statusActive") },
              { value: "inactive", label: t("app.workflows.statusInactive") },
            ]}
            value={status}
            onChange={setStatus}
          />
          {trigger === "schedule" && (
            <p className={hintClass}>{t("app.workflows.statusScheduleHint")}</p>
          )}
        </div>

        {errors.form && <Alert tone="danger">{errors.form}</Alert>}
      </div>
    </Modal>
  );
}
