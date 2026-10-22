import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./styles";

type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: typeof Info }> = {
  info: { box: "border-primary/20 bg-primary/5 text-fg", icon: Info },
  success: { box: "border-success/25 bg-success/10 text-fg", icon: CheckCircle2 },
  warning: { box: "border-warning/30 bg-warning/10 text-fg", icon: AlertTriangle },
  danger: { box: "border-danger/25 bg-danger/10 text-fg", icon: XCircle },
};

const iconColors: Record<AlertTone, string> = {
  info: "text-primary-text",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

/** Inline notice for success/error/info messages inside a page or card. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  dismissLabel = "Close",
  className,
}: AlertProps) {
  const Icon = tones[tone].icon;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm", tones[tone].box, className)}
    >
      <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", iconColors[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "text-fg-muted" : undefined}>{children}</div>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="-m-1 shrink-0 rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
