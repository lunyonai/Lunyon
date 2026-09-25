import { supabaseAdmin } from "../lib/supabase.js";
import type { AuthUser } from "../middleware/auth.js";
import { getProfile } from "./authService.js";

export type NormalizedMe = {
  id: string;
  email: string | null;
  fullName: string | null;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
};

export type NormalizedEntitlement = {
  active: boolean;
  status: string;
  accessUntil: string | null;
};

const INACTIVE_ENTITLEMENT: NormalizedEntitlement = {
  active: false,
  status: "none",
  accessUntil: null,
};

async function ensureProfile(user: AuthUser) {
  const existing = await getProfile(user.id);
  if (existing) return existing;

  const { error } = await supabaseAdmin.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
  });

  if (error) {
    return null;
  }

  return getProfile(user.id);
}

export async function getNormalizedMe(user: AuthUser): Promise<NormalizedMe> {
  const profile = await ensureProfile(user);

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? null,
    fullName: profile?.full_name ?? null,
    profile: profile
      ? {
          id: profile.id,
          email: profile.email ?? null,
          full_name: profile.full_name ?? null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
      : null,
  };
}

export async function getNormalizedEntitlement(
  userId: string,
): Promise<NormalizedEntitlement> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .select("status, access_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return INACTIVE_ENTITLEMENT;
  }

  const accessUntil =
    typeof data.access_until === "string" ? data.access_until : null;
  const until = accessUntil ? new Date(accessUntil) : null;
  const status = typeof data.status === "string" ? data.status : "none";
  const active =
    status === "active" &&
    until !== null &&
    !Number.isNaN(until.getTime()) &&
    until.getTime() > Date.now();

  if (!active) {
    return {
      active: false,
      status: status === "active" ? "expired" : status || "none",
      accessUntil,
    };
  }

  return {
    active: true,
    status: "active",
    accessUntil,
  };
}
