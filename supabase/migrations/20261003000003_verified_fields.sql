create or replace function public.can_view_profile(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target = (select auth.uid()) or exists(
    select 1 from public.profiles p where p.user_id=target and (
      p.visibility='public' or (p.visibility='connections' and exists(
        select 1 from public.connections c where c.status='accepted' and
          ((c.owner_id=(select auth.uid()) and c.addressee_id=target) or (c.addressee_id=(select auth.uid()) and c.owner_id=target))
      ))
    )
  );
$$;

revoke update on public.profiles from authenticated;
grant update(username,full_name,profession,headline,biography,avatar_path,cover_path,city,country,languages,visibility,onboarding_step) on public.profiles to authenticated;
revoke update on public.credits from authenticated;
grant update(project_id,project_title,role,production,year) on public.credits to authenticated;
revoke update on public.organizations from authenticated;
grant update(slug,name,about,logo_path,cover_path,city,country,website) on public.organizations to authenticated;
revoke update on public.project_members from authenticated;
grant update(role) on public.project_members to authenticated;

create or replace function public.respond_connection(request_id uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare asker uuid;
begin
  if decision not in ('accepted','declined') then raise exception 'Invalid response'; end if;
  update public.connections set status=decision
    where id=request_id and addressee_id=auth.uid() and status='pending' returning owner_id into asker;
  if asker is null then raise exception 'Request not found or already handled'; end if;
  if decision='accepted' then
    insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id) values(asker,auth.uid(),'connection_accepted','profile',auth.uid());
  end if;
end;
$$;
grant execute on function public.respond_connection(uuid,text) to authenticated;

create or replace function public.respond_application(application_id uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare app_owner uuid; employer uuid;
begin
  if decision not in ('under_review','shortlisted','rejected','accepted','withdrawn') then raise exception 'Invalid application status'; end if;
  select a.owner_id,j.owner_id into app_owner,employer from public.job_applications a join public.jobs j on j.id=a.job_id where a.id=application_id;
  if app_owner is null then raise exception 'Application not found'; end if;
  if auth.uid()=app_owner and decision='withdrawn' then
    update public.job_applications set status=decision where id=application_id and status in ('applied','under_review');
  elsif auth.uid()=employer and decision<>'withdrawn' then
    update public.job_applications set status=decision where id=application_id;
  else raise exception 'You cannot change this application'; end if;
  insert into public.notifications(owner_id,actor_id,kind,entity_type,entity_id)
    values(case when auth.uid()=app_owner then employer else app_owner end,auth.uid(),'application_update','job',application_id);
end;
$$;
grant execute on function public.respond_application(uuid,text) to authenticated;
