import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import DashboardHeader from "./components/DashboardHeader";
import StatsGrid from "./components/StatsGrid.tsx";
import ActivityFeed from "./components/ActivityFeed.tsx";
import SystemStatus from "./components/SystemStatus.tsx";

function PaymentNotice() {
  const { t } = useLocale();
  const [params, setParams] = useSearchParams();
  const paid = params.get("paid") === "1";
  const canceled = params.get("canceled") === "1";
  if (!paid && !canceled) return null;

  function dismiss() {
    const next = new URLSearchParams(params);
    next.delete("paid");
    next.delete("canceled");
    setParams(next, { replace: true });
  }

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
        paid
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/20 bg-amber-500/10 text-amber-300"
      }`}
    >
      <p>{t(paid ? "app.billing.paidNotice" : "app.billing.canceledNotice")}</p>
      <button
        type="button"
        aria-label={t("app.common.close")}
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardPage() {

  return (
    <AppShell>
      <section className="space-y-8">
        <PaymentNotice />

        <DashboardHeader />

        <StatsGrid />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ActivityFeed />
          </div>

          <div className="xl:col-span-2">
            <SystemStatus />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
