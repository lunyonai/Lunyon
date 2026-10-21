-- Runtime: atomic AI usage counter, activity log, workflow execution and scheduling.
-- GENERATE ONLY. Do not apply until approved.
-- Prerequisites: 20260925_phase3_workflows.sql, 20261019_agent_assistant.sql.
-- Additive only: adds columns, tables, indexes and one function. Nothing is dropped.
-- Access: service_role only. No anon/authenticated grants. RLS enabled with no policies.

-- ---------------------------------------------------------------------------
-- Atomic usage counter. Shared by the assistant, prompts, employees and workflows.
-- Returns the new count for the day; p_delta = -1 gives a unit back after a failed call.
-- ---------------------------------------------------------------------------
create or replace function public.increment_agent_usage(
  p_user_id uuid,
  p_day date,
  p_delta integer default 1
)
returns integer
language sql
set search_path = public
as $$
  insert into public.agent_usage as u (user_id, day, messages)
  values (p_user_id, p_day, greatest(p_delta, 0))
  on conflict (user_id, day)
  do update set messages = greatest(u.messages + p_delta, 0)
  returning messages;
$$;

revoke all on function public.increment_agent_usage(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.increment_agent_usage(uuid, date, integer) to service_role;

-- Pending confirmations are listed and expired per user.
create index if not exists agent_actions_user_status_idx
  on public.agent_actions (user_id, status, expires_at);

-- ---------------------------------------------------------------------------
-- Activity log. One row per finished prompt, employee task or workflow run.
-- Stores a short input snippet only; AI outputs and email contents are not stored here.
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('prompt', 'employee', 'workflow')),
  ref_id text,
  subject text not null,
  detail text,
  status text not null default 'succeeded' check (status in ('succeeded', 'failed')),
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_created_idx
  on public.activity_events (user_id, created_at desc);

create index if not exists activity_events_user_ref_idx
  on public.activity_events (user_id, type, ref_id);

-- ---------------------------------------------------------------------------
-- Workflow scheduling columns.
-- trigger stays text: 'manual' or 'schedule'. schedule holds
-- { frequency: daily|weekdays|weekly, time: HH:mm, weekday?: 0-6, timezone, locale }.
-- ---------------------------------------------------------------------------
alter table public.workflows add column if not exists schedule jsonb;
alter table public.workflows add column if not exists next_run_at timestamptz;
alter table public.workflows add column if not exists last_run_at timestamptz;
alter table public.workflows add column if not exists last_run_status text;

create index if not exists workflows_due_idx
  on public.workflows (next_run_at)
  where status = 'active' and trigger = 'schedule' and next_run_at is not null;

-- ---------------------------------------------------------------------------
-- Workflow runs. steps holds per-step status and the AI output of each step
-- (truncated). Gmail and Calendar steps record counts only, never message bodies.
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  trigger text not null check (trigger in ('manual', 'schedule')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'failed')),
  steps jsonb not null default '[]'::jsonb,
  output text,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists workflow_runs_workflow_started_idx
  on public.workflow_runs (workflow_id, started_at desc);

create index if not exists workflow_runs_running_idx
  on public.workflow_runs (started_at)
  where status = 'running';

-- At most one running run per workflow (double clicks, two scheduler instances).
create unique index if not exists workflow_runs_one_running_idx
  on public.workflow_runs (workflow_id)
  where status = 'running';

alter table public.activity_events enable row level security;
alter table public.activity_events force row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_runs force row level security;

revoke all on table public.activity_events from public, anon, authenticated;
revoke all on table public.workflow_runs from public, anon, authenticated;

grant select, insert, update, delete on table public.activity_events to service_role;
grant select, insert, update, delete on table public.workflow_runs to service_role;
