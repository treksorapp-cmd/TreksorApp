begin;
insert into auth.users(id,email) values
 ('91000000-0000-4000-8000-000000000001','progress-a@example.invalid'),
 ('91000000-0000-4000-8000-000000000002','progress-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into public.app_progress(user_id,device_id,payload,updated_at) values
 ('91000000-0000-4000-8000-000000000001','device-testing','{"version":1,"sets":3}','2000-01-01');
update public.app_progress set payload='{"version":1,"sets":4}' where user_id='91000000-0000-4000-8000-000000000001';
do $$ begin
 if (select payload->>'sets' from public.app_progress where device_id='device-testing')<>'4' then raise exception 'Owner update failed'; end if;
 if (select updated_at from public.app_progress where device_id='device-testing') < now()-interval '1 minute' then raise exception 'Timestamp is not server controlled'; end if;
 begin
  update public.app_progress set user_id='91000000-0000-4000-8000-000000000002';
  raise exception 'Owner could reassign snapshot';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"91000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.app_progress where user_id='91000000-0000-4000-8000-000000000001') then raise exception 'Cross-account read'; end if;
 update public.app_progress set payload='{"sets":99}' where user_id='91000000-0000-4000-8000-000000000001';
 if found then raise exception 'Cross-account update'; end if;
 delete from public.app_progress where user_id='91000000-0000-4000-8000-000000000001';
 if found then raise exception 'Cross-account delete'; end if;
 begin
  insert into public.app_progress(user_id,device_id,payload) values('91000000-0000-4000-8000-000000000001','device-attacker','{}');
  raise exception 'Cross-account insert';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ begin
 begin
  perform 1 from public.app_progress;
  raise exception 'Anonymous progress read';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner read/write, cross-account isolation, immutable identity, server timestamp, anonymous denial' as result;
rollback;
