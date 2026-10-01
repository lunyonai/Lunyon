import type { User } from "@supabase/supabase-js";

export function userFullName(user: User | null): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  return name;
}

export function userDisplayName(user: User | null): string {
  const name = userFullName(user);
  if (name) return name;
  const email = user?.email ?? "";
  return email.split("@")[0] || "";
}

export function userInitials(user: User | null): string {
  const name = userDisplayName(user);
  if (!name) return "•";
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase() || name.slice(0, 2).toUpperCase();
}
