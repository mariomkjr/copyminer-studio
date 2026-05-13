-- Histórico de copies usadas (V8-01..V8-852+ importados do COPIES-USADAS.md)
create table if not exists public.copies (
  id uuid primary key default gen_random_uuid(),
  video_id text unique,            -- "V8-852" (null se gerado pela app sem ID atribuído)
  batch_date date,
  monte text,                       -- MONTE03
  formato text references public.formatos(slug),
  tema text,
  p1_copy text not null,
  p2_copy text not null,
  source text not null default 'app',  -- 'import' (legado) | 'app' (gerada na app)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_copies_formato on public.copies(formato);
create index if not exists idx_copies_monte on public.copies(monte);
create index if not exists idx_copies_created_at on public.copies(created_at desc);
create index if not exists idx_copies_video_id on public.copies(video_id);

alter table public.copies enable row level security;

drop policy if exists "copies select all authenticated" on public.copies;
create policy "copies select all authenticated"
  on public.copies for select
  to authenticated
  using (true);

drop policy if exists "copies insert own" on public.copies;
create policy "copies insert own"
  on public.copies for insert
  to authenticated
  with check (auth.uid() = created_by or created_by is null);
