import { ApiError } from "./api";

const ERROR_KEYS: Record<string, string> = {
  AGENT_QUOTA: "app.ai.quota",
  AGENT_NO_KEY: "app.ai.noKey",
  AGENT_NOT_READY: "app.ai.notReady",
  ACTIVITY_NOT_READY: "app.ai.notReady",
  WORKFLOWS_NOT_READY: "app.ai.notReady",
  AI_KEY_INVALID: "app.ai.keyInvalid",
  AI_RATE_LIMITED: "app.ai.rateLimited",
  RATE_LIMITED: "app.ai.tooMany",
  EMPLOYEE_PAUSED: "app.ai.paused",
  WORKFLOW_RUNNING: "app.ai.alreadyRunning",
  STEP_INVALID: "app.ai.stepInvalid",
};

const NEEDS_SETTINGS = new Set(["AGENT_QUOTA", "AGENT_NO_KEY", "AI_KEY_INVALID"]);

/** i18n key for an error from an AI run, and whether Settings can fix it. */
export function aiErrorInfo(err: unknown) {
  const code = err instanceof ApiError ? err.code : undefined;
  return {
    key: (code && ERROR_KEYS[code]) || "app.ai.error",
    needsSettings: Boolean(code && NEEDS_SETTINGS.has(code)),
  };
}

export function stepErrorKey(code: string | undefined) {
  return (code && ERROR_KEYS[code]) || null;
}

export function userTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}
