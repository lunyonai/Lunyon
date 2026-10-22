import { useLocale } from "../i18n/LocaleProvider";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
};

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  danger = true,
  busy = false,
}: ConfirmDialogProps) {
  const { t } = useLocale();

  return (
    <Modal
      title={title}
      onClose={onCancel}
      busy={busy}
      size="sm"
      layer="z-[70]"
      closeLabel={t("app.common.close")}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            {t("app.common.cancel")}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {busy ? t("app.common.saving") : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-fg-muted">{body}</p>
    </Modal>
  );
}
