import { useState } from "react";
import { Search } from "lucide-react";
import { useLocale } from "../../../i18n/LocaleProvider";

export default function PromptLibraryDemo() {
  const { t } = useLocale();
  const [selected, setSelected] = useState("email");

  const categories = [
    { id: "all", label: t("demo.all") },
    { id: "email", label: t("demo.email") },
    { id: "reports", label: t("demo.reports") },
    { id: "research", label: t("demo.research") },
    { id: "meetings", label: t("demo.meetings") },
  ];

  const prompts = [
    {
      id: "email",
      title: t("demo.emailFollowUp"),
      category: t("demo.email"),
      preview: t("demo.emailFollowUpPreview"),
    },
    {
      id: "weekly",
      title: t("demo.weeklyReport"),
      category: t("demo.reports"),
      preview: t("demo.weeklyReportPreview"),
    },
    {
      id: "research",
      title: t("demo.researchSummary"),
      category: t("demo.research"),
      preview: t("demo.researchSummaryPreview"),
    },
    {
      id: "meeting",
      title: t("demo.meetingPrep"),
      category: t("demo.meetings"),
      preview: t("demo.meetingPrepPreview"),
    },
  ];

  const active = prompts.find((p) => p.id === selected) ?? prompts[0];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lunyo-text-muted)]" />
        <input
          readOnly
          value=""
          placeholder={t("demo.searchPrompts")}
          className="h-10 w-full rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/80 pl-10 text-sm text-[var(--lunyo-text-muted)] outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat.id}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
              cat.id === "all"
                ? "bg-[var(--lunyo-primary-soft)] text-[var(--lunyo-primary)]"
                : "border border-[var(--lunyo-border)] text-[var(--lunyo-text-muted)]"
            }`}
          >
            {cat.label}
          </span>
        ))}
      </div>

      <ul className="space-y-2">
        {prompts.map((prompt) => {
          const isActive = prompt.id === selected;
          return (
            <li key={prompt.id}>
              <button
                type="button"
                onClick={() => setSelected(prompt.id)}
                className={`w-full rounded-[var(--lunyo-radius)] border px-3 py-2.5 text-left transition ${
                  isActive
                    ? "border-[var(--lunyo-primary)]/40 bg-[var(--lunyo-primary-soft)]"
                    : "border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/60 hover:border-[var(--lunyo-border)]"
                }`}
              >
                <p className="text-sm font-medium text-[var(--lunyo-text)]">
                  {prompt.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--lunyo-text-muted)]">
                  {prompt.category}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/80 p-3">
        <p className="text-[11px] font-medium text-[var(--lunyo-text-muted)]">
          {t("demo.selectedPrompt")}
        </p>
        <p className="mt-1 text-sm text-[var(--lunyo-text)]">{active.title}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--lunyo-text-muted)]">
          {active.preview}
        </p>
      </div>
    </div>
  );
}
