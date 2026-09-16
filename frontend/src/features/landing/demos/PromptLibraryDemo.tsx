import { useState } from "react";
import { Search } from "lucide-react";

const categories = ["All", "Email", "Reports", "Research", "Meetings"];

const prompts = [
  {
    id: "email",
    title: "Email follow-up",
    category: "Email",
    preview: "Draft a concise follow-up after a client meeting.",
  },
  {
    id: "weekly",
    title: "Weekly report",
    category: "Reports",
    preview: "Summarize progress, blockers, and next steps.",
  },
  {
    id: "research",
    title: "Research summary",
    category: "Research",
    preview: "Turn notes into a clear brief with key findings.",
  },
  {
    id: "meeting",
    title: "Meeting preparation",
    category: "Meetings",
    preview: "Prepare agenda, context, and talking points.",
  },
];

export default function PromptLibraryDemo() {
  const [selected, setSelected] = useState("email");
  const active = prompts.find((p) => p.id === selected) ?? prompts[0];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lunyo-text-muted)]" />
        <input
          readOnly
          value=""
          placeholder="Search prompts…"
          className="h-10 w-full rounded-[var(--lunyo-radius)] border border-[var(--lunyo-border)] bg-[var(--lunyo-bg)]/80 pl-10 text-sm text-[var(--lunyo-text-muted)] outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span
            key={cat}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium ${
              cat === "All"
                ? "bg-[var(--lunyo-primary-soft)] text-[var(--lunyo-primary)]"
                : "border border-[var(--lunyo-border)] text-[var(--lunyo-text-muted)]"
            }`}
          >
            {cat}
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
          Selected prompt
        </p>
        <p className="mt-1 text-sm text-[var(--lunyo-text)]">{active.title}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--lunyo-text-muted)]">
          {active.preview}
        </p>
      </div>
    </div>
  );
}
