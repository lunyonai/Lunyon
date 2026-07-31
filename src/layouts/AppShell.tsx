import {
  Bell,
  Bot,
  ChevronDown,
  House,
  LibraryBig,
  PanelLeft,
  Settings,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import Logo from "../features/auth/components/Logo";
import { NavLink } from "react-router-dom";
type AppShellProps = {
  children: ReactNode;
};



const navigation = [
  { label: "Overview", icon: House, to: "/dashboard" },
  { label: "AI Employees", icon: Bot, to: "/employees" },
  { label: "Prompt Library", icon: LibraryBig, to: "/prompts" },
  { label: "Workflows", icon: Workflow, to: "/workflows" },
];

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-slate-800 px-6">
          <Logo showTagline={false} compact />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6">
          <p className="px-3 pb-3 text-xs font-semibold tracking-wider text-slate-500">
            WORKSPACE
          </p>

          {navigation.map((item) => {
  const Icon = item.icon;

  return (
    <NavLink
      key={item.label}
      to={item.to}
      className={({ isActive }) =>
        `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-blue-500/10 text-blue-300"
            : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
})}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          <button
            type="button"
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-semibold text-white">
              LD
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">
                Lucas Duque
              </p>
              <p className="truncate text-xs text-slate-500">
                Personal workspace
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-slate-800 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div>
              <p className="text-sm font-medium text-slate-200">Overview</p>
              <p className="text-xs text-slate-500">
                Your AI workspace at a glance
              </p>
            </div>
          </div>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-400" />
          </button>
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}