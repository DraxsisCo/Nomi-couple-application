create table public.activity_items (
  id bigint generated always as identity primary key,
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('status', 'poke', 'daily', 'challenge', 'event', 'memory')),
  source_key text not null check (char_length(source_key) between 1 and 180),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  unique (couple_id, source_key)
);

create table public.activity_reactions (
  activity_id bigint not null references public.activity_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('😍', '😂', '🥹', '🫶', '🔥')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create table public.activity_replies (
  id bigint generated always as identity primary key,
  activity_id bigint not null references public.activity_items(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, author_id)
);

alter table public.activity_items enable row level security;
alter table public.activity_reactions enable row level security;
alter table public.activity_replies enable row level security;

create policy "couple members view activity items"
on public.activity_items for select to authenticated
using ((select private.is_couple_member(couple_id)));

create policy "couple members view activity reactions"
on public.activity_reactions for select to authenticated
using (exists (
  select 1 from public.activity_items item
  where item.id = activity_id
    and (select private.is_couple_member(item.couple_id))
));

create policy "members add own activity reactions"
on public.activity_reactions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.activity_items item
    where item.id = activity_id
      and (select private.is_couple_member(item.couple_id))
  )
);

create policy "members change own activity reactions"
on public.activity_reactions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.activity_items item
    where item.id = activity_id
      and (select private.is_couple_member(item.couple_id))
  )
);

create policy "members remove own activity reactions"
on public.activity_reactions for delete to authenticated
using (user_id = (select auth.uid()));

create policy "couple members view activity replies"
on public.activity_replies for select to authenticated
using (exists (
  select 1 from public.activity_items item
  where item.id = activity_id
    and (select private.is_couple_member(item.couple_id))
));

create policy "members add own activity replies"
on public.activity_replies for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.activity_items item
    where item.id = activity_id
      and (select private.is_couple_member(item.couple_id))
  )
);

create policy "members change own activity replies"
on public.activity_replies for update to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.activity_items item
    where item.id = activity_id
      and (select private.is_couple_member(item.couple_id))
  )
);

create policy "members remove own activity replies"
on public.activity_replies for delete to authenticated
using (author_id = (select auth.uid()));

revoke all on public.activity_items, public.activity_reactions, public.activity_replies from public, anon;
grant select on public.activity_items to authenticated;
grant select, insert, update, delete on public.activity_reactions, public.activity_replies to authenticated;
grant usage, select on sequence public.activity_replies_id_seq to authenticated;

create index activity_items_couple_cursor_idx on public.activity_items (couple_id, created_at desc, id desc);
create index activity_items_actor_id_idx on public.activity_items (actor_id);
create index activity_reactions_user_id_idx on public.activity_reactions (user_id);
create index activity_replies_activity_created_idx on public.activity_replies (activity_id, created_at);
create index activity_replies_author_id_idx on public.activity_replies (author_id);

create or replace function private.capture_activity_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_couple uuid;
  item_actor uuid;
  item_type text;
  item_source text;
  item_payload jsonb;
  item_created timestamptz;
  completed_count integer;
