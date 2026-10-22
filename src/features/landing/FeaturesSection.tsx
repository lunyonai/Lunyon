import ProductShowcase from "./ProductShowcase";
import SectionHeader from "./SectionHeader";
import { useLocale } from "../../i18n/LocaleProvider";

export default function FeaturesSection() {
  const { t } = useLocale();

  return (
    <section id="product" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={t("product.kicker")}
          title={t("product.headline")}
          subtitle={t("product.supporting")}
        />
        <ProductShowcase />
      </div>
    </section>
  );
}
