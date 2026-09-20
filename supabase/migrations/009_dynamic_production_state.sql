-- Persist the diary mood selected by the author instead of restoring a UI placeholder.
alter table public.diary_entries
add column if not exists emoji text not null default '🤍'
check (char_length(emoji) between 1 and 16);

-- Both members may maintain the relationship start date shown in their shared space.
create policy "members update relationship date"
on public.couples for update to authenticated
using ((select public.is_couple_member(id)))
with check ((select public.is_couple_member(id)));

grant update (relationship_started_on) on public.couples to authenticated;

-- Keep private, user-scoped features synchronized across active sessions.
alter publication supabase_realtime add table
  public.intimacy_signals,
  public.cycle_settings,
  public.cycle_logs,
  public.notification_preferences;
