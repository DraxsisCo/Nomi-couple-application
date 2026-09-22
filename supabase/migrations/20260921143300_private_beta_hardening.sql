-- Private-beta hardening: invite abuse controls, revocable consent,
-- atomic cycle writes, and idempotent push delivery.

create table private.invite_attempts (
  user_id uuid not null,
  attempted_at timestamptz not null default now()
);

revoke all on table private.invite_attempts from public, anon, authenticated;
create index invite_attempts_user_recent_idx
  on private.invite_attempts (user_id, attempted_at desc);

create or replace function private.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  random_byte integer;
begin
  while char_length(result) < 12 loop
    random_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if random_byte < 248 then
      result := result || substr(alphabet, (random_byte % char_length(alphabet)) + 1, 1);
    end if;
  end loop;
  return result;
end;
$$;

revoke execute on function private.generate_invite_code() from public, anon, authenticated;

drop function if exists public.create_couple_invite(text, date);

create or replace function public.create_couple_invite(relationship_date date default null)
returns table(couple_id uuid, invite_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_couple uuid;
  generated_code text;
  expiry timestamptz := now() + interval '24 hours';
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated'; end if;

  select cm.couple_id into target_couple
  from public.couple_members cm
  where cm.user_id = (select auth.uid());

  if target_couple is null then
    insert into public.couples (relationship_started_on, created_by)
    values (relationship_date, (select auth.uid()))
    returning id into target_couple;

    insert into public.couple_members (couple_id, user_id, role)
    values (target_couple, (select auth.uid()), 'creator');
  end if;

  if (select count(*) from public.couple_members cm where cm.couple_id = target_couple) >= 2 then
    raise exception 'couple_full';
  end if;

  generated_code := private.generate_invite_code();
  delete from public.invites
  where created_by = (select auth.uid()) and accepted_at is null;

  insert into public.invites (couple_id, token_hash, created_by, expires_at)
  values (
    target_couple,
    encode(extensions.digest(generated_code, 'sha256'), 'hex'),
    (select auth.uid()),
    expiry
  );

  return query select target_couple, generated_code, expiry;
end;
$$;

create or replace function public.accept_couple_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  normalized_token text := upper(trim(raw_token));
  found_invite public.invites%rowtype;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if normalized_token !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$' then
    raise exception 'invalid_or_expired_invite';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller_id::text, 0));
  delete from private.invite_attempts
  where user_id = caller_id and attempted_at < now() - interval '24 hours';

  if (
    select count(*) from private.invite_attempts
    where user_id = caller_id and attempted_at > now() - interval '15 minutes'
  ) >= 5 then
    raise exception 'invite_rate_limited';
  end if;

  insert into private.invite_attempts (user_id) values (caller_id);

  if exists (select 1 from public.couple_members where user_id = caller_id) then
    raise exception 'already_paired';
  end if;

  select * into found_invite
  from public.invites
  where token_hash = encode(extensions.digest(normalized_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if found_invite.id is null then raise exception 'invalid_or_expired_invite'; end if;
  if found_invite.created_by = caller_id then raise exception 'cannot_join_self'; end if;
  if (select count(*) from public.couple_members where couple_id = found_invite.couple_id) >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id, role)
  values (found_invite.couple_id, caller_id, 'partner');

  update public.invites
  set accepted_by = caller_id, accepted_at = now()
  where id = found_invite.id;

  return found_invite.couple_id;
end;
$$;

revoke execute on function public.create_couple_invite(date) from public, anon;
revoke execute on function public.accept_couple_invite(text) from public, anon;
grant execute on function public.create_couple_invite(date) to authenticated;
grant execute on function public.accept_couple_invite(text) to authenticated;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  target_couple uuid;
  remaining_member uuid;
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;

  select couple_id into target_couple
  from public.couple_members
  where user_id = caller_id;

  if target_couple is null then return; end if;

  select user_id into remaining_member
  from public.couple_members
  where couple_id = target_couple and user_id <> caller_id
  limit 1;

  if remaining_member is not null then
    update public.couples
    set created_by = remaining_member
    where id = target_couple and created_by = caller_id;
  end if;

  delete from public.couple_members where user_id = caller_id;

  if remaining_member is null then
    delete from public.couples where id = target_couple;
  end if;
end;
$$;

revoke execute on function public.leave_couple() from public, anon;
grant execute on function public.leave_couple() to authenticated;

create table public.feature_consents (
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null check (feature in ('adult_confirmed', 'intimacy', 'adult_challenges')),
  accepted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature),
  check (accepted_at is not null or revoked_at is not null)
);

alter table public.feature_consents enable row level security;
revoke all on public.feature_consents from anon;
grant select, insert, update on public.feature_consents to authenticated;

