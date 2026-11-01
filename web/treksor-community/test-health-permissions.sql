begin;
insert into auth.users(id,email) values
('93000000-0000-4000-8000-000000000001','health-owner@example.invalid'),
('93000000-0000-4000-8000-000000000002','health-other@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
insert into public.health_snapshots(user_id,payload) values('93000000-0000-4000-8000-000000000001','{"version":1,"workouts":[]}');
do $$begin
 if(select count(*) from public.health_snapshots)<>1 then raise exception 'Owner read failed';end if;
 begin
  update public.health_snapshots set user_id='93000000-0000-4000-8000-000000000002';
  raise exception 'Owner reassignment unexpectedly succeeded';
 exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000002',true);
do $$begin if(select count(*) from public.health_snapshots)<>0 then raise exception 'Cross-account health disclosure';end if;end$$;
delete from public.health_snapshots where user_id='93000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','93000000-0000-4000-8000-000000000001',true);
do $$begin if(select count(*) from public.health_snapshots)<>1 then raise exception 'Cross-account deletion';end if;end$$;
delete from public.health_snapshots where user_id='93000000-0000-4000-8000-000000000001';
do $$begin if(select count(*) from public.health_snapshots)<>0 then raise exception 'Owner delete failed';end if;end$$;
reset role;
rollback;
