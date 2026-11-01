-- Owner-only, explicitly saved snapshots. No provider tokens or public read access.
begin;
create table public.health_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 updated_at timestamptz not null default now(),
 constraint health_snapshot_version check (coalesce(payload->>'version' = '1',false)),
 constraint health_snapshot_shape check (coalesce(jsonb_typeof(payload->'workouts') = 'array' and jsonb_array_length(payload->'workouts') <= 2000 and octet_length(payload::text) <= 1500000,false))
);
alter table public.health_snapshots enable row level security;
revoke all on public.health_snapshots from anon;
grant select,insert,update,delete on public.health_snapshots to authenticated;
create policy health_snapshot_owner on public.health_snapshots to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.touch_health_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=now(); return new; end; $$;
revoke all on function public.touch_health_snapshot() from public,anon,authenticated;
create trigger health_snapshot_updated before insert or update on public.health_snapshots for each row execute function public.touch_health_snapshot();
commit;
