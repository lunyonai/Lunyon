import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile, type TileTone } from "./IconTile";
import { cardClass, cx } from "./styles";

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: TileTone;
  className?: string;
};

/** KPI tile: identity icon, label, big number and a one-line context hint. */
export function StatCard({ label, value, hint, icon, tone = "primary", className }: StatCardProps) {
  return (
    <article className={cx(cardClass, "relative overflow-hidden p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        <IconTile icon={icon} tone={tone} size="sm" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-fg sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-fg-subtle">{hint}</p>}
    </article>
  );
}
