drop policy if exists connections_owner_all on public.connections;
drop policy if exists job_applications_owner_all on public.job_applications;
drop policy if exists project_members_owner_all on public.project_members;
drop policy if exists credit_verifications_owner_all on public.credit_verifications;
drop policy if exists reports_owner_all on public.reports;
drop policy if exists admin_actions_owner_all on public.admin_actions;
drop policy if exists messages_owner_all on public.messages;

create policy "Connections parties read" on public.connections for select to authenticated using(owner_id=(select auth.uid()) or addressee_id=(select auth.uid()));
create policy "Create own requests" on public.connections for insert to authenticated with check(owner_id=(select auth.uid()) and status='pending');
create policy "Cancel own request" on public.connections for delete to authenticated using(owner_id=(select auth.uid()) and status='pending');

create policy "Applications parties read" on public.job_applications for select to authenticated using(
  owner_id=(select auth.uid()) or exists(select 1 from public.jobs j where j.id=job_id and j.owner_id=(select auth.uid())) or public.is_admin()
);
create policy "Applicants submit" on public.job_applications for insert to authenticated with check(owner_id=(select auth.uid()) and status='applied');

create policy "Project team readable" on public.project_members for select using(
  owner_id=(select auth.uid()) or exists(select 1 from public.projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or p.visibility='public'))
);
create policy "Project owners manage team" on public.project_members for all to authenticated using(
  exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid()))
) with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=(select auth.uid())));

create policy "Credit review parties read" on public.credit_verifications for select to authenticated using(
  owner_id=(select auth.uid()) or exists(select 1 from public.organization_members m where m.organization_id=credit_verifications.organization_id and m.owner_id=(select auth.uid()))
);
create policy "Authorized organization verifies credit" on public.credit_verifications for insert to authenticated with check(
  exists(select 1 from public.organization_members m where m.organization_id=credit_verifications.organization_id and m.owner_id=(select auth.uid()) and m.role in ('owner','admin','editor'))
);

create policy "Reports reporter and admin read" on public.reports for select to authenticated using(owner_id=(select auth.uid()) or public.is_admin());
create policy "Members submit reports" on public.reports for insert to authenticated with check(owner_id=(select auth.uid()) and status='open');
create policy "Admin resolves reports" on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Admin removes reports" on public.reports for delete to authenticated using(public.is_admin());

create policy "Admin audit insert" on public.admin_actions for insert to authenticated with check(owner_id=(select auth.uid()) and public.is_admin());

create policy "Messages membership read" on public.messages for select using(public.is_conversation_member(conversation_id));
create policy "Members send messages" on public.messages for insert to authenticated with check(owner_id=(select auth.uid()) and public.is_conversation_member(conversation_id));
create policy "Authors edit own messages" on public.messages for update to authenticated using(owner_id=(select auth.uid()) and public.is_conversation_member(conversation_id)) with check(owner_id=(select auth.uid()) and public.is_conversation_member(conversation_id));
create policy "Authors delete own messages" on public.messages for delete to authenticated using(owner_id=(select auth.uid()) and public.is_conversation_member(conversation_id));

create policy "Public skill list" on public.profile_skills for select using(public.can_view_profile(owner_id));
create policy "Public experience list" on public.experiences for select using(public.can_view_profile(owner_id));
create policy "Public education list" on public.education for select using(public.can_view_profile(owner_id));
create policy "Public awards list" on public.awards for select using(public.can_view_profile(owner_id));
create policy "Public portfolio list" on public.portfolio_items for select using(visibility='public' and public.can_view_profile(owner_id));
create policy "Public verified credits" on public.credits for select using(public.can_view_profile(owner_id));
create policy "Public organization roster" on public.organization_members for select using(true);
create policy "Visible work reactions" on public.work_likes for select using(exists(select 1 from public.work_posts w where w.id=work_id and w.status='published' and w.visibility='public'));
create policy "Visible journal reactions" on public.blog_likes for select using(exists(select 1 from public.blogs b where b.id=blog_id and b.status='published'));
create policy "Collaboration creators read interest" on public.collaboration_interests for select using(
  owner_id=(select auth.uid()) or exists(select 1 from public.collaborations c where c.id=collaboration_id and c.owner_id=(select auth.uid()))
);
create policy "Collaboration creators respond" on public.collaboration_interests for update to authenticated using(
  exists(select 1 from public.collaborations c where c.id=collaboration_id and c.owner_id=(select auth.uid()))
) with check(exists(select 1 from public.collaborations c where c.id=collaboration_id and c.owner_id=(select auth.uid())));
create policy "Availability profile read" on public.availability for select using(public.can_view_profile(owner_id));
