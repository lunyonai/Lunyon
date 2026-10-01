import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import { useActivity } from "../activity/ActivityContext";
import { useWorkflows } from "../workflows/WorkflowsContext";
import { api } from "../../lib/api";
import { useEmployees } from "./EmployeesContext";
import {
  AVAILABLE_CAPABILITIES,
  extraFieldCatalog,
  normalizeEmployee,
  UPCOMING_CAPABILITIES,
  type Employee,
} from "./employeeTypes";
import { employeeIconMap, resolveEmployeeCopy, statusClass } from "./employeeView";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function EmployeeConfigPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { employees, loading, updateEmployee, toggleCapability } = useEmployees();
  const { workflows } = useWorkflows();
  const { activities } = useActivity();
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

  const employeeActivity = useMemo(() => {
    if (!copy) return [];
    return activities.filter(
      (item) =>
        item.type === "employee" &&
        (item.title.includes(copy.name) || item.detail.includes(copy.name)),
    );
  }, [activities, copy]);

  if (employee === undefined) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">{t("app.common.loading")}</p>
      </AppShell>
    );
  }

  if (!employee || !copy) {
    return (
      <AppShell>
        <p className="text-sm text-slate-400">{t("app.employees.notFound")}</p>
        <Link to="/employees" className="mt-4 inline-flex text-sm text-blue-400">
          {t("app.common.back")}
        </Link>
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
      <section className="mx-auto max-w-3xl space-y-8">
        <button
          type="button"
          onClick={() => navigate("/employees")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("app.common.back")}
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${visual.background}`}
          >
            <Icon className={`h-5 w-5 ${visual.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {copy.name}
            </h1>
            <p className="mt-1 text-sm text-blue-400">{copy.role}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(employee.status)}`}
            >
              {t(
                employee.status === "active"
                  ? "app.employees.statusActive"
                  : "app.employees.statusPaused",
              )}
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.identitySection")}
          </p>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.employees.fieldName")}
            <input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          </label>
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.employees.fieldRole")}
            <input value={role} onChange={(event) => setRole(event.target.value)} className={fieldClass} />
          </label>
          {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.employees.fieldDescription")}
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`${fieldClass} min-h-20 resize-none`}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.purposeSection")}
          </p>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.employees.fieldPurpose")}
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className={`${fieldClass} min-h-24 resize-none`}
            />
          </label>
          {errors.purpose && <p className="mt-1 text-xs text-red-400">{errors.purpose}</p>}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.instructionsSection")}
          </p>
          <label className="mt-4 block text-sm font-medium text-white">
            {t("app.employees.fieldInstructions")}
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className={`${fieldClass} min-h-32 resize-none`}
            />
          </label>
          {errors.instructions && (
            <p className="mt-1 text-xs text-red-400">{errors.instructions}</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.capabilitiesSection")}
          </p>
          <div className="mt-4 space-y-2">
            {AVAILABLE_CAPABILITIES.map((id) => (
              <label
                key={id}
                className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={employee.capabilities.includes(id)}
                  onChange={() => void toggleCapability(currentEmployee.id, id)}
                  className="accent-blue-500"
                />
                {t(`app.employees.cap.${id}`)}
              </label>
            ))}
            {UPCOMING_CAPABILITIES.map((id) => (
              <label
                key={id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-500"
              >
                <span className="flex items-center gap-3">
                  <input type="checkbox" disabled className="accent-blue-500" />
                  {t(`app.employees.cap.${id}`)}
                </span>
                <span className="text-[10px] uppercase tracking-wide">
                  {t("app.common.comingLater")}
                </span>
              </label>
            ))}
          </div>
        </section>

        {extraFields.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.employees.extraSection")}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t("app.employees.extraHint")}
            </p>
            <div className="mt-4 space-y-4">
              {extraFields.map((field) => (
                <label key={field.key} className="block text-sm font-medium text-white">
                  {t(field.labelKey)}
                  <input
                    value={extra[field.key] ?? ""}
                    onChange={(event) =>
                      setExtra((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.workflowsSection")}
          </p>
          {linkedWorkflows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {t("app.employees.workflowsEmpty")}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {linkedWorkflows.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200"
                >
                  {item.title?.trim() || t("app.workflows.untitled")}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-xs font-semibold tracking-wider text-slate-500">
            {t("app.employees.activitySection")}
          </p>
          {employeeActivity.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {t("app.employees.activityEmpty")}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {employeeActivity.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-800 px-3 py-2">
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex items-center justify-end gap-3">
          {saveError && <span className="text-sm text-red-400">{saveError}</span>}
          {saved && (
            <span className="text-sm text-emerald-400">{t("app.settings.saved")}</span>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? t("app.common.saving") : t("app.common.save")}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
