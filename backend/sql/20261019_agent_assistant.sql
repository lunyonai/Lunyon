-- AI assistant (agent): conversations, confirmable actions, usage quota, user-provided AI keys.
-- GENERATE ONLY. Do not apply until approved.
-- Prerequisite: auth.users (Supabase). Calendar writes still go through calendar_write_intents.
-- Additive only: does not drop or alter existing tables.
-- Access: service_role only. No anon/authenticated grants. RLS enabled with no policies.

-- ---------------------------------------------------------------------------
-- User-provided AI keys (BYOK). One key per user. Plain keys are never stored.
-- ---------------------------------------------------------------------------
create table if not exists public.user_ai_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null check (provider in ('openai', 'gemini')),
  encrypted_key text not null,
  key_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_ai_keys enable row level security;
alter table public.user_ai_keys force row level security;
revoke all on table public.user_ai_keys from public, anon, authenticated;
grant select, insert, update, delete on table public.user_ai_keys to service_role;

comment on table public.user_ai_keys is
  'User AI provider keys, AES-256-GCM encrypted with INTEGRATION_ENCRYPTION_KEY. Only the last 4 characters are kept in clear (key_hint).';

-- ---------------------------------------------------------------------------
-- Conversations and messages. Tool results (email bodies, events) are not stored.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_conversations_user_updated_idx
  on public.agent_conversations (user_id, updated_at desc);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_conversation_created_idx
  on public.agent_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Actions proposed by the assistant. Executed only after the user confirms.
-- The calendar confirmation token is stored encrypted and cleared once used.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.agent_conversations (id) on delete cascade,
  message_id uuid references public.agent_messages (id) on delete cascade,
  kind text not null check (kind in ('calendar.create', 'calendar.update', 'calendar.delete')),
  summary jsonb not null,
  confirmation_token_enc text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'canceled', 'expired', 'failed')),
  result jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_actions_conversation_idx
  on public.agent_actions (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Daily usage counter (free tier quota).
-- ---------------------------------------------------------------------------
create table if not exists public.agent_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  messages integer not null default 0,
  primary key (user_id, day)
);

alter table public.agent_conversations enable row level security;
alter table public.agent_conversations force row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_messages force row level security;
alter table public.agent_actions enable row level security;
alter table public.agent_actions force row level security;
alter table public.agent_usage enable row level security;
alter table public.agent_usage force row level security;

revoke all on table public.agent_conversations from public, anon, authenticated;
revoke all on table public.agent_messages from public, anon, authenticated;
revoke all on table public.agent_actions from public, anon, authenticated;
revoke all on table public.agent_usage from public, anon, authenticated;

grant select, insert, update, delete on table public.agent_conversations to service_role;
grant select, insert, update, delete on table public.agent_messages to service_role;
grant select, insert, update, delete on table public.agent_actions to service_role;
grant select, insert, update, delete on table public.agent_usage to service_role;
