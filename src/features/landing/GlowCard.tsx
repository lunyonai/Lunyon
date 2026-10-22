import type { HTMLAttributes } from "react";
import { cx } from "../../components/ui/styles";

/**
 * Landing card: surface pane with a hairline border that picks up a primary/violet gradient
 * and a soft inner glow on hover. Tokens only, so it follows the theme.
 */
export default function GlowCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "group/card relative isolate overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-card backdrop-blur-sm transition duration-300 hover:border-line-strong",
        className,
      )}
      {...props}
    >
      {/* gradient hairline that fades in on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          padding: 1,
          background:
            "linear-gradient(140deg, color-mix(in srgb, var(--ui-primary) 70%, transparent), transparent 40%, transparent 60%, color-mix(in srgb, var(--ui-tint-violet) 55%, transparent))",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* inner glow from the top */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, color-mix(in srgb, var(--ui-primary) 9%, transparent), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
