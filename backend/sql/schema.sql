-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchases (Stripe / PayPal)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal')),
  provider_session_id text,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'canceled')),
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_provider_session_idx
  on public.purchases (provider_session_id);

-- Prompts library
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  title text not null,
  content text not null,
  category text not null default 'general',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  title text not null,
  content text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Course progress
create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null,
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  completed_lessons jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- User settings
create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text default 'dark',
  locale text default 'pt-BR',
  notifications_enabled boolean default true,
  preferred_ai_provider text default 'openai',
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
