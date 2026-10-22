/**
 * Class recipes for the design system. Prefer the components in this folder; use these
 * directly when the element must stay something else (a NavLink, a <label>, a native select).
 */

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost";
export type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg shadow-card hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-fg shadow-card hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white shadow-card hover:bg-danger-hover",
  dangerGhost: "text-danger-text hover:bg-danger/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
};

const iconButtonSizes: Record<ButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

export function buttonClass({
  variant = "secondary",
  size = "md",
  block = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size], block && "w-full", className);
}

export function iconButtonClass({
  variant = "ghost",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cx(buttonBase, buttonVariants[variant], iconButtonSizes[size], className);
}

export const cardClass = "rounded-xl border border-line bg-surface shadow-card";
/** Add to clickable cards (links, quick actions) for a gentle lift on hover. */
export const cardHoverClass =
  "transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover";

const fieldBase =
  "w-full rounded-lg border border-line bg-surface text-sm text-fg shadow-card outline-none transition " +
  "placeholder:text-fg-placeholder focus:border-primary focus:ring-3 focus:ring-primary/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-muted aria-invalid:border-danger";

export const inputClass = cx(fieldBase, "h-9 px-3");
export const textareaClass = cx(fieldBase, "min-h-24 px-3 py-2 leading-6");
export const selectClass = cx(fieldBase, "h-9 px-2.5");
export const labelClass = "text-sm font-medium text-fg";
export const hintClass = "text-xs text-fg-subtle";

export const popoverClass = "rounded-xl border border-line bg-surface p-1 shadow-overlay";
const menuItemBase =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors " +
  "disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";
export const menuItemClass = cx(menuItemBase, "text-fg-muted hover:bg-surface-2 hover:text-fg");
/** Destructive menu entry (delete, remove). Separate recipe: Tailwind can't override same-property utilities by order. */
export const dangerMenuItemClass = cx(menuItemBase, "text-danger-text hover:bg-danger/10");

/** Vertical/sub navigation items (sidebar, folder lists, settings tabs). */
export function navItemClass(active: boolean, className?: string) {
  return cx(
    "relative flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-sm font-medium transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
    active
      ? "bg-primary/10 text-fg [&_svg]:text-primary-text"
      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
    className,
  );
}

export const skeletonClass = "animate-pulse rounded-md bg-surface-2";
export const dividerClass = "border-line";
