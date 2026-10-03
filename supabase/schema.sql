-- EDIT: Add or rename profile fields here, then update the dashboard queries too.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each signed-in user may read and edit only the row whose id matches their auth user id.
grant select, update on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Automatically create a profile row whenever Supabase Auth creates a user.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- Automatically refresh updated_at when the profile is edited.
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.set_profile_updated_at();

-- EDIT: Saved website projects belong to the signed-in user who created them.
create table if not exists public.website_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  prompt text not null default '' check (char_length(prompt) <= 1200),
  site_data jsonb not null check (jsonb_typeof(site_data) = 'object'),
  theme text not null default 'light'
    check (theme in ('light', 'warm', 'bold')),
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_projects_user_updated_idx
  on public.website_projects (user_id, updated_at desc);

alter table public.website_projects enable row level security;
grant select, insert, update, delete on public.website_projects to authenticated;

drop policy if exists "Users can read their own website projects"
  on public.website_projects;
create policy "Users can read their own website projects"
  on public.website_projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own website projects"
  on public.website_projects;
create policy "Users can create their own website projects"
  on public.website_projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own website projects"
  on public.website_projects;
create policy "Users can update their own website projects"
  on public.website_projects for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own website projects"
  on public.website_projects;
create policy "Users can delete their own website projects"
  on public.website_projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists on_website_project_updated on public.website_projects;
create trigger on_website_project_updated
  before update on public.website_projects
  for each row execute function public.set_profile_updated_at();

-- A user's AI generation attempts are limited to five per UTC day.
create table if not exists public.ai_generation_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  generation_count integer not null default 0
    check (generation_count between 0 and 5),
  primary key (user_id, usage_date)
);

alter table public.ai_generation_usage enable row level security;

create or replace function public.consume_website_generation()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_utc_date date := (now() at time zone 'utc')::date;
  updated_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  insert into public.ai_generation_usage (user_id, usage_date, generation_count)
  values (current_user_id, current_utc_date, 1)
  on conflict (user_id, usage_date)
  do update
    set generation_count = ai_generation_usage.generation_count + 1
    where public.ai_generation_usage.generation_count < 5
  returning generation_count into updated_count;

  return found;
end;
$$;

revoke all on function public.consume_website_generation() from public;
grant execute on function public.consume_website_generation() to authenticated;
