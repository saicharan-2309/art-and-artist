create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  full_name text not null default '', profession text not null default '', headline text not null default '',
  biography text not null default '', avatar_path text, cover_path text, city text, country text,
  languages text[] not null default '{}', visibility text not null default 'public' check (visibility in ('public','connections','private')),
  verified_at timestamptz, onboarding_step smallint not null default 0 check (onboarding_step between 0 and 7),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.skills (id bigint generated always as identity primary key, name text not null unique, category text not null default 'Craft');
create table public.profile_skills (owner_id uuid not null references public.profiles(user_id) on delete cascade, skill_id bigint not null references public.skills(id) on delete cascade, proficiency text not null default 'Working', primary key(owner_id,skill_id));
create table public.experiences (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, organization text not null, role text not null, description text not null default '', location text, started_on date, ended_on date, is_current boolean not null default false);
create table public.education (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, institution text not null, qualification text not null default '', field text, started_on date, ended_on date, description text not null default '');
create table public.awards (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, title text not null, issuer text, awarded_on date, url text);
create table public.organizations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, slug text not null unique, name text not null, about text not null default '', logo_path text, cover_path text, city text, country text, website text, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.organization_members (organization_id uuid not null references public.organizations(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, role text not null default 'member' check(role in ('owner','admin','editor','member')), primary key(organization_id,owner_id));
create table public.projects (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, organization_id uuid references public.organizations(id) on delete set null, title text not null, project_type text not null default 'Other', description text not null default '', cover_path text, location text, year integer, status text not null default 'in_development', visibility text not null default 'public' check(visibility in ('public','private')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.project_members (project_id uuid not null references public.projects(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, role text not null, verified boolean not null default false, primary key(project_id,owner_id,role));
create table public.portfolio_items (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, project_id uuid references public.projects(id) on delete set null, title text not null, description text not null default '', media_path text not null, thumbnail_path text, media_type text not null check(media_type in ('image','video','audio','document','link')), category text not null default 'Work', year integer, tags text[] not null default '{}', visibility text not null default 'public' check(visibility in ('public','connections','private')), sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.credits (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, project_id uuid references public.projects(id) on delete set null, project_title text not null, role text not null, production text, year integer, verification_status text not null default 'pending' check(verification_status in ('requested','pending','verified','rejected')), created_at timestamptz not null default now());
create table public.credit_verifications (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, credit_id uuid not null references public.credits(id) on delete cascade, organization_id uuid not null references public.organizations(id) on delete cascade, decision text not null check(decision in ('verified','rejected')), note text not null default '', created_at timestamptz not null default now());
create table public.work_posts (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, project_id uuid references public.projects(id) on delete set null, portfolio_item_id uuid references public.portfolio_items(id) on delete set null, title text not null, body text not null default '', media_path text, thumbnail_path text, medium text, project_type text, location text, year integer, tags text[] not null default '{}', visibility text not null default 'public' check(visibility in ('public','connections','private')), status text not null default 'published' check(status in ('draft','published','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.work_likes (work_id uuid not null references public.work_posts(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, created_at timestamptz not null default now(), primary key(work_id,owner_id));
create table public.work_saves (work_id uuid not null references public.work_posts(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, created_at timestamptz not null default now(), primary key(work_id,owner_id));
create table public.connections (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, addressee_id uuid not null references public.profiles(user_id) on delete cascade, status text not null default 'pending' check(status in ('pending','accepted','declined','withdrawn')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(owner_id,addressee_id), check(owner_id <> addressee_id));
create table public.jobs (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, organization_id uuid references public.organizations(id) on delete set null, title text not null, role text not null, description text not null, responsibilities text not null default '', qualifications text not null default '', location text, work_mode text not null default 'on_site', employment_type text not null default 'contract', compensation text, deadline date, skills text[] not null default '{}', application_instructions text not null default '', status text not null default 'draft' check(status in ('draft','active','paused','closed')), created_at timestamptz not null default now());
create table public.job_applications (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, job_id uuid not null references public.jobs(id) on delete cascade, cover_note text not null default '', status text not null default 'applied' check(status in ('applied','under_review','shortlisted','rejected','accepted','withdrawn')), created_at timestamptz not null default now(), unique(job_id,owner_id));
create table public.collaborations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, project_id uuid references public.projects(id) on delete set null, title text not null, project_type text not null, description text not null, location text, work_mode text not null default 'hybrid', roles_needed text[] not null default '{}', skills text[] not null default '{}', stage text, timeline text, budget text, compensation text not null default 'negotiable', deadline date, status text not null default 'open' check(status in ('draft','open','paused','closed')), created_at timestamptz not null default now());
create table public.collaboration_interests (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, collaboration_id uuid not null references public.collaborations(id) on delete cascade, note text not null default '', status text not null default 'sent', created_at timestamptz not null default now(), unique(collaboration_id,owner_id));
create table public.blogs (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, organization_id uuid references public.organizations(id) on delete set null, slug text not null unique, title text not null, subtitle text not null default '', cover_path text, category text not null default 'Journal', tags text[] not null default '{}', body jsonb not null default '[]', status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz, created_at timestamptz not null default now());
create table public.blog_drafts (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, title text not null default '', content jsonb not null default '[]', updated_at timestamptz not null default now());
create table public.blog_likes (blog_id uuid not null references public.blogs(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, primary key(blog_id,owner_id));
create table public.blog_saves (blog_id uuid not null references public.blogs(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, primary key(blog_id,owner_id));
create table public.conversations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, context_type text, context_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.conversation_members (conversation_id uuid not null references public.conversations(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, last_read_at timestamptz, muted boolean not null default false, primary key(conversation_id,owner_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, owner_id uuid not null references public.profiles(user_id) on delete cascade, body text not null default '', attachment_path text, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, actor_id uuid references public.profiles(user_id) on delete set null, kind text not null, entity_type text, entity_id uuid, payload jsonb not null default '{}', read_at timestamptz, created_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id) on delete cascade, target_type text not null, target_id uuid not null, reason text not null, details text not null default '', status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')), created_at timestamptz not null default now());
create table public.blocked_users (owner_id uuid not null references public.profiles(user_id) on delete cascade, blocked_id uuid not null references public.profiles(user_id) on delete cascade, created_at timestamptz not null default now(), primary key(owner_id,blocked_id), check(owner_id <> blocked_id));
create table public.user_settings (owner_id uuid primary key references public.profiles(user_id) on delete cascade, profile_visibility text not null default 'public', portfolio_visibility text not null default 'public', allow_messages text not null default 'everyone', allow_connections boolean not null default true, show_availability boolean not null default true, show_contact boolean not null default false, email_notifications boolean not null default true, updated_at timestamptz not null default now());
create table public.availability (owner_id uuid primary key references public.profiles(user_id) on delete cascade, status text not null default 'open', interested_in text[] not null default '{}', note text not null default '', updated_at timestamptz not null default now());
create table public.admin_roles (owner_id uuid primary key references public.profiles(user_id) on delete cascade, role text not null check(role in ('admin','moderator','verification_reviewer')), granted_by uuid references public.profiles(user_id), created_at timestamptz not null default now());
create table public.admin_actions (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(user_id), action text not null, target_type text not null, target_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now());

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_roles where owner_id = (select auth.uid()) and role in ('admin','moderator'));
$$;
create or replace function public.can_view_profile(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target = (select auth.uid()) or exists(select 1 from public.profiles where user_id = target and visibility = 'public');
$$;
create or replace function public.can_view_portfolio(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target=(select auth.uid()) or exists(
    select 1 from public.user_settings s where s.owner_id=target and s.portfolio_visibility='public' and public.can_view_profile(target)
  );
$$;
create or replace function public.is_conversation_member(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.conversation_members where conversation_id = target and owner_id = (select auth.uid()));
$$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare base_name text;
begin
  base_name := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'artist'), '[^a-z0-9_]', '', 'g'));
  base_name := left(case when length(base_name) < 3 then 'artist' || base_name else base_name end, 22);
  insert into public.profiles(user_id,username,full_name) values(new.id,base_name || '_' || left(replace(new.id::text,'-',''),6),coalesce(new.raw_user_meta_data ->> 'full_name',''));
  insert into public.user_settings(owner_id) values(new.id);
  insert into public.availability(owner_id) values(new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create index profiles_profession_idx on public.profiles(profession);
create index profiles_place_idx on public.profiles(country,city);
create index projects_owner_idx on public.projects(owner_id,created_at desc);
create index portfolio_owner_idx on public.portfolio_items(owner_id,sort_order);
create index work_feed_idx on public.work_posts(status,visibility,created_at desc);
create index jobs_feed_idx on public.jobs(status,created_at desc);
create index collaborations_feed_idx on public.collaborations(status,created_at desc);
create index blogs_feed_idx on public.blogs(status,published_at desc);
create index messages_feed_idx on public.messages(conversation_id,created_at desc);
create index notifications_feed_idx on public.notifications(owner_id,created_at desc);

do $$ declare t text; begin
  foreach t in array array['profiles','profile_skills','experiences','education','awards','organizations','organization_members','projects','project_members','portfolio_items','credits','credit_verifications','work_posts','work_likes','work_saves','connections','jobs','job_applications','collaborations','collaboration_interests','blogs','blog_drafts','blog_likes','blog_saves','conversations','conversation_members','messages','notifications','reports','blocked_users','user_settings','availability','admin_roles','admin_actions','skills']
  loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['profile_skills','experiences','education','awards','organization_members','project_members','portfolio_items','credits','credit_verifications','work_likes','work_saves','connections','job_applications','collaboration_interests','blog_drafts','blog_likes','blog_saves','conversation_members','messages','notifications','reports','blocked_users','user_settings','availability','admin_actions']
  loop
    execute format('create policy %I on public.%I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))',t || '_owner_all',t);
  end loop;
end $$;
create policy "Profiles public read" on public.profiles for select using (public.can_view_profile(user_id));
create policy "Profiles own update" on public.profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Profiles own insert" on public.profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Skills catalog read" on public.skills for select using(true);
create policy "Skills admin edit" on public.skills for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Organizations read" on public.organizations for select using(true);
create policy "Organizations owner write" on public.organizations for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Projects read public" on public.projects for select using(visibility='public' or owner_id=(select auth.uid()));
create policy "Projects owner write" on public.projects for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Work read public" on public.work_posts for select using((status='published' and visibility='public') or owner_id=(select auth.uid()));
create policy "Work owner write" on public.work_posts for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Jobs read active" on public.jobs for select using(status='active' or owner_id=(select auth.uid()) or public.is_admin());
create policy "Jobs owner write" on public.jobs for all to authenticated using(owner_id=(select auth.uid()) or public.is_admin()) with check(owner_id=(select auth.uid()) or public.is_admin());
create policy "Collaborations read open" on public.collaborations for select using(status='open' or owner_id=(select auth.uid()));
create policy "Collaborations owner write" on public.collaborations for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Blogs published read" on public.blogs for select using(status='published' or owner_id=(select auth.uid()));
create policy "Blogs owner write" on public.blogs for all to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Conversation read membership" on public.conversations for select using(public.is_conversation_member(id));
create policy "Create conversation" on public.conversations for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Messages read membership" on public.messages for select using(public.is_conversation_member(conversation_id));
create policy "Send to conversation members" on public.messages for insert to authenticated with check(owner_id=(select auth.uid()) and public.is_conversation_member(conversation_id));
create policy "Admin roles self or admins read" on public.admin_roles for select using(owner_id=(select auth.uid()) or public.is_admin());
create policy "Admin roles admins write" on public.admin_roles for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Admin actions admins read" on public.admin_actions for select using(public.is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('covers','covers',false,12582912,array['image/jpeg','image/png','image/webp']),
  ('portfolio','portfolio',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','application/pdf']),
  ('projects','projects',false,20971520,array['image/jpeg','image/png','image/webp','video/mp4']),
  ('showreels','showreels',false,104857600,array['video/mp4']),
  ('blog-images','blog-images',false,12582912,array['image/jpeg','image/png','image/webp']),
  ('organization-assets','organization-assets',false,12582912,array['image/jpeg','image/png','image/webp']),
  ('message-attachments','message-attachments',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict(id) do nothing;
create policy "Upload own media" on storage.objects for insert to authenticated with check(bucket_id <> 'message-attachments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Read own media" on storage.objects for select to authenticated using((storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Update own media" on storage.objects for update to authenticated using((storage.foldername(name))[1]=(select auth.uid())::text) with check((storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Delete own media" on storage.objects for delete to authenticated using((storage.foldername(name))[1]=(select auth.uid())::text);
