import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const stages = [
  {
    n: "01",
    title: "You describe the work.",
    body: "Prompts give Lunyo the context and instructions it needs.",
  },
  {
    n: "02",
    title: "Lunyo builds the process.",
    body: "Workflows connect the steps that need to happen.",
  },
  {
    n: "03",
    title: "AI Employees do the work.",
    body: "Specialized AI workers execute recurring tasks.",
  },
  {
    n: "04",
    title: "You get the outcome.",
    body: "Not more AI conversations. Work completed.",
  },
] as const;

export default function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { once: false, margin: "-80px" });
  const animatePulse = Boolean(inView && !reduceMotion);

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 bg-transparent py-24 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="text-3xl font-semibold tracking-tight text-[var(--lunyo-text)] md:text-4xl"
        >
          From instruction to outcome.
        </motion.h2>

        <div ref={trackRef} className="relative mt-16">
          <div className="pointer-events-none absolute inset-y-0 left-[13px] w-px bg-[var(--lunyo-border)] md:hidden" />
          <div className="pointer-events-none absolute top-[15px] right-[6%] left-[6%] hidden h-px bg-[var(--lunyo-border)] md:block" />

          {animatePulse && (
            <>
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-[12px] hidden h-[7px] w-[7px] rounded-full bg-[rgb(96,165,250)] md:block"
                initial={{ left: "6%", opacity: 0.35 }}
                animate={{ left: ["6%", "94%"], opacity: [0.35, 0.9, 0.35] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute left-[10px] h-[7px] w-[7px] rounded-full bg-[rgb(96,165,250)] md:hidden"
                initial={{ top: "2%", opacity: 0.35 }}
                animate={{ top: ["2%", "96%"], opacity: [0.35, 0.9, 0.35] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </>
          )}

          <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
            {stages.map((stage, index) => (
              <motion.li
                key={stage.n}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.48,
                  delay: reduceMotion ? 0 : index * 0.08,
                  ease,
                }}
                className="relative pl-10 md:pl-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border border-[rgba(96,165,250,0.45)] bg-[rgba(148,163,184,0.35)] md:relative md:top-0 md:mb-6 md:block"
                />
                <p className="text-xs tabular-nums tracking-[0.14em] text-[var(--lunyo-text-muted)]">
                  {stage.n}
                </p>
                <h3 className="mt-3 text-lg font-medium tracking-tight text-[var(--lunyo-text)]">
                  {stage.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--lunyo-text-muted)]">
                  {stage.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
