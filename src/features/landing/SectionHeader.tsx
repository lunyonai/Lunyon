import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cx } from "../../components/ui/styles";
import { reveal } from "./landingMotion";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

/** Centered section intro: small eyebrow pill, tight h2 and a muted supporting line. */
export default function SectionHeader({ eyebrow, title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cx("mx-auto max-w-3xl text-center", className)}>
      {eyebrow && (
        <motion.p
          {...reveal(0, 10)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary-text" aria-hidden="true" />
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        {...reveal(0.05, 18)}
        className="mt-5 text-balance bg-gradient-to-b from-fg via-fg to-fg/65 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl md:text-5xl md:leading-[1.08]"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          {...reveal(0.1, 14)}
          className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-fg-muted sm:text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
