## Tujuan
- Restart layanan Supabase lokal agar kembali berjalan sehat.
- Menyediakan `schema.sql` (DDL lengkap) dan `README.md` untuk backend marketplace hyper-local.

## Prosedur Restart
1. Hentikan stack: `docker compose -f supabase-multi-vendor/docker-compose.yml down`
2. (Opsional) Bersihkan kontainer lama bertanda `*-old`: `docker rm -f supabase-*-old realtime-dev.supabase-realtime-old` jika ingin benar-benar kosong.
3. Jalankan kembali: `docker compose -f supabase-multi-vendor/docker-compose.yml up -d`
4. Verifikasi status: `docker compose -f supabase-multi-vendor/docker-compose.yml ps`
5. Cek health Logflare: `iwr http://localhost:4000/health -UseBasicParsing` harus `200 OK`.
6. Cek Kong proxy: `iwr http://localhost:8000 -UseBasicParsing` wajar `Unauthorized` tanpa kredensial.
7. Catatan Windows: gunakan named volume `db-data` untuk Postgres (sudah direncanakan) agar tidak terjadi error `chmod`.

## Skema Database (schema.sql)
### Ekstensi & Enum
- Aktifkan `pgcrypto` untuk `gen_random_uuid()`.
- Enum `user_role`: `customer | merchant | admin`.
- Enum `order_status`: `pending_payment | paid | processing | shipped | completed | cancelled`.

### Tabel Utama
- `profiles` (1:1 ke `auth.users`):
  - `id uuid primary key` (FK ke `auth.users.id`), `full_name text`, `avatar_url text`, `role user_role not null default 'customer'`, `created_at timestamptz default now()`.
- `shops`:
  - `id uuid pk default gen_random_uuid()`, `owner_id uuid not null` (FK ke `profiles.id`), `name text not null`, `description text`, `whatsapp_number text`, `image_url text`, `address text`, `is_active boolean default true`, `created_at timestamptz default now()`, `unique(owner_id)`.
- `products`:
  - `id uuid pk default gen_random_uuid()`, `shop_id uuid not null` (FK ke `shops.id`), `name text not null`, `price bigint not null check(price >= 0)`, `stock int not null default 0 check(stock >= 0)`, `description text`, `image_url text`, `category text`, `created_at timestamptz default now()`.
- `promos`:
  - `code text primary key`, `discount_amount bigint not null check(discount_amount >= 0)`, `quota int not null default 0 check(quota >= 0)`, `is_active boolean default true`, `created_at timestamptz default now()`.
- `orders`:
  - `id uuid pk default gen_random_uuid()`, `user_id uuid not null` (FK `profiles.id`), `shop_id uuid not null` (FK `shops.id`), `total_amount bigint not null check(total_amount >= 0)`, `status order_status not null default 'pending_payment'`, `payment_proof_url text`, `promo_code_used text`, `admin_notes text`, `created_at timestamptz default now()`.
- `order_items`:
  - `id uuid pk default gen_random_uuid()`, `order_id uuid not null` (FK `orders.id` on delete cascade), `product_id uuid not null` (FK `products.id`), `product_name text not null`, `quantity int not null check(quantity > 0)`, `price_per_item bigint not null check(price_per_item >= 0)`, `created_at timestamptz default now()`.

### Indeks
- `shops(owner_id) unique`, `products(shop_id)`, `orders(user_id)`, `orders(shop_id)`, `order_items(order_id)`, `promos(is_active)`.

### Trigger & Fungsi
- Fungsi `public.handle_new_user()` (security definer) untuk auto-insert `profiles` saat ada user baru di `auth.users`, memetakan `full_name`/`avatar_url` dari `raw_user_meta_data` jika ada.
- Trigger `auth.on_auth_user_created` AFTER INSERT ON `auth.users` EXECUTE FUNCTION `public.handle_new_user()`.
- Helper role checks: `public.is_admin()`, `public.is_merchant()`, `public.is_customer()` berbasis `auth.uid()`.

## RLS Policies
- Aktifkan RLS di semua tabel.
- `profiles`: pelanggan hanya bisa `select` miliknya (`id = auth.uid()`), admin full CRUD (`is_admin()`).
- `shops`: publik bisa `select`; insert/update oleh merchant/admin dengan syarat `owner_id = auth.uid()`; delete admin.
- `products`: publik bisa `select`; insert/update/delete oleh merchant/admin jika `shop.owner_id = auth.uid()`; admin selalu boleh.
- `promos`: publik `select`; write hanya admin.
- `orders`: select pelanggan (`user_id = auth.uid()`), merchant (order ke tokonya via join `shops.owner_id = auth.uid()`), admin full; insert pelanggan (atau admin) dengan `user_id = auth.uid()`; update/delete admin.
- `order_items`: select pelanggan (join ke order miliknya), merchant (join ke order tokonya), admin full; insert pelanggan untuk order miliknya; update/delete admin.

## Alur Verifikasi Admin (Manual Transfer)
- Pelanggan membuat order → `pending_payment`; upload `payment_proof_url`.
- Admin cek di Studio, set status `paid` dan isi `admin_notes` jika perlu.
- Merchant dapat melihat order masuk untuk `shop_id` miliknya dan memproses.

## README.md
- Prasyarat: Supabase (self-host/cloud), Docker untuk lokal, akses Studio.
- Cara apply skema: aktifkan `pgcrypto`, jalankan `schema.sql` via Studio SQL editor atau `docker exec -i supabase-db psql -U postgres -d postgres < schema.sql`.
- RLS: cara uji dengan JWT claims lokal (`auth.uid()` via `request.jwt.claims.sub`).
- Manajemen peran: ubah `profiles.role` menjadi `merchant`/`admin`.
- Storage saran: bucket `payment-proofs` dengan kebijakan upload oleh pelanggan ke path sendiri dan admin full read.
- Contoh kueri: daftar produk, buat order + items, lihat order masuk merchant, admin verifikasi pembayaran.

## Lokasi File
- `supabase-multi-vendor/dev/schema.sql`
- `supabase-multi-vendor/README.md`

## Verifikasi
- Setelah apply, uji RLS dengan JWT, buat data dummy, dan pastikan alur manual transfer berjalan.

Silakan konfirmasi. Setelah disetujui, saya akan menghasilkan `schema.sql` dan `README.md`, lalu melakukan restart serta verifikasi layanan.