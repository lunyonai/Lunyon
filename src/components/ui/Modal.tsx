import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { cx } from "./styles";

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

type ModalProps = {
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  /** Blocks Escape/backdrop close while a request runs. */
  busy?: boolean;
  size?: keyof typeof sizes;
  closeLabel: string;
  footer?: ReactNode;
  children?: ReactNode;
  /** z-index layer; dialogs opened from other dialogs go higher. */
  layer?: "z-50" | "z-[60]" | "z-[70]";
};

/** Centered dialog: header (title/description/close), scrollable body, optional footer. */
export function Modal({
  title,
  description,
  onClose,
  busy = false,
  size = "md",
  closeLabel,
  footer,
  children,
  layer = "z-50",
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div className={cx("fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6", layer)}>
      <button
        type="button"
        aria-label={closeLabel}
        tabIndex={-1}
        onClick={busy ? undefined : onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-overlay sm:rounded-xl",
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            disabled={busy}
            className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
