import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
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
    <Card>
      <CardHeader
        title={t("app.billing.section")}
        actions={
          !plan ? undefined : plan.active ? (
            <Badge tone="primary" dot>
              {t("app.workflows.statusActive")}
            </Badge>
          ) : (
            <Badge>{t("app.dashboard.planFree")}</Badge>
          )
        }
      />

      <div className="mt-5 rounded-lg border border-line bg-surface-2 px-4 py-3.5">
        {plan?.active ? (
          <p className="text-sm font-medium text-fg">
            {t("app.billing.active", { date: until ?? "—" })}
          </p>
        ) : (
          <p className="text-sm font-medium text-fg">
            {plan?.status === "expired" && until
              ? t("app.billing.expired", { date: until })
              : t("app.billing.free")}
          </p>
        )}
        <p className="mt-1.5 text-sm text-fg-muted">{t("app.billing.hint")}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {error && <p className="text-sm text-danger-text">{error}</p>}
        <Button variant="primary" onClick={() => void handleCheckout()} disabled={busy}>
          {busy
            ? t("app.billing.redirecting")
            : plan?.active
              ? t("app.billing.extend")
              : t("app.billing.buy")}
        </Button>
      </div>
    </Card>
  );
}
