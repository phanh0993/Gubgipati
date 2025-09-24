-- Create mapping table for group -> printer URI
create table if not exists public.printer_mappings (
  id bigserial primary key,
  group_key text not null unique,
  printer_uri text not null,
  printer_name text,
  created_at timestamptz default now()
);


