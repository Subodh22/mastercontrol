-- Official OpenAI billing usage (daily) pulled from OpenAI API

create table if not exists public.openai_billing_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists openai_billing_daily_user_day_idx on public.openai_billing_daily(user_id, day desc);

alter table public.openai_billing_daily enable row level security;

create policy "openai_billing_daily_select_own"
  on public.openai_billing_daily for select
  using (auth.uid() = user_id);

create policy "openai_billing_daily_insert_own"
  on public.openai_billing_daily for insert
  with check (auth.uid() = user_id);

create policy "openai_billing_daily_update_own"
  on public.openai_billing_daily for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "openai_billing_daily_delete_own"
  on public.openai_billing_daily for delete
  using (auth.uid() = user_id);

-- updated_at trigger (reuses public.set_updated_at from other migrations if present)
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create or replace function public.set_updated_at()
    returns trigger
    language plpgsql
    as $func$
    begin
      new.updated_at = now();
      return new;
    end;
    $func$;
  end if;
end $$;

drop trigger if exists set_openai_billing_daily_updated_at on public.openai_billing_daily;
create trigger set_openai_billing_daily_updated_at
before update on public.openai_billing_daily
for each row execute function public.set_updated_at();
