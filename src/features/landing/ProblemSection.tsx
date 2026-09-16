import { motion, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const work = [
  "Replying to repetitive emails",
  "Summarizing meetings",
  "Preparing weekly reports",
  "Researching information",
  "Following up with clients",
  "Turning notes into action items",
];

export default function ProblemSection() {
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
          Your day is full of work that shouldn&apos;t need you.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="mt-5 max-w-xl text-base leading-7 text-[var(--lunyo-text-muted)] sm:text-lg"
        >
          Important work often gets buried under repetitive work.
        </motion.p>

        <ul className="mt-14 max-w-2xl">
          {work.map((item, index) => (
            <motion.li
              key={item}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.45,
                delay: reduceMotion ? 0 : index * 0.07,
                ease,
              }}
              className="flex items-baseline gap-4 border-b border-[var(--lunyo-border)] py-4 first:border-t"
            >
              <span className="w-7 shrink-0 text-xs tabular-nums text-[var(--lunyo-text-muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-base text-[var(--lunyo-text)]/90 sm:text-lg">
                {item}
              </span>
            </motion.li>
          ))}
        </ul>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.12, ease }}
          className="mt-14 max-w-xl text-xl font-medium tracking-tight text-[var(--lunyo-text)] sm:text-2xl"
        >
          Lunyo takes that work off your plate.
        </motion.p>
      </div>
    </section>
  );
}
