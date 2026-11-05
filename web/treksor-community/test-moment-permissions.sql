begin;
insert into auth.users (id,email) values ('91000000-0000-4000-8000-000000000001','journey-owner-test@example.invalid'),('91000000-0000-4000-8000-000000000002','journey-viewer-test@example.invalid');
insert into public.web_profiles(user_id,display_name,discoverable) values('91000000-0000-4000-8000-000000000001','Journey policy test',true);
insert into public.profile_moments(id,user_id,photo_path,taken_on,is_public) values
('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001/92000000-0000-4000-8000-000000000001.jpg',current_date,true),
('92000000-0000-4000-8000-000000000002','91000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001/92000000-0000-4000-8000-000000000002.jpg',current_date,false);
set local role authenticated;
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000002',true);
do $$begin if(select count(*) from public.profile_moments where user_id='91000000-0000-4000-8000-000000000001')<>1 then raise exception 'Viewer saw private moment';end if;end$$;
delete from public.profile_moments where id='92000000-0000-4000-8000-000000000001';
do $$begin if(select count(*) from public.profile_moments where user_id='91000000-0000-4000-8000-000000000001')<>1 then raise exception 'Viewer deleted another users moment';end if;end$$;
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
do $$begin if(select count(*) from public.profile_moments where user_id='91000000-0000-4000-8000-000000000001')<>2 then raise exception 'Owner cannot see own moments';end if;end$$;
update public.web_profiles set discoverable=false where user_id='91000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000002',true);
do $$begin if(select count(*) from public.profile_moments where user_id='91000000-0000-4000-8000-000000000001')<>0 then raise exception 'Private profile moments leaked';end if;end$$;
reset role;
rollback;
