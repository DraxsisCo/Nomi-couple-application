-- Restrict privileged functions. PostgreSQL grants EXECUTE to PUBLIC by default.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_couple_invite(text, date) from public, anon;
revoke execute on function public.accept_couple_invite(text) from public, anon;
revoke execute on function public.leave_couple() from public, anon;
revoke execute on function public.is_couple_member(uuid) from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;

-- Profiles are created by the auth trigger. Clients may read/update but not insert/delete.
drop policy if exists "users manage own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Intimacy signals are ephemeral by design and disappear after withdrawal/expiry.
drop policy if exists "adult couple members view active intimacy signals" on public.intimacy_signals;
create policy "adult couple members view active intimacy signals"
on public.intimacy_signals for select to authenticated
using (
  withdrawn_at is null
  and expires_at > now()
  and (select public.is_couple_member(couple_id))
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and adult_confirmed_at is not null
  )
);

-- Explicit Data API privileges. RLS remains the row-level authorization boundary.
revoke all on all tables in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select on public.couples, public.couple_members, public.invites to authenticated;
grant select, insert, update, delete on
  public.statuses,
  public.events,
  public.diary_entries,
  public.diary_photos,
  public.diary_replies,
  public.push_subscriptions,
  public.notification_preferences,
  public.cycle_settings,
  public.cycle_logs
to authenticated;
grant select, insert, update on public.intimacy_signals to authenticated;

-- PostgreSQL does not automatically index foreign keys.
create index couples_created_by_idx on public.couples(created_by);
create index invites_couple_id_idx on public.invites(couple_id);
create index invites_created_by_idx on public.invites(created_by);
create index invites_accepted_by_idx on public.invites(accepted_by) where accepted_by is not null;
create index statuses_couple_id_idx on public.statuses(couple_id);
create index events_created_by_idx on public.events(created_by);
create index diary_entries_author_id_idx on public.diary_entries(author_id);
create index diary_photos_entry_id_idx on public.diary_photos(entry_id);
create index diary_replies_author_id_idx on public.diary_replies(author_id);
create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create index intimacy_signals_sender_id_idx on public.intimacy_signals(sender_id);
