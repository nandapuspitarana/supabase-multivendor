# Supabase Backend – Hyper-local Multi-vendor Marketplace

## Tujuan
- Menyediakan skema database, RLS, dan trigger untuk marketplace RT/RW.
- Mendukung alur pembayaran transfer manual dan verifikasi oleh Admin via Supabase Studio.

## Prasyarat
- Supabase self-host (Docker) atau Supabase Cloud.
- Akses ke Supabase Studio/Dashboard.
- Untuk lokal: Docker Desktop dan PowerShell (Windows).

## Struktur Skema
- Enums:
  - `user_role`: `customer | merchant | admin`
  - `order_status`: `pending_payment | paid | processing | shipped | completed | cancelled`
- Tabel:
  - `profiles` (1:1 ke `auth.users`)
  - `shops` (satu merchant → satu shop)
  - `products`
  - `promos`
  - `orders`
  - `order_items`
- Trigger: membuat `profiles` otomatis saat user baru di `auth.users`.
- RLS: pelanggan baca produk/toko dan kelola order sendiri; merchant kelola shop/produk sendiri dan melihat order yang masuk; admin full CRUD.

## Lokasi Berkas
- `supabase-multi-vendor/dev/schema.sql` – DDL lengkap (enums, tabel, FK/PK, indeks, trigger, RLS).

## Cara Mengaplikasikan Skema
### Via Supabase Studio
1. Buka SQL Editor.
2. Salin isi `schema.sql` dan jalankan.

### Via Docker (Lokal, Windows PowerShell)
1. Salin berkas ke container:
   - `docker cp supabase-multi-vendor/dev/schema.sql supabase-db:/tmp/schema.sql`
2. Eksekusi:
   - `docker exec supabase-db psql -U postgres -d postgres -f /tmp/schema.sql`

## Prosedur Restart (Lokal)
1. Hentikan stack:
   - `docker compose -f supabase-multi-vendor/docker-compose.yml down`
2. Jalankan kembali:
   - `docker compose -f supabase-multi-vendor/docker-compose.yml up -d`
3. Verifikasi:
   - `docker compose -f supabase-multi-vendor/docker-compose.yml ps`
   - `iwr http://localhost:4000/health -UseBasicParsing` → harus `200 OK`
   - `iwr http://localhost:8000 -UseBasicParsing` → akan `Unauthorized` bila tanpa kredensial

## Peran dan Kebijakan
- Pelanggan:
  - Baca semua `shops` dan `products`.
  - Membuat dan membaca `orders` milik sendiri.
- Merchant:
  - Buat/ubah `shops` milik sendiri.
  - Buat/ubah `products` milik shop sendiri.
  - Lihat `orders` yang masuk ke shop miliknya.
- Admin:
  - Full CRUD seluruh tabel.

## Alur Pembayaran Manual
1. Pelanggan membuat order (`status = pending_payment`) dan unggah `payment_proof_url`.
2. Admin verifikasi transfer di Studio, lalu atur `status = paid` dan isi `admin_notes` bila perlu.
3. Merchant melihat order masuk untuk `shop_id` miliknya dan memproses pengiriman.

## Tips Pengujian RLS
- Di SQL editor, set role `authenticated` dan masukkan claim JWT:
  - `select set_config('request.jwt.claims', '{"sub":"<UUID_USER>"}', true);`
  - Gunakan `auth.uid()` di policy untuk memverifikasi akses.

## Manajemen Peran
- Promosikan user menjadi `merchant` atau `admin` dengan memperbarui `profiles.role`:
  - `update public.profiles set role = 'merchant' where id = '<UUID_USER>';`

## Catatan Windows
- Postgres data sebaiknya memakai named volume (`db-data`) untuk menghindari error `chmod` pada bind mount Windows.

