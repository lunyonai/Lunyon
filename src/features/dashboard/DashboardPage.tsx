import AppShell from "../../layouts/AppShell";
import DashboardHeader from "./components/DashboardHeader";
import StatsGrid from "./components/StatsGrid.tsx";
import ActivityFeed from "./components/ActivityFeed.tsx";
import SystemStatus from "./components/SystemStatus.tsx";


export default function DashboardPage() {

  return (
    <AppShell>
      <section className="space-y-8">
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