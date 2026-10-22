import { animate, motion, useReducedMotion } from "framer-motion";
import { Clock3, Hourglass } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { IconTile } from "../../components/ui/IconTile";
import { useLocale } from "../../i18n/LocaleProvider";
import SectionHeader from "./SectionHeader";
import { ease, reveal } from "./landingMotion";

const MIN = 1;
const MAX = 20;
const WEEKS = 52;

export default function TimeCalculatorSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useLocale();
  const sliderId = useId();
  const [hours, setHours] = useState(5);
  const [animatedHours, setAnimatedHours] = useState(5 * WEEKS);
  const displayRef = useRef(5 * WEEKS);
  const target = hours * WEEKS;
  // With reduced motion the number jumps straight to the target; no state sync needed.
  const displayHours = reduceMotion ? target : animatedHours;

  useEffect(() => {
    if (reduceMotion) {
      displayRef.current = target;
      return;
    }
    const controls = animate(displayRef.current, target, {
      duration: 0.45,
      ease,
      onUpdate: (value) => {
        const next = Math.round(value);
        displayRef.current = next;
        setAnimatedHours(next);
      },
    });
    return () => controls.stop();
  }, [target, reduceMotion]);

  const fill = ((hours - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={t("calculator.eyebrow")} title={t("calculator.headline")} subtitle={t("calculator.question")} />

        <motion.div
          {...reveal(0.1, 24)}
          className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-card backdrop-blur-sm sm:mt-16"
        >
          <div className="grid md:grid-cols-2">
            {/* input side */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <IconTile icon={Clock3} tone="primary" size="md" />
                <label htmlFor={sliderId} className="text-sm font-medium text-fg-muted">
                  {t("calculator.sliderAria")}
                </label>
              </div>

              <p className="mt-8 text-4xl font-semibold tracking-tight tabular-nums text-fg sm:text-5xl" aria-live="polite">
                {t(hours === 1 ? "calculator.hourWeek" : "calculator.hoursWeek", { count: hours })}
              </p>

              <input
                id={sliderId}
                type="range"
                min={MIN}
                max={MAX}
                step={1}
                value={hours}
                onChange={(event) => setHours(Number(event.target.value))}
                className="mt-8 h-2 w-full cursor-pointer appearance-none rounded-full accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-4 focus-visible:ring-offset-surface [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ui-primary)_35%,transparent)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--ui-primary)_35%,transparent),0_2px_6px_rgb(0_0_0/0.4)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
                style={{
                  background: `linear-gradient(90deg, var(--ui-primary), var(--ui-tint-violet) ${fill}%, var(--ui-surface-3) ${fill}%)`,
                }}
              />
              <div className="mt-3 flex justify-between text-xs tabular-nums text-fg-subtle">
                <span>{MIN}h</span>
                <span>{t("calculator.range")}</span>
                <span>{MAX}h</span>
              </div>
            </div>

            {/* result side */}
            <div className="relative isolate border-t border-line p-6 sm:p-8 md:border-l md:border-t-0">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(90% 70% at 100% 0%, color-mix(in srgb, var(--ui-primary) 20%, transparent), transparent 70%), radial-gradient(70% 60% at 0% 100%, color-mix(in srgb, var(--ui-tint-violet) 14%, transparent), transparent 70%)",
                }}
              />
              <div className="flex items-center gap-3">
                <IconTile icon={Hourglass} tone="violet" size="md" />
                <p className="text-sm font-medium text-fg-muted">{t("calculator.acrossYear")}</p>
              </div>
              <p className="mt-8 flex items-baseline gap-3">
                <span className="bg-gradient-to-br from-fg to-primary-text bg-clip-text text-6xl font-semibold tracking-tight tabular-nums text-transparent sm:text-7xl">
                  {displayHours}
                </span>
                <span className="text-xl font-medium text-fg-muted sm:text-2xl">{t("calculator.hours")}</span>
              </p>
              <p className="mt-6 text-lg font-medium leading-7 text-fg">
                {t("calculator.whatWouldYouDo", { hours: displayHours })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line bg-surface-2/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="text-xs leading-5 text-fg-subtle">{t("calculator.disclaimer")}</p>
            <p className="shrink-0 text-sm font-semibold tracking-tight text-fg">{t("calculator.close")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
