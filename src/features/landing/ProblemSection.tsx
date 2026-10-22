import { motion } from "framer-motion";
import { FileText, ListChecks, Mail, Repeat2, Search, Send, Users, type LucideIcon } from "lucide-react";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { useLocale } from "../../i18n/LocaleProvider";
import GlowCard from "./GlowCard";
import SectionHeader from "./SectionHeader";
import { reveal } from "./landingMotion";

/** Icon + tone per item, in the same order as `problem.items`. */
const visuals: Array<{ icon: LucideIcon; tone: TileTone }> = [
  { icon: Mail, tone: "primary" },
  { icon: Users, tone: "violet" },
  { icon: FileText, tone: "orange" },
  { icon: Search, tone: "cyan" },
  { icon: Send, tone: "rose" },
  { icon: ListChecks, tone: "emerald" },
];

export default function ProblemSection() {
  const { messages } = useLocale();
  const copy = messages.problem;

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={copy.eyebrow} title={copy.headline} subtitle={copy.supporting} />

        <ul className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {copy.items.map((item, index) => {
            const visual = visuals[index % visuals.length];
            return (
              <motion.li key={item} {...reveal(index * 0.05, 14)}>
                <GlowCard className="flex h-full items-center gap-4 p-4 sm:p-5">
                  <IconTile icon={visual.icon} tone={visual.tone} size="md" />
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-6 text-fg">{item}</span>
                  <Repeat2 className="h-4 w-4 shrink-0 text-fg-subtle/60" aria-hidden="true" />
                </GlowCard>
              </motion.li>
            );
          })}
        </ul>

        <motion.p
          {...reveal(0.1, 12)}
          className="mx-auto mt-14 max-w-2xl text-balance text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          <span className="bg-gradient-to-r from-primary-text via-tint-violet to-tint-cyan bg-clip-text text-transparent">
            {copy.close}
          </span>
        </motion.p>
      </div>
    </section>
  );
}
