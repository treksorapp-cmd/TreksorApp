-- Transaction-only integration fixtures. No accounts or messages persist.
begin;
insert into auth.users(id,email) values
 ('90000000-0000-4000-8000-000000000001','treksor-test-a@example.invalid'),
 ('90000000-0000-4000-8000-000000000002','treksor-test-b@example.invalid'),
 ('90000000-0000-4000-8000-000000000003','treksor-test-c@example.invalid'),
 ('90000000-0000-4000-8000-000000000004','treksor-test-admin@example.invalid');
insert into public.admin_members(user_id) values ('90000000-0000-4000-8000-000000000004');
insert into public.web_profiles(user_id,display_name,city,discoverable) values
 ('90000000-0000-4000-8000-000000000001','Test A','Test City',true),
 ('90000000-0000-4000-8000-000000000002','Test B','Test City',true),
 ('90000000-0000-4000-8000-000000000003','Test C','Test City',false),
 ('90000000-0000-4000-8000-000000000004','Test Admin','Test City',false);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.web_profiles where user_id='90000000-0000-4000-8000-000000000003')<>0 then raise exception 'Hidden profile exposed'; end if;
end $$;
insert into public.web_groups(id,owner_id,title,description,category,city) values ('90000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000001','Test group','Test group description','Hiking','Test City');
insert into public.web_group_posts(group_id,user_id,body) values ('90000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000001','Test post');
insert into public.web_connections(id,from_user,to_user,kind,introduction) values ('90000000-0000-4000-8000-000000000020','90000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002','buddy','A test invitation with no delivery.');
do $$ begin
 begin
  update public.web_connections set status='accepted' where id='90000000-0000-4000-8000-000000000020';
  raise exception 'Sender accepted own invitation';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.web_messages(connection_id,sender_id,body) values ('90000000-0000-4000-8000-000000000020','90000000-0000-4000-8000-000000000001','Not allowed while pending');
  raise exception 'Pending conversation allowed message';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.web_mentors(user_id,headline,specialty,description,experience,approved) values ('90000000-0000-4000-8000-000000000001','Testing mentor','Purpose','Testing a description for mentor.','Testing mentor experience.',true);
  raise exception 'Mentor self approval succeeded';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.web_mentors(user_id,headline,specialty,description,experience) values ('90000000-0000-4000-8000-000000000001','Testing mentor','Purpose','Testing a description for mentor.','Testing mentor experience.');
update public.web_mentors set approved=true where user_id='90000000-0000-4000-8000-000000000001';
do $$ begin if (select approved from public.web_mentors where user_id='90000000-0000-4000-8000-000000000001') then raise exception 'Self update approved mentor'; end if; end $$;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
update public.web_connections set status='accepted' where id='90000000-0000-4000-8000-000000000020';
insert into public.web_messages(connection_id,sender_id,body) values ('90000000-0000-4000-8000-000000000020','90000000-0000-4000-8000-000000000002','Accepted connection message');
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.web_connections)<>0 then raise exception 'Third party saw connection'; end if;
 if (select count(*) from public.web_messages)<>0 then raise exception 'Third party saw messages'; end if;
 if (select count(*) from public.web_group_posts)<>0 then raise exception 'Nonmember saw group conversation'; end if;
 if (select count(*) from public.web_mentors)<>0 then raise exception 'Pending mentor visible to third party'; end if;
 begin
  update public.web_profiles set user_id='90000000-0000-4000-8000-000000000002' where user_id='90000000-0000-4000-8000-000000000003';
  raise exception 'Profile ownership reassignment allowed';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.web_group_members(group_id,user_id) values ('90000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000003');
do $$ begin if (select count(*) from public.web_group_posts)<>1 then raise exception 'Member could not read posts'; end if; end $$;
insert into public.web_group_posts(group_id,user_id,body) values ('90000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000003','Member can post');
insert into public.web_reports(reporter_id,target_user,reason) values ('90000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000002','Test report visible only to reporter and admin.');
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin if (select count(*) from public.web_reports)<>0 then raise exception 'Reported user can read report'; end if; end $$;
insert into public.web_blocks(blocker_id,blocked_id) values ('90000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 begin
  insert into public.web_messages(connection_id,sender_id,body) values ('90000000-0000-4000-8000-000000000020','90000000-0000-4000-8000-000000000001','Blocked message');
  raise exception 'Blocked participant sent message';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.web_profiles where user_id='90000000-0000-4000-8000-000000000002')<>0 then raise exception 'Blocked profile still exposed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
update public.web_mentors set approved=true where user_id='90000000-0000-4000-8000-000000000001';
do $$ begin
 if not (select approved from public.web_mentors where user_id='90000000-0000-4000-8000-000000000001') then raise exception 'Admin unable to approve mentor'; end if;
 if (select count(*) from public.web_reports)<>1 then raise exception 'Admin unable to review reports'; end if;
end $$;
set local role anon;
do $$ begin
 if (select count(*) from public.web_groups)<>1 then raise exception 'Public group unreadable'; end if;
 begin perform * from public.web_messages; raise exception 'Anonymous access to messages'; exception when insufficient_privilege then null; end;
 begin perform * from public.web_profiles; raise exception 'Anonymous access to profiles'; exception when insufficient_privilege then null; end;
end $$;
select 'PASS: profile privacy, group ownership/membership, invitation consent, message isolation, blocking, mentor approval, reporting, anonymous restrictions' as verification;
rollback;
