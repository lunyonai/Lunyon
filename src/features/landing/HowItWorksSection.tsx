import { motion, useInView, useReducedMotion } from "framer-motion";
import { Bot, CheckCircle2, PenLine, Workflow, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { useLocale } from "../../i18n/LocaleProvider";
import GlowCard from "./GlowCard";
import SectionHeader from "./SectionHeader";
import { reveal } from "./landingMotion";

const stepVisuals: Array<{ icon: LucideIcon; tone: TileTone }> = [
  { icon: PenLine, tone: "primary" },
  { icon: Workflow, tone: "orange" },
  { icon: Bot, tone: "violet" },
  { icon: CheckCircle2, tone: "emerald" },
];

/** Gradient that runs through the connector line and the numbered nodes. */
const lineGradient =
  "linear-gradient(90deg, var(--ui-primary), var(--ui-tint-violet) 50%, var(--ui-tint-emerald))";
const lineGradientVertical =
  "linear-gradient(180deg, var(--ui-primary), var(--ui-tint-violet) 50%, var(--ui-tint-emerald))";

export default function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { once: false, margin: "-80px" });
  const animatePulse = Boolean(inView && !reduceMotion);
  const { messages, t } = useLocale();
  const stages = messages.how.stages;

  return (
    <section id="how-it-works" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={t("nav.howItWorks")} title={messages.how.headline} />

        <div ref={trackRef} className="relative mt-14 sm:mt-20">
          {/* connector: horizontal on desktop (through the number nodes), vertical on mobile */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-5 hidden h-px opacity-60 md:block"
            style={{ background: lineGradient }}
          />

          {animatePulse && (
            <>
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-5 hidden h-1.5 w-16 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-primary-text to-transparent blur-[1px] md:block"
                initial={{ left: "12.5%", opacity: 0 }}
                animate={{ left: ["12.5%", "82%"], opacity: [0, 1, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
              />
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute left-5 h-16 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-primary-text to-transparent blur-[1px] md:hidden"
                initial={{ top: "2%", opacity: 0 }}
                animate={{ top: ["2%", "72%"], opacity: [0, 1, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
              />
            </>
          )}

          <ol className="relative grid gap-6 md:grid-cols-4 md:gap-5">
            {stages.map((stage, index) => {
              const visual = stepVisuals[index % stepVisuals.length];
              return (
                <motion.li
                  key={stage.n}
                  {...reveal(index * 0.08, 16)}
                  className="relative flex gap-5 md:flex-col md:items-center md:gap-0"
                >
                  {index < stages.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-6 left-5 top-10 w-px opacity-60 md:hidden"
                      style={{ background: lineGradientVertical }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-px shadow-[0_0_24px_-4px_color-mix(in_srgb,var(--ui-primary)_60%,transparent)]"
                    style={{ background: lineGradient }}
                  >
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-canvas text-xs font-semibold tabular-nums text-fg">
                      {stage.n}
                    </span>
                  </span>

                  <GlowCard className="min-w-0 flex-1 p-5 md:mt-6 md:w-full">
                    <IconTile icon={visual.icon} tone={visual.tone} size="sm" />
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-fg">{stage.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-fg-muted">{stage.body}</p>
                  </GlowCard>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
