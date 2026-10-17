-- Run after 202610160002_ten_minute_growth.sql.
-- Completed sessions are authoritative. Each cumulative five minutes earns
-- one random seed; an already-finished session is never awarded twice.
begin;

create table public.garden_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seeds integer[] not null default array[0,0,0,0,0],
  flowers smallint[] not null default '{}'::smallint[],
  growing_kind smallint,
  growing_seconds integer not null default 0,
  awarded_milestones integer not null default 0 check (awarded_milestones between 0 and 100000),
  check (cardinality(seeds) = 5 and seeds[1] between 0 and 100000 and seeds[2] between 0 and 100000 and seeds[3] between 0 and 100000 and seeds[4] between 0 and 100000 and seeds[5] between 0 and 100000),
  check (cardinality(flowers) <= 10000),
  check (growing_kind is null or growing_kind between 0 and 4),
  check (growing_seconds between 0 and 599),
  check (growing_kind is not null or growing_seconds = 0)
);
alter table public.garden_state enable row level security;
create policy own_garden on public.garden_state for select to authenticated
  using (user_id = auth.uid() and public.is_demo_user());
revoke all on public.garden_state from anon, authenticated;
grant select on public.garden_state to authenticated;

alter table public.flower_collections drop constraint flower_collections_species_check;
alter table public.flower_collections add constraint flower_collections_species_check
  check (species in ('Eschscholzia californica', 'Bellis perennis', 'Centaurea cyanus', 'Papaver rhoeas', 'Cosmos bipinnatus'));

-- Preserve the first poppy and any partial progress that the old cloud garden displayed.
insert into public.garden_state(user_id, flowers, growing_kind, growing_seconds)
select user_id,
  case when total_seconds >= 600 then array[0]::smallint[] else '{}'::smallint[] end,
  case when total_seconds > 0 and total_seconds < 600 then 0::smallint else null::smallint end,
  case when total_seconds > 0 and total_seconds < 600 then total_seconds::integer else 0 end
from public.flower_progress
on conflict(user_id) do nothing;
insert into public.garden_state(user_id)
select user_id from public.demo_accounts
on conflict(user_id) do nothing;

-- Grant the seeds already earned by historical completed breaks once on migration.
do $$
declare row_data record; inventory integer[]; award integer; kind integer;
begin
  for row_data in select user_id, total_seconds from public.flower_progress loop
    select seeds into inventory from public.garden_state where user_id = row_data.user_id;
    for award in 1..(row_data.total_seconds / 300)::integer loop
      kind := floor(random() * 5)::integer;
      inventory[kind + 1] := inventory[kind + 1] + 1;
    end loop;
    update public.garden_state set seeds = inventory,
      awarded_milestones = (row_data.total_seconds / 300)::integer where user_id = row_data.user_id;
  end loop;
end;
$$;

-- Safe to call while GO is running. The row lock and awarded_milestones make
-- refreshes, retries, and concurrent devices idempotent.
create function public.claim_seeds() returns void
language plpgsql security definer set search_path = '' as $$
declare
  garden public.garden_state;
  completed bigint;
  active_seconds integer;
  eligible integer;
  award integer;
  kind integer;
  inventory integer[];
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  insert into public.garden_state(user_id) values(auth.uid()) on conflict do nothing;
  select * into garden from public.garden_state where user_id = auth.uid() for update;
  select coalesce(sum(duration_seconds), 0) into completed from public.break_sessions
    where user_id = auth.uid() and ended_at is not null;
  select coalesce((select least(43200, greatest(0, floor(extract(epoch from (clock_timestamp() - started_at)))::integer))
    from public.break_sessions where user_id = auth.uid() and ended_at is null), 0) into active_seconds;
  eligible := ((completed + active_seconds) / 300)::integer;
  if eligible <= garden.awarded_milestones then return; end if;
  inventory := garden.seeds;
  for award in garden.awarded_milestones + 1..eligible loop
    kind := floor(random() * 5)::integer;
    inventory[kind + 1] := inventory[kind + 1] + 1;
  end loop;
  update public.garden_state set seeds = inventory, awarded_milestones = eligible
    where user_id = auth.uid();
