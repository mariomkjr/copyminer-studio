-- Profiles dos membros do time (1:1 com auth.users)
create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text default 'member',
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "team_members select all authenticated" on public.team_members;
create policy "team_members select all authenticated"
  on public.team_members for select
  to authenticated
  using (true);

drop policy if exists "team_members update self" on public.team_members;
create policy "team_members update self"
  on public.team_members for update
  to authenticated
  using (auth.uid() = user_id);

-- Cria profile automático no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.team_members (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- Catálogo read-only dos 6 formatos validados
create table if not exists public.formatos (
  slug text primary key,
  name text not null,
  description text,
  gatilho text,
  when_to_use text,
  when_not_to_use text,
  examples jsonb default '[]'::jsonb,
  target_percent int,
  display_order int default 0
);

alter table public.formatos enable row level security;

drop policy if exists "formatos read all authenticated" on public.formatos;
create policy "formatos read all authenticated"
  on public.formatos for select
  to authenticated
  using (true);
-- Catálogo read-only de gatilhos psicológicos (8 categorias)
create table if not exists public.psychology_hooks (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  gatilho text,
  rationale text,
  templates jsonb default '[]'::jsonb,
  display_order int default 0
);

alter table public.psychology_hooks enable row level security;

drop policy if exists "psychology read all authenticated" on public.psychology_hooks;
create policy "psychology read all authenticated"
  on public.psychology_hooks for select
  to authenticated
  using (true);

create index if not exists idx_psychology_categoria on public.psychology_hooks(categoria);
-- Catálogo de avatares MONTE (MONTE01...MONTE13)
create table if not exists public.montes (
  name text primary key,
  active boolean not null default true,
  description text,
  prompt_used text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.montes enable row level security;

drop policy if exists "montes read all authenticated" on public.montes;
create policy "montes read all authenticated"
  on public.montes for select
  to authenticated
  using (true);
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
-- Log de gerações de prompt (P1+Extend e Nanobana)
create table if not exists public.prompt_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                  -- 'video' (P1+Extend) | 'monte' (Nanobana)
  input_image_url text,                -- só pra kind='video'
  image_analysis jsonb,                -- JSON estruturado da análise GPT-4o
  p1_copy text,
  p2_copy text,
  p1_prompt text,
  ext_prompt text,
  monte_params jsonb,                  -- {tema, emocao, angulo, iluminacao, cenario}
  monte_prompt text,                   -- output Nanobana
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_gen_user on public.prompt_generations(user_id, created_at desc);
create index if not exists idx_prompt_gen_kind on public.prompt_generations(kind);

alter table public.prompt_generations enable row level security;

drop policy if exists "prompt_gen select all authenticated" on public.prompt_generations;
create policy "prompt_gen select all authenticated"
  on public.prompt_generations for select
  to authenticated
  using (true);

drop policy if exists "prompt_gen insert own" on public.prompt_generations;
create policy "prompt_gen insert own"
  on public.prompt_generations for insert
  to authenticated
  with check (auth.uid() = user_id);
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
