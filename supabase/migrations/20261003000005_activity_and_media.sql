drop policy if exists "Connection requests notify parties" on public.connections;
drop policy if exists conversation_members_owner_all on public.conversation_members;
create policy "Read conversation membership" on public.conversation_members for select to authenticated using(owner_id=(select auth.uid()) or public.is_conversation_member(conversation_id));
create policy "Update own conversation membership" on public.conversation_members for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Leave own conversation" on public.conversation_members for delete to authenticated using(owner_id=(select auth.uid()));
create policy "Recipients receive membership attachments" on storage.objects for select to authenticated using(
  bucket_id='message-attachments' and exists(
    select 1 from public.messages m where m.attachment_path=name and (storage.foldername(name))[1]=m.owner_id::text and public.is_conversation_member(m.conversation_id)
  )
);
create policy "Read published work media" on storage.objects for select to anon,authenticated using(
  bucket_id='portfolio' and exists(select 1 from public.work_posts w where w.media_path=name and w.visibility='public' and w.status='published' and (storage.foldername(name))[1]=w.owner_id::text)
);
create policy "Members upload conversation attachments" on storage.objects for insert to authenticated with check(
  bucket_id='message-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text
);

create or replace function public.start_conversation(target uuid, context_kind text default null, context uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); thread uuid; message_rule text;
begin
  if actor is null or target=actor or not exists(select 1 from public.profiles where user_id=target) then raise exception 'A valid recipient is required'; end if;
  if exists(select 1 from public.blocked_users b where (b.owner_id=actor and b.blocked_id=target) or (b.owner_id=target and b.blocked_id=actor)) then raise exception 'Messaging is unavailable'; end if;
  select allow_messages into message_rule from public.user_settings where owner_id=target;
  if message_rule='nobody' then raise exception 'This profile is not accepting messages'; end if;
  if message_rule='connections' and not exists(select 1 from public.connections c where c.status='accepted' and
    ((c.owner_id=actor and c.addressee_id=target) or (c.addressee_id=actor and c.owner_id=target))) then raise exception 'Connect before sending a message'; end if;
  select c.id into thread from public.conversations c
    where (select count(*) from public.conversation_members m where m.conversation_id=c.id and m.owner_id in (actor,target))=2
      and (select count(*) from public.conversation_members m where m.conversation_id=c.id)=2
      and coalesce(c.context_type,'')=coalesce(context_kind,'') and c.context_id is not distinct from context limit 1;
  if thread is not null then return thread; end if;
  insert into public.conversations(owner_id,context_type,context_id) values(actor,context_kind,context) returning id into thread;
  insert into public.conversation_members(conversation_id,owner_id) values(thread,actor),(thread,target);
  return thread;
end;
$$;
grant execute on function public.start_conversation(uuid,text,uuid) to authenticated;

create or replace function public.notify_content_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare recipient uuid; item_id uuid; actor uuid;
begin
  actor:=new.owner_id;
  if tg_table_name='work_likes' then
    item_id:=new.work_id;
    select w.owner_id into recipient from public.work_posts w where w.id=item_id;
    if recipient is not null and recipient<>actor then
      insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id) values(recipient,actor,'work_like','work',item_id);
    end if;
  elsif tg_table_name='blog_likes' then
    item_id:=new.blog_id;
    select b.owner_id into recipient from public.blogs b where b.id=item_id;
    if recipient is not null and recipient<>actor then
      insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id) values(recipient,actor,'blog_like','blog',item_id);
    end if;
  elsif tg_table_name='job_applications' then
    item_id:=new.job_id;
    select j.owner_id into recipient from public.jobs j where j.id=item_id;
    if recipient is not null and recipient<>actor then
      insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id) values(recipient,actor,'job_application','job',item_id);
    end if;
  elsif tg_table_name='collaboration_interests' then
    item_id:=new.collaboration_id;
    select c.owner_id into recipient from public.collaborations c where c.id=item_id;
    if recipient is not null and recipient<>actor then
      insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id) values(recipient,actor,'collaboration_interest','collaboration',item_id);
    end if;
  end if;
  return new;
end;
$$;
create trigger work_like_notification after insert on public.work_likes for each row execute function public.notify_content_activity();
create trigger blog_like_notification after insert on public.blog_likes for each row execute function public.notify_content_activity();
create trigger job_application_notification after insert on public.job_applications for each row execute function public.notify_content_activity();
create trigger collaboration_interest_notification after insert on public.collaboration_interests for each row execute function public.notify_content_activity();
