-- PHASE 2.5 — Integration connections (Google first)
-- GENERATE ONLY. Do not apply until approved.
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

-- Users may see connection metadata only if selected through a column-safe view
-- later. For now they may SELECT their row; the API never returns token columns.
drop policy if exists "integration_connections_select_own" on public.integration_connections;
create policy "integration_connections_select_own"
  on public.integration_connections
  for select
  to authenticated
  using (user_id = auth.uid());

-- Writes are backend/service-role only (no insert/update/delete for authenticated).
