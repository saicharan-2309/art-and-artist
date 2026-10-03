create or replace function public.request_connection(target uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); existing public.connections%rowtype;
begin
  if actor is null or target = actor then raise exception 'A signed-in user and another profile are required'; end if;
  if exists(select 1 from public.blocked_users b where (b.owner_id=actor and b.blocked_id=target) or (b.owner_id=target and b.blocked_id=actor)) then
    raise exception 'This connection is unavailable';
  end if;
  if exists(select 1 from public.user_settings s where s.owner_id=target and not s.allow_connections) then raise exception 'This profile is not accepting requests'; end if;
  select * into existing from public.connections c
    where (c.owner_id=actor and c.addressee_id=target) or (c.owner_id=target and c.addressee_id=actor)
    order by c.created_at desc limit 1;
  if existing.id is not null then
    if existing.status='accepted' then return existing.id; end if;
    if existing.owner_id=target and existing.status='pending' then
      update public.connections set status='accepted' where id=existing.id;
      return existing.id;
    end if;
    if existing.status='pending' then return existing.id; end if;
    delete from public.connections where id=existing.id;
  end if;
  insert into public.connections(owner_id,addressee_id) values(actor,target) returning id into existing.id;
  insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
    values(target,actor,'connection_request','profile',actor);
  return existing.id;
end;
$$;
grant execute on function public.request_connection(uuid) to authenticated;

create or replace function public.respond_connection(request_id uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if decision not in ('accepted','declined') then raise exception 'Invalid response'; end if;
  update public.connections set status=decision
    where id=request_id and addressee_id=auth.uid() and status='pending';
  if not found then raise exception 'Request not found or already handled'; end if;
  if decision='accepted' then
    insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
    select owner_id,auth.uid(),'connection_accepted','profile',auth.uid() from public.connections where id=request_id;
  end if;
end;
$$;
grant execute on function public.respond_connection(uuid,text) to authenticated;

create or replace function public.start_conversation(target uuid, context_kind text default null, context uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); thread uuid;
begin
  if actor is null or target=actor or not exists(select 1 from public.profiles where user_id=target) then raise exception 'A valid recipient is required'; end if;
  if exists(select 1 from public.blocked_users b where (b.owner_id=actor and b.blocked_id=target) or (b.owner_id=target and b.blocked_id=actor)) then raise exception 'Messaging is unavailable'; end if;
  if exists(select 1 from public.user_settings s where s.owner_id=target and s.allow_messages='nobody') then raise exception 'This profile is not accepting messages'; end if;
  select c.id into thread from public.conversations c
    where (select count(*) from public.conversation_members m where m.conversation_id=c.id and m.owner_id in (actor,target))=2
      and (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
      and coalesce(c.context_type,'')=coalesce(context_kind,'') and c.context_id is not distinct from context
    limit 1;
  if thread is not null then return thread; end if;
  insert into public.conversations(owner_id,context_type,context_id) values(actor,context_kind,context) returning id into thread;
  insert into public.conversation_members(conversation_id,owner_id) values(thread,actor),(thread,target);
  return thread;
end;
$$;
grant execute on function public.start_conversation(uuid,text,uuid) to authenticated;

create or replace function public.notify_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
  select owner_id,new.owner_id,'message','conversation',new.conversation_id
  from public.conversation_members where conversation_id=new.conversation_id and owner_id<>new.owner_id and not muted;
  return new;
end;
$$;
create trigger message_notification after insert on public.messages for each row execute function public.notify_message();

create policy "Read public profile media" on storage.objects for select to anon,authenticated using (
  bucket_id='avatars' and exists(select 1 from public.profiles p where p.user_id::text=(storage.foldername(name))[1] and public.can_view_profile(p.user_id))
  or bucket_id='covers' and exists(select 1 from public.profiles p where p.user_id::text=(storage.foldername(name))[1] and public.can_view_profile(p.user_id))
  or bucket_id='portfolio' and exists(select 1 from public.portfolio_items i where i.media_path=name and i.visibility='public' and (storage.foldername(name))[1]=i.owner_id::text and public.can_view_portfolio(i.owner_id))
  or bucket_id='projects' and exists(select 1 from public.projects p where p.cover_path=name and p.visibility='public' and (storage.foldername(name))[1]=p.owner_id::text)
  or bucket_id='blog-images' and exists(select 1 from public.blogs b where b.cover_path=name and b.status='published' and (storage.foldername(name))[1]=b.owner_id::text)
  or bucket_id='organization-assets' and exists(select 1 from public.organizations o where (o.logo_path=name or o.cover_path=name) and (storage.foldername(name))[1]=o.owner_id::text)
);

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
