-- Apply once through Supabase SQL Editor. Only Dashboard administrators manage demo_accounts.
create table public.demo_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slot smallint not null unique check (slot between 1 and 5)
);
alter table public.demo_accounts enable row level security;
revoke all on public.demo_accounts from anon, authenticated;
create function public.is_demo_user() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.demo_accounts where user_id = auth.uid());
$$;
revoke all on function public.is_demo_user() from public;
grant execute on function public.is_demo_user() to authenticated;
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Nature explorer' check (length(display_name) between 1 and 80)
);
create table public.break_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  check (duration_seconds between 0 and 43200),
  check ((ended_at is null and duration_seconds = 0) or (ended_at >= started_at and duration_seconds = least(43200, floor(extract(epoch from (ended_at - started_at)))::integer)))
);
create unique index one_active_break_per_user on public.break_sessions(user_id) where ended_at is null;
create index break_history on public.break_sessions(user_id, started_at desc);
-- Derived projection rows are maintained only by finish_break.
create table public.flower_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  species text not null default 'Eschscholzia californica' check (species = 'Eschscholzia californica'),
  total_seconds bigint not null default 0 check (total_seconds >= 0)
);
create table public.flower_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  species text not null default 'Eschscholzia californica' check (species = 'Eschscholzia californica'),
  collected_at timestamptz not null default now(),
  unique(user_id, species)
);
alter table public.profiles enable row level security;
alter table public.break_sessions enable row level security;
alter table public.flower_progress enable row level security;
alter table public.flower_collections enable row level security;
create policy own_profile on public.profiles for all to authenticated using (user_id = auth.uid() and public.is_demo_user()) with check (user_id = auth.uid() and public.is_demo_user());
create policy own_sessions on public.break_sessions for select to authenticated using (user_id = auth.uid() and public.is_demo_user());
create policy own_progress on public.flower_progress for select to authenticated using (user_id = auth.uid() and public.is_demo_user());
create policy own_collection on public.flower_collections for select to authenticated using (user_id = auth.uid() and public.is_demo_user());
revoke all on public.profiles, public.break_sessions, public.flower_progress, public.flower_collections from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.break_sessions, public.flower_progress, public.flower_collections to authenticated;
create function public.start_break() returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  insert into public.profiles(user_id) values(auth.uid()) on conflict do nothing;
  insert into public.flower_progress(user_id) values(auth.uid()) on conflict do nothing;
  select id into result from public.break_sessions where user_id = auth.uid() and ended_at is null;
  if result is null then
    insert into public.break_sessions(user_id) values(auth.uid()) returning id into result;
  end if;
  return result;
end;
$$;
create function public.finish_break(session_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare target public.break_sessions; finished timestamptz := clock_timestamp(); total bigint;
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select * into target from public.break_sessions where id = session_id and user_id = auth.uid() for update;
  if not found then raise exception 'Session not found'; end if;
  if target.ended_at is not null then return; end if;
  update public.break_sessions set ended_at = finished,
    duration_seconds = least(43200, greatest(0, floor(extract(epoch from (finished - started_at)))::integer)) where id = target.id;
  select coalesce(sum(duration_seconds), 0) into total from public.break_sessions where user_id = auth.uid() and ended_at is not null;
  insert into public.flower_progress(user_id, total_seconds) values(auth.uid(), total)
    on conflict(user_id) do update set total_seconds = excluded.total_seconds;
  if total >= 12600 then
    insert into public.flower_collections(user_id) values(auth.uid()) on conflict(user_id, species) do nothing;
  end if;
end;
$$;
revoke all on function public.start_break(), public.finish_break(uuid) from public;
grant execute on function public.start_break(), public.finish_break(uuid) to authenticated;
