create extension if not exists pgcrypto;
create type customer_mode as enum ('active','guest');
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('pending_payment','paid','processing','shipped','completed','cancelled');
  end if;
end$$;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.product_categories cascade;
drop table if exists public.vendors cascade;
drop table if exists public.customers cascade;
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  mode customer_mode not null,
  full_name text,
  email text unique,
  phone text unique,
  address text,
  created_at timestamptz default now(),
  constraint active_required_fields check (mode <> 'active' or (full_name is not null and email is not null and phone is not null and address is not null))
);
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  whatsapp_number text,
  image_url text,
  address text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id),
  category_id uuid not null references public.product_categories(id),
  name text not null,
  description text,
  price bigint not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  image_url text,
  created_at timestamptz default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  vendor_id uuid not null references public.vendors(id),
  total_amount bigint not null check (total_amount >= 0),
  status order_status not null default 'pending_payment',
  payment_proof_url text,
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
create index idx_products_vendor on public.products(vendor_id);
create index idx_products_category on public.products(category_id);
create index idx_products_name on public.products(name);
create index idx_orders_vendor on public.orders(vendor_id);
create index idx_orders_customer on public.orders(customer_id);
create index idx_vendor_active on public.vendors(is_active);
insert into public.vendors (name, description, whatsapp_number, image_url, address) values
('Warung Bu Sari', 'Warung sembako dan kebutuhan harian', '081234567890', 'https://example.com/images/vendors/sari.jpg', 'Jalan Melati No. 12'),
('UMKM Kopi Pak Budi', 'Kopi lokal sangrai fresh', '081987654321', 'https://example.com/images/vendors/budi.jpg', 'Jalan Kenanga No. 3'),
('Dapur Mbak Rina', 'Makanan rumahan siap antar', '082112223334', 'https://example.com/images/vendors/rina.jpg', 'Jalan Mawar No. 5');
insert into public.product_categories (name, slug) values
('Sembako', 'sembako'),
('Minuman', 'minuman'),
('Makanan', 'makanan'),
('Snack', 'snack'),
('Buah & Sayur', 'produce');
insert into public.products (vendor_id, category_id, name, description, price, stock, image_url) values
((select id from public.vendors where name='Warung Bu Sari'), (select id from public.product_categories where slug='sembako'), 'Beras 5kg', 'Beras premium 5kg', 85000, 50, 'https://example.com/images/products/beras5kg.jpg'),
((select id from public.vendors where name='Warung Bu Sari'), (select id from public.product_categories where slug='sembako'), 'Gula Pasir 1kg', 'Gula pasir kualitas baik', 14000, 100, 'https://example.com/images/products/gula1kg.jpg'),
((select id from public.vendors where name='Warung Bu Sari'), (select id from public.product_categories where slug='sembako'), 'Minyak Goreng 1L', 'Minyak goreng sawit', 20000, 80, 'https://example.com/images/products/minyak1l.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi'), (select id from public.product_categories where slug='minuman'), 'Kopi Robusta 250g', 'Biji kopi robusta sangrai', 45000, 30, 'https://example.com/images/products/robusta250.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi'), (select id from public.product_categories where slug='minuman'), 'Kopi Arabika 250g', 'Biji kopi arabika sangrai', 65000, 25, 'https://example.com/images/products/arabika250.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi'), (select id from public.product_categories where slug='minuman'), 'Cold Brew 500ml', 'Minuman kopi siap minum', 30000, 40, 'https://example.com/images/products/coldbrew500.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina'), (select id from public.product_categories where slug='makanan'), 'Nasi Ayam Geprek', 'Ayam geprek pedas level bisa pilih', 25000, 60, 'https://example.com/images/products/geprek.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina'), (select id from public.product_categories where slug='makanan'), 'Nasi Rendang', 'Rendang sapi rumahan', 30000, 50, 'https://example.com/images/products/rendang.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina'), (select id from public.product_categories where slug='snack'), 'Keripik Tempe', 'Keripik tempe renyah 150g', 12000, 100, 'https://example.com/images/products/keripiktempe.jpg'),
((select id from public.vendors where name='Warung Bu Sari'), (select id from public.product_categories where slug='produce'), 'Pisang Cavendish 1kg', 'Pisang segar 1kg', 18000, 70, 'https://example.com/images/products/pisang.jpg');
insert into public.customers (mode, full_name, email, phone, address) values
('active', 'Andi Pratama', 'andi@example.com', '081200000001', 'RT 01 RW 02, Jalan Merdeka No. 10'),
('active', 'Budi Santoso', 'budi@example.com', '081200000002', 'RT 02 RW 03, Jalan Melati No. 11'),
('active', 'Citra Lestari', 'citra@example.com', '081200000003', 'RT 03 RW 04, Jalan Mawar No. 15'),
('active', 'Dewi Kartika', 'dewi@example.com', '081200000004', 'RT 04 RW 05, Jalan Kenanga No. 7'),
('active', 'Eko Nugroho', 'eko@example.com', '081200000005', 'RT 05 RW 06, Jalan Anggrek No. 9');
insert into public.customers (mode, full_name, phone) values
('guest', 'Guest 1', '081300000001'),
('guest', 'Guest 2', '081300000002'),
('guest', 'Guest 3', '081300000003');
insert into public.orders (customer_id, vendor_id, total_amount, status) values
((select id from public.customers where mode='guest' and full_name='Guest 1'), (select id from public.vendors where name='Warung Bu Sari'), 34000, 'pending_payment'),
((select id from public.customers where mode='guest' and full_name='Guest 2'), (select id from public.vendors where name='UMKM Kopi Pak Budi'), 95000, 'pending_payment'),
((select id from public.customers where mode='guest' and full_name='Guest 3'), (select id from public.vendors where name='Dapur Mbak Rina'), 37000, 'pending_payment');
insert into public.order_items (order_id, product_id, product_name, quantity, price_per_item)
select (select o.id from public.orders o join public.customers c on c.id=o.customer_id where c.full_name='Guest 1' and c.mode='guest'),
       p.id, p.name, 1, p.price
from public.products p
where p.name = 'Gula Pasir 1kg';
insert into public.order_items (order_id, product_id, product_name, quantity, price_per_item)
select (select o.id from public.orders o join public.customers c on c.id=o.customer_id where c.full_name='Guest 1' and c.mode='guest'),
       p.id, p.name, 1, p.price
from public.products p
where p.name = 'Minyak Goreng 1L';
insert into public.order_items (order_id, product_id, product_name, quantity, price_per_item)
select (select o.id from public.orders o join public.customers c on c.id=o.customer_id where c.full_name='Guest 2' and c.mode='guest'),
       p.id, p.name, 1, p.price
from public.products p
where p.name in ('Kopi Arabika 250g')
limit 1;
insert into public.order_items (order_id, product_id, product_name, quantity, price_per_item)
select (select o.id from public.orders o join public.customers c on c.id=o.customer_id where c.full_name='Guest 3' and c.mode='guest'),
       p.id, p.name, 1, p.price
from public.products p
where p.name in ('Nasi Ayam Geprek')
limit 1;
