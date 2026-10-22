import type { LucideIcon } from "lucide-react";
import { cx } from "./styles";

export type TileTone = "primary" | "violet" | "orange" | "cyan" | "rose" | "amber" | "emerald" | "neutral";

/** Static class strings so Tailwind can see every tone. */
const tones: Record<TileTone, string> = {
  primary: "from-primary/20 to-primary/5 text-primary-text ring-primary/20",
  violet: "from-tint-violet/20 to-tint-violet/5 text-tint-violet ring-tint-violet/20",
  orange: "from-tint-orange/20 to-tint-orange/5 text-tint-orange ring-tint-orange/20",
  cyan: "from-tint-cyan/20 to-tint-cyan/5 text-tint-cyan ring-tint-cyan/20",
  rose: "from-tint-rose/20 to-tint-rose/5 text-tint-rose ring-tint-rose/20",
  amber: "from-tint-amber/20 to-tint-amber/5 text-tint-amber ring-tint-amber/20",
  emerald: "from-tint-emerald/20 to-tint-emerald/5 text-tint-emerald ring-tint-emerald/20",
  neutral: "from-surface-3 to-surface-2 text-fg-muted ring-line",
};

const sizes = {
  sm: "h-8 w-8 rounded-lg [&_svg]:size-4",
  md: "h-10 w-10 rounded-xl [&_svg]:size-5",
  lg: "h-12 w-12 rounded-xl [&_svg]:size-6",
} as const;

type IconTileProps = {
  icon: LucideIcon;
  tone?: TileTone;
  size?: keyof typeof sizes;
  className?: string;
};

/** Gradient icon badge that gives each area/entity a recognizable identity color. */
export function IconTile({ icon: Icon, tone = "neutral", size = "md", className }: IconTileProps) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center bg-gradient-to-br ring-1 ring-inset",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      <Icon aria-hidden="true" />
    </span>
  );
}
