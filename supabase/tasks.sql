-- Tasks (Kanban) for MasterControl

create type if not exists public.task_status as enum ('backlog','todo','doing','blocked','done');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'backlog',
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_status_updated_at_idx on public.tasks(user_id, status, updated_at desc);

alter table public.tasks enable row level security;

create policy "tasks_select_own"
on public.tasks for select
using (auth.uid() = user_id);

create policy "tasks_insert_own"
on public.tasks for insert
with check (auth.uid() = user_id);

create policy "tasks_update_own"
on public.tasks for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "tasks_delete_own"
on public.tasks for delete
using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();
