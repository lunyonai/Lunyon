import {
  Bot,
  House,
  LibraryBig,
  PanelLeft,
  Settings,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Logo from "../features/auth/components/Logo";
import LanguageSwitcher from "../features/landing/LanguageSwitcher";
import NotificationsPopover from "../features/notifications/NotificationsPopover";
import { NavLink, useLocation } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";
import UserMenu from "./UserMenu";

type AppShellProps = {
  children: ReactNode;
};

const navigation = [
  { key: "overview", icon: House, to: "/dashboard" },
  { key: "employees", icon: Bot, to: "/employees" },
  { key: "prompts", icon: LibraryBig, to: "/prompts" },
  { key: "workflows", icon: Workflow, to: "/workflows" },
] as const;

function headerCopy(
  pathname: string,
  t: (path: string) => string,
): { title: string; subtitle: string } {
  if (pathname.startsWith("/employees/") && pathname !== "/employees") {
    return {
      title: t("app.employees.configureTitle"),
      subtitle: t("app.employees.configureSubtitle"),
    };
  }
  if (pathname === "/employees") {
    return {
      title: t("app.nav.employees"),
      subtitle: t("app.employees.subtitle"),
    };
  }
  if (pathname === "/prompts") {
    return {
      title: t("app.nav.prompts"),
      subtitle: t("app.prompts.subtitle"),
    };
  }
  if (pathname === "/workflows") {
    return {
      title: t("app.nav.workflows"),
      subtitle: t("app.workflows.subtitle"),
    };
  }
  if (pathname === "/settings") {
    return {
      title: t("app.nav.settings"),
      subtitle: t("app.settings.subtitle"),
    };
  }
  return {
    title: t("app.nav.overview"),
    subtitle: t("app.nav.overviewSubtitle"),
  };
}

export default function AppShell({ children }: AppShellProps) {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const header = headerCopy(pathname, t);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = (
    <>
      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="px-3 pb-3 text-xs font-semibold tracking-wider text-slate-500">
          {t("app.nav.workspace")}
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;
          const label = t(`app.nav.${item.key}`);

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-500/10 text-blue-300"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-blue-500/10 text-blue-300"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          {t("app.nav.settings")}
        </NavLink>
        <UserMenu />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-800 px-6">
          <Logo size="small" />
        </div>
        {nav}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("app.common.close")}
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950">
            <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
              <Logo size="small" />
              <button
                type="button"
                aria-label={t("app.common.close")}
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between gap-3 border-b border-slate-800 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={t("app.nav.openSidebar")}
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {header.title}
              </p>
              <p className="truncate text-xs text-slate-500">{header.subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitcher />
            <NotificationsPopover />
          </div>
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
