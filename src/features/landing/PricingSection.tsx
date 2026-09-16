import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-transparent py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl font-semibold text-white md:text-4xl"
        >
          Simple pricing. No surprises.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center"
        >
          <p className="text-sm text-slate-400">Full access for</p>
<p className="mt-2 text-6xl font-semibold text-white">$20</p>
<p className="mt-1 text-slate-400">per year</p>

          <Link
            to="/login"
            className="mt-8 inline-block w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Get Started
          </Link>

          <p className="mt-4 text-xs text-slate-500">
            One-time payment. 12 months of access.
          </p>
        </motion.div>
      </div>
    </section>
  );
}