import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ProductPreview from "./ProductPreview";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.45, ease }}
            className="text-4xl font-semibold tracking-tight text-[var(--lunyo-text)] sm:text-5xl lg:text-6xl"
          >
            Reclaim Your Time.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.08, ease }}
            className="mt-5 max-w-md text-base leading-7 text-[var(--lunyo-text-muted)] sm:text-lg"
          >
            Lunyo turns repetitive work into automated workflows, giving you
            more time to focus on what matters.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.16, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-[var(--lunyo-radius)] bg-[var(--lunyo-primary)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Get Started
            </Link>
            <a
              href="/#how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] px-5 text-sm font-medium text-[var(--lunyo-text)] transition hover:bg-[var(--lunyo-surface)]/80"
            >
              See how Lunyo works
            </a>
          </motion.div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
