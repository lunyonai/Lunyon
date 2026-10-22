import { useSearchParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import DashboardHeader from "./components/DashboardHeader";
import StatsGrid from "./components/StatsGrid.tsx";
import ActivityFeed from "./components/ActivityFeed.tsx";
import SystemStatus from "./components/SystemStatus.tsx";
import ActivityChart from "./components/ActivityChart";
import QuickActions from "./components/QuickActions";

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
    <Alert
      tone={paid ? "success" : "warning"}
      onDismiss={dismiss}
      dismissLabel={t("app.common.close")}
    >
      {t(paid ? "app.billing.paidNotice" : "app.billing.canceledNotice")}
    </Alert>
  );
}

export default function DashboardPage() {

  return (
    <AppShell>
      <section className="space-y-6">
        <PaymentNotice />

        <DashboardHeader />

        <StatsGrid />

        <QuickActions />

        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ActivityChart />
            <ActivityFeed />
          </div>

          <SystemStatus />
        </div>
      </section>
    </AppShell>
  );
}
