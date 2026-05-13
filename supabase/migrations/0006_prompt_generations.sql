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
