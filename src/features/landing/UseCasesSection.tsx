import { motion, useReducedMotion } from "framer-motion";
import { useLocale } from "../../i18n/LocaleProvider";

const ease = [0.22, 1, 0.36, 1] as const;

export default function UseCasesSection() {
  const reduceMotion = useReducedMotion();
  const { messages } = useLocale();

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
          {messages.useCases.headline}
        </motion.h2>

        <div className="relative mt-16 max-w-2xl">
          <div className="pointer-events-none absolute top-2 bottom-2 left-[5px] w-px bg-[var(--lunyo-border)]" />

          <ol className="space-y-12 sm:space-y-14">
            {messages.useCases.moments.map((moment, index) => (
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
