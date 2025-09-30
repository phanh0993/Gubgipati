-- Supabase SQL: Create order_buffet table and indexes
-- Safe to run multiple times

create table if not exists public.order_buffet (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  buffet_package_id bigint not null references public.buffet_packages(id) on delete restrict,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_order_buffet_order on public.order_buffet(order_id);
create index if not exists idx_order_buffet_package on public.order_buffet(buffet_package_id);

-- Optional RLS (disable by default for simplicity); adjust per your security needs
alter table public.order_buffet enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'order_buffet' and policyname = 'Allow all'
  ) then
    create policy "Allow all" on public.order_buffet for all using (true) with check (true);
  end if;
end $$;


