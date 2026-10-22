import { useId, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Copy,
  FileText,
  LibraryBig,
  Mail,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { Badge } from "../../components/ui/Badge";
import { Button, IconButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Field } from "../../components/ui/Field";
import { IconTile, type TileTone } from "../../components/ui/IconTile";
import { PageHeader } from "../../components/ui/PageHeader";
import { cx, inputClass, textareaClass } from "../../components/ui/styles";
import { useActivity } from "../activity/ActivityContext";
import { useLocale } from "../../i18n/LocaleProvider";
import { api } from "../../lib/api";
import { aiErrorInfo } from "../../lib/aiErrors";
import RunResultCard, { RunErrorNotice } from "../../components/RunResultCard";

const promptDefs = [
  {
    id: "followUp",
    icon: Mail,
    tone: "rose",
    categoryKey: "catSales",
  },
  {
    id: "notes",
    icon: MessageSquareText,
    tone: "primary",
    categoryKey: "catProductivity",
  },
  {
    id: "weekly",
    icon: Clock3,
    tone: "amber",
    categoryKey: "catManagement",
  },
] as const satisfies ReadonlyArray<{ id: string; icon: typeof Mail; tone: TileTone; categoryKey: string }>;

type PromptId = (typeof promptDefs)[number]["id"];

export default function PromptLibraryPage() {
  const { t, locale } = useLocale();
  const [search, setSearch] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<PromptId | null>(null);
  const [context, setContext] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [runError, setRunError] = useState<{ key: string; needsSettings: boolean } | null>(null);
  const { stats, refresh: refreshActivity } = useActivity();
  const panelTitleId = useId();
  const contextFieldId = useId();

  const prompts = useMemo(
    () =>
      promptDefs.map((def) => ({
        ...def,
        title: t(`app.prompts.${def.id}Title`),
        description: t(`app.prompts.${def.id}Description`),
        category: t(`app.prompts.${def.categoryKey}`),
        inputLabel: t(`app.prompts.${def.id}Label`),
        inputPlaceholder: t(`app.prompts.${def.id}Placeholder`),
      })),
    [t],
  );

  const selectedPrompt =
    prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;

  const filteredPrompts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return prompts;

    return prompts.filter((prompt) =>
      [prompt.title, prompt.description, prompt.category].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [prompts, search]);

  function closePanel() {
    setSelectedPromptId(null);
    setContext("");
    setResult(null);
    setRunError(null);
    setIsRunning(false);
  }

  async function handleRunPrompt() {
    if (!selectedPrompt || !context.trim() || isRunning) return;

    setIsRunning(true);
    setResult(null);
    setRunError(null);

    try {
      const run = await api.runPrompt(selectedPrompt.id, context.trim(), locale);
      setResult(run.output);
      void refreshActivity();
    } catch (err) {
      setRunError(aiErrorInfo(err));
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <PageHeader
          icon={LibraryBig}
          tone="amber"
          title={t("app.prompts.title")}
          description={t("app.prompts.subtitle")}
          actions={
            <Button variant="primary">
              <Plus />
              {t("app.prompts.newPrompt")}
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("app.prompts.search")}
              aria-label={t("app.prompts.search")}
              className={cx(inputClass, "pl-9")}
            />
          </div>

          <Button>
            <BookOpen />
            {t("app.prompts.allCategories")}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPrompts.map((prompt) => {
            const Icon = prompt.icon;

            return (
              <Card
                key={prompt.id}
                as="article"
                padded={false}
                className="group flex min-h-56 flex-col p-5 transition-colors hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={Icon} tone={prompt.tone} />

                  <IconButton
                    size="sm"
                    onClick={() => setSelectedPromptId(prompt.id)}
                    aria-label={t("app.prompts.useAria", { title: prompt.title })}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <ArrowUpRight />
                  </IconButton>
                </div>

                <div className="mt-4 flex-1">
                  <Badge>{prompt.category}</Badge>

                  <h2 className="mt-3 text-sm font-semibold text-fg">{prompt.title}</h2>

                  <p className="mt-1.5 text-sm leading-6 text-fg-muted">{prompt.description}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-xs tabular-nums text-fg-subtle">
                    {t("app.prompts.usedTimes", {
                      uses: stats?.byRef[`prompt:${prompt.id}`] ?? 0,
                    })}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-2"
                    onClick={() => setSelectedPromptId(prompt.id)}
                  >
                    <Copy />
                    {t("app.prompts.usePrompt")}
                  </Button>
                </div>
              </Card>
            );
          })}

          {filteredPrompts.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-line-strong">
              <EmptyState tone="amber"
                icon={Search}
                title={t("app.prompts.emptyTitle")}
                description={t("app.prompts.emptyBody")}
              />
            </div>
          )}

          <button
            type="button"
            className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-line-strong p-5 text-center transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary-text">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>

            <p className="mt-4 text-sm font-medium text-fg">{t("app.prompts.createTitle")}</p>

            <p className="mt-1 max-w-52 text-xs leading-5 text-fg-subtle">
              {t("app.prompts.createBody")}
            </p>
          </button>
        </div>
      </section>

      {selectedPrompt && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t("app.prompts.closePanel")}
            onClick={closePanel}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
          />

          <aside
            aria-labelledby={panelTitleId}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-overlay"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={selectedPrompt.icon} tone={selectedPrompt.tone} />

                <div className="min-w-0">
                  <p id={panelTitleId} className="truncate text-base font-semibold text-fg">
                    {selectedPrompt.title}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-primary-text">
                    {selectedPrompt.category}
                  </p>
                </div>
              </div>

              <IconButton
                size="sm"
                className="-mr-1.5"
                aria-label={t("app.prompts.close")}
                onClick={closePanel}
              >
                <X />
              </IconButton>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <p className="text-sm leading-6 text-fg-muted">{selectedPrompt.description}</p>

              <Field label={selectedPrompt.inputLabel} htmlFor={contextFieldId}>
                <textarea
                  id={contextFieldId}
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder={selectedPrompt.inputPlaceholder}
                  className={cx(textareaClass, "min-h-40 resize-none")}
                />
              </Field>

              {result && (
                <RunResultCard title={t("app.prompts.draftGenerated")} output={result} />
              )}

              {runError && (
                <RunErrorNotice errorKey={runError.key} needsSettings={runError.needsSettings} />
              )}
            </div>

            <div className="border-t border-line bg-surface-2/60 px-5 py-4">
              <Button
                variant="primary"
                size="lg"
                block
                loading={isRunning}
                onClick={() => void handleRunPrompt()}
                disabled={!context.trim()}
              >
                {!isRunning && <FileText />}
                {isRunning ? t("app.prompts.generating") : t("app.prompts.generateDraft")}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
