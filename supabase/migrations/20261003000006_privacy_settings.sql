drop policy if exists "Public portfolio list" on public.portfolio_items;
create or replace function public.can_view_portfolio(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target=(select auth.uid()) or exists(
    select 1 from public.user_settings s where s.owner_id=target and s.portfolio_visibility='public' and public.can_view_profile(target)
  );
$$;
create policy "Portfolio visibility settings" on public.portfolio_items for select using(
  owner_id=(select auth.uid()) or (visibility='public' and public.can_view_portfolio(owner_id))
);
