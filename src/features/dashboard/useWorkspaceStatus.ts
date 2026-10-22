import { useEffect, useState } from "react";
import {
  api,
  type AgentStatus,
  type EntitlementResponse,
  type GmailStatus,
  type GoogleStatus,
} from "../../lib/api";

export type WorkspaceStatus = {
  google: GoogleStatus | null;
  gmail: GmailStatus | null;
  ai: AgentStatus | null;
  plan: EntitlementResponse | null;
};

function settledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

/** Integration/AI/plan status, fetched once per dashboard visit; null while loading. */
export function useWorkspaceStatus() {
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.googleStatus(),
      api.gmailStatus(),
      api.agentStatus(),
      api.entitlement(),
    ]).then(([google, gmail, ai, plan]) => {
      if (cancelled) return;
      setStatus({
        google: settledValue(google),
        gmail: settledValue(gmail),
        ai: settledValue(ai),
        plan: settledValue(plan),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
