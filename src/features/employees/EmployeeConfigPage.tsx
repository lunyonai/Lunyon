import { useEffect, useId, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowLeft, SearchX, Workflow } from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  buttonClass,
  cx,
  inputClass,
  skeletonClass,
  textareaClass,
} from "../../components/ui/styles";
import { useLocale } from "../../i18n/LocaleProvider";
import { relativeTime } from "../activity/activityView";
import { useWorkflows } from "../workflows/WorkflowsContext";
import { api, type ActivityRecord } from "../../lib/api";
import { useEmployees } from "./EmployeesContext";
import {
  AVAILABLE_CAPABILITIES,
  extraFieldCatalog,
  normalizeEmployee,
  UPCOMING_CAPABILITIES,
  type Employee,
} from "./employeeTypes";
import { employeeIconMap, resolveEmployeeCopy, statusTone } from "./employeeView";

export default function EmployeeConfigPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const fieldId = useId();
  const { employees, loading, updateEmployee, toggleCapability } = useEmployees();
  const { workflows } = useWorkflows();
  const [employeeActivity, setEmployeeActivity] = useState<ActivityRecord[]>([]);
  const [remote, setRemote] = useState<Employee | null | undefined>(undefined);

  useEffect(() => {
    if (!employeeId) {
      setRemote(null);
      return;
    }
    const listed = employees.find((item) => item.id === employeeId);
    if (listed) {
      setRemote(listed);
      return;
    }
    if (loading) {
      setRemote(undefined);
      return;
    }
    let cancelled = false;
    api
      .getEmployee(employeeId)
      .then((row) => {
        if (!cancelled) setRemote(normalizeEmployee(row));
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, employees, loading]);

  const employee = remote === undefined ? undefined : remote;
  const copy = employee ? resolveEmployeeCopy(employee, t) : null;
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [instructions, setInstructions] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!employee || !copy) return;
    setName(copy.name);
    setRole(copy.role);
    setDescription(copy.description);
    setPurpose(copy.purpose);
    setInstructions(copy.instructions);
    setExtra(employee.extra ?? {});
  }, [employee?.id]);

  const linkedWorkflows = useMemo(() => {
    if (!employee) return [];
    return workflows.filter((item) => item.employeeId === employee.id);
  }, [employee, workflows]);

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    api
      .activity({ type: "employee", ref: employeeId, limit: 20 })
      .then((items) => {
        if (!cancelled) setEmployeeActivity(items);
      })
      .catch(() => {
        if (!cancelled) setEmployeeActivity([]);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const backButton = (
    <Button variant="ghost" size="sm" className="-ml-2.5" onClick={() => navigate("/employees")}>
      <ArrowLeft />
      {t("app.common.back")}
    </Button>
  );

  if (employee === undefined) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl space-y-6" aria-busy="true">
          <p className="sr-only">{t("app.common.loading")}</p>
          <div className={cx(skeletonClass, "h-12 w-64")} aria-hidden="true" />
          <div className={cx(skeletonClass, "h-56 rounded-xl")} aria-hidden="true" />
          <div className={cx(skeletonClass, "h-40 rounded-xl")} aria-hidden="true" />
        </section>
      </AppShell>
    );
  }

  if (!employee || !copy) {
    return (
      <AppShell>
        <section className="mx-auto max-w-3xl">
          <Card padded={false}>
            <EmptyState tone="violet"
              icon={SearchX}
              title={t("app.employees.notFound")}
              action={
                <Link to="/employees" className={buttonClass({ size: "sm" })}>
                  <ArrowLeft />
                  {t("app.common.back")}
                </Link>
              }
            />
          </Card>
        </section>
      </AppShell>
    );
  }

  const currentEmployee = employee;
  const visual = employeeIconMap[employee.icon];
  const Icon = visual.icon;
  const extraFields = extraFieldCatalog[employee.kind];

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("app.common.required");
    if (!role.trim()) nextErrors.role = t("app.common.required");
    if (!purpose.trim()) nextErrors.purpose = t("app.common.required");
    if (!instructions.trim()) nextErrors.instructions = t("app.common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveError("");
    try {
      await updateEmployee(currentEmployee.id, {
        name: name.trim(),
        role: role.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        instructions: instructions.trim(),
        extra,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      setSaveError(t("app.employees.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow={backButton}
          title={
            <span className="flex items-center gap-3">
              <span
                className={cx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  visual.background,
                )}
              >
                <Icon className={cx("h-[18px] w-[18px]", visual.color)} aria-hidden="true" />
              </span>
              <span className="min-w-0">{copy.name}</span>
            </span>
          }
          description={<span className="text-primary-text">{copy.role}</span>}
          actions={
            <Badge tone={statusTone(employee.status)} dot>
              {t(
                employee.status === "active"
                  ? "app.employees.statusActive"
                  : "app.employees.statusPaused",
              )}
            </Badge>
          }
        />

        <Card className="space-y-5">
          <CardHeader title={t("app.employees.identitySection")} />
          <Field label={t("app.employees.fieldName")} htmlFor={`${fieldId}-name`} error={errors.name}>
            <input
              id={`${fieldId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              className={inputClass}
            />
          </Field>
          <Field label={t("app.employees.fieldRole")} htmlFor={`${fieldId}-role`} error={errors.role}>
            <input
              id={`${fieldId}-role`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-invalid={errors.role ? true : undefined}
              className={inputClass}
            />
          </Field>
          <Field label={t("app.employees.fieldDescription")} htmlFor={`${fieldId}-description`}>
            <textarea
              id={`${fieldId}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={cx(textareaClass, "min-h-20 resize-none")}
            />
          </Field>
        </Card>

        <Card className="space-y-5">
          <CardHeader title={t("app.employees.purposeSection")} />
          <Field
            label={t("app.employees.fieldPurpose")}
            htmlFor={`${fieldId}-purpose`}
            error={errors.purpose}
          >
            <textarea
              id={`${fieldId}-purpose`}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              aria-invalid={errors.purpose ? true : undefined}
              className={cx(textareaClass, "min-h-24 resize-none")}
            />
          </Field>
        </Card>

        <Card className="space-y-5">
          <CardHeader title={t("app.employees.instructionsSection")} />
          <Field
            label={t("app.employees.fieldInstructions")}
            htmlFor={`${fieldId}-instructions`}
            error={errors.instructions}
          >
            <textarea
              id={`${fieldId}-instructions`}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              aria-invalid={errors.instructions ? true : undefined}
              className={cx(textareaClass, "min-h-32 resize-none")}
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <CardHeader title={t("app.employees.capabilitiesSection")} />
          <div className="space-y-2">
            {AVAILABLE_CAPABILITIES.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm text-fg transition-colors hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={employee.capabilities.includes(id)}
                  onChange={() => void toggleCapability(currentEmployee.id, id)}
                  className="h-4 w-4 accent-primary"
                />
                {t(`app.employees.cap.${id}`)}
              </label>
            ))}
            {UPCOMING_CAPABILITIES.map((id) => (
              <label
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg-subtle"
              >
                <span className="flex items-center gap-3">
                  <input type="checkbox" disabled className="h-4 w-4 accent-primary" />
                  {t(`app.employees.cap.${id}`)}
                </span>
                <Badge>{t("app.common.comingLater")}</Badge>
              </label>
            ))}
          </div>
        </Card>

        {extraFields.length > 0 && (
          <Card className="space-y-5">
            <CardHeader
              title={t("app.employees.extraSection")}
              description={t("app.employees.extraHint")}
            />
            {extraFields.map((field) => (
              <Field
                key={field.key}
                label={t(field.labelKey)}
                htmlFor={`${fieldId}-extra-${field.key}`}
              >
                <input
                  id={`${fieldId}-extra-${field.key}`}
                  value={extra[field.key] ?? ""}
                  onChange={(event) =>
                    setExtra((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            ))}
          </Card>
        )}

        <Card padded={false}>
          <div className="border-b border-line px-5 py-4">
            <CardHeader title={t("app.employees.workflowsSection")} />
          </div>
          {linkedWorkflows.length === 0 ? (
            <EmptyState tone="violet"
              icon={Workflow}
              title={t("app.employees.workflowsEmpty")}
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-line">
              {linkedWorkflows.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3 text-sm text-fg">
                  <Workflow className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <span className="min-w-0 truncate">
                    {item.title?.trim() || t("app.workflows.untitled")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="border-b border-line px-5 py-4">
            <CardHeader title={t("app.employees.activitySection")} />
          </div>
          {employeeActivity.length === 0 ? (
            <EmptyState tone="violet"
              icon={Activity}
              title={t("app.employees.activityEmpty")}
              className="py-8"
            />
          ) : (
            <ul className="divide-y divide-line">
              {employeeActivity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <p className="min-w-0 truncate text-sm text-fg">{item.detail}</p>
                  <span className="shrink-0 text-xs tabular-nums text-fg-subtle">
                    {relativeTime(item.createdAt, t("app.dashboard.justNow"))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {saveError && <span className="text-sm text-danger-text">{saveError}</span>}
          {saved && <span className="text-sm text-success-text">{t("app.settings.saved")}</span>}
          <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
            {saving ? t("app.common.saving") : t("app.common.save")}
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
