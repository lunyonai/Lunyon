-- PHASE — Password reset challenges
-- GENERATE ONLY. Do not apply until approved.
-- Canonical app: frontend/ + frontend/backend/
-- Service-role backend only. Do not expose this table to the browser.

create table if not exists public.password_reset_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email_normalized text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  reset_token_hash text,
  reset_token_expires_at timestamptz
);

create index if not exists password_reset_challenges_user_id_idx
  on public.password_reset_challenges (user_id);

create index if not exists password_reset_challenges_email_idx
  on public.password_reset_challenges (email_normalized);

create index if not exists password_reset_challenges_active_idx
  on public.password_reset_challenges (user_id, consumed_at, expires_at);

create unique index if not exists password_reset_challenges_token_hash_idx
  on public.password_reset_challenges (reset_token_hash)
  where reset_token_hash is not null;

alter table public.password_reset_challenges enable row level security;

-- No policies for anon/authenticated. Access is service-role only.
