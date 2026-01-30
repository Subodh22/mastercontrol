-- MasterControl schema (run in Supabase SQL editor)

-- Enable required extension for trigram indexes (optional but recommended)
create extension if not exists pg_trgm;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_id_created_at_idx on public.conversations(user_id, created_at desc);
create index if not exists conversations_title_trgm_idx on public.conversations using gin (title gin_trgm_ops);
create index if not exists conversations_content_trgm_idx on public.conversations using gin (content gin_trgm_ops);

alter table public.conversations enable row level security;

-- Policies
create policy "conversations_select_own"
on public.conversations for select
using (auth.uid() = user_id);

create policy "conversations_insert_own"
on public.conversations for insert
with check (auth.uid() = user_id);

create policy "conversations_update_own"
on public.conversations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "conversations_delete_own"
on public.conversations for delete
using (auth.uid() = user_id);
