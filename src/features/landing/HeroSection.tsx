import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonClass, cx } from "../../components/ui/styles";
import { loginPath, sectionHref } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";
import { ease } from "./landingMotion";

function intro(delay: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
  } as const;
}

export default function HeroSection() {
  const { locale, t } = useLocale();

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-48 lg:pb-32 lg:pt-56">
      {/* spotlight + fading grid behind the headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, color-mix(in srgb, var(--ui-primary) 20%, transparent), transparent 70%), radial-gradient(35% 40% at 80% 30%, color-mix(in srgb, var(--ui-tint-violet) 9%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--ui-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-line) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 0%, #000 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 0%, #000 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.p
            {...intro(0)}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-line-strong/70 bg-surface/70 py-1 pl-1.5 pr-3.5 text-xs font-medium text-fg-muted shadow-card backdrop-blur sm:text-[13px]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-tint-violet/30 ring-1 ring-inset ring-primary/30">
              <Sparkles className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
            </span>
            <span className="truncate">{t("hero.eyebrow")}</span>
          </motion.p>

          <motion.h1
            {...intro(0.06)}
            className="mt-7 text-balance bg-gradient-to-b from-fg from-30% to-fg/55 bg-clip-text pb-2 text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-transparent sm:text-6xl lg:text-7xl"
          >
            {t("hero.headline")}
          </motion.h1>

          <motion.p
            {...intro(0.12)}
            className="mt-5 max-w-2xl text-pretty text-base leading-7 text-fg-muted sm:text-lg sm:leading-8"
          >
            {t("hero.body")}
          </motion.p>

          <motion.div
            {...intro(0.18)}
            className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Link
              to={loginPath(locale)}
              className={cx(
                buttonClass({ variant: "primary", size: "lg" }),
                "group h-11 px-5 shadow-[0_8px_30px_-8px_color-mix(in_srgb,var(--ui-primary)_70%,transparent)]",
              )}
            >
              {t("hero.getStarted")}
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href={sectionHref(locale, "how-it-works")}
              className={cx(buttonClass({ variant: "secondary", size: "lg" }), "h-11 bg-surface/60 px-5 backdrop-blur")}
            >
              {t("hero.seeHow")}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
