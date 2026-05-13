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
