-- Reference DDL for public.treksor_sync_events, deployed to Supabase on 2026-11-13.
-- Additive schema. Existing public.treksor_activity_events and app_progress remain untouched.
-- This file is a schema reference, NOT a pending migration; do not run twice.
create table public.treksor_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar text check (pillar in ('Body','Mind','Balance','Purpose')),
  kind text not null check (kind in ('today_completed','workout_set','workout_session','balance_session','goal_progress','watch_activity')),
  event_key text not null check (char_length(event_key) between 1 and 128),
  source text not null check (source in ('ios','android','web','watch')),
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 8192),
  created_at timestamptz not null default now(),
  unique (user_id,kind,event_key),
  constraint today_date_only check (kind <> 'today_completed' or (event_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and payload = '{}'::jsonb))
);
alter table public.treksor_sync_events enable row level security;
revoke all on public.treksor_sync_events from anon;
grant select,insert on public.treksor_sync_events to authenticated;
create policy sync_read_own on public.treksor_sync_events for select to authenticated using (user_id = (select auth.uid()));
create policy sync_insert_own on public.treksor_sync_events for insert to authenticated with check (user_id = (select auth.uid()));
create index treksor_sync_events_user_time_idx on public.treksor_sync_events (user_id,occurred_at desc);
comment on column public.treksor_sync_events.pillar is 'Nullable for cross-pillar features such as Today; otherwise Body, Mind, Balance or Purpose.';
