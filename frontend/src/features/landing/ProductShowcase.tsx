import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PromptLibraryDemo from "./demos/PromptLibraryDemo";
import WorkflowsDemo from "./demos/WorkflowsDemo";
import EmployeesDemo from "./demos/EmployeesDemo";

const tabs = [
  { id: "prompts" as const, label: "Prompt Library" },
  { id: "workflows" as const, label: "Workflows" },
  { id: "employees" as const, label: "AI Employees" },
];

type TabId = (typeof tabs)[number]["id"];

const ease = [0.22, 1, 0.36, 1] as const;

function DemoPanel({ tab }: { tab: TabId }) {
  switch (tab) {
    case "prompts":
      return <PromptLibraryDemo />;
    case "workflows":
      return <WorkflowsDemo />;
    case "employees":
      return <EmployeesDemo />;
  }
}

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<TabId>("prompts");

  return (
    <div className="mt-12">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[var(--lunyo-radius)] border px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-[var(--lunyo-primary)]/40 bg-[var(--lunyo-primary-soft)] text-[var(--lunyo-primary)]"
                  : "border-[var(--lunyo-border)] bg-[var(--lunyo-surface)]/80 text-[var(--lunyo-text-muted)] hover:text-[var(--lunyo-text)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="mt-6 min-h-[320px] rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] p-5 sm:p-6"
        style={{ backgroundColor: "var(--lunyo-surface)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease }}
          >
            <DemoPanel tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
