import type { ReactNode } from "react";
import { cx } from "./styles";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-fg-muted",
  primary: "border-primary/20 bg-primary/10 text-primary-text",
  success: "border-success/25 bg-success/10 text-success-text",
  warning: "border-warning/25 bg-warning/10 text-warning-text",
  danger: "border-danger/25 bg-danger/10 text-danger-text",
};

const dots: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

type BadgeProps = {
  tone?: Tone;
  /** Leading status dot. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", dots[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}
