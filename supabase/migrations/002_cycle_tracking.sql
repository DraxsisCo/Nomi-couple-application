create table public.cycle_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_period_start date not null,
  cycle_length smallint not null default 28 check (cycle_length between 20 and 45),
  period_length smallint not null default 5 check (period_length between 2 and 10),
  shared_with_partner boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_on date not null default current_date,
  symptoms text[] not null default '{}',
  note text not null default '' check (char_length(note) <= 1000),
  flow_level smallint check (flow_level between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, logged_on)
);

alter table public.cycle_settings enable row level security;
alter table public.cycle_logs enable row level security;

create policy "users manage own cycle settings"
on public.cycle_settings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "partners view shared cycle settings"
on public.cycle_settings for select
using (
  shared_with_partner and exists (
    select 1
    from public.couple_members owner_membership
    join public.couple_members viewer_membership using (couple_id)
    where owner_membership.user_id = cycle_settings.user_id
      and viewer_membership.user_id = auth.uid()
  )
);

create policy "users manage own cycle logs"
on public.cycle_logs for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "partners view shared cycle logs"
on public.cycle_logs for select
using (
  exists (
    select 1
    from public.cycle_settings settings
    join public.couple_members owner_membership on owner_membership.user_id = settings.user_id
    join public.couple_members viewer_membership using (couple_id)
    where settings.user_id = cycle_logs.user_id
      and settings.shared_with_partner
      and viewer_membership.user_id = auth.uid()
  )
);

create index cycle_logs_user_date_idx on public.cycle_logs(user_id, logged_on desc);

alter table public.notification_preferences
add column cycle_reminders boolean not null default false;
