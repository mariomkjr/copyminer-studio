-- Função helper pra checar se o user atual é admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- prompt_generations: admin vê tudo, member vê só próprio
drop policy if exists "prompt_gen select all authenticated" on public.prompt_generations;
drop policy if exists "prompt_gen select own or admin" on public.prompt_generations;
create policy "prompt_gen select own or admin"
  on public.prompt_generations for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- team_members: admin pode atualizar qualquer um (promover, renomear)
drop policy if exists "team_members update self or admin" on public.team_members;
create policy "team_members update self or admin"
  on public.team_members for update
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- Promove MK
update public.team_members
set role = 'admin'
where user_id = '3eccd5bd-f0df-4ac5-a0ef-1e974cdc341b';
