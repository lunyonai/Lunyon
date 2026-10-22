import { motion } from "framer-motion";
import { CalendarCheck2, Laptop, MessagesSquare, Sunrise, type LucideIcon } from "lucide-react";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { useLocale } from "../../i18n/LocaleProvider";
import GlowCard from "./GlowCard";
import SectionHeader from "./SectionHeader";
import { reveal } from "./landingMotion";

/** One visual per moment of the day, same order as `useCases.moments`. */
const visuals: Array<{ icon: LucideIcon; tone: TileTone }> = [
  { icon: Sunrise, tone: "amber" },
  { icon: Laptop, tone: "primary" },
  { icon: MessagesSquare, tone: "violet" },
  { icon: CalendarCheck2, tone: "emerald" },
];

export default function UseCasesSection() {
  const { messages } = useLocale();
  const copy = messages.useCases;

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.headline} />

        <ol className="mt-14 grid gap-4 sm:mt-16 md:grid-cols-2">
          {copy.moments.map((moment, index) => {
            const visual = visuals[index % visuals.length];
            return (
              <motion.li key={moment.when} {...reveal(index * 0.06, 16)}>
                <GlowCard className="flex h-full gap-4 p-5 sm:gap-5 sm:p-7">
                  <div className="flex flex-col items-center">
                    <IconTile icon={visual.icon} tone={visual.tone} size="lg" />
                    <span className="mt-3 text-[11px] font-medium tabular-nums text-fg-subtle" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-subtle">{moment.when}</h3>
                    <p className="mt-2.5 text-base leading-7 text-fg sm:text-lg sm:leading-8">{moment.copy}</p>
                  </div>
                </GlowCard>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
