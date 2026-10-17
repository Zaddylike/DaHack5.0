-- Apply after 202610170001_cloud_seed_garden.sql. Memories are optional and
-- never participate in break duration, seeds, growth, or achievements.
begin;

alter table public.break_sessions add constraint break_sessions_id_user_unique unique (id, user_id);

create table public.break_memories (
  session_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note text check (note is null or char_length(note) between 1 and 120),
  latitude_approx numeric(5,2) check (latitude_approx between -90 and 90),
  longitude_approx numeric(5,2) check (longitude_approx between -180 and 180),
  photo_path text,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.break_sessions(id, user_id) on delete cascade,
  check ((latitude_approx is null) = (longitude_approx is null)),
  check (note is not null or photo_path is not null or latitude_approx is not null),
  check (photo_path is null or photo_path = user_id::text || '/' || session_id::text || '.jpg')
);
create index break_memories_user_time on public.break_memories(user_id, captured_at desc);
alter table public.break_memories enable row level security;
revoke all on public.break_memories from anon, authenticated;
grant select, insert, update on public.break_memories to authenticated;

create policy own_completed_memories on public.break_memories
  for all to authenticated
  using (user_id = auth.uid() and public.is_demo_user())
  with check (
    user_id = auth.uid() and public.is_demo_user()
    and exists (
      select 1 from public.break_sessions s
      where s.id = session_id and s.user_id = auth.uid() and s.ended_at is not null
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('break-memories', 'break-memories', false, 3145728, array['image/jpeg'])
on conflict (id) do nothing;

create policy own_memory_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'break-memories' and public.is_demo_user() and exists (
    select 1 from public.break_sessions s where s.user_id = auth.uid() and s.ended_at is not null
      and name = auth.uid()::text || '/' || s.id::text || '.jpg'
  ));
create policy own_memory_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'break-memories' and public.is_demo_user() and exists (
    select 1 from public.break_sessions s where s.user_id = auth.uid() and s.ended_at is not null
      and name = auth.uid()::text || '/' || s.id::text || '.jpg'
  ));
create policy own_memory_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'break-memories' and public.is_demo_user() and exists (
    select 1 from public.break_sessions s where s.user_id = auth.uid() and s.ended_at is not null
      and name = auth.uid()::text || '/' || s.id::text || '.jpg'
  ))
  with check (bucket_id = 'break-memories' and public.is_demo_user() and exists (
    select 1 from public.break_sessions s where s.user_id = auth.uid() and s.ended_at is not null
      and name = auth.uid()::text || '/' || s.id::text || '.jpg'
  ));

-- The browser never supplies user_id or a Storage path. A memory can only
-- attach to the caller's own completed session.
create function public.save_break_memory(
  target_session_id uuid,
  memory_note text,
  memory_latitude numeric,
  memory_longitude numeric,
  memory_captured_at timestamptz,
  has_photo boolean
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.is_demo_user() then raise exception 'Demo account access required'; end if;
  if not exists (select 1 from public.break_sessions where id = target_session_id and user_id = auth.uid() and ended_at is not null)
    then raise exception 'Completed session not found'; end if;
  if memory_note is not null and char_length(memory_note) > 120 then raise exception 'Note is too long'; end if;
  if (memory_latitude is null) <> (memory_longitude is null) then raise exception 'Incomplete location'; end if;
  if memory_latitude is not null and (memory_latitude < -90 or memory_latitude > 90 or memory_longitude < -180 or memory_longitude > 180)
    then raise exception 'Invalid location'; end if;
  if nullif(btrim(memory_note), '') is null and memory_latitude is null and not coalesce(has_photo, false)
    then raise exception 'Memory is empty'; end if;
  if coalesce(has_photo, false) and not exists (
    select 1 from storage.objects where bucket_id = 'break-memories'
      and name = auth.uid()::text || '/' || target_session_id::text || '.jpg'
  ) then raise exception 'Photo upload not found'; end if;
  insert into public.break_memories(session_id, user_id, note, latitude_approx, longitude_approx, photo_path, captured_at)
  values (target_session_id, auth.uid(), nullif(btrim(memory_note), ''), round(memory_latitude, 2), round(memory_longitude, 2),
    case when has_photo then auth.uid()::text || '/' || target_session_id::text || '.jpg' else null end,
    memory_captured_at)
  on conflict(session_id) do update set
    note = excluded.note,
    latitude_approx = excluded.latitude_approx,
    longitude_approx = excluded.longitude_approx,
    photo_path = excluded.photo_path,
    captured_at = excluded.captured_at,
    updated_at = now();
end;
$$;
revoke all on function public.save_break_memory(uuid, text, numeric, numeric, timestamptz, boolean) from public;
grant execute on function public.save_break_memory(uuid, text, numeric, numeric, timestamptz, boolean) to authenticated;

commit;
