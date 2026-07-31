import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Mail,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import AppShell from "../../layouts/AppShell";
import { useActivity } from "../activity/ActivityContext";

const prompts = [
  {
    title: "Client follow-up email",
    description:
      "Write a concise, professional follow-up after a client meeting.",
    category: "Sales",
    uses: "1.2k",
    icon: Mail,
    iconColor: "text-blue-400",
    iconBackground: "bg-blue-500/10",
    inputLabel: "Meeting context",
    inputPlaceholder:
      "Example: Met Sarah today to discuss the updated project timeline and next milestones.",
  },
  {
    title: "Meeting notes to actions",
    description:
      "Turn unstructured meeting notes into clear decisions and next steps.",
    category: "Productivity",
    uses: "986",
    icon: MessageSquareText,
    iconColor: "text-violet-400",
    iconBackground: "bg-violet-500/10",
    inputLabel: "Meeting notes",
    inputPlaceholder:
      "Paste your meeting notes here and the AI will organize decisions and actions.",
  },
  {
    title: "Weekly project update",
    description:
      "Create a concise status update for stakeholders and your team.",
    category: "Management",
    uses: "742",
    icon: Clock3,
    iconColor: "text-emerald-400",
    iconBackground: "bg-emerald-500/10",
    inputLabel: "Project progress",
    inputPlaceholder:
      "Example: Completed onboarding screens, fixed 12 bugs, and started API integration.",
  },
];

type Prompt = (typeof prompts)[number];

export default function PromptLibraryPage() {
  const [search, setSearch] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [context, setContext] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { addActivity } = useActivity();

  const filteredPrompts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return prompts;

    return prompts.filter((prompt) =>
      [prompt.title, prompt.description, prompt.category].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [search]);

  function closePanel() {
    setSelectedPrompt(null);
    setContext("");
    setResult(null);
    setIsRunning(false);
  }

  function handleRunPrompt() {
  if (!selectedPrompt || !context.trim() || isRunning) return;

  setIsRunning(true);
  setResult(null);

  window.setTimeout(() => {
    const promptTitle = selectedPrompt.title;

    setIsRunning(false);

    setResult(
      `Your ${promptTitle.toLowerCase()} is ready. The AI used your context to create a clear first draft that you can review and refine.`,
    );

    addActivity({
  title: `${promptTitle} generated`,
  detail: context.trim().slice(0, 48),
  type: "prompt",
});
  }, 1400);
}

  return (
    <AppShell>
      <section>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">PROMPT ENGINE</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Prompt Library
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Reusable AI instructions built for the work you do every day.
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            New prompt
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prompts..."
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/60 px-10 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <BookOpen className="h-4 w-4" />
            All categories
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPrompts.map((prompt) => {
            const Icon = prompt.icon;

            return (
              <article
                key={prompt.title}
                className="group flex min-h-56 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${prompt.iconBackground}`}
                  >
                    <Icon className={`h-5 w-5 ${prompt.iconColor}`} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPrompt(prompt)}
                    aria-label={`Use ${prompt.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5">
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                    {prompt.category}
                  </span>

                  <h2 className="mt-3 text-base font-semibold text-white">
                    {prompt.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {prompt.description}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-xs text-slate-500">
                    Used {prompt.uses} times
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedPrompt(prompt)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 transition hover:text-blue-300"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Use prompt
                  </button>
                </div>
              </article>
            );
          })}

          {filteredPrompts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-14 text-center">
              <Search className="mx-auto h-6 w-6 text-slate-500" />
              <p className="mt-4 text-sm font-semibold text-slate-300">
                No prompts found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search term.
              </p>
            </div>
          )}

          <button
            type="button"
            className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-5 text-center transition hover:border-blue-500/60 hover:bg-blue-500/5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-200">
              Create a custom prompt
            </p>

            <p className="mt-2 max-w-52 text-xs leading-5 text-slate-500">
              Save an instruction your AI team can reuse anytime.
            </p>
          </button>
        </div>
      </section>

      {selectedPrompt && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close prompt panel"
            onClick={closePanel}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${selectedPrompt.iconBackground}`}
                >
                  <selectedPrompt.icon
                    className={`h-5 w-5 ${selectedPrompt.iconColor}`}
                  />
                </div>

                <div>
                  <p className="text-base font-semibold text-white">
                    {selectedPrompt.title}
                  </p>
                  <p className="mt-1 text-sm text-blue-400">
                    {selectedPrompt.category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close panel"
                onClick={closePanel}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm leading-6 text-slate-400">
                {selectedPrompt.description}
              </p>

              <div className="mt-8">
                <label className="text-sm font-semibold text-white">
                  {selectedPrompt.inputLabel}
                </label>

                <textarea
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder={selectedPrompt.inputPlaceholder}
                  className="mt-3 min-h-40 w-full resize-none rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {result && (
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-300">
                      Draft generated
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {result}
                  </p>
                </div>
              )}
            </div>

           <div className="border-t border-slate-800 p-6">
  <button
    type="button"
    onClick={handleRunPrompt}
    disabled={!context.trim() || isRunning}
    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-950/60 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isRunning ? (
      <span className="flex items-center gap-2">
        <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        Generating...
      </span>
    ) : (
      <span className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Generate draft
      </span>
    )}
  </button>
</div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}