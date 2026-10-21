import { useEffect, useState } from "react";
import { useLocale } from "../../i18n/LocaleProvider";
import { api, ApiError, type AgentProvider, type AgentStatus } from "../../lib/api";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-70";

const PROVIDER_LABEL: Record<AgentProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export default function AiKeyPanel() {
  const { t } = useLocale();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [provider, setProvider] = useState<AgentProvider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .agentStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function handleSave() {
    if (busy || !apiKey.trim()) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      setStatus(await api.saveAgentKey(provider, apiKey.trim()));
      setApiKey("");
      setMessage(t("app.agent.key.saved"));
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "AI_KEY_INVALID"
          ? t("app.agent.key.invalid")
          : t("app.agent.key.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      setStatus(await api.deleteAgentKey());
      setMessage(t("app.agent.key.removed"));
    } catch {
      setError(t("app.agent.key.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-base font-semibold text-white">{t("app.agent.key.section")}</h2>
      <p className="mt-2 text-sm text-slate-400">{t("app.agent.key.hint")}</p>

      {status?.ownKey ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 p-4">
          <p className="text-sm text-slate-200">
            {t("app.agent.key.current", {
              provider: PROVIDER_LABEL[status.ownKey.provider],
              hint: status.ownKey.hint,
            })}
          </p>
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="flex h-10 items-center rounded-xl border border-slate-800 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
          >
            {t("app.agent.key.remove")}
          </button>
        </div>
      ) : (
        status?.freeAvailable && (
          <p className="mt-4 text-sm text-slate-300">
            {t(status.planActive ? "app.agent.key.planUsage" : "app.agent.key.freeUsage", {
              used: status.usedToday,
              limit: status.dailyLimit,
            })}
          </p>
        )
      )}

      <label className="mt-4 block text-sm font-medium text-white">
        {t("app.agent.key.provider")}
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value as AgentProvider)}
          className={fieldClass}
        >
          <option value="gemini">{PROVIDER_LABEL.gemini}</option>
          <option value="openai">{PROVIDER_LABEL.openai}</option>
        </select>
      </label>
      <label className="mt-4 block text-sm font-medium text-white">
        {t("app.agent.key.apiKey")}
        <input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={provider === "openai" ? "sk-..." : "AIza..."}
          className={fieldClass}
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">
        {t("app.agent.key.howTo")}{" "}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          {t("app.agent.key.geminiLink")}
        </a>
        {" · "}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          {t("app.agent.key.openaiLink")}
        </a>
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={busy || !apiKey.trim()}
        className="mt-5 flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
      >
        {busy ? t("app.agent.key.saving") : t("app.agent.key.save")}
      </button>
      {message && <p className="mt-2 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
