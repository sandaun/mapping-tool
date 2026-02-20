-- Signal Library schema for Supabase
-- Apply in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.signal_library (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  model text not null,
  manufacturer_norm text generated always as (
    regexp_replace(lower(trim(manufacturer)), '\s+', ' ', 'g')
  ) stored,
  model_norm text generated always as (
    regexp_replace(lower(trim(model)), '\s+', ' ', 'g')
  ) stored,
  input_type text not null check (input_type in ('modbus', 'bacnet', 'knx')),
  signals jsonb not null,
  parser_version text not null,
  parser_provider text,
  parser_model text,
  parse_warnings jsonb not null default '[]'::jsonb,
  confidence_stats jsonb,
  source_file_name text,
  source_file_type text,
  source_file_size integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint signal_library_unique_key unique (manufacturer_norm, model_norm, input_type)
);

create index if not exists signal_library_manufacturer_idx
  on public.signal_library (manufacturer_norm);

create index if not exists signal_library_model_idx
  on public.signal_library (model_norm);

create index if not exists signal_library_input_type_idx
  on public.signal_library (input_type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists signal_library_set_updated_at on public.signal_library;
create trigger signal_library_set_updated_at
before update on public.signal_library
for each row execute procedure public.set_updated_at();

alter table public.signal_library enable row level security;

-- Public read-only access
create policy "signal_library_public_select"
  on public.signal_library
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies for anon/authenticated.
-- Writes are done from server route handlers using SUPABASE_SERVICE_ROLE_KEY.
