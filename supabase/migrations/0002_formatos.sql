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
