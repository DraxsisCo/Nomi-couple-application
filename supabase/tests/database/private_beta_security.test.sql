begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'feature_consents', 'feature consent table exists');
select has_table('public', 'notification_deliveries', 'push idempotency table exists');
select has_function('public', 'save_cycle_state', array['date','integer','integer','text[]','text','boolean','date'], 'atomic cycle RPC exists');
select policies_are('public', 'feature_consents', array['users and partners view feature consents','users insert own feature consents','users update own feature consents'], 'feature consent policies are explicit');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@nami.test', '', now(), now(), '{}', '{"display_name":"One"}'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@nami.test', '', now(), now(), '{}', '{"display_name":"Two"}'),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@nami.test', '', now(), now(), '{}', '{"display_name":"Outsider"}'),
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invite@nami.test', '', now(), now(), '{}', '{"display_name":"Invite"}');

insert into public.couples (id, created_by)
values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
insert into public.couple_members (couple_id, user_id, role) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'creator'),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'partner');
insert into public.events (id, couple_id, created_by, title, starts_at)
values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Private event', now());

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select results_eq('select count(*) from public.events', array[1::bigint], 'couple member sees event');

set local request.jwt.claim.sub = '20000000-0000-0000-0000-000000000001';
select results_eq('select count(*) from public.events', array[0::bigint], 'unrelated user cannot see event');
select throws_ok(
  $$insert into public.events (couple_id, created_by, title, starts_at) values ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Intrusion', now())$$,
  '42501', null, 'unrelated user cannot insert event'
);

set local request.jwt.claim.sub = '30000000-0000-0000-0000-000000000001';
select matches((select invite_code from public.create_couple_invite(null) limit 1), '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$', 'server generates a 12-character invite code');

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select lives_ok(
  $$select public.save_cycle_state(current_date, 28, 5, array['cramp'], 'private note', false, current_date)$$,
  'cycle settings and log save atomically'
);

select * from finish();
rollback;
