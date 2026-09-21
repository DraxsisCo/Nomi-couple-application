create table public.fun_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  adult_deck_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  prompt_on date not null,
  prompt_key text not null check (char_length(prompt_key) between 1 and 80),
  user_id uuid not null references public.profiles(id) on delete cascade,
  answer text not null check (char_length(answer) between 1 and 500),
  reaction text check (reaction is null or reaction in ('😍', '😂', '🥹', '🫶', '🔥')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, prompt_on, user_id)
);

create table public.couple_pokes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('hug', 'kiss', 'miss_you', 'thinking_of_you', 'date_tonight')),
  message text not null default '' check (char_length(message) <= 80),
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.challenge_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  challenge_on date not null,
  challenge_key text not null check (char_length(challenge_key) between 1 and 80),
  deck text not null default 'general' check (deck in ('general', 'adult')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  state text not null check (state in ('accepted', 'completed', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, challenge_on, challenge_key, user_id)
);

alter table public.fun_preferences enable row level security;
alter table public.daily_answers enable row level security;
alter table public.couple_pokes enable row level security;
alter table public.challenge_responses enable row level security;

create or replace function private.daily_prompt_complete(target_couple uuid, target_day date, target_prompt text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.couple_members
      where couple_id = target_couple
        and user_id = (select auth.uid())
    )
    and (
      select count(distinct answer.user_id) = 2
      from public.daily_answers answer
      where answer.couple_id = target_couple
        and answer.prompt_on = target_day
        and answer.prompt_key = target_prompt
    );
$$;

create or replace function private.both_adult_fun_enabled(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.couple_members
      where couple_id = target_couple
        and user_id = (select auth.uid())
    )
    and (
      select count(*) = 2
        and bool_and(profile.adult_confirmed_at is not null)
        and bool_and(coalesce(preference.adult_deck_enabled, false))
      from public.couple_members member
      join public.profiles profile on profile.id = member.user_id
      left join public.fun_preferences preference on preference.user_id = member.user_id
      where member.couple_id = target_couple
    );
$$;

create or replace function private.can_send_poke(target_couple uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.couple_members
      where couple_id = target_couple
        and user_id = (select auth.uid())
    )
    and (
      select count(*) < 10
      from public.couple_pokes poke
      where poke.couple_id = target_couple
        and poke.sender_id = (select auth.uid())
        and poke.created_at > now() - interval '1 hour'
    );
$$;

revoke execute on function private.daily_prompt_complete(uuid, date, text) from public, anon;
revoke execute on function private.both_adult_fun_enabled(uuid) from public, anon;
revoke execute on function private.can_send_poke(uuid) from public, anon;
grant execute on function private.daily_prompt_complete(uuid, date, text) to authenticated;
grant execute on function private.both_adult_fun_enabled(uuid) to authenticated;
grant execute on function private.can_send_poke(uuid) to authenticated;

create policy "couple members view fun preferences"
on public.fun_preferences for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.couple_members mine
    join public.couple_members theirs using (couple_id)
    where mine.user_id = (select auth.uid())
      and theirs.user_id = fun_preferences.user_id
  )
);

create policy "users insert own fun preferences"
on public.fun_preferences for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update own fun preferences"
on public.fun_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "answers stay private until both respond"
on public.daily_answers for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    (select private.is_couple_member(couple_id))
    and (select private.daily_prompt_complete(couple_id, prompt_on, prompt_key))
  )
);

create policy "users insert own daily answer"
on public.daily_answers for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.is_couple_member(couple_id))
);

create policy "users update own daily answer"
on public.daily_answers for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (select private.is_couple_member(couple_id))
);

create policy "couple members view pokes"
on public.couple_pokes for select to authenticated
using ((select private.is_couple_member(couple_id)));

create policy "members send limited pokes"
on public.couple_pokes for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (select private.can_send_poke(couple_id))
);

create policy "recipients mark pokes seen"
on public.couple_pokes for update to authenticated
using (
  sender_id <> (select auth.uid())
  and (select private.is_couple_member(couple_id))
)
with check (
  sender_id <> (select auth.uid())
  and (select private.is_couple_member(couple_id))
);

create policy "couple members view challenge responses"
on public.challenge_responses for select to authenticated
using (
  (select private.is_couple_member(couple_id))
  and (deck = 'general' or (select private.both_adult_fun_enabled(couple_id)))
);

create policy "users insert own challenge response"
on public.challenge_responses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.is_couple_member(couple_id))
  and (deck = 'general' or (select private.both_adult_fun_enabled(couple_id)))
);

create policy "users update own challenge response"
on public.challenge_responses for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (select private.is_couple_member(couple_id))
  and (deck = 'general' or (select private.both_adult_fun_enabled(couple_id)))
);

revoke all on public.fun_preferences, public.daily_answers, public.couple_pokes, public.challenge_responses from anon;
grant select, insert, update on public.fun_preferences, public.daily_answers, public.challenge_responses to authenticated;
grant select, insert on public.couple_pokes to authenticated;
grant update (seen_at) on public.couple_pokes to authenticated;

create index daily_answers_user_id_idx on public.daily_answers(user_id);
create index daily_answers_prompt_idx on public.daily_answers(couple_id, prompt_on, prompt_key);
create index couple_pokes_sender_id_idx on public.couple_pokes(sender_id);
create index couple_pokes_recent_idx on public.couple_pokes(couple_id, created_at desc);
create index challenge_responses_user_id_idx on public.challenge_responses(user_id);
create index challenge_responses_daily_idx on public.challenge_responses(couple_id, challenge_on, challenge_key);

alter table public.notification_preferences
add column fun_updates boolean not null default true;

alter publication supabase_realtime add table
  public.fun_preferences,
  public.daily_answers,
  public.couple_pokes,
  public.challenge_responses;
