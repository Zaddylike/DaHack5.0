-- Run after 202610160001_core.sql. Align collection unlock with the 10-minute bloom goal.
begin;

create or replace function public.finish_break(session_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
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
  if total >= 600 then
    insert into public.flower_collections(user_id) values(auth.uid()) on conflict(user_id, species) do nothing;
  end if;
end;
$$;

-- Existing completed breaks remain the source of truth after this rules change.
insert into public.flower_progress(user_id, total_seconds)
select user_id, sum(duration_seconds)
from public.break_sessions
where ended_at is not null
group by user_id
on conflict(user_id) do update set total_seconds = excluded.total_seconds;

insert into public.flower_collections(user_id)
select user_id
from public.break_sessions
where ended_at is not null
group by user_id
having sum(duration_seconds) >= 600
on conflict(user_id, species) do nothing;

commit;
