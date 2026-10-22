import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass, cx } from "../../components/ui/styles";
import { loginPath, sectionHref } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";
import { reveal } from "./landingMotion";

export default function CTASection() {
  const { locale, t } = useLocale();

  return (
    <section id="cta" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          {...reveal(0, 24)}
          className="relative isolate overflow-hidden rounded-3xl border border-line bg-surface/70 px-6 py-16 text-center shadow-card backdrop-blur-sm sm:px-12 sm:py-24"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 0%, color-mix(in srgb, var(--ui-primary) 30%, transparent), transparent 70%), radial-gradient(40% 60% at 85% 100%, color-mix(in srgb, var(--ui-tint-violet) 20%, transparent), transparent 70%), radial-gradient(35% 55% at 10% 100%, color-mix(in srgb, var(--ui-tint-cyan) 12%, transparent), transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--ui-line) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-line) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 50% 0%, #000 20%, transparent 75%)",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-primary-text/70 to-transparent"
          />

          <h2 className="mx-auto max-w-2xl text-balance bg-gradient-to-b from-fg via-fg to-fg/65 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            {t("cta.headline")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-fg-muted sm:text-lg">
            {t("cta.supporting")}
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to={loginPath(locale)}
              className={cx(
                buttonClass({ variant: "primary", size: "lg" }),
                "group h-11 whitespace-normal px-5 text-center shadow-[0_8px_30px_-8px_color-mix(in_srgb,var(--ui-primary)_70%,transparent)]",
              )}
            >
              {t("cta.button")}
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href={sectionHref(locale, "how-it-works")}
              className={cx(buttonClass({ variant: "secondary", size: "lg" }), "h-11 bg-surface/60 px-5 backdrop-blur")}
            >
              {t("hero.seeHow")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
