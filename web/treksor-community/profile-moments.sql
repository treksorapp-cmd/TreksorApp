-- Source snapshot of the opt_in_public_profile_moments migration applied 2026-10-28.
create table public.profile_moments (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 photo_path text not null unique,
 caption text not null default '' check(length(caption)<=400),
 taken_on date not null,
 is_public boolean not null default false,
 created_at timestamptz not null default now(),
 check(photo_path=user_id::text||'/'||id::text||'.jpg')
);
create index profile_moments_user_date on public.profile_moments(user_id,taken_on desc);
alter table public.profile_moments enable row level security;
grant select,insert,update,delete on public.profile_moments to authenticated;
create policy "Owners manage moments" on public.profile_moments for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Discoverable shared moments" on public.profile_moments for select to authenticated using (
 is_public and exists(select 1 from public.web_profiles p where p.user_id=profile_moments.user_id and p.discoverable)
 and not exists(select 1 from public.web_blocks b where (b.blocker_id=(select auth.uid()) and b.blocked_id=profile_moments.user_id) or (b.blocked_id=(select auth.uid()) and b.blocker_id=profile_moments.user_id))
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('journey-moments','journey-moments',false,8388608,array['image/jpeg']);
create policy "Moment owner upload" on storage.objects for insert to authenticated with check(bucket_id='journey-moments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Moment owner delete" on storage.objects for delete to authenticated using(bucket_id='journey-moments' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Moment photo read" on storage.objects for select to authenticated using(bucket_id='journey-moments' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.profile_moments m where m.photo_path=name and m.is_public)));
