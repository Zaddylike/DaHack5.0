-- Apply after the existing cloud garden migrations. Existing active plants keep their progress.
begin;
alter table public.garden_state add column planted_at timestamptz;
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
    next_seconds := garden.growing_seconds + least(seconds, greatest(0, floor(extract(epoch from (least(finished,target.started_at + interval '12 hours') - greatest(target.started_at, coalesce(garden.planted_at,target.started_at)))))::integer));
    if next_seconds >= 600 then
      kind := garden.growing_kind;
      blooms := array_append(blooms, kind::smallint);
      inventory[kind + 1] := inventory[kind + 1] + 1;
      update public.garden_state set seeds = inventory, flowers = blooms,
        growing_kind = null, growing_seconds = 0, planted_at = null where user_id = auth.uid();
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

create or replace function public.plant_seed(seed_kind integer) returns void
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
    growing_seconds = 0, planted_at = clock_timestamp() where user_id = auth.uid();
end;
$$;

commit;
