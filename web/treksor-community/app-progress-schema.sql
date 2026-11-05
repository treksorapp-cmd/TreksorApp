create table public.app_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 device_id text not null check (char_length(device_id) between 8 and 100),
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=2000000),
 updated_at timestamptz not null default now(),
 primary key(user_id,device_id)
);
alter table public.app_progress enable row level security;
revoke all on public.app_progress from anon,authenticated;
grant select,insert,delete on public.app_progress to authenticated;
grant update(payload) on public.app_progress to authenticated;
create policy progress_read_own on public.app_progress for select to authenticated using(user_id=(select auth.uid()));
create policy progress_insert_own on public.app_progress for insert to authenticated with check(user_id=(select auth.uid()));
create policy progress_update_own on public.app_progress for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy progress_delete_own on public.app_progress for delete to authenticated using(user_id=(select auth.uid()));
create function public.stamp_app_progress() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;
revoke all on function public.stamp_app_progress() from public,anon,authenticated;
create trigger app_progress_timestamp before insert or update on public.app_progress for each row execute function public.stamp_app_progress();
create index app_progress_user_updated_idx on public.app_progress(user_id,updated_at desc);
