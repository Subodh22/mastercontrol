-- Passions: simple Notion-style notes grouped by passion

create table if not exists public.passion_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  passion text not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint passion_notes_passion_check check (passion in ('real_estate','sales','content'))
);

create index if not exists passion_notes_user_passion_updated_idx on public.passion_notes(user_id, passion, updated_at desc);

alter table public.passion_notes enable row level security;

create policy "passion_notes_select_own"
  on public.passion_notes for select
  using (auth.uid() = user_id);

create policy "passion_notes_insert_own"
  on public.passion_notes for insert
  with check (auth.uid() = user_id);

create policy "passion_notes_update_own"
  on public.passion_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "passion_notes_delete_own"
  on public.passion_notes for delete
  using (auth.uid() = user_id);

-- updated_at trigger (reuses public.set_updated_at if present)
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

drop trigger if exists set_passion_notes_updated_at on public.passion_notes;
create trigger set_passion_notes_updated_at
before update on public.passion_notes
for each row execute function public.set_updated_at();
