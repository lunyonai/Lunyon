import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile, type TileTone } from "./IconTile";
import { cx } from "./styles";

type EmptyStateProps = {
  icon?: LucideIcon;
  tone?: TileTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, tone = "neutral", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && (
        <div className="relative mb-6 mt-4">
          {/* soft halo rings behind the tile */}
          <span className="absolute -inset-3 rounded-2xl border border-dashed border-line" aria-hidden="true" />
          <span className="absolute -inset-6 rounded-3xl border border-line/60" aria-hidden="true" />
          <IconTile icon={icon} tone={tone} size="md" className="relative" />
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
