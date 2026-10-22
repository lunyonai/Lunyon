import { useState } from "react";
import { CornerDownLeft, FileText, Mail, Search, Users, type LucideIcon } from "lucide-react";
import { IconTile, type TileTone } from "../../../components/ui/IconTile";
import { cx } from "../../../components/ui/styles";
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

  const prompts: Array<{ id: string; title: string; category: string; preview: string; icon: LucideIcon; tone: TileTone }> = [
    { id: "email", title: t("demo.emailFollowUp"), category: t("demo.email"), preview: t("demo.emailFollowUpPreview"), icon: Mail, tone: "primary" },
    { id: "weekly", title: t("demo.weeklyReport"), category: t("demo.reports"), preview: t("demo.weeklyReportPreview"), icon: FileText, tone: "orange" },
    { id: "research", title: t("demo.researchSummary"), category: t("demo.research"), preview: t("demo.researchSummaryPreview"), icon: Search, tone: "cyan" },
    { id: "meeting", title: t("demo.meetingPrep"), category: t("demo.meetings"), preview: t("demo.meetingPrepPreview"), icon: Users, tone: "violet" },
  ];

  const active = prompts.find((p) => p.id === selected) ?? prompts[0];

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <div className="relative" aria-hidden="true">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <div className="flex h-9 w-full items-center rounded-lg border border-line bg-canvas/60 pl-9 pr-3 text-sm text-fg-placeholder">
            {t("demo.searchPrompts")}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5" aria-hidden="true">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className={cx(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                cat.id === "all" ? "border-primary/25 bg-primary/10 text-primary-text" : "border-line text-fg-muted",
              )}
            >
              {cat.label}
            </span>
          ))}
        </div>

        <ul className="space-y-1.5">
          {prompts.map((prompt) => {
            const isActive = prompt.id === selected;
            return (
              <li key={prompt.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelected(prompt.id)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActive
                      ? "border-primary/35 bg-primary/10"
                      : "border-transparent hover:border-line hover:bg-surface-2/60",
                  )}
                >
                  <IconTile icon={prompt.icon} tone={prompt.tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{prompt.title}</span>
                    <span className="block truncate text-xs text-fg-subtle">{prompt.category}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-canvas/60 p-4" aria-live="polite">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 50% at 100% 0%, color-mix(in srgb, var(--ui-primary) 12%, transparent), transparent 70%)",
          }}
        />
        <p className="relative text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">{t("demo.selectedPrompt")}</p>
        <div className="relative mt-3 flex items-center gap-2.5">
          <IconTile icon={active.icon} tone={active.tone} size="sm" />
          <p className="min-w-0 truncate text-sm font-semibold text-fg">{active.title}</p>
        </div>
        <p className="relative mt-4 rounded-lg border border-line bg-surface/80 p-3 text-[13px] leading-6 text-fg">
          {active.preview}
          <span className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-primary-text motion-reduce:animate-none" aria-hidden="true" />
        </p>
        <div className="relative mt-4 flex-1 space-y-2" aria-hidden="true">
          <span className="block h-1.5 w-11/12 rounded-full bg-surface-3" />
          <span className="block h-1.5 w-4/5 rounded-full bg-surface-3" />
          <span className="block h-1.5 w-2/3 rounded-full bg-surface-3/70" />
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-line pt-3" aria-hidden="true">
          <span className="text-[11px] text-fg-subtle">{active.category}</span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-fg">
            <CornerDownLeft className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
