import { useId, useState } from "react";
import { useLocale } from "../../i18n/LocaleProvider";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { cx, inputClass, textareaClass } from "../../components/ui/styles";
import { useEmployees } from "./EmployeesContext";
import {
  AVAILABLE_CAPABILITIES,
  UPCOMING_CAPABILITIES,
  type CapabilityId,
} from "./employeeTypes";

type EmployeeFormPanelProps = {
  onClose: () => void;
};

export default function EmployeeFormPanel({ onClose }: EmployeeFormPanelProps) {
  const { t } = useLocale();
  const id = useId();
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

  const statusOptions = (["active", "paused"] as const).map((value) => ({
    value,
    label: t(`app.employees.status${value === "active" ? "Active" : "Paused"}`),
  }));

  return (
    <Modal
      title={t("app.employees.addTitle")}
      description={t("app.employees.addSubtitle")}
      onClose={onClose}
      size="lg"
      closeLabel={t("app.common.close")}
      footer={
        <>
          <Button onClick={onClose}>{t("app.common.cancel")}</Button>
          <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
            {saving ? t("app.common.saving") : t("app.common.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-fg">{t("app.employees.identitySection")}</h3>
          <Field label={t("app.employees.fieldName")} htmlFor={`${id}-name`} error={errors.name}>
            <input
              id={`${id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              className={inputClass}
            />
          </Field>
          <Field label={t("app.employees.fieldRole")} htmlFor={`${id}-role`} error={errors.role}>
            <input
              id={`${id}-role`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-invalid={errors.role ? true : undefined}
              className={inputClass}
            />
          </Field>
          <Field label={t("app.employees.fieldDescription")} htmlFor={`${id}-description`}>
            <textarea
              id={`${id}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={cx(textareaClass, "min-h-20 resize-none")}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-fg">{t("app.employees.purposeSection")}</h3>
          <Field
            label={t("app.employees.fieldPurpose")}
            htmlFor={`${id}-purpose`}
            error={errors.purpose}
          >
            <textarea
              id={`${id}-purpose`}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              aria-invalid={errors.purpose ? true : undefined}
              className={cx(textareaClass, "min-h-24 resize-none")}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-fg">
            {t("app.employees.instructionsSection")}
          </h3>
          <Field
            label={t("app.employees.fieldInstructions")}
            htmlFor={`${id}-instructions`}
            error={errors.instructions}
          >
            <textarea
              id={`${id}-instructions`}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              aria-invalid={errors.instructions ? true : undefined}
              className={cx(textareaClass, "min-h-28 resize-none")}
            />
          </Field>
          {errors.form && <Alert tone="danger">{errors.form}</Alert>}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-fg">
            {t("app.employees.capabilitiesSection")}
          </h3>
          <div className="space-y-2">
            {AVAILABLE_CAPABILITIES.map((capability) => (
              <label
                key={capability}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm text-fg transition-colors hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={capabilities.includes(capability)}
                  onChange={() => toggleCapability(capability)}
                  className="h-4 w-4 accent-primary"
                />
                {t(`app.employees.cap.${capability}`)}
              </label>
            ))}
            {UPCOMING_CAPABILITIES.map((capability) => (
              <label
                key={capability}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg-subtle"
              >
                <span className="flex items-center gap-3">
                  <input type="checkbox" disabled className="h-4 w-4 accent-primary" />
                  {t(`app.employees.cap.${capability}`)}
                </span>
                <Badge>{t("app.common.comingLater")}</Badge>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-fg">{t("app.employees.statusSection")}</h3>
          <SegmentedControl
            size="sm"
            ariaLabel={t("app.employees.statusSection")}
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
        </section>
      </div>
    </Modal>
  );
}
