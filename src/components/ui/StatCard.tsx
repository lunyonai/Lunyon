import type { LucideIcon } from "lucide-react";
import { useId, type ReactNode } from "react";
import { IconTile, type TileTone } from "./IconTile";
import { cardClass, cx } from "./styles";

/** CSS color per tone, for SVG strokes/fills that can't use Tailwind classes. */
const toneColor: Record<TileTone, string> = {
  primary: "var(--ui-primary)",
  violet: "var(--ui-tint-violet)",
  orange: "var(--ui-tint-orange)",
  cyan: "var(--ui-tint-cyan)",
  rose: "var(--ui-tint-rose)",
  amber: "var(--ui-tint-amber)",
  emerald: "var(--ui-tint-emerald)",
  neutral: "var(--ui-fg-subtle)",
};

/** Tiny area sparkline (single series, no axes); decorative, the number carries the value. */
function Sparkline({ values, tone }: { values: number[]; tone: TileTone }) {
  const gradientId = useId();
  const width = 120;
  const height = 36;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => [index * step, height - 2 - (value / max) * (height - 6)] as const);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const color = toneColor[tone];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full overflow-visible" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: TileTone;
  /** Daily values (oldest first) for a sparkline under the number. */
  trend?: number[];
  /** Change badge, e.g. "+3 vs yesterday"; `direction` picks its color. */
  delta?: { label: ReactNode; direction: "up" | "down" | "flat" };
  className?: string;
};

/** KPI tile: identity icon, label, big number, optional trend sparkline and change badge. */
export function StatCard({ label, value, hint, icon, tone = "primary", trend, delta, className }: StatCardProps) {
  return (
    <article className={cx(cardClass, "relative flex flex-col overflow-hidden p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        <IconTile icon={icon} tone={tone} size="sm" />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums text-fg sm:text-3xl">{value}</p>
        {delta && (
          <span
            className={cx(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              delta.direction === "up" && "bg-success/10 text-success-text",
              delta.direction === "down" && "bg-danger/10 text-danger-text",
              delta.direction === "flat" && "bg-surface-2 text-fg-subtle",
            )}
          >
            {delta.label}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 truncate text-xs text-fg-subtle">{hint}</p>}
      {trend && trend.length > 1 && (
        <div className="-mx-1 mt-auto pt-3">
          <Sparkline values={trend} tone={tone} />
        </div>
      )}
    </article>
  );
}
