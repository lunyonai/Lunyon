import type { ReactNode } from "react";
import { cx, hintClass, labelClass } from "./styles";

type FieldProps = {
  label: ReactNode;
  /** Connects the label to the control; omit when the control is nested (implicit label). */
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error stack. Pass the control (input/select/textarea) as children. */
export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className={cx(labelClass, "block")}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger-text">{error}</p>
      ) : (
        hint && <p className={hintClass}>{hint}</p>
      )}
    </div>
  );
}