end;
$$;
revoke all on function public.claim_seeds() from public;
grant execute on function public.claim_seeds() to authenticated;

create or replace function public.start_break() returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  insert into public.profiles(user_id) values(auth.uid()) on conflict do nothing;
  insert into public.flower_progress(user_id) values(auth.uid()) on conflict do nothing;
  insert into public.garden_state(user_id) values(auth.uid()) on conflict do nothing;
  select id into result from public.break_sessions where user_id = auth.uid() and ended_at is null;
  if result is null then
    insert into public.break_sessions(user_id) values(auth.uid()) returning id into result;
  end if;
  return result;
end;
$$;

create or replace function public.finish_break(session_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.break_sessions;
  garden public.garden_state;
  finished timestamptz := clock_timestamp();
  total bigint;
  seconds integer;
  kind integer;
  inventory integer[];
  blooms smallint[];
  next_seconds integer;
  flower_species text[] := array['Eschscholzia californica', 'Bellis perennis', 'Centaurea cyanus', 'Papaver rhoeas', 'Cosmos bipinnatus'];
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select * into target from public.break_sessions where id = session_id and user_id = auth.uid() for update;
  if not found then raise exception 'Session not found'; end if;
  if target.ended_at is not null then return; end if;
  seconds := least(43200, greatest(0, floor(extract(epoch from (finished - target.started_at)))::integer));
  update public.break_sessions set ended_at = finished, duration_seconds = seconds where id = target.id;

  select coalesce(sum(duration_seconds), 0) into total from public.break_sessions
    where user_id = auth.uid() and ended_at is not null;

  insert into public.garden_state(user_id) values(auth.uid()) on conflict do nothing;
  select * into garden from public.garden_state where user_id = auth.uid() for update;
  inventory := garden.seeds;
  blooms := garden.flowers;
  if garden.growing_kind is not null then
    next_seconds := garden.growing_seconds + seconds;
    if next_seconds >= 600 then
      kind := garden.growing_kind;
      blooms := array_append(blooms, kind::smallint);
      inventory[kind + 1] := inventory[kind + 1] + 1;
      update public.garden_state set seeds = inventory, flowers = blooms,
        growing_kind = null, growing_seconds = 0 where user_id = auth.uid();
      insert into public.flower_collections(user_id, species)
        values(auth.uid(), flower_species[kind + 1]) on conflict(user_id, species) do nothing;
    else
      update public.garden_state set seeds = inventory, growing_seconds = next_seconds where user_id = auth.uid();
    end if;
  else
    update public.garden_state set seeds = inventory where user_id = auth.uid();
  end if;

  insert into public.flower_progress(user_id, total_seconds) values(auth.uid(), total)
    on conflict(user_id) do update set total_seconds = excluded.total_seconds;
  perform public.claim_seeds();
end;
$$;

create function public.plant_seed(seed_kind integer) returns void
language plpgsql security definer set search_path = '' as $$
declare garden public.garden_state; inventory integer[];
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  if seed_kind is null or seed_kind not between 0 and 4 then raise exception 'Invalid seed'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  insert into public.garden_state(user_id) values(auth.uid()) on conflict do nothing;
  select * into garden from public.garden_state where user_id = auth.uid() for update;
  if garden.growing_kind is not null then raise exception 'A flower is already growing'; end if;
  if garden.seeds[seed_kind + 1] < 1 then raise exception 'Seed unavailable'; end if;
  inventory := garden.seeds;
  inventory[seed_kind + 1] := inventory[seed_kind + 1] - 1;
  update public.garden_state set seeds = inventory, growing_kind = seed_kind::smallint,
    growing_seconds = 0 where user_id = auth.uid();
end;
$$;
revoke all on function public.plant_seed(integer) from public;
grant execute on function public.plant_seed(integer) to authenticated;

commit;
