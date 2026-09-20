create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_couple_member(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = target_couple
      and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_couple_member(uuid) from public, anon;
grant execute on function private.is_couple_member(uuid) to authenticated;

-- Keep the policy-facing API stable without exposing a privileged public RPC.
create or replace function public.is_couple_member(target_couple uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_couple_member(target_couple);
$$;

revoke execute on function public.is_couple_member(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;
