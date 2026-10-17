-- Daily Mail: private-by-default photos; anonymous copies visible only to their recipient.
begin;
create table public.mail_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.break_sessions(id) on delete cascade,
  shared_at timestamptz,
  withdrawn boolean not null default false
);
create table public.daily_deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  delivery_day date not null,
  share_id uuid not null unique references public.mail_shares(id) on delete cascade,
  opened boolean not null default false,
  thanked boolean not null default false,
  thanks_seen boolean not null default false,
  unique(recipient_id, delivery_day)
);
alter table public.mail_shares enable row level security;
alter table public.daily_deliveries enable row level security;
revoke all on public.mail_shares, public.daily_deliveries from anon, authenticated;
-- No direct table access: RPCs return only the minimum anonymous fields.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('daily-mail','daily-mail',false,3145728,array['image/jpeg']);

create function public.mail_photo_access(object_name text, uploading boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and public.is_demo_user() and exists (
  select 1 from public.mail_shares s where object_name = s.id::text || '.jpg' and not s.withdrawn
  and (s.owner_id = auth.uid() and (not uploading or s.shared_at is null)
   or not uploading and s.shared_at is not null and exists(select 1 from public.daily_deliveries d where d.share_id=s.id and d.recipient_id=auth.uid()))
 );
$$;
create policy mail_photo_read on storage.objects for select to authenticated
 using(bucket_id='daily-mail' and public.mail_photo_access(name,false));
create policy mail_photo_upload on storage.objects for insert to authenticated
 with check(bucket_id='daily-mail' and public.mail_photo_access(name,true));
create policy mail_photo_replace on storage.objects for update to authenticated
 using(bucket_id='daily-mail' and public.mail_photo_access(name,true))
 with check(bucket_id='daily-mail' and public.mail_photo_access(name,true));

create function public.prepare_mail_share(target_session uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 if not exists(select 1 from public.break_memories m join public.break_sessions b on b.id=m.session_id
  where m.session_id=target_session and m.user_id=auth.uid() and b.ended_at is not null and m.photo_path is not null)
 then raise exception 'Saved photo required'; end if;
 insert into public.mail_shares(owner_id,session_id) values(auth.uid(),target_session) on conflict(session_id) do nothing;
 select id into result from public.mail_shares where session_id=target_session and owner_id=auth.uid() and not withdrawn;
 if result is null then raise exception 'Sharing withdrawn'; end if;
 return result;
end; $$;
create function public.publish_mail_share(target_share uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 perform 1 from public.mail_shares where id=target_share and owner_id=auth.uid() and not withdrawn for update;
 if not found then raise exception 'Share not found'; end if;
 if not exists(select 1 from storage.objects where bucket_id='daily-mail' and name=target_share::text || '.jpg') then raise exception 'Photo required'; end if;
 update public.mail_shares set shared_at=coalesce(shared_at,now()) where id=target_share;
end; $$;
create function public.withdraw_mail_share(target_share uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 update public.mail_shares set withdrawn=true where id=target_share and owner_id=auth.uid();
end; $$;
create function public.my_mail_shares() returns table(id uuid,session_id uuid,published boolean,withdrawn boolean)
language sql stable security definer set search_path = '' as $$
 select s.id,s.session_id,s.shared_at is not null,s.withdrawn from public.mail_shares s
 where auth.uid() is not null and public.is_demo_user() and s.owner_id=auth.uid();
$$;
create function public.get_daily_mail() returns table(id uuid,photo_path text,minutes integer,shared_day date,opened boolean,thanked boolean,withdrawn boolean)
language plpgsql security definer set search_path = '' as $$
declare chosen uuid; today date := (now() at time zone 'UTC')::date;
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('mail:' || auth.uid()::text,0));
 if not exists(select 1 from public.daily_deliveries d where d.recipient_id=auth.uid() and d.delivery_day=today) then
  select s.id into chosen from public.mail_shares s
   where s.owner_id<>auth.uid() and not s.withdrawn and (s.shared_at at time zone 'UTC')::date=today
   and not exists(select 1 from public.daily_deliveries d where d.share_id=s.id)
   order by random() limit 1 for update skip locked;
  if chosen is not null then
   insert into public.daily_deliveries(recipient_id,delivery_day,share_id) values(auth.uid(),today,chosen);
  end if;
 end if;
 return query select d.id,case when s.withdrawn then null else s.id::text || '.jpg' end,
  (b.duration_seconds/60)::integer,(s.shared_at at time zone 'UTC')::date,d.opened,d.thanked,s.withdrawn
 from public.daily_deliveries d join public.mail_shares s on s.id=d.share_id join public.break_sessions b on b.id=s.session_id
 where d.recipient_id=auth.uid() and d.delivery_day=today;
end; $$;
create function public.open_daily_mail(target_delivery uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 update public.daily_deliveries set opened=true where id=target_delivery and recipient_id=auth.uid();
end; $$;
create function public.thank_daily_mail(target_delivery uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 update public.daily_deliveries d set thanked=true where d.id=target_delivery and d.recipient_id=auth.uid()
 and d.opened and exists(select 1 from public.mail_shares s where s.id=d.share_id and not s.withdrawn);
end; $$;
create function public.mail_thanks(acknowledge boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare result boolean;
begin
 if auth.uid() is null or not public.is_demo_user() then raise exception 'Access required'; end if;
 select exists(select 1 from public.daily_deliveries d join public.mail_shares s on s.id=d.share_id
 where s.owner_id=auth.uid() and d.thanked and not d.thanks_seen) into result;
 if acknowledge then update public.daily_deliveries d set thanks_seen=true
 where d.thanked and exists(select 1 from public.mail_shares s where s.id=d.share_id and s.owner_id=auth.uid()); end if;
 return result;
end; $$;
revoke all on function public.mail_photo_access(text,boolean),public.prepare_mail_share(uuid),public.publish_mail_share(uuid),public.withdraw_mail_share(uuid),public.my_mail_shares(),public.get_daily_mail(),public.open_daily_mail(uuid),public.thank_daily_mail(uuid),public.mail_thanks(boolean) from public;
grant execute on function public.mail_photo_access(text,boolean),public.prepare_mail_share(uuid),public.publish_mail_share(uuid),public.withdraw_mail_share(uuid),public.my_mail_shares(),public.get_daily_mail(),public.open_daily_mail(uuid),public.thank_daily_mail(uuid),public.mail_thanks(boolean) to authenticated;
commit;