begin
  if tg_table_name = 'statuses' then
    item_couple := new.couple_id;
    item_actor := new.user_id;
    item_type := 'status';
    item_source := 'status:' || new.user_id::text || ':' || extract(epoch from new.updated_at)::bigint::text;
    item_payload := jsonb_build_object('mood', new.mood, 'emoji', new.mood_emoji, 'activity', new.activity);
    item_created := new.updated_at;
  elsif tg_table_name = 'events' then
    if tg_op = 'DELETE' then
      delete from public.activity_items where couple_id = old.couple_id and source_key = 'event:' || old.id::text;
      return old;
    end if;
    item_couple := new.couple_id;
    item_actor := new.created_by;
    item_type := 'event';
    item_source := 'event:' || new.id::text;
    item_payload := jsonb_build_object('title', new.title, 'startsAt', new.starts_at, 'allDay', new.all_day);
    item_created := new.created_at;
  elsif tg_table_name = 'diary_entries' then
    if tg_op = 'DELETE' then
      delete from public.activity_items where couple_id = old.couple_id and source_key = 'memory:' || old.id::text;
      return old;
    end if;
    item_couple := new.couple_id;
    item_actor := new.author_id;
    item_type := 'memory';
    item_source := 'memory:' || new.id::text;
    item_payload := jsonb_build_object('title', new.title, 'body', left(new.body, 240), 'emoji', coalesce(new.emoji, '🤍'));
    item_created := new.created_at;
  elsif tg_table_name = 'couple_pokes' then
    if tg_op <> 'INSERT' then return new; end if;
    item_couple := new.couple_id;
    item_actor := new.sender_id;
    item_type := 'poke';
    item_source := 'poke:' || new.id::text;
    item_payload := jsonb_build_object('kind', new.kind, 'message', new.message);
    item_created := new.created_at;
  elsif tg_table_name = 'daily_answers' then
    select count(distinct user_id) into completed_count
    from public.daily_answers
    where couple_id = new.couple_id and prompt_on = new.prompt_on and prompt_key = new.prompt_key;
    if completed_count < 2 then return new; end if;
    item_couple := new.couple_id;
    item_actor := new.user_id;
    item_type := 'daily';
    item_source := 'daily:' || new.prompt_on::text || ':' || new.prompt_key;
    item_payload := jsonb_build_object('promptKey', new.prompt_key, 'promptOn', new.prompt_on);
    item_created := now();
  elsif tg_table_name = 'challenge_responses' then
    if new.deck <> 'general' or new.state <> 'completed' then return new; end if;
    select count(distinct user_id) into completed_count
    from public.challenge_responses
    where couple_id = new.couple_id and challenge_on = new.challenge_on
      and challenge_key = new.challenge_key and deck = 'general' and state = 'completed';
    if completed_count < 2 then return new; end if;
    item_couple := new.couple_id;
    item_actor := new.user_id;
    item_type := 'challenge';
    item_source := 'challenge:' || new.challenge_on::text || ':' || new.challenge_key;
    item_payload := jsonb_build_object('challengeKey', new.challenge_key, 'challengeOn', new.challenge_on);
    item_created := now();
  else
    return coalesce(new, old);
  end if;

  insert into public.activity_items (couple_id, actor_id, activity_type, source_key, payload, created_at)
  values (item_couple, item_actor, item_type, item_source, item_payload, item_created)
  on conflict (couple_id, source_key) do update
  set actor_id = excluded.actor_id, payload = excluded.payload;
  return new;
end;
$$;

revoke execute on function private.capture_activity_item() from public, anon, authenticated;

create trigger statuses_activity_feed after insert or update on public.statuses
for each row execute function private.capture_activity_item();
create trigger events_activity_feed after insert or update or delete on public.events
for each row execute function private.capture_activity_item();
create trigger diary_activity_feed after insert or update or delete on public.diary_entries
for each row execute function private.capture_activity_item();
create trigger pokes_activity_feed after insert on public.couple_pokes
for each row execute function private.capture_activity_item();
create trigger daily_activity_feed after insert or update on public.daily_answers
for each row execute function private.capture_activity_item();
create trigger challenge_activity_feed after insert or update on public.challenge_responses
for each row execute function private.capture_activity_item();

insert into public.activity_items (couple_id, actor_id, activity_type, source_key, payload, created_at)
select couple_id, user_id, 'status', 'status:' || user_id::text || ':current',
  jsonb_build_object('mood', mood, 'emoji', mood_emoji, 'activity', activity), updated_at
from public.statuses
on conflict (couple_id, source_key) do nothing;

insert into public.activity_items (couple_id, actor_id, activity_type, source_key, payload, created_at)
select couple_id, created_by, 'event', 'event:' || id::text,
  jsonb_build_object('title', title, 'startsAt', starts_at, 'allDay', all_day), created_at
from public.events
on conflict (couple_id, source_key) do nothing;

insert into public.activity_items (couple_id, actor_id, activity_type, source_key, payload, created_at)
select couple_id, author_id, 'memory', 'memory:' || id::text,
  jsonb_build_object('title', title, 'body', left(body, 240), 'emoji', coalesce(emoji, '🤍')), created_at
from public.diary_entries
on conflict (couple_id, source_key) do nothing;

insert into public.activity_items (couple_id, actor_id, activity_type, source_key, payload, created_at)
select couple_id, sender_id, 'poke', 'poke:' || id::text,
  jsonb_build_object('kind', kind, 'message', message), created_at
from public.couple_pokes
on conflict (couple_id, source_key) do nothing;

alter publication supabase_realtime add table public.activity_items, public.activity_reactions, public.activity_replies;
