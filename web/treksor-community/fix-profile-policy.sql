-- Break the profiles/connections RLS dependency cycle with one scoped boolean lookup.
-- No profile data is returned; the caller must be a participant in the relation.
create schema if not exists treksor_private;
revoke all on schema treksor_private from public,anon;
grant usage on schema treksor_private to authenticated;
create or replace function treksor_private.is_web_contact(target uuid) returns boolean
 language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.web_connections c
  where (c.from_user=auth.uid() and c.to_user=target) or (c.to_user=auth.uid() and c.from_user=target)
 );
$$;
revoke all on function treksor_private.is_web_contact(uuid) from public,anon;
grant execute on function treksor_private.is_web_contact(uuid) to authenticated;
drop policy profiles_read on public.web_profiles;
create policy profiles_read on public.web_profiles for select to authenticated using (
 user_id=(select auth.uid()) or (
 not exists(select 1 from public.web_blocks b where (b.blocker_id=(select auth.uid()) and b.blocked_id=user_id) or (b.blocked_id=(select auth.uid()) and b.blocker_id=user_id))
 and (discoverable or exists(select 1 from public.web_mentors m where m.user_id=web_profiles.user_id and m.approved)
 or treksor_private.is_web_contact(user_id)))
 or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid()))
);
