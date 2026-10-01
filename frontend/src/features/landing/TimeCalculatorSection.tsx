import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "../../i18n/LocaleProvider";

const ease = [0.22, 1, 0.36, 1] as const;

export default function TimeCalculatorSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useLocale();
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
          {t("calculator.headline")}
        </motion.h2>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="mt-5 max-w-xl text-base leading-7 text-[var(--lunyo-text-muted)] sm:text-lg"
        >
          {t("calculator.question")}
        </motion.p>

        <div className="mt-14 max-w-xl">
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-[var(--lunyo-text-muted)]">
              {t(hours === 1 ? "calculator.hourWeek" : "calculator.hoursWeek", {
                count: hours,
              })}
            </p>
            <p className="text-xs text-[var(--lunyo-text-muted)]">
              {t("calculator.range")}
            </p>
          </div>

          <label className="mt-5 block">
            <span className="sr-only">{t("calculator.sliderAria")}</span>
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
            {t("calculator.acrossYear")}
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight text-[var(--lunyo-text)] tabular-nums sm:text-6xl">
            {displayHours}{" "}
            <span className="text-2xl font-medium text-[var(--lunyo-text-muted)] sm:text-3xl">
              {t("calculator.hours")}
            </span>
          </p>

          <p className="mt-8 max-w-md text-lg text-[var(--lunyo-text)]">
            {t("calculator.whatWouldYouDo", { hours: displayHours })}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--lunyo-text-muted)]">
            {t("calculator.disclaimer")}
          </p>
          <p className="mt-10 text-xl font-semibold tracking-tight text-[var(--lunyo-text)]">
            {t("calculator.close")}
          </p>
        </div>
      </div>
    </section>
  );
}
