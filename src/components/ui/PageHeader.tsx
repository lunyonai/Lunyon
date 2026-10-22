import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile, type TileTone } from "./IconTile";
import { cx } from "./styles";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons aligned to the right on wide screens. */
  actions?: ReactNode;
  /** Small element above the title (back link, breadcrumb, status badge). */
  eyebrow?: ReactNode;
  /** Section icon shown as a colored tile beside the title. */
  icon?: LucideIcon;
  tone?: TileTone;
  className?: string;
};

/** The one h1 per page. The AppShell top bar only shows the section name. */
export function PageHeader({ title, description, actions, eyebrow, icon, tone = "primary", className }: PageHeaderProps) {
  return (
    <header className={cx("flex flex-wrap items-center justify-between gap-x-6 gap-y-4", className)}>
      <div className="flex min-w-0 max-w-3xl items-center gap-4">
        {icon && <IconTile icon={icon} tone={tone} size="lg" className="hidden sm:flex" />}
        <div className="min-w-0">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm leading-6 text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
