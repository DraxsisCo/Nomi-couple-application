create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.notification_preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.create_couple_invite(raw_token text, relationship_date date default null)
returns table(couple_id uuid, invite_code text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  target_couple uuid;
  expiry timestamptz := now() + interval '24 hours';
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if char_length(raw_token) < 8 then raise exception 'invalid_token'; end if;

  select cm.couple_id into target_couple from public.couple_members cm where cm.user_id = auth.uid();
  if target_couple is null then
    insert into public.couples (relationship_started_on, created_by)
    values (relationship_date, auth.uid()) returning id into target_couple;
    insert into public.couple_members (couple_id, user_id, role)
    values (target_couple, auth.uid(), 'creator');
  end if;

  if (select count(*) from public.couple_members where couple_members.couple_id = target_couple) >= 2 then
    raise exception 'couple_full';
  end if;

  delete from public.invites where created_by = auth.uid() and accepted_at is null;
  insert into public.invites (couple_id, token_hash, created_by, expires_at)
  values (target_couple, encode(extensions.digest(upper(raw_token), 'sha256'), 'hex'), auth.uid(), expiry);
  return query select target_couple, upper(raw_token), expiry;
end;
$$;

create or replace function public.accept_couple_invite(raw_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  found_invite public.invites%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'already_paired'; end if;
  select * into found_invite from public.invites
  where token_hash = encode(extensions.digest(upper(raw_token), 'sha256'), 'hex')
    and accepted_at is null and expires_at > now()
  for update;
  if found_invite.id is null then raise exception 'invalid_or_expired_invite'; end if;
  if found_invite.created_by = auth.uid() then raise exception 'cannot_join_self'; end if;
  if (select count(*) from public.couple_members where couple_id = found_invite.couple_id) >= 2 then raise exception 'couple_full'; end if;
  insert into public.couple_members (couple_id, user_id, role) values (found_invite.couple_id, auth.uid(), 'partner');
  update public.invites set accepted_by = auth.uid(), accepted_at = now() where id = found_invite.id;
  return found_invite.couple_id;
end;
$$;

create or replace function public.leave_couple()
returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  select couple_id into target from public.couple_members where user_id = auth.uid();
  delete from public.couple_members where user_id = auth.uid();
  if target is not null and not exists (select 1 from public.couple_members where couple_id = target) then
    delete from public.couples where id = target;
  end if;
end;
$$;

grant execute on function public.create_couple_invite(text, date) to authenticated;
grant execute on function public.accept_couple_invite(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;

create policy "creators view own invites" on public.invites for select using (created_by = auth.uid());

-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, display_name)
select id, coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), split_part(email, '@', 1))
from auth.users on conflict (id) do nothing;

insert into public.notification_preferences (user_id)
select id from auth.users on conflict (user_id) do nothing;
