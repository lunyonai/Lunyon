import { KeyRound } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Field } from "../../components/ui/Field";
import { IconTile } from "../../components/ui/IconTile";
import { inputClass, selectClass } from "../../components/ui/styles";
import { useLocale } from "../../i18n/LocaleProvider";
import { api, ApiError, type AgentProvider, type AgentStatus } from "../../lib/api";

const PROVIDER_LABEL: Record<AgentProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

const linkClass = "font-medium text-primary-text hover:underline";

export default function AiKeyPanel() {
  const { t } = useLocale();
  const fieldId = useId();
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

  const statusBadge = !status ? null : status.ownKey ? (
    <Badge tone="success" dot>
      {t("app.dashboard.connected")}
    </Badge>
  ) : (
    <Badge tone={status.freeAvailable ? "neutral" : "warning"} dot>
      {t("app.dashboard.notConnected")}
    </Badge>
  );

  const usage = status?.ownKey
    ? null
    : status?.freeAvailable
      ? t(status.planActive ? "app.agent.key.planUsage" : "app.agent.key.freeUsage", {
          used: status.usedToday,
          limit: status.dailyLimit,
        })
      : null;

  return (
    <Card padded={false}>
      <div className="border-b border-line px-5 py-4">
        <CardHeader
          title={t("app.agent.key.section")}
          description={t("app.agent.key.hint")}
          actions={statusBadge}
        />
      </div>

      <div className="divide-y divide-line">
        {status?.ownKey ? (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <IconTile icon={KeyRound} tone="violet" size="sm" />
              <span className="min-w-0 text-sm text-fg">
                {t("app.agent.key.current", {
                  provider: PROVIDER_LABEL[status.ownKey.provider],
                  hint: status.ownKey.hint,
                })}
              </span>
            </span>
            <Button size="sm" onClick={handleRemove} disabled={busy}>
              {t("app.agent.key.remove")}
            </Button>
          </div>
        ) : (
          usage && <p className="px-5 py-3 text-sm text-fg-muted tabular-nums">{usage}</p>
        )}

        <div className="space-y-4 px-5 py-5">
          <Field label={t("app.agent.key.provider")} htmlFor={`${fieldId}-provider`}>
            <select
              id={`${fieldId}-provider`}
              value={provider}
              onChange={(event) => setProvider(event.target.value as AgentProvider)}
              className={selectClass}
            >
              <option value="gemini">{PROVIDER_LABEL.gemini}</option>
              <option value="openai">{PROVIDER_LABEL.openai}</option>
            </select>
          </Field>
          <Field
            label={t("app.agent.key.apiKey")}
            htmlFor={`${fieldId}-key`}
            hint={
              <>
                {t("app.agent.key.howTo")}{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {t("app.agent.key.geminiLink")}
                </a>
                {" · "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {t("app.agent.key.openaiLink")}
                </a>
              </>
            }
          >
            <input
              id={`${fieldId}-key`}
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={provider === "openai" ? "sk-..." : "AIza..."}
              className={inputClass}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            {message && <p className="text-sm text-success-text">{message}</p>}
            {error && <p className="text-sm text-danger-text">{error}</p>}
            <Button variant="primary" onClick={handleSave} disabled={busy || !apiKey.trim()}>
              {busy ? t("app.agent.key.saving") : t("app.agent.key.save")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
