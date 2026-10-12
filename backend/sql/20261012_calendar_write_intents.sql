-- Calendar write confirmation + sanitized mutation audit.
-- GENERATE ONLY. Do not apply until approved.
-- Prerequisite: auth.users (Supabase). Independent of selected_calendar_ids.
-- Additive only: does not drop existing tables, rows, credentials, policies, or integrations.
-- Access: service_role only. No anon/authenticated grants. RLS enabled with no policies.

create table if not exists public.calendar_write_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('create', 'update', 'delete')),
  payload jsonb not null,
  confirmation_hash text not null,
  idempotency_key text not null,
  etag text,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  consumed_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now()
);

-- Permanent unique: one intent per user+key. Preferable to a partial unique on
-- unconsumed rows, which would allow a second create after consume and would
-- still block reuse of expired unconsumed rows. Preview retries update the
-- same unclaimed row; completed keys must not insert again.
drop index if exists calendar_write_intents_open_idempotency_idx;

create unique index if not exists calendar_write_intents_idempotency_idx
  on public.calendar_write_intents (user_id, idempotency_key);

create unique index if not exists calendar_write_intents_confirmation_hash_idx
  on public.calendar_write_intents (confirmation_hash);

create index if not exists calendar_write_intents_user_created_idx
  on public.calendar_write_intents (user_id, created_at desc);

alter table public.calendar_write_intents enable row level security;
alter table public.calendar_write_intents force row level security;
revoke all on table public.calendar_write_intents from public, anon, authenticated;
grant select, insert, update, delete on table public.calendar_write_intents to service_role;

comment on table public.calendar_write_intents is
  'Short-lived single-use calendar write confirmations. Plain confirmation tokens are never stored; only SHA-256 hashes.';

create table if not exists public.calendar_mutation_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  calendar_id text,
  google_event_id text,
  status text not null check (status in ('ok', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists calendar_mutation_audit_user_created_idx
  on public.calendar_mutation_audit (user_id, created_at desc);

alter table public.calendar_mutation_audit enable row level security;
alter table public.calendar_mutation_audit force row level security;
revoke all on table public.calendar_mutation_audit from public, anon, authenticated;
grant select, insert on table public.calendar_mutation_audit to service_role;

comment on table public.calendar_mutation_audit is
  'Sanitized calendar mutation log: action, calendar id, event id, status. No event titles or descriptions.';
