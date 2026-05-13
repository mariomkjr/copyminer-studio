-- Bucket pra imagens de referência (gerador de vídeo)
insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', true)
on conflict (id) do nothing;

-- Policy: authenticated users podem upload + leitura pública
drop policy if exists "reference-images insert authenticated" on storage.objects;
create policy "reference-images insert authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'reference-images');

drop policy if exists "reference-images read public" on storage.objects;
create policy "reference-images read public"
  on storage.objects for select
  to public
  using (bucket_id = 'reference-images');

drop policy if exists "reference-images delete own" on storage.objects;
create policy "reference-images delete own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'reference-images' and owner = auth.uid());
