drop policy if exists organization_members_owner_all on public.organization_members;
create policy "Organization members read" on public.organization_members for select to authenticated using(
  owner_id=(select auth.uid()) or exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid()))
);
create policy "Organization owners manage membership" on public.organization_members for all to authenticated using(
  exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid()))
) with check(exists(select 1 from public.organizations o where o.id=organization_id and o.owner_id=(select auth.uid())));

drop policy if exists collaboration_interests_owner_all on public.collaboration_interests;
create policy "Interest parties read" on public.collaboration_interests for select to authenticated using(
  owner_id=(select auth.uid()) or exists(select 1 from public.collaborations c where c.id=collaboration_id and c.owner_id=(select auth.uid()))
);
create policy "Interest only in open work" on public.collaboration_interests for insert to authenticated with check(
  owner_id=(select auth.uid()) and status='sent' and exists(
    select 1 from public.collaborations c where c.id=collaboration_id and c.status='open' and c.owner_id<>(select auth.uid())
  )
);
create policy "Interest owner withdraws" on public.collaboration_interests for update to authenticated using(
  owner_id=(select auth.uid()) and status in ('sent','viewed')
) with check(owner_id=(select auth.uid()) and status='withdrawn');

drop policy if exists "Applicants submit" on public.job_applications;
create policy "Applicants submit" on public.job_applications for insert to authenticated with check(
  owner_id=(select auth.uid()) and status='applied' and exists(
    select 1 from public.jobs j where j.id=job_id and j.status='active' and j.owner_id<>(select auth.uid())
  )
);
revoke insert on public.connections from authenticated;
create unique index if not exists connections_one_direction_pair
  on public.connections(least(owner_id,addressee_id),greatest(owner_id,addressee_id));

create or replace function public.request_connection(target uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); existing public.connections%rowtype;
begin
  if actor is null or target=actor then raise exception 'A signed-in user and another profile are required'; end if;
  if exists(select 1 from public.blocked_users b where (b.owner_id=actor and b.blocked_id=target) or (b.owner_id=target and b.blocked_id=actor)) then raise exception 'This connection is unavailable'; end if;
  if exists(select 1 from public.user_settings s where s.owner_id=target and not s.allow_connections) then raise exception 'This profile is not accepting requests'; end if;
  select * into existing from public.connections c where
    (c.owner_id=actor and c.addressee_id=target) or (c.owner_id=target and c.addressee_id=actor)
    order by c.created_at desc limit 1;
  if existing.id is not null then
    if existing.status='accepted' then return existing.id; end if;
    if existing.owner_id=target and existing.status='pending' then
      update public.connections set status='accepted' where id=existing.id;
      insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
        values(target,actor,'connection_accepted','profile',actor);
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

drop policy if exists "Authorized organization verifies credit" on public.credit_verifications;
create policy "Authorized organization verifies credit" on public.credit_verifications for insert to authenticated with check(
  reviewer_id=(select auth.uid()) and (
    exists(select 1 from public.organizations o where o.id=credit_verifications.organization_id and o.owner_id=(select auth.uid()))
    or exists(select 1 from public.organization_members m where m.organization_id=credit_verifications.organization_id and m.owner_id=(select auth.uid()) and m.role in ('owner','admin','editor'))
  )
);

create or replace function public.respond_collaboration_interest(interest_id uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare applicant uuid; creator uuid;
begin
  if decision not in ('accepted','declined') then raise exception 'Invalid response'; end if;
  select i.owner_id,c.owner_id into applicant,creator from public.collaboration_interests i
    join public.collaborations c on c.id=i.collaboration_id where i.id=interest_id;
  if auth.uid() is distinct from creator then raise exception 'Only the project creator can respond'; end if;
  update public.collaboration_interests set status=decision where id=interest_id and status in ('sent','viewed');
  if not found then raise exception 'Interest not found or already handled'; end if;
  insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
    values(applicant,auth.uid(),'collaboration_response','collaboration',interest_id);
end;
$$;
grant execute on function public.respond_collaboration_interest(uuid,text) to authenticated;

alter table public.messages add constraint messages_attachment_owner_path
  check(attachment_path is null or split_part(attachment_path,'/',1)=owner_id::text) not valid;
