create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('customer','merchant','admin');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending_payment','paid','processing','shipped','completed','cancelled');
  end if;
end$$;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  avatar_url text,
  phone_number text,
  role user_role not null default 'customer',
  created_at timestamptz default now()
);
create table if not exists public.shops (
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
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id),
  name text not null,
  price bigint not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  description text,
  image_url text,
  category text,
  created_at timestamptz default now()
);
create table if not exists public.promos (
  code text primary key,
  discount_amount bigint not null check (discount_amount >= 0),
  quota int not null default 0 check (quota >= 0),
  is_active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  shop_id uuid,
  guest_name text,
  guest_phone text,
  shipping_address text,
  total_amount bigint not null check (total_amount >= 0),
  status order_status not null default 'pending_payment',
  payment_proof_url text,
  promo_code_used text,
  is_pickup boolean default false,
  admin_notes text,
  created_at timestamptz default now()
);
alter table public.orders
  add column if not exists service_fee bigint not null default 0;
alter table public.orders
  add column if not exists payment_method text;
alter table public.orders
  add column if not exists shipping_address text;
create table if not exists public.order_items (
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
  insert into public.profiles (id, full_name, avatar_url, phone_number, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'full_name'), null),
    coalesce((new.raw_user_meta_data ->> 'avatar_url'), null),
    coalesce((new.raw_user_meta_data ->> 'phone_number'), null),
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
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'select_own_profile') then
    create policy select_own_profile on public.profiles for select using (id = auth.uid());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'admin_select_profiles') then
    create policy admin_select_profiles on public.profiles for select using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'admin_insert_profiles') then
    create policy admin_insert_profiles on public.profiles for insert with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'admin_update_profiles') then
    create policy admin_update_profiles on public.profiles for update using (public.is_admin()) with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'admin_delete_profiles') then
    create policy admin_delete_profiles on public.profiles for delete using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shops' and policyname = 'public_read_shops') then
    create policy public_read_shops on public.shops for select using (true);
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shops' and policyname = 'merchant_insert_shops') then
    create policy merchant_insert_shops on public.shops for insert with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shops' and policyname = 'merchant_update_shops') then
    create policy merchant_update_shops on public.shops for update using ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid()) with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shops' and policyname = 'admin_delete_shops') then
    create policy admin_delete_shops on public.shops for delete using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'public_read_products') then
    create policy public_read_products on public.products for select using (true);
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'merchant_insert_products') then
    create policy merchant_insert_products on public.products for insert with check ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'merchant_update_products') then
    create policy merchant_update_products on public.products for update using ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid())) with check ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'merchant_delete_products') then
    create policy merchant_delete_products on public.products for delete using ((public.is_merchant() or public.is_admin()) and exists (select 1 from public.shops s where s.id = products.shop_id and s.owner_id = auth.uid()));
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promos' and policyname = 'admin_write_promos_insert') then
    create policy admin_write_promos_insert on public.promos for insert with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promos' and policyname = 'admin_write_promos_update') then
    create policy admin_write_promos_update on public.promos for update using (public.is_admin()) with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promos' and policyname = 'admin_write_promos_delete') then
    create policy admin_write_promos_delete on public.promos for delete using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promos' and policyname = 'public_read_promos') then
    create policy public_read_promos on public.promos for select using (true);
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'select_orders_customer') then
    create policy select_orders_customer on public.orders for select using (user_id = auth.uid());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'select_orders_merchant') then
    create policy select_orders_merchant on public.orders for select using (exists (select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()));
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'select_orders_admin') then
    create policy select_orders_admin on public.orders for select using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'insert_orders_customer') then
    create policy insert_orders_customer on public.orders for insert with check (auth.role() in ('authenticated','anon') or public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'insert_orders_anyone') then
    create policy insert_orders_anyone on public.orders for insert with check (true);
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'update_orders_admin') then
    create policy update_orders_admin on public.orders for update using (public.is_admin()) with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'delete_orders_admin') then
    create policy delete_orders_admin on public.orders for delete using (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'select_order_items') then
    create policy select_order_items on public.order_items for select using (
      exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
      or exists (select 1 from public.orders o join public.shops s on s.id = o.shop_id where o.id = order_items.order_id and s.owner_id = auth.uid())
      or public.is_admin()
    );
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'insert_order_items') then
    create policy insert_order_items on public.order_items for insert with check (
      -- Allow insert if the order belongs to the current authenticated user OR it's a guest order
      exists (select 1 from public.orders o where o.id = order_items.order_id and (o.user_id = auth.uid() or o.user_id is null))
      -- OR allow if the user is an admin
      or public.is_admin()
    );
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'update_order_items_admin') then
    create policy update_order_items_admin on public.order_items for update using (public.is_admin()) with check (public.is_admin());
  end if;
end$$;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'order_items' and policyname = 'delete_order_items_admin') then
    create policy delete_order_items_admin on public.order_items for delete using (public.is_admin());
  end if;
end$$;
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  badge_text text,
  cta_text text,
  cta_url text,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.banners enable row level security;
create index if not exists idx_banners_active on public.banners(is_active);
create policy public_read_banners on public.banners for select using (true);
create policy admin_write_banners_insert on public.banners for insert with check (public.is_admin());
create policy admin_write_banners_update on public.banners for update using (public.is_admin()) with check (public.is_admin());
create policy admin_write_banners_delete on public.banners for delete using (public.is_admin());
create table if not exists public.ui_sections (
  key text primary key,
  title text,
  subtitle text,
  cta_text text,
  cta_url text,
  icon_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.ui_sections enable row level security;
create index if not exists idx_ui_sections_active on public.ui_sections(is_active);
create policy public_read_ui_sections on public.ui_sections for select using (true);
create policy admin_write_ui_sections_insert on public.ui_sections for insert with check (public.is_admin());
create policy admin_write_ui_sections_update on public.ui_sections for update using (public.is_admin()) with check (public.is_admin());
create policy admin_write_ui_sections_delete on public.ui_sections for delete using (public.is_admin());

do $$
begin
  if not exists (select 1 from pg_type where typname = 'customer_mode') then
    create type customer_mode as enum ('active','guest');
  end if;
end$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  mode customer_mode not null,
  auth_user_id uuid,
  full_name text,
  email text unique,
  phone text unique,
  address text,
  created_at timestamptz default now(),
  constraint active_required_fields check (mode <> 'active' or (full_name is not null and email is not null and phone is not null and address is not null))
);

create index if not exists idx_customers_auth_user on public.customers(auth_user_id);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  whatsapp_number text,
  image_url text,
  address text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_product_categories_active on public.product_categories(is_active);
create index if not exists idx_product_categories_sort on public.product_categories(sort_order);

alter table public.products
  add column if not exists vendor_id uuid references public.vendors(id),
  add column if not exists category_id uuid references public.product_categories(id);

create index if not exists idx_products_vendor on public.products(vendor_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_name on public.products(name);

create index if not exists idx_vendor_active on public.vendors(is_active);
