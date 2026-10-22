import { ArrowUp, Sparkles } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "../../../components/ui/Button";
import { cardClass, cx } from "../../../components/ui/styles";
import { useLocale } from "../../../i18n/LocaleProvider";

const suggestions = ["app.agent.suggestion1", "app.agent.suggestion2", "app.agent.suggestion3"] as const;

/** Entry point to the assistant: the question is handed to /assistant, which sends it. */
export default function AskAssistantCard() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const inputId = useId();
  const [prompt, setPrompt] = useState("");

  function ask(text: string) {
    const message = text.trim();
    if (!message) return;
    navigate("/assistant", { state: { prompt: message } });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    ask(prompt);
  }

  return (
    <section className={cx(cardClass, "relative isolate flex flex-col overflow-hidden p-5 sm:p-6")}>
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-16 -z-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/25 to-tint-violet/20 blur-3xl"
      />
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-tint-violet text-white shadow-card">
          <Sparkles className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-fg">{t("app.dashboard.askTitle")}</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-fg-muted">{t("app.dashboard.askHint")}</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor={inputId} className="sr-only">
          {t("app.dashboard.askTitle")}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pl-3.5 shadow-card transition focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <input
            id={inputId}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t("app.dashboard.askPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-placeholder"
          />
          <IconButton
            type="submit"
            variant="primary"
            size="sm"
            aria-label={t("app.dashboard.askSubmit")}
            disabled={!prompt.trim()}
          >
            <ArrowUp />
          </IconButton>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => ask(t(key))}
            className="rounded-full border border-line bg-surface-2/60 px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-fg"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </section>
  );
}
