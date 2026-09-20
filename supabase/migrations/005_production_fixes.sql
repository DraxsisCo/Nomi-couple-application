alter table public.notification_preferences alter column quiet_start drop not null;
alter table public.notification_preferences alter column quiet_end drop not null;

-- Private diary media bucket. Object names must begin with the owner's user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diary-photos', 'diary-photos', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "couple members view diary photos" on storage.objects for select to authenticated using (
  bucket_id = 'diary-photos' and exists (
    select 1 from public.diary_photos photo
    join public.diary_entries entry on entry.id = photo.entry_id
    where photo.storage_path = name and public.is_couple_member(entry.couple_id)
  )
);
create policy "users upload own diary photos" on storage.objects for insert to authenticated with check (
  bucket_id = 'diary-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "users delete own diary photos" on storage.objects for delete to authenticated using (
  bucket_id = 'diary-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
