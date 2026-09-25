import { useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "../../i18n/LocaleProvider";
import { useEmployees } from "./EmployeesContext";
import {
  AVAILABLE_CAPABILITIES,
  UPCOMING_CAPABILITIES,
  type CapabilityId,
} from "./employeeTypes";

type EmployeeFormPanelProps = {
  onClose: () => void;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function EmployeeFormPanel({ onClose }: EmployeeFormPanelProps) {
  const { t } = useLocale();
  const { addEmployee } = useEmployees();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [instructions, setInstructions] = useState("");
  const [capabilities, setCapabilities] = useState<CapabilityId[]>(["run_task"]);
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function toggleCapability(id: CapabilityId) {
    setCapabilities((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSave() {
    if (saving) return;
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = t("app.common.required");
    if (!role.trim()) nextErrors.role = t("app.common.required");
    if (!purpose.trim()) nextErrors.purpose = t("app.common.required");
    if (!instructions.trim()) nextErrors.instructions = t("app.common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await addEmployee({
        kind: "custom",
        icon: "bot",
        name: name.trim(),
        role: role.trim(),
        description: description.trim() || purpose.trim(),
        purpose: purpose.trim(),
        instructions: instructions.trim(),
        capabilities,
        status,
        extra: {},
      });
      onClose();
    } catch {
      setErrors({ form: t("app.employees.saveError") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t("app.employees.closePanel")}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-base font-semibold text-white">
              {t("app.employees.addTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {t("app.employees.addSubtitle")}
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
          <section>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.employees.identitySection")}
            </p>
            <label className="mt-4 block text-sm font-medium text-white">
              {t("app.employees.fieldName")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
              />
            </label>
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name}</p>
            )}
            <label className="mt-4 block text-sm font-medium text-white">
              {t("app.employees.fieldRole")}
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className={fieldClass}
              />
            </label>
            {errors.role && (
              <p className="mt-1 text-xs text-red-400">{errors.role}</p>
            )}
            <label className="mt-4 block text-sm font-medium text-white">
              {t("app.employees.fieldDescription")}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`${fieldClass} min-h-20 resize-none`}
              />
            </label>
          </section>

          <section>
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
            {errors.purpose && (
              <p className="mt-1 text-xs text-red-400">{errors.purpose}</p>
            )}
          </section>

          <section>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.employees.instructionsSection")}
            </p>
            <label className="mt-4 block text-sm font-medium text-white">
              {t("app.employees.fieldInstructions")}
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                className={`${fieldClass} min-h-28 resize-none`}
              />
            </label>
            {errors.instructions && (
              <p className="mt-1 text-xs text-red-400">{errors.instructions}</p>
            )}
            {errors.form && (
              <p className="mt-1 text-xs text-red-400">{errors.form}</p>
            )}
          </section>

          <section>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.employees.capabilitiesSection")}
            </p>
            <div className="mt-3 space-y-2">
              {AVAILABLE_CAPABILITIES.map((id) => (
                <label
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={capabilities.includes(id)}
                    onChange={() => toggleCapability(id)}
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

          <section>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {t("app.employees.statusSection")}
            </p>
            <div className="mt-3 flex gap-2">
              {(["active", "paused"] as const).map((value) => (
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
                  {t(`app.employees.status${value === "active" ? "Active" : "Paused"}`)}
                </button>
              ))}
            </div>
          </section>
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
