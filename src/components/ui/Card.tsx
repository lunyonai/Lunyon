import type { HTMLAttributes, ReactNode } from "react";
import { cardClass, cx } from "./styles";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article" | "aside";
  /** Applies the standard inner padding. Turn off for lists that run edge to edge. */
  padded?: boolean;
};

export function Card({ as: Tag = "section", padded = true, className, ...props }: CardProps) {
  return <Tag className={cx(cardClass, padded && "p-5 sm:p-6", className)} {...props} />;
}

type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Heading level for the title; sections inside a page default to h2. */
  as?: "h2" | "h3";
};

export function CardHeader({ title, description, actions, className, as: Heading = "h2" }: CardHeaderProps) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-x-4 gap-y-3", className)}>
      <div className="min-w-0">
        <Heading className="text-sm font-semibold text-fg">{title}</Heading>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
