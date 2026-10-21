import { env } from "../../config/env.js";
import { decryptSecret } from "../../lib/tokenCrypto.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { AgentProvider, ModelConfig } from "../agent/models.js";
import { getNormalizedEntitlement } from "../identityService.js";

/** Abuse guard for users on their own key; the server key uses the free or paid limit. */
export const OWN_KEY_DAILY_LIMIT = 500;

type UserKeyRow = {
  provider: AgentProvider;
  encrypted_key: string;
  key_hint: string;
  updated_at: string;
};

function dbUnavailable(error: { message: string }): never {
  const message = error.message.toLowerCase();
  if (message.includes("does not exist") || message.includes("schema cache")) {
    throw new AppError("The assistant is not available yet", 503, "AGENT_NOT_READY");
  }
  throw new AppError("Could not complete this request", 400);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function modelFor(provider: AgentProvider) {
  return provider === "openai" ? env.OPENAI_MODEL : env.GEMINI_MODEL;
}

export async function loadUserKey(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_ai_keys")
    .select("provider, encrypted_key, key_hint, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) dbUnavailable(error);
  return data as UserKeyRow | null;
}

function serverConfig(): ModelConfig | null {
  const provider = env.AGENT_FREE_PROVIDER;
  const apiKey = provider === "openai" ? env.OPENAI_API_KEY : env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return { provider, apiKey, model: modelFor(provider) };
}

function serverLimit(planActive: boolean) {
  return planActive ? env.AGENT_PAID_DAILY_LIMIT : env.AGENT_FREE_DAILY_LIMIT;
}

export async function usedToday(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("agent_usage")
    .select("messages")
    .eq("user_id", userId)
    .eq("day", today())
    .maybeSingle();
  if (error) dbUnavailable(error);
  return (data?.messages as number | undefined) ?? 0;
}

function isMissingFunction(error: { message: string; code?: string }) {
  return error.code === "PGRST202" || /function .* does not exist/i.test(error.message);
}

/** Adds delta to today's counter and returns the new value. Atomic when the SQL function exists. */
async function incrementUsage(userId: string, delta: number): Promise<number> {
  const day = today();
  const { data, error } = await supabaseAdmin.rpc("increment_agent_usage", {
    p_user_id: userId,
    p_day: day,
    p_delta: delta,
  });
  if (!error) return Number(data ?? 0);
  if (!isMissingFunction(error)) dbUnavailable(error);

  // Fallback until 20261021_runtime_activity.sql is applied (not atomic).
  const next = Math.max((await usedToday(userId)) + delta, 0);
  const { error: upsertError } = await supabaseAdmin
    .from("agent_usage")
    .upsert({ user_id: userId, day, messages: next }, { onConflict: "user_id,day" });
  if (upsertError) dbUnavailable(upsertError);
  return next;
}

export type AiReservation = {
  config: ModelConfig;
  /** Gives the unit back when the provider call failed. Safe to call more than once. */
  release: () => Promise<void>;
};

/**
 * Picks the model (user key, or server key on the free/paid limit) and reserves one unit of
 * today's quota before the call, so concurrent requests cannot go over the limit.
 */
export async function reserveAiUsage(userId: string): Promise<AiReservation> {
  const [key, entitlement] = await Promise.all([
    loadUserKey(userId),
    getNormalizedEntitlement(userId),
  ]);

  let config: ModelConfig;
  let limit: number;
  if (key) {
    config = {
      provider: key.provider,
      apiKey: decryptSecret(key.encrypted_key),
      model: modelFor(key.provider),
    };
    limit = OWN_KEY_DAILY_LIMIT;
  } else {
    const server = serverConfig();
    limit = serverLimit(entitlement.active);
    if (!server || limit === 0) {
      throw new AppError("Add your own AI key in Settings to use AI features", 503, "AGENT_NO_KEY");
    }
    config = server;
  }

  const count = await incrementUsage(userId, 1);
  if (count > limit) {
    await incrementUsage(userId, -1);
    throw new AppError(
      key || entitlement.active ? "Daily AI limit reached" : "Daily free AI limit reached",
      429,
      "AGENT_QUOTA",
    );
  }

  let released = false;
  return {
    config,
    async release() {
      if (released) return;
      released = true;
      try {
        await incrementUsage(userId, -1);
      } catch {
        // The unit stays used; never mask the original error.
      }
    },
  };
}

export async function getAiAccessStatus(userId: string) {
  const [key, used, entitlement] = await Promise.all([
    loadUserKey(userId),
    usedToday(userId),
    getNormalizedEntitlement(userId),
  ]);
  const limit = serverLimit(entitlement.active);
  return {
    ownKey: key ? { provider: key.provider, hint: key.key_hint, updatedAt: key.updated_at } : null,
    freeAvailable: serverConfig() !== null && limit > 0,
    freeDailyLimit: env.AGENT_FREE_DAILY_LIMIT,
    dailyLimit: key ? OWN_KEY_DAILY_LIMIT : limit,
    planActive: entitlement.active,
    usedToday: used,
  };
}
