import {
  Bot,
  CalendarDays,
  House,
  Mail,
  LibraryBig,
  PanelLeft,
  Settings,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "../features/auth/components/Logo";
import LanguageSwitcher from "../features/landing/LanguageSwitcher";
import NotificationsPopover from "../features/notifications/NotificationsPopover";
import { NavLink, useLocation } from "react-router-dom";
import { IconButton } from "../components/ui/Button";
import { cx, navItemClass } from "../components/ui/styles";
import { useLocale } from "../i18n/LocaleProvider";
import ThemeToggle from "../theme/ThemeToggle";
import UserMenu from "./UserMenu";

type AppShellProps = {
  children: ReactNode;
};

const navigation = [
  { key: "overview", icon: House, to: "/dashboard" },
  { key: "assistant", icon: Sparkles, to: "/assistant" },
  { key: "employees", icon: Bot, to: "/employees" },
  { key: "prompts", icon: LibraryBig, to: "/prompts" },
  { key: "workflows", icon: Workflow, to: "/workflows" },
  { key: "calendar", icon: CalendarDays, to: "/calendar" },
  { key: "mail", icon: Mail, to: "/mail" },
] as const;

/** Sidebar item with a brand-colored indicator bar on the active route. */
function sidebarItemClass(active: boolean) {
  return cx(
    navItemClass(active),
    active &&
      "before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-primary",
  );
}

/** Section name for the top bar; each page renders its own title and description. */
function sectionTitle(pathname: string, t: (path: string) => string): string {
  if (pathname.startsWith("/employees")) return t("app.nav.employees");
  if (pathname === "/prompts") return t("app.nav.prompts");
  if (pathname === "/workflows") return t("app.nav.workflows");
  if (pathname === "/calendar") return t("app.nav.calendar");
  if (pathname === "/assistant") return t("app.nav.assistant");
  if (pathname === "/mail") return t("app.nav.mail");
  if (pathname === "/settings") return t("app.nav.settings");
  return t("app.nav.overview");
}

export default function AppShell({ children }: AppShellProps) {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const section = sectionTitle(pathname, t);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const nav = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
          {t("app.nav.workspace")}
        </p>

        <div className="space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={closeSidebar}
                className={({ isActive }) => sidebarItemClass(isActive)}
              >
                <Icon aria-hidden="true" />
                {t(`app.nav.${item.key}`)}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="space-y-1 border-t border-line p-3">
        <NavLink
          to="/settings"
          onClick={closeSidebar}
          className={({ isActive }) => sidebarItemClass(isActive)}
        >
          <Settings aria-hidden="true" />
          {t("app.nav.settings")}
        </NavLink>
        <UserMenu />
      </div>
    </>
  );

  const brand = (
    <div className="flex h-16 shrink-0 items-center px-5">
      <Logo size="small" />
    </div>
  );

  return (
    <div className="relative min-h-screen bg-canvas text-fg">
      {/* Ambient brand glow behind the content area. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] lg:left-64"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 70% at 15% 0%, var(--ui-glow-1), transparent 70%), radial-gradient(ellipse 50% 60% at 85% 0%, var(--ui-glow-2), transparent 70%)",
        }}
      />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        {brand}
        {nav}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("app.common.close")}
            onClick={closeSidebar}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-line bg-surface shadow-overlay">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <IconButton aria-label={t("app.common.close")} size="sm" onClick={closeSidebar}>
                <X />
              </IconButton>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <IconButton
              aria-label={t("app.nav.openSidebar")}
              onClick={() => setSidebarOpen(true)}
              className="-ml-1.5 lg:hidden"
            >
              <PanelLeft />
            </IconButton>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-fg-subtle sm:inline">{t("app.nav.personalWorkspace")}</span>
              <span className="hidden text-fg-placeholder sm:inline" aria-hidden="true">/</span>
              <span className="truncate font-medium text-fg">{section}</span>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="mr-2 hidden sm:block">
              <LanguageSwitcher />
            </div>
            <ThemeToggle />
            <NotificationsPopover />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
