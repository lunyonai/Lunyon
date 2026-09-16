import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const moments = [
  {
    when: "Before your first meeting",
    copy: "Lunyo checks what matters, summarizes relevant information and prepares the context you need.",
  },
  {
    when: "While you're working",
    copy: "AI Employees handle repetitive research, summaries, organization and recurring tasks.",
  },
  {
    when: "After a meeting",
    copy: "Lunyo turns notes into summaries, action items and follow-ups.",
  },
  {
    when: "At the end of the week",
    copy: "Reports that used to consume your time are already prepared.",
  },
] as const;

export default function UseCasesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative bg-transparent py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--lunyo-text)] md:text-4xl"
        >
          What could Lunyo take off your plate today?
        </motion.h2>

        <div className="relative mt-16 max-w-2xl">
          <div className="pointer-events-none absolute top-2 bottom-2 left-[5px] w-px bg-[var(--lunyo-border)]" />

          <ol className="space-y-12 sm:space-y-14">
            {moments.map((moment, index) => (
              <motion.li
                key={moment.when}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.48,
                  delay: reduceMotion ? 0 : index * 0.06,
                  ease,
                }}
                className="relative pl-10"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border border-[rgba(96,165,250,0.4)] bg-[rgba(148,163,184,0.4)]"
                />
                <p className="text-xs font-medium tracking-[0.14em] text-[var(--lunyo-text-muted)] uppercase">
                  {moment.when}
                </p>
                <p className="mt-3 text-base leading-7 text-[var(--lunyo-text)]/88 sm:text-lg">
                  {moment.copy}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
