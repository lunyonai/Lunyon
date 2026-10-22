import { useSearchParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import AppShell from "../../layouts/AppShell";
import { useLocale } from "../../i18n/LocaleProvider";
import DashboardHeader from "./components/DashboardHeader";
import StatsGrid from "./components/StatsGrid.tsx";
import ActivityFeed from "./components/ActivityFeed.tsx";
import SystemStatus from "./components/SystemStatus.tsx";
import ActivityChart from "./components/ActivityChart";
import AskAssistantCard from "./components/AskAssistantCard";
import GettingStarted from "./components/GettingStarted";
import { useWorkspaceStatus } from "./useWorkspaceStatus";
import InboxWidget from "./components/InboxWidget";
import TodayAgenda from "./components/TodayAgenda";

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
  const workspace = useWorkspaceStatus();
  return (
    <AppShell>
      <section className="space-y-6">
        <PaymentNotice />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid xl:col-span-2">
            <DashboardHeader />
          </div>
          <AskAssistantCard />
        </div>

        <StatsGrid />

        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ActivityChart />
            <GettingStarted status={workspace} />
            <ActivityFeed />
          </div>

          <div className="space-y-6">
            <TodayAgenda />
            <InboxWidget />
            <SystemStatus status={workspace} />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
