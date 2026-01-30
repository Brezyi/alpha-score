-- Fix security findings: restrict friend_codes/achievements, harden profiles exposure
-- Note: pg_net extension cannot be moved without Supabase CLI; marking as informational

-- 2) FRIEND CODES: stop public enumeration
alter table public.friend_codes enable row level security;

drop policy if exists "Anyone can view friend codes" on public.friend_codes;

create policy "Users can view their own friend code"
on public.friend_codes
for select
using (auth.uid() = user_id);

-- keep existing insert policy (idempotent recreate)
drop policy if exists "Users can create their own friend code" on public.friend_codes;
create policy "Users can create their own friend code"
on public.friend_codes
for insert
with check (auth.uid() = user_id);

-- 3) PROFILES: remove broad access to full profiles; expose only safe fields via public_profiles table
alter table public.profiles enable row level security;

-- Remove the problematic policies that expose full profile rows (incl. payout_email, country, gender)
drop policy if exists "Users can view profiles of pending friend requesters" on public.profiles;
drop policy if exists "Users can view profiles of their friends" on public.profiles;

-- Create safe public profile cache table
create table if not exists public.public_profiles (
  user_id uuid primary key,
  display_name text,
  avatar_url text,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.public_profiles enable row level security;

-- Backfill / upsert from existing profiles
insert into public.public_profiles (user_id, display_name, avatar_url, username, created_at, updated_at)
select p.user_id,
       p.display_name,
       p.avatar_url,
       p.username,
       p.created_at,
       p.updated_at
from public.profiles p
on conflict (user_id) do update
set display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    username = excluded.username,
    updated_at = excluded.updated_at;

-- Keep public_profiles in sync on profile changes
create or replace function public.sync_public_profiles_from_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.public_profiles where user_id = old.user_id;
    return old;
  end if;

  insert into public.public_profiles (user_id, display_name, avatar_url, username, created_at, updated_at)
  values (
    new.user_id,
    new.display_name,
    new.avatar_url,
    new.username,
    coalesce(new.created_at, now()),
    coalesce(new.updated_at, now())
  )
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      avatar_url = excluded.avatar_url,
      username = excluded.username,
      updated_at = excluded.updated_at;

  return new;
end;
$$;

drop trigger if exists trg_sync_public_profiles_insupd on public.profiles;
create trigger trg_sync_public_profiles_insupd
after insert or update on public.profiles
for each row
execute function public.sync_public_profiles_from_profiles();

drop trigger if exists trg_sync_public_profiles_del on public.profiles;
create trigger trg_sync_public_profiles_del
after delete on public.profiles
for each row
execute function public.sync_public_profiles_from_profiles();

-- RLS policies for public_profiles (mirror the previous friend/pending behavior but only safe columns)
drop policy if exists "Users can view their own public profile" on public.public_profiles;
create policy "Users can view their own public profile"
on public.public_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can view public profiles of their friends" on public.public_profiles;
create policy "Users can view public profiles of their friends"
on public.public_profiles
for select
using (
  exists (
    select 1
    from public.friend_connections fc
    where fc.status = 'accepted'::public.friend_status
      and (
        (fc.requester_id = auth.uid() and fc.addressee_id = public_profiles.user_id)
        or
        (fc.addressee_id = auth.uid() and fc.requester_id = public_profiles.user_id)
      )
  )
);

drop policy if exists "Users can view public profiles of pending friend requesters" on public.public_profiles;
create policy "Users can view public profiles of pending friend requesters"
on public.public_profiles
for select
using (
  exists (
    select 1
    from public.friend_connections fc
    where fc.status = 'pending'::public.friend_status
      and fc.addressee_id = auth.uid()
      and fc.requester_id = public_profiles.user_id
  )
);

-- Allow users to upsert their own public profile (needed for the sync trigger when users edit their profile)
drop policy if exists "Users can insert their own public profile" on public.public_profiles;
create policy "Users can insert their own public profile"
on public.public_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own public profile" on public.public_profiles;
create policy "Users can update their own public profile"
on public.public_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Secure resolver for add-by-code flow (prevents needing broad SELECT access)
create or replace function public.resolve_friend_code(p_code text)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Require authentication
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  return query
  select fc.user_id,
         pp.display_name,
         pp.avatar_url
  from public.friend_codes fc
  left join public.public_profiles pp on pp.user_id = fc.user_id
  where fc.code = upper(p_code)
  limit 1;
end;
$$;

revoke all on function public.resolve_friend_code(text) from public;
grant execute on function public.resolve_friend_code(text) to authenticated;

-- 4) ACHIEVEMENTS: restrict to authenticated users (still works because app fetches only when logged in)
alter table public.achievements enable row level security;

drop policy if exists "Anyone can view achievements" on public.achievements;
create policy "Authenticated users can view achievements"
on public.achievements
for select
using (auth.uid() is not null);
