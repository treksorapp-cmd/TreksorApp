-- Applied remotely through Supabase on 2026-11-03; existing RLS remains enforced.
grant select on public.community_events to anon, authenticated;
grant select, insert, update, delete on public.community_events to service_role;
revoke truncate, references, trigger on public.community_events from anon, authenticated;
