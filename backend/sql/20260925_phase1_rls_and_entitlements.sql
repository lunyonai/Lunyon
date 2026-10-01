-- PHASE 1 — Foundation + Security
-- GENERATE ONLY. DO NOT APPLY until explicitly approved.
-- Canonical app: frontend/ + frontend/backend/
-- Service-role backend bypasses RLS; these policies are defense in depth.

-- ---------------------------------------------------------------------------
-- Entitlements (approved business model)
-- ---------------------------------------------------------------------------
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'none'
    check (status in ('none', 'active', 'expired', 'canceled')),
  access_until timestamptz,
  source text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Enable RLS on product tables
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.prompts enable row level security;
alter table public.settings enable row level security;
alter table public.entitlements enable row level security;

-- Legacy tables (not used by the Lunyon app; RLS still applied)
alter table public.templates enable row level security;
alter table public.course_progress enable row level security;

-- ---------------------------------------------------------------------------
-- profiles: owner read/update only
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- settings: owner only
-- ---------------------------------------------------------------------------
drop policy if exists "settings_select_own" on public.settings;
create policy "settings_select_own"
  on public.settings
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "settings_insert_own" on public.settings;
create policy "settings_insert_own"
  on public.settings
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "settings_update_own" on public.settings;
create policy "settings_update_own"
  on public.settings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- prompts: owner CRUD; public read when is_public
-- ---------------------------------------------------------------------------
drop policy if exists "prompts_select_own_or_public" on public.prompts;
create policy "prompts_select_own_or_public"
  on public.prompts
  for select
  to authenticated
  using (user_id = auth.uid() or is_public = true);

drop policy if exists "prompts_insert_own" on public.prompts;
create policy "prompts_insert_own"
  on public.prompts
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "prompts_update_own" on public.prompts;
create policy "prompts_update_own"
  on public.prompts
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "prompts_delete_own" on public.prompts;
create policy "prompts_delete_own"
  on public.prompts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- purchases: owner SELECT only. Writes belong to trusted backend / payments.
-- ---------------------------------------------------------------------------
drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own"
  on public.purchases
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- entitlements: owner SELECT only. Writes belong to trusted backend / Stripe.
-- ---------------------------------------------------------------------------
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
  on public.entitlements
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Legacy: templates / course_progress (same ownership pattern)
-- ---------------------------------------------------------------------------
drop policy if exists "templates_select_own_or_public" on public.templates;
create policy "templates_select_own_or_public"
  on public.templates
  for select
  to authenticated
  using (user_id = auth.uid() or is_public = true);

drop policy if exists "templates_insert_own" on public.templates;
create policy "templates_insert_own"
  on public.templates
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "templates_update_own" on public.templates;
create policy "templates_update_own"
  on public.templates
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "templates_delete_own" on public.templates;
create policy "templates_delete_own"
  on public.templates
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "course_progress_select_own" on public.course_progress;
create policy "course_progress_select_own"
  on public.course_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "course_progress_insert_own" on public.course_progress;
create policy "course_progress_insert_own"
  on public.course_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "course_progress_update_own" on public.course_progress;
create policy "course_progress_update_own"
  on public.course_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
