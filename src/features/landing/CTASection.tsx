import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { loginPath } from "../../i18n/paths";
import { useLocale } from "../../i18n/LocaleProvider";

export default function CTASection() {
  const { locale, t } = useLocale();

  return (
    <section id="cta" className="bg-transparent py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-semibold text-white md:text-4xl"
        >
          {t("cta.headline")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-4 max-w-xl text-slate-400"
        >
          {t("cta.supporting")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <Link
            to={loginPath(locale)}
            className="inline-block rounded-full bg-white px-10 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {t("cta.button")}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-16"
        >
          <p className="text-sm font-medium tracking-tight text-white">
            {t("cta.brand")}
          </p>
          <p className="mt-1 text-sm text-slate-400">{t("cta.tagline")}</p>
        </motion.div>
      </div>
    </section>
  );
}
