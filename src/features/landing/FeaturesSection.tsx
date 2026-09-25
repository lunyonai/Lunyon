import { motion } from "framer-motion";
import ProductShowcase from "./ProductShowcase";
import { useLocale } from "../../i18n/LocaleProvider";

export default function FeaturesSection() {
  const { t } = useLocale();

  return (
    <section id="product" className="relative bg-transparent py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs font-medium tracking-[0.14em] text-[var(--lunyo-text-muted)] uppercase"
        >
          {t("product.kicker")}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 text-3xl font-semibold text-[var(--lunyo-text)] md:text-4xl"
        >
          {t("product.headline")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-xl text-[var(--lunyo-text-muted)]"
        >
          {t("product.supporting")}
        </motion.p>

        <ProductShowcase />
      </div>
    </section>
  );
}
