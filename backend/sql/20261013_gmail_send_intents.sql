-- Gmail send confirmation + sanitized mutation audit.
-- GENERATE ONLY. Do not apply until approved.
-- Prerequisite: auth.users. Independent of calendar_write_intents.
-- Additive only. Service-role writes only.

create table if not exists public.gmail_send_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('send', 'reply')),
  payload jsonb not null,
  confirmation_hash text not null,
  idempotency_key text not null,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  consumed_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists gmail_send_intents_idempotency_idx
  on public.gmail_send_intents (user_id, idempotency_key);

create unique index if not exists gmail_send_intents_confirmation_hash_idx
  on public.gmail_send_intents (confirmation_hash);

create index if not exists gmail_send_intents_user_created_idx
  on public.gmail_send_intents (user_id, created_at desc);

alter table public.gmail_send_intents enable row level security;
alter table public.gmail_send_intents force row level security;
revoke all on table public.gmail_send_intents from public, anon, authenticated;
grant select, insert, update, delete on table public.gmail_send_intents to service_role;

comment on table public.gmail_send_intents is
  'Short-lived single-use Gmail send confirmations. Plain tokens are never stored; only SHA-256 hashes. Bodies live only until expiry/consume.';

create table if not exists public.gmail_send_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  recipient_count integer,
  thread_id text,
  gmail_message_id text,
  status text not null check (status in ('ok', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists gmail_send_audit_user_created_idx
  on public.gmail_send_audit (user_id, created_at desc);

alter table public.gmail_send_audit enable row level security;
alter table public.gmail_send_audit force row level security;
revoke all on table public.gmail_send_audit from public, anon, authenticated;
grant select, insert on table public.gmail_send_audit to service_role;

comment on table public.gmail_send_audit is
  'Sanitized Gmail send log: action, recipient count, thread/message ids, status. No subjects or bodies.';
