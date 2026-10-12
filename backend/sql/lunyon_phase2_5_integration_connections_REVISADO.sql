-- PHASE 2.5 — Integration connections (Google first)
-- REVIEWED DRAFT. Apply only after backup and approval.
-- SECURITY CHANGE: removed direct authenticated SELECT on encrypted token rows.
-- Independent of Phase 1 entitlements SQL. Requires auth.users.
-- Tokens are stored encrypted at rest (APPLICATION-LEVEL AES-256-GCM).
-- The Lunyon API uses the service role and still MUST filter by user_id.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_account_id text,
  provider_email text,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connected', 'error')),
  scopes text[] not null default '{}',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists integration_connections_user_id_idx
  on public.integration_connections (user_id);

alter table public.integration_connections enable row level security;

-- Backend-only table.  No direct PostgREST access from browser roles.
-- Even encrypted tokens should not be returned to authenticated clients.
drop policy if exists "integration_connections_select_own" on public.integration_connections;
revoke all on table public.integration_connections from anon, authenticated;

-- Access from trusted backend (service role/secret key) only.
-- Backend MUST authorize every request and filter by user_id.
