import { supabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../middleware/errorHandler.js";
import type { AuthUser } from "../middleware/auth.js";
import { disconnectGmail } from "./gmailConnectionService.js";
import { disconnectGoogle } from "./googleConnectionService.js";

/** Tables exported per user, with the columns that are safe to hand back (never tokens or keys). */
const EXPORT_TABLES: Array<{ table: string; columns: string; owner?: string }> = [
  { table: "profiles", columns: "*", owner: "id" },
  { table: "settings", columns: "*" },
  { table: "entitlements", columns: "*" },
  { table: "purchases", columns: "*" },
  { table: "ai_employees", columns: "*" },
  { table: "workflows", columns: "*" },
  { table: "workflow_runs", columns: "*" },
  { table: "activity_events", columns: "*" },
  { table: "prompts", columns: "*" },
  { table: "agent_conversations", columns: "*" },
  { table: "agent_messages", columns: "*" },
  {
    table: "agent_actions",
    columns: "id, conversation_id, message_id, kind, summary, status, result, expires_at, created_at, updated_at",
  },
  { table: "agent_usage", columns: "*" },
  { table: "user_ai_keys", columns: "provider, key_hint, created_at, updated_at" },
  {
    table: "integration_connections",
    columns: "provider, provider_email, status, scopes, created_at, updated_at",
  },
  { table: "calendar_mutation_audit", columns: "*" },
  { table: "gmail_send_audit", columns: "*" },
];

export async function exportAccountData(user: AuthUser) {
  const data: Record<string, unknown> = {};
  await Promise.all(
    EXPORT_TABLES.map(async ({ table, columns, owner }) => {
      const result = await supabaseAdmin
        .from(table)
        .select(columns)
        .eq(owner ?? "user_id", user.id)
        .limit(10000);
      // Tables from migrations that are not applied yet are simply left out.
      if (!result.error) data[table] = result.data;
    }),
  );
  return {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email ?? null },
    data,
  };
}

/**
 * Revokes Google access, then deletes the auth user. Product tables reference auth.users with
 * ON DELETE CASCADE; prompts and templates use SET NULL, so private ones are removed first.
 */
export async function deleteAccount(user: AuthUser) {
  for (const disconnect of [disconnectGoogle, disconnectGmail]) {
    try {
      await disconnect(user.id);
    } catch {
      // Tokens are deleted with the user even when Google cannot be reached.
    }
  }
  for (const table of ["prompts", "templates"]) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("user_id", user.id)
      .eq("is_public", false);
    if (error && !error.message.toLowerCase().includes("does not exist")) {
      throw new AppError("Could not delete the account", 500);
    }
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) throw new AppError("Could not delete the account", 500);
}
