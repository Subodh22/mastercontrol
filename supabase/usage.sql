-- MasterControl usage tracking (daily)

create table if not exists public.usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  total_tokens bigint not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists usage_daily_user_day_idx on public.usage_daily(user_id, day desc);

alter table public.usage_daily enable row level security;

create policy "usage_daily_select_own"
  on public.usage_daily for select
  using (auth.uid() = user_id);

create policy "usage_daily_insert_own"
  on public.usage_daily for insert
  with check (auth.uid() = user_id);

create policy "usage_daily_update_own"
  on public.usage_daily for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usage_daily_delete_own"
  on public.usage_daily for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_usage_daily_updated_at on public.usage_daily;
create trigger set_usage_daily_updated_at
before update on public.usage_daily
for each row execute function public.set_updated_at();
