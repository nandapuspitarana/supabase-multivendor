create extension if not exists pgcrypto;
create type user_role as enum ('customer','merchant','admin');
create type order_status as enum ('pending_payment','paid','processing','shipped','completed','cancelled');
create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz default now()
);
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  description text,
  whatsapp_number text,
  image_url text,
  address text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(owner_id)
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  name text not null,
  price bigint not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  description text,
  image_url text,
  category text,
  created_at timestamptz default now()
);
create table public.promos (
  code text primary key,
  discount_amount bigint not null check (discount_amount >= 0),
  quota int not null default 0 check (quota >= 0),
  is_active boolean default true,
  created_at timestamptz default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  shop_id uuid not null references public.shops(id),
  total_amount bigint not null check (total_amount >= 0),
  status order_status not null default 'pending_payment',
  payment_proof_url text,
  promo_code_used text,
  admin_notes text,
  created_at timestamptz default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity int not null check (quantity > 0),
  price_per_item bigint not null check (price_per_item >= 0),
  created_at timestamptz default now()
);
create index if not exists idx_shops_owner on public.shops(owner_id);
create index if not exists idx_products_shop on public.products(shop_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_shop on public.orders(shop_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_promos_active on public.promos(is_active);
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'full_name'), null),
    coalesce((new.raw_user_meta_data ->> 'avatar_url'), null),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;
create or replace function public.is_merchant()
returns boolean
language sql
stable
as $$
select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'merchant');
$$;
create or replace function public.is_customer()
returns boolean
language sql
stable
as $$
select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'customer');
$$;
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.promos enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy select_own_profile on public.profiles for select using (id = auth.uid());
create policy admin_select_profiles on public.profiles for select using (public.is_admin());
create policy admin_insert_profiles on public.profiles for insert with check (public.is_admin());
create policy admin_update_profiles on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy admin_delete_profiles on public.profiles for delete using (public.is_admin());
create policy public_read_shops on public.shops for select using (true);
create policy merchant_insert_shops on public.shops for insert with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());
create policy merchant_update_shops on public.shops for update using ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid()) with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());
create policy admin_delete_shops on public.shops for delete using (public.is_admin());
create policy public_read_products on public.products for select using (true);
create policy merchant_insert_products on public.products for insert with check ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
create policy merchant_update_products on public.products for update using ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid())) with check ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
create policy merchant_delete_products on public.products for delete using ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
create policy admin_write_promos_insert on public.promos for insert with check (public.is_admin());
create policy admin_write_promos_update on public.promos for update using (public.is_admin()) with check (public.is_admin());
create policy admin_write_promos_delete on public.promos for delete using (public.is_admin());
create policy public_read_promos on public.promos for select using (true);
create policy select_orders_customer on public.orders for select using (user_id = auth.uid());
create policy select_orders_merchant on public.orders for select using (exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()));
create policy select_orders_admin on public.orders for select using (public.is_admin());
create policy insert_orders_customer on public.orders for insert with check ((user_id = auth.uid()) or public.is_admin());
create policy update_orders_admin on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy delete_orders_admin on public.orders for delete using (public.is_admin());
create policy select_order_items on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  or exists (select 1 from public.orders o join public.shops s on s.id = o.shop_id where o.id = order_items.order_id and s.owner_id = auth.uid())
  or public.is_admin()
);
create policy insert_order_items on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  or public.is_admin()
);
create policy update_order_items_admin on public.order_items for update using (public.is_admin()) with check (public.is_admin());
create policy delete_order_items_admin on public.order_items for delete using (public.is_admin());
