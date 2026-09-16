import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function TimeCalculatorSection() {
  const reduceMotion = useReducedMotion();
  const [hours, setHours] = useState(5);
  const [displayHours, setDisplayHours] = useState(260);
  const displayRef = useRef(260);

  useEffect(() => {
    const target = hours * 52;
    if (reduceMotion) {
      displayRef.current = target;
      setDisplayHours(target);
      return;
    }

    const controls = animate(displayRef.current, target, {
      duration: 0.45,
      ease,
      onUpdate: (value) => {
        const next = Math.round(value);
        displayRef.current = next;
        setDisplayHours(next);
      },
    });

    return () => controls.stop();
  }, [hours, reduceMotion]);

  return (
    <section className="relative bg-transparent py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="text-3xl font-semibold tracking-tight text-[var(--lunyo-text)] md:text-4xl"
        >
          Your time has value.
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="mt-5 max-w-xl text-base leading-7 text-[var(--lunyo-text-muted)] sm:text-lg"
        >
          How much time do repetitive tasks take every week?
        </motion.p>

        <div className="mt-14 max-w-xl">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-[var(--lunyo-text-muted)]">
              {hours} {hours === 1 ? "hour" : "hours"} / week
            </p>
            <p className="text-xs text-[var(--lunyo-text-muted)]">1–20 hours</p>
          </div>

          <label className="mt-5 block">
            <span className="sr-only">Hours spent on repetitive tasks each week</span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={hours}
              onChange={(event) => setHours(Number(event.target.value))}
              className="h-8 w-full cursor-pointer appearance-none bg-transparent accent-[var(--lunyo-primary)]"
            />
          </label>

          <p className="mt-10 text-sm tracking-[0.12em] text-[var(--lunyo-text-muted)] uppercase">
            Across a year, that is
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-[var(--lunyo-text)] tabular-nums sm:text-6xl">
            {displayHours}{" "}
            <span className="text-2xl font-medium text-[var(--lunyo-text-muted)] sm:text-3xl">
              hours
            </span>
          </p>

          <p className="mt-8 max-w-md text-lg text-[var(--lunyo-text)]">
            What would you do with {displayHours} hours back?
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--lunyo-text-muted)]">
            This is the scale of repetitive work in a year — not a promise of
            how much Lunyo will recover.
          </p>
          <p className="mt-10 text-xl font-semibold tracking-tight text-[var(--lunyo-text)]">
            Reclaim Your Time.
          </p>
        </div>
      </div>
    </section>
  );
}