create policy "users and partners view feature consents"
on public.feature_consents for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.couple_members mine
    join public.couple_members theirs using (couple_id)
    where mine.user_id = (select auth.uid())
      and theirs.user_id = feature_consents.user_id
  )
);

create policy "users insert own feature consents"
on public.feature_consents for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update own feature consents"
on public.feature_consents for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

insert into public.feature_consents (user_id, feature, accepted_at, updated_at)
select id, 'adult_confirmed', adult_confirmed_at, adult_confirmed_at
from public.profiles
where adult_confirmed_at is not null
on conflict (user_id, feature) do nothing;

insert into public.feature_consents (user_id, feature, accepted_at, updated_at)
select user_id, 'adult_challenges', updated_at, updated_at
from public.fun_preferences
where adult_deck_enabled
on conflict (user_id, feature) do nothing;

create or replace function private.both_feature_consented(target_couple uuid, target_feature text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.couple_members
      where couple_id = target_couple and user_id = (select auth.uid())
    )
    and (
      select count(*) = 2
      from public.couple_members member
      join public.feature_consents consent
        on consent.user_id = member.user_id
       and consent.feature = target_feature
       and consent.accepted_at is not null
       and consent.revoked_at is null
      where member.couple_id = target_couple
    );
$$;

revoke execute on function private.both_feature_consented(uuid, text) from public, anon;
grant execute on function private.both_feature_consented(uuid, text) to authenticated;

drop policy if exists "adult couple members view active intimacy signals" on public.intimacy_signals;
create policy "mutually consenting members view active intimacy signals"
on public.intimacy_signals for select to authenticated
using (
  withdrawn_at is null
  and expires_at > now()
  and (select private.is_couple_member(couple_id))
  and (select private.both_feature_consented(couple_id, 'adult_confirmed'))
  and (select private.both_feature_consented(couple_id, 'intimacy'))
);

drop policy if exists "adult members send own intimacy signals" on public.intimacy_signals;
create policy "mutually consenting members send intimacy signals"
on public.intimacy_signals for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (select private.is_couple_member(couple_id))
  and (select private.both_feature_consented(couple_id, 'adult_confirmed'))
  and (select private.both_feature_consented(couple_id, 'intimacy'))
);

create or replace function private.both_adult_fun_enabled(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.both_feature_consented(target_couple, 'adult_confirmed'))
    and (select private.both_feature_consented(target_couple, 'adult_challenges'));
$$;

revoke execute on function private.both_adult_fun_enabled(uuid) from public, anon;
grant execute on function private.both_adult_fun_enabled(uuid) to authenticated;

create or replace function public.save_cycle_state(
  last_period_start date,
  cycle_length integer,
  period_length integer,
  symptoms text[],
  note text,
  shared_with_partner boolean,
  logged_on date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if caller_id is null then raise exception 'not_authenticated'; end if;
  if cycle_length not between 20 and 45 then raise exception 'invalid_cycle_length'; end if;
  if period_length not between 2 and 10 then raise exception 'invalid_period_length'; end if;
  if char_length(coalesce(note, '')) > 1000 then raise exception 'note_too_long'; end if;

  insert into public.cycle_settings (
    user_id, last_period_start, cycle_length, period_length, shared_with_partner, updated_at
  ) values (
    caller_id, last_period_start, cycle_length, period_length, shared_with_partner, now()
  )
  on conflict (user_id) do update set
    last_period_start = excluded.last_period_start,
    cycle_length = excluded.cycle_length,
    period_length = excluded.period_length,
    shared_with_partner = excluded.shared_with_partner,
    updated_at = now();

  insert into public.cycle_logs (user_id, logged_on, symptoms, note, updated_at)
  values (caller_id, logged_on, symptoms, coalesce(note, ''), now())
  on conflict on constraint cycle_logs_user_id_logged_on_key do update set
    symptoms = excluded.symptoms,
    note = excluded.note,
    updated_at = now();
end;
$$;

revoke execute on function public.save_cycle_state(date, integer, integer, text[], text, boolean, date) from public, anon;
grant execute on function public.save_cycle_state(date, integer, integer, text[], text, boolean, date) to authenticated;

create table public.notification_deliveries (
  event_type text not null check (event_type in ('poke', 'daily_answer', 'challenge')),
  resource_id uuid not null,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_type, resource_id, recipient_id)
);

alter table public.notification_deliveries enable row level security;
revoke all on public.notification_deliveries from public, anon, authenticated;
create index notification_deliveries_recipient_idx
  on public.notification_deliveries (recipient_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feature_consents'
  ) then
    alter publication supabase_realtime add table public.feature_consents;
  end if;
end
$$;
