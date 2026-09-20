create extension if not exists pgcrypto;

create type public.couple_role as enum ('creator', 'partner');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_path text,
  created_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  relationship_started_on date,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.couple_role not null,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.statuses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  mood text not null,
  mood_emoji text not null,
  activity text not null,
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  all_day boolean not null default false,
  reminder_offsets integer[] not null default '{1440}',
  created_at timestamptz not null default now()
);

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  happened_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diary_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  storage_path text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.diary_replies (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status_updates boolean not null default true,
  event_reminders boolean not null default true,
  quiet_start time not null default '23:00',
  quiet_end time not null default '08:00',
  timezone text not null default 'Asia/Tehran',
  updated_at timestamptz not null default now()
);

create or replace function public.is_couple_member(target_couple uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = target_couple and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.invites enable row level security;
alter table public.statuses enable row level security;
alter table public.events enable row level security;
alter table public.diary_entries enable row level security;
alter table public.diary_photos enable row level security;
alter table public.diary_replies enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;

create policy "profiles visible to self and partner" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.couple_members mine
    join public.couple_members theirs using (couple_id)
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);
create policy "users manage own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "members view couple" on public.couples for select using (public.is_couple_member(id));
create policy "members view membership" on public.couple_members for select using (public.is_couple_member(couple_id));
create policy "members view statuses" on public.statuses for select using (public.is_couple_member(couple_id));
create policy "users manage own status" on public.statuses for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy "members manage events" on public.events for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id) and created_by = auth.uid());
create policy "members view diary" on public.diary_entries for select using (public.is_couple_member(couple_id));
create policy "authors manage diary" on public.diary_entries for all using (author_id = auth.uid()) with check (author_id = auth.uid() and public.is_couple_member(couple_id));
create policy "members view photos" on public.diary_photos for select using (exists (select 1 from public.diary_entries e where e.id = entry_id and public.is_couple_member(e.couple_id)));
create policy "entry authors manage photos" on public.diary_photos for all using (exists (select 1 from public.diary_entries e where e.id = entry_id and e.author_id = auth.uid())) with check (exists (select 1 from public.diary_entries e where e.id = entry_id and e.author_id = auth.uid()));
create policy "members view replies" on public.diary_replies for select using (exists (select 1 from public.diary_entries e where e.id = entry_id and public.is_couple_member(e.couple_id)));
create policy "authors manage replies" on public.diary_replies for all using (author_id = auth.uid()) with check (author_id = auth.uid() and exists (select 1 from public.diary_entries e where e.id = entry_id and public.is_couple_member(e.couple_id)));
create policy "users manage push subscriptions" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users manage notification preferences" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index events_couple_starts_idx on public.events(couple_id, starts_at);
create index diary_entries_couple_date_idx on public.diary_entries(couple_id, happened_on desc);
create index diary_replies_entry_idx on public.diary_replies(entry_id, created_at);

alter publication supabase_realtime add table public.statuses, public.events, public.diary_entries, public.diary_replies;
