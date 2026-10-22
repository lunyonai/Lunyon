import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClass, cx } from "../../components/ui/styles";
import { loginPath } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";
import SectionHeader from "./SectionHeader";
import { reveal } from "./landingMotion";

export default function PricingSection() {
  const { locale, t } = useLocale();

  /** "Full access" covers every product area; labels reuse the product's own names. */
  const included = [
    t("product.tabEmployees"),
    t("product.tabPrompts"),
    t("product.tabWorkflows"),
    `${t("app.dashboard.serviceGmail")} · ${t("app.dashboard.serviceCalendar")}`,
    t("app.nav.assistant"),
  ];

  return (
    <section id="pricing" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={t("nav.pricing")} title={t("pricing.headline")} />

        <motion.div {...reveal(0.1, 24)} className="relative mx-auto mt-14 max-w-md sm:mt-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 blur-3xl"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 40%, color-mix(in srgb, var(--ui-primary) 30%, transparent), transparent 70%), radial-gradient(40% 40% at 70% 80%, color-mix(in srgb, var(--ui-tint-violet) 24%, transparent), transparent 70%)",
            }}
          />
          <div className="rounded-[20px] bg-gradient-to-b from-primary/60 to-tint-violet/40 p-px shadow-[0_24px_80px_-24px_color-mix(in_srgb,var(--ui-primary)_45%,transparent)]">
            <div className="relative overflow-hidden rounded-[19px] bg-surface p-7 sm:p-9">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-40"
                style={{
                  background:
                    "radial-gradient(70% 100% at 50% 0%, color-mix(in srgb, var(--ui-primary) 14%, transparent), transparent 70%)",
                }}
              />
              <p className="relative text-sm font-medium text-fg-muted">{t("pricing.fullAccess")}</p>
              <p className="relative mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-semibold tracking-tight text-fg sm:text-7xl">$20</span>
                <span className="text-base text-fg-muted">{t("pricing.perYear")}</span>
              </p>

              <ul className="relative mt-8 space-y-3 border-t border-line pt-6">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-fg">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-text ring-1 ring-inset ring-primary/25">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to={loginPath(locale)}
                className={cx(
                  buttonClass({ variant: "primary", size: "lg", block: true }),
                  "group relative mt-8 h-11 shadow-[0_8px_30px_-8px_color-mix(in_srgb,var(--ui-primary)_70%,transparent)]",
                )}
              >
                {t("pricing.getStarted")}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>

              <p className="relative mt-4 text-center text-xs text-fg-subtle">{t("pricing.footnote")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
