-- PHASE 2 — AI Employees persistence
-- GENERATE ONLY. Do not apply until approved.
-- Independent of Phase 1 entitlements SQL. Requires auth.users (Supabase Auth).
-- Canonical app: frontend/ + frontend/backend/

create table if not exists public.ai_employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  role text not null,
  description text,
  purpose text,
  instructions text,
  kind text not null
    check (kind in ('email', 'meeting', 'content', 'workflow', 'analyst', 'custom')),
  icon text,
  status text not null default 'active'
    check (status in ('active', 'paused')),
  capabilities jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_employees_user_id_idx
  on public.ai_employees (user_id);

create index if not exists ai_employees_user_updated_idx
  on public.ai_employees (user_id, updated_at desc);

alter table public.ai_employees enable row level security;

drop policy if exists "ai_employees_select_own" on public.ai_employees;
create policy "ai_employees_select_own"
  on public.ai_employees
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "ai_employees_insert_own" on public.ai_employees;
create policy "ai_employees_insert_own"
  on public.ai_employees
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ai_employees_update_own" on public.ai_employees;
create policy "ai_employees_update_own"
  on public.ai_employees
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "ai_employees_delete_own" on public.ai_employees;
create policy "ai_employees_delete_own"
  on public.ai_employees
  for delete
  to authenticated
  using (user_id = auth.uid());
