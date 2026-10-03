alter table public.credits add column if not exists verified_by uuid references public.profiles(user_id);
revoke insert on public.credits from authenticated;
grant insert(owner_id,project_id,project_title,role,production,year) on public.credits to authenticated;
revoke insert on public.organizations from authenticated;
grant insert(owner_id,slug,name,about,logo_path,cover_path,city,country,website) on public.organizations to authenticated;
revoke insert on public.project_members from authenticated;
grant insert(project_id,owner_id,role) on public.project_members to authenticated;

create or replace function public.prevent_self_credit_verification()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.verification_status='verified' and current_user not in ('postgres','service_role') then
    raise exception 'Only an authorized organization reviewer can verify a credit';
  end if;
  return new;
end;
$$;
create trigger prevent_self_credit_verification before insert or update of verification_status on public.credits
for each row execute function public.prevent_self_credit_verification();

create or replace function public.apply_credit_verification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare credit_owner uuid; project_org uuid;
begin
  select c.owner_id,p.organization_id into credit_owner,project_org
    from public.credits c left join public.projects p on p.id=c.project_id where c.id=new.credit_id;
  if credit_owner is null or credit_owner<>new.owner_id or project_org is distinct from new.organization_id then
    raise exception 'The organization is not attached to this credit project';
  end if;
  update public.credits set verification_status=new.decision,verified_by=new.reviewer_id where id=new.credit_id;
  return new;
end;
$$;
create trigger apply_credit_verification after insert on public.credit_verifications
for each row execute function public.apply_credit_verification();

create policy "Connection requests notify parties" on public.connections for update to authenticated
using(addressee_id=(select auth.uid()) and status='pending') with check(addressee_id=(select auth.uid()) and status in ('accepted','declined'));
