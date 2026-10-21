import { useEffect, useState } from "react";
import { localeMeta } from "../../i18n/config";
import { useLocale } from "../../i18n/LocaleProvider";
import { api, type EntitlementResponse } from "../../lib/api";

export default function PlanPanel() {
  const { t, locale } = useLocale();
  const [plan, setPlan] = useState<EntitlementResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .entitlement()
      .then(setPlan)
      .catch(() => setPlan(null));
  }, []);

  async function handleCheckout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const session = await api.stripeCheckout();
      if (!session.url) throw new Error("no url");
      window.location.assign(session.url);
    } catch {
      setError(t("app.billing.checkoutError"));
      setBusy(false);
    }
  }

  const until = plan?.accessUntil
    ? new Intl.DateTimeFormat(localeMeta[locale].htmlLang, { dateStyle: "long" }).format(
        new Date(plan.accessUntil),
      )
    : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-base font-semibold text-white">{t("app.billing.section")}</h2>

      {plan?.active ? (
        <p className="mt-3 text-sm text-emerald-400">
          {t("app.billing.active", { date: until ?? "—" })}
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-300">
          {plan?.status === "expired" && until
            ? t("app.billing.expired", { date: until })
            : t("app.billing.free")}
        </p>
      )}
      <p className="mt-2 text-sm text-slate-400">{t("app.billing.hint")}</p>

      <button
        type="button"
        onClick={() => void handleCheckout()}
        disabled={busy}
        className="mt-5 flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {busy
          ? t("app.billing.redirecting")
          : plan?.active
            ? t("app.billing.extend")
            : t("app.billing.buy")}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
