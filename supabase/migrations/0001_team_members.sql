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
