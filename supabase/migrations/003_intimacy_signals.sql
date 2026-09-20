alter table public.profiles
add column adult_confirmed_at timestamptz;

create table public.intimacy_signals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  signal text not null check (signal in ('فاز فلرت', 'هورنی‌ام', 'بغل می‌خوام', 'بوس‌مودم', 'تایم دوتامون', 'فعلاً اسپیس')),
  emoji text not null,
  message text not null default '' check (char_length(message) <= 180),
  expires_at timestamptz not null default (now() + interval '6 hours'),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.intimacy_signals enable row level security;

create policy "adult couple members view active intimacy signals"
on public.intimacy_signals for select
using (
  public.is_couple_member(couple_id)
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and adult_confirmed_at is not null
  )
);

create policy "adult members send own intimacy signals"
on public.intimacy_signals for insert
with check (
  sender_id = auth.uid()
  and public.is_couple_member(couple_id)
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and adult_confirmed_at is not null
  )
);

create policy "senders withdraw own intimacy signals"
on public.intimacy_signals for update
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

create index intimacy_signals_couple_active_idx
on public.intimacy_signals(couple_id, expires_at desc)
where withdrawn_at is null;

alter table public.notification_preferences
add column intimacy_signals boolean not null default false;

comment on column public.notification_preferences.intimacy_signals is
'Opt-in only. Notification copy must remain generic and never expose the selected signal on the lock screen.';
