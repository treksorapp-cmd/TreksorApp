begin;
create table public.sleep_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null,
 updated_at timestamptz not null default now(),
 constraint sleep_snapshot_version check(coalesce(payload->>'version'='1',false)),
 constraint sleep_snapshot_shape check(coalesce(jsonb_typeof(payload->'nights')='array' and jsonb_array_length(payload->'nights')<=1000 and octet_length(payload::text)<=500000,false))
);
alter table public.sleep_snapshots enable row level security;
revoke all on public.sleep_snapshots from anon;
grant select,insert,update,delete on public.sleep_snapshots to authenticated;
create policy sleep_snapshot_owner on public.sleep_snapshots to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create trigger sleep_snapshot_updated before insert or update on public.sleep_snapshots for each row execute function public.touch_health_snapshot();
commit;
