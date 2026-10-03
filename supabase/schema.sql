-- EDIT: Add or rename profile fields here, then update the dashboard queries too.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles enable row level security;

-- Each signed-in user may read and edit only the row whose id matches their auth user id.
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

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

-- EDIT: Private support inbox for live website chat and visitor enquiries.
create table if not exists public.support_inbox (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  kind text not null check (kind in ('conversation', 'enquiry')),
  visitor_name text check (visitor_name is null or char_length(visitor_name) <= 80),
  visitor_email text check (visitor_email is null or char_length(visitor_email) <= 160),
  service text check (service is null or char_length(service) <= 80),
  message text check (message is null or char_length(message) <= 1200),
  consented_at timestamptz,
  messages jsonb not null default '[]'::jsonb
    check (
      case
        when jsonb_typeof(messages) = 'array'
          then jsonb_array_length(messages) <= 40
        else false
      end
    ),
  status text not null default 'new' check (status in ('new', 'in-progress', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_inbox_consent_check check (
    (kind = 'enquiry' and consented_at is not null)
    or (kind = 'conversation' and consented_at is null)
  ),
  constraint support_inbox_item_shape_check check (
    (
      kind = 'conversation'
      and visitor_name is null
      and visitor_email is null
      and service is null
      and message is null
    )
    or (
      kind = 'enquiry'
      and visitor_name is not null
      and visitor_email is not null
      and message is not null
    )
  )
);

create index if not exists support_inbox_updated_idx
  on public.support_inbox (updated_at desc);

alter table public.support_inbox enable row level security;
revoke all on public.support_inbox from anon, authenticated;
grant select on public.support_inbox to authenticated;
grant update (status) on public.support_inbox to authenticated;
grant delete on public.support_inbox to authenticated;
grant select, insert, update on public.support_inbox to service_role;

drop policy if exists "Admins can read the support inbox" on public.support_inbox;
create policy "Admins can read the support inbox"
  on public.support_inbox for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update support inbox status" on public.support_inbox;
create policy "Admins can update support inbox status"
  on public.support_inbox for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can delete support inbox items" on public.support_inbox;
create policy "Admins can delete support inbox items"
  on public.support_inbox for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop trigger if exists on_support_inbox_updated on public.support_inbox;
create trigger on_support_inbox_updated
  before update on public.support_inbox
  for each row execute function public.set_profile_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_inbox'
  ) then
    alter publication supabase_realtime add table public.support_inbox;
  end if;
end;
$$;

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
