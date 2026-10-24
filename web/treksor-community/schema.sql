-- Additive community schema. Existing mobile tables and policies remain intact.
create table public.web_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 60),
 city text not null default '' check (char_length(city)<=100),
 bio text not null default '' check (char_length(bio)<=600),
 interests text[] not null default '{}' check (cardinality(interests)<=8),
 pace text not null default 'Tranquilo' check (pace in ('Tranquilo','Intermedio','Activo')),
 discoverable boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.web_groups (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.web_profiles(user_id) on delete cascade,
 title text not null check (char_length(title) between 4 and 90),
 description text not null check (char_length(description) between 10 and 1200),
 category text not null check (category in ('Hiking','Deporte','Camping','Café y charla','Bienestar','Voluntariado')),
 city text not null check (char_length(city) between 2 and 100),
 size_style text not null default 'small' check (size_style in ('small','open')),
 next_activity text not null default '' check (char_length(next_activity)<=300),
 created_at timestamptz not null default now()
);
create table public.web_group_members (
 group_id uuid references public.web_groups(id) on delete cascade,
 user_id uuid references public.web_profiles(user_id) on delete cascade,
 created_at timestamptz not null default now(), primary key(group_id,user_id)
);
create table public.web_mentors (
 user_id uuid primary key references public.web_profiles(user_id) on delete cascade,
 headline text not null check(char_length(headline) between 5 and 100),
 specialty text not null check (specialty in ('Body','Mind','Balance','Purpose')),
 description text not null check(char_length(description) between 20 and 1200),
 experience text not null check(char_length(experience) between 10 and 1200),
 format text not null default 'Online' check(format in ('Online','Presencial','Ambos')),
 approved boolean not null default false, created_at timestamptz not null default now()
);
create table public.web_blocks (
 blocker_id uuid references auth.users(id) on delete cascade,
 blocked_id uuid references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_id), check(blocker_id<>blocked_id)
);
create table public.web_connections (
 id uuid primary key default gen_random_uuid(),
 from_user uuid not null references public.web_profiles(user_id) on delete cascade,
 to_user uuid not null references public.web_profiles(user_id) on delete cascade,
 kind text not null check(kind in ('buddy','mentor')),
 introduction text not null check(char_length(introduction) between 10 and 1000),
 status text not null default 'pending' check(status in ('pending','accepted','declined','closed')),
 created_at timestamptz not null default now(), check(from_user<>to_user)
);
create unique index web_connections_pair_idx on public.web_connections(least(from_user,to_user),greatest(from_user,to_user),kind);
create table public.web_messages (
 id uuid primary key default gen_random_uuid(), connection_id uuid not null references public.web_connections(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 2000), created_at timestamptz not null default now()
);
create table public.web_group_posts (
 id uuid primary key default gen_random_uuid(), group_id uuid not null references public.web_groups(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 2000), created_at timestamptz not null default now()
);
create table public.web_reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references auth.users(id) on delete cascade,
 target_user uuid references auth.users(id) on delete set null,
 target_group uuid references public.web_groups(id) on delete set null,
 reason text not null check(char_length(reason) between 10 and 1500),
 resolved boolean not null default false, created_at timestamptz not null default now()
);
create index on public.web_groups(owner_id);
create index on public.web_groups(category,city);
create index on public.web_group_members(user_id);
create index on public.web_blocks(blocked_id);
create index on public.web_connections(from_user,created_at desc);
create index on public.web_connections(to_user,created_at desc);
create index on public.web_messages(connection_id,created_at);
create index on public.web_messages(sender_id);
create index on public.web_group_posts(group_id,created_at);
create index on public.web_group_posts(user_id);
create index on public.web_reports(reporter_id);
create index on public.web_reports(target_user);
create index on public.web_reports(target_group);
alter table public.web_profiles enable row level security;
alter table public.web_groups enable row level security;
alter table public.web_group_members enable row level security;
alter table public.web_mentors enable row level security;
alter table public.web_blocks enable row level security;
alter table public.web_connections enable row level security;
alter table public.web_messages enable row level security;
alter table public.web_group_posts enable row level security;
alter table public.web_reports enable row level security;
revoke all on public.web_profiles,public.web_groups,public.web_group_members,public.web_mentors,public.web_blocks,public.web_connections,public.web_messages,public.web_group_posts,public.web_reports from anon,authenticated;
-- Explicit privileges: sensitive identity and relationship columns cannot be reassigned.
grant select,insert,delete on public.web_profiles,public.web_groups,public.web_group_members,public.web_mentors,public.web_blocks,public.web_connections,public.web_messages,public.web_group_posts,public.web_reports to authenticated;
grant select on public.web_groups to anon;
grant update(display_name,city,bio,interests,pace,discoverable) on public.web_profiles to authenticated;
grant update(title,description,category,city,size_style,next_activity) on public.web_groups to authenticated;
grant update(approved) on public.web_mentors to authenticated;
grant update(status) on public.web_connections to authenticated;
grant update(resolved) on public.web_reports to authenticated;
create policy profiles_read on public.web_profiles for select to authenticated using (
 user_id=(select auth.uid()) or (
 not exists(select 1 from public.web_blocks b where (b.blocker_id=(select auth.uid()) and b.blocked_id=user_id) or (b.blocked_id=(select auth.uid()) and b.blocker_id=user_id))
 and (discoverable or exists(select 1 from public.web_mentors m where m.user_id=web_profiles.user_id and m.approved)
 or exists(select 1 from public.web_connections c where (c.from_user=(select auth.uid()) and c.to_user=web_profiles.user_id) or (c.to_user=(select auth.uid()) and c.from_user=web_profiles.user_id))))
 or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid()))
);
create policy profiles_insert on public.web_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy profiles_update on public.web_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy groups_read on public.web_groups for select to anon,authenticated using(true);
create policy groups_insert on public.web_groups for insert to authenticated with check(owner_id=(select auth.uid()));
create policy groups_update on public.web_groups for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy groups_delete on public.web_groups for delete to authenticated using(owner_id=(select auth.uid()) or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy memberships_read on public.web_group_members for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.web_groups g where g.id=group_id and g.owner_id=(select auth.uid())));
create policy memberships_insert on public.web_group_members for insert to authenticated with check(user_id=(select auth.uid()));
create policy memberships_delete on public.web_group_members for delete to authenticated using(user_id=(select auth.uid()));
create policy mentors_read on public.web_mentors for select to authenticated using(approved or user_id=(select auth.uid()) or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy mentors_apply on public.web_mentors for insert to authenticated with check(user_id=(select auth.uid()) and not approved);
create policy mentors_admin on public.web_mentors for update to authenticated using(exists(select 1 from public.admin_members a where a.user_id=(select auth.uid()))) with check(exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy mentors_withdraw on public.web_mentors for delete to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy blocks_read on public.web_blocks for select to authenticated using(blocker_id=(select auth.uid()) or blocked_id=(select auth.uid()));
create policy blocks_insert on public.web_blocks for insert to authenticated with check(blocker_id=(select auth.uid()));
create policy blocks_delete on public.web_blocks for delete to authenticated using(blocker_id=(select auth.uid()));
create policy connections_read on public.web_connections for select to authenticated using(from_user=(select auth.uid()) or to_user=(select auth.uid()));
create policy connections_insert on public.web_connections for insert to authenticated with check(
 from_user=(select auth.uid()) and status='pending'
 and not exists(select 1 from public.web_blocks b where (b.blocker_id=from_user and b.blocked_id=to_user) or (b.blocker_id=to_user and b.blocked_id=from_user))
 and ((kind='buddy' and exists(select 1 from public.web_profiles p where p.user_id=to_user and p.discoverable))
 or (kind='mentor' and exists(select 1 from public.web_mentors m where m.user_id=to_user and m.approved)))
);
create policy connections_update on public.web_connections for update to authenticated using(from_user=(select auth.uid()) or to_user=(select auth.uid())) with check(from_user=(select auth.uid()) or to_user=(select auth.uid()));
create function public.web_guard_connection_status() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.status=old.status then return new; end if;
 if old.status='pending' and new.status in ('accepted','declined') and auth.uid()=old.to_user then return new; end if;
 if old.status in ('pending','accepted') and new.status='closed' and auth.uid() in (old.from_user,old.to_user) then return new; end if;
 raise exception 'Invalid connection transition' using errcode='42501';
end; $$;
revoke all on function public.web_guard_connection_status() from public,anon,authenticated;
create trigger web_connection_status before update on public.web_connections for each row execute function public.web_guard_connection_status();
create policy messages_read on public.web_messages for select to authenticated using(exists(select 1 from public.web_connections c where c.id=connection_id and (c.from_user=(select auth.uid()) or c.to_user=(select auth.uid()))));
create policy messages_insert on public.web_messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(
 select 1 from public.web_connections c where c.id=connection_id and c.status='accepted' and (c.from_user=(select auth.uid()) or c.to_user=(select auth.uid()))
 and not exists(select 1 from public.web_blocks b where (b.blocker_id=c.from_user and b.blocked_id=c.to_user) or (b.blocker_id=c.to_user and b.blocked_id=c.from_user))));
create policy posts_read on public.web_group_posts for select to authenticated using(exists(select 1 from public.web_group_members m where m.group_id=web_group_posts.group_id and m.user_id=(select auth.uid())) or exists(select 1 from public.web_groups g where g.id=web_group_posts.group_id and g.owner_id=(select auth.uid())));
create policy posts_insert on public.web_group_posts for insert to authenticated with check(user_id=(select auth.uid()) and (exists(select 1 from public.web_group_members m where m.group_id=web_group_posts.group_id and m.user_id=(select auth.uid())) or exists(select 1 from public.web_groups g where g.id=web_group_posts.group_id and g.owner_id=(select auth.uid()))));
create policy posts_delete on public.web_group_posts for delete to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy reports_insert on public.web_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and not resolved and (target_user is not null or target_group is not null));
create policy reports_read on public.web_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
create policy reports_admin on public.web_reports for update to authenticated using(exists(select 1 from public.admin_members a where a.user_id=(select auth.uid()))) with check(exists(select 1 from public.admin_members a where a.user_id=(select auth.uid())));
