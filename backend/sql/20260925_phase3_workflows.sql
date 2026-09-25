-- PHASE 3 — Workflow / Automation persistence
-- GENERATE ONLY. Do not apply until approved.
-- Depends on: auth.users, public.ai_employees (Phase 2).
-- Independent of Phase 1 entitlements and Phase 2.5 integrations.
-- Canonical app: frontend/ + frontend/backend/
-- Workflow and Automation are the same table.

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  employee_id uuid references public.ai_employees (id) on delete set null,
  title text not null,
  description text,
  trigger text not null default 'manual',
  steps jsonb not null default '[]'::jsonb,
  status text not null default 'inactive'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_user_id_idx
  on public.workflows (user_id);

create index if not exists workflows_user_updated_idx
  on public.workflows (user_id, updated_at desc);

create index if not exists workflows_employee_id_idx
  on public.workflows (employee_id);

alter table public.workflows enable row level security;

drop policy if exists "workflows_select_own" on public.workflows;
create policy "workflows_select_own"
  on public.workflows
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "workflows_insert_own" on public.workflows;
create policy "workflows_insert_own"
  on public.workflows
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "workflows_update_own" on public.workflows;
create policy "workflows_update_own"
  on public.workflows
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "workflows_delete_own" on public.workflows;
create policy "workflows_delete_own"
  on public.workflows
  for delete
  to authenticated
  using (user_id = auth.uid());
