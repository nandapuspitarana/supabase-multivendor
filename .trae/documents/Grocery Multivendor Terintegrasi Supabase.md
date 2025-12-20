## Arsitektur
- Frontend React berbasis router dengan halaman: Home, Store List, Single Store, Product, Cart, Checkout, Dashboard Vendor, Auth.
- Supabase: Auth (GoTrue), Database (Postgres+RLS), Storage (bucket untuk gambar), Edge Functions untuk webhook/WhatsApp/email.
- Akses data via `@supabase/supabase-js` (auth, storage) dan PostgREST (`/rest/v1`) untuk query/CRUD yang terkontrol.

## Setup Supabase
- Variabel env UI: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`.
- Bucket Storage: `product-images`, `vendor-logos` dengan policy upload vendor terbatas ke miliknya, read publik.

## Skema & RLS
- Tabel: `vendors`, `product_categories`, `products`, `customers` (mode `active|guest`), `orders`, `order_items`.
- Tambahan kolom:
  - `products.vendor_id`, `products.category_id`, `products.image_url` (Storage path)
  - `orders.service_fee bigint not null`, `orders.payment_method text`, `orders.shipping_address text`
  - `customers.auth_user_id uuid null` untuk mengikat Customer aktif ke `auth.users`.
- RLS:
  - Publik: read `products`, `vendors`, `product_categories`.
  - Vendor: CRUD produk miliknya (`exists vendors.owner_id = auth.uid()`), read order ke tokonya.
  - Admin: full akses.

## Auth
- Halaman Login/Register menggunakan `supabase.auth.signInWithPassword`/`signUp`.
- Pada signup: buat profil `customers` dengan `mode='active'` dan isi data dasar; simpan `auth_user_id`.
- Session persistence: guarded routes untuk Dashboard Vendor & Checkout.

## Storage
- Komponen upload gambar (produk/vendor) menggunakan `supabase.storage.from(bucket).upload(path, file)`.
- Simpan URL publik ke kolom `image_url`.

## API & Edge Functions
- PostgREST: endpoints `products`, `vendors`, `orders`, `order_items`, `customers` dengan query terfilter.
- Edge Functions:
  - `whatsapp_notify`: generate pesan, call WhatsApp API provider (atau deep-link WA).
  - `send_invoice_email`: kirim invoice via email (SMTP atau provider).

## Frontend (React)
- Store List: render dari `vendors` (sudah diterapkan dasar), skeleton loader & error banner.
- Single Store: daftar produk milik vendor, filter by kategori.
- Product Detail: tambah ke cart.
- Cart state di local storage; sinkron ke DB saat checkout jika login (untuk order history).

## Dashboard Vendor
- Halaman: ringkasan order, daftar produk, form tambah/edit produk, upload gambar.
- Validasi form (harga ≥0, stok ≥0, wajib nama/kategori).

## Checkout
- Form: daftar belanjaan, info pengiriman, metode pembayaran (transfer/manual), service fee included.
- Hitung `total = sum(item.qty*price) + service_fee`.
- Buat `orders` + `order_items`; set `status='pending_payment'`; upload bukti transfer opsional.

## Integrasi WhatsApp
- Deep-link: `https://wa.me/<phone>?text=<encoded_template>` untuk:
  - Konfirmasi pesanan ke vendor
  - Notifikasi status pengiriman ke customer
  - Chat antara pembeli-vendor
- Template pesan: invoice ringkas + tautan ke detail order.

## Invoice
- Format: daftar produk + harga, service fee (termasuk ongkir), total, info vendor.
- Generate HTML + PDF (opsional) di frontend, kirim via Email function dan tombol WhatsApp share.

## Dokumentasi API
- Dokumen endpoint (query parameter, header `apikey`), contoh permintaan/response.
- Jelaskan RLS dan peran akses.

## Testing E2E
- Gunakan Cypress/Playwright:
  - Alur: register/login → tambah produk (vendor) → browse produk → tambah ke cart → checkout → generate WhatsApp link.
  - Mock Storage upload.

## Keamanan
- Validasi form frontend + backend (constraints database).
- Jangan hardcode keys; pakai env.
- RLS membatasi akses antar vendor; audit logs via Supabase.
- Sanitasi input untuk WhatsApp template.

## Implementasi Bertahap
1. Tambah kolom yang diperlukan (`orders.service_fee`, `customers.auth_user_id`).
2. Komponen Auth dan session guard.
3. Dashboard Vendor CRUD produk + upload gambar ke Storage.
4. Checkout flow + pembuatan order & item.
5. WhatsApp deep-link dan email invoice.
6. Testing E2E dan dokumentasi API.

Silakan konfirmasi. Setelah disetujui, saya akan menambahkan skema/kolom, komponen UI, integrasi Storage/Auth, fungsi WhatsApp/email, serta test E2E sesuai rencana.