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
