insert into public.vendors (name, description, whatsapp_number, image_url, address) values
('Warung Bu Sari', 'Warung sembako dan kebutuhan harian', '081234567890', 'https://example.com/images/vendors/sari.jpg', 'Jalan Melati No. 12'),
('UMKM Kopi Pak Budi', 'Kopi lokal sangrai fresh', '081987654321', 'https://example.com/images/vendors/budi.jpg', 'Jalan Kenanga No. 3'),
('Dapur Mbak Rina', 'Makanan rumahan siap antar', '082112223334', 'https://example.com/images/vendors/rina.jpg', 'Jalan Mawar No. 5');

insert into public.product_categories (name, slug) values
('Sembako', 'sembako'),
('Minuman', 'minuman'),
('Makanan', 'makanan'),
('Snack', 'snack'),
('Buah & Sayur', 'produce')
on conflict (slug) do nothing;

insert into public.products (vendor_id, category_id, name, description, price, stock, image_url) values
((select id from public.vendors where name='Warung Bu Sari' limit 1), (select id from public.product_categories where slug='sembako'), 'Beras 5kg', 'Beras premium 5kg', 85000, 50, 'https://example.com/images/products/beras5kg.jpg'),
((select id from public.vendors where name='Warung Bu Sari' limit 1), (select id from public.product_categories where slug='sembako'), 'Gula Pasir 1kg', 'Gula pasir kualitas baik', 14000, 100, 'https://example.com/images/products/gula1kg.jpg'),
((select id from public.vendors where name='Warung Bu Sari' limit 1), (select id from public.product_categories where slug='sembako'), 'Minyak Goreng 1L', 'Minyak goreng sawit', 20000, 80, 'https://example.com/images/products/minyak1l.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi' limit 1), (select id from public.product_categories where slug='minuman'), 'Kopi Robusta 250g', 'Biji kopi robusta sangrai', 45000, 30, 'https://example.com/images/products/robusta250.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi' limit 1), (select id from public.product_categories where slug='minuman'), 'Kopi Arabika 250g', 'Biji kopi arabika sangrai', 65000, 25, 'https://example.com/images/products/arabika250.jpg'),
((select id from public.vendors where name='UMKM Kopi Pak Budi' limit 1), (select id from public.product_categories where slug='minuman'), 'Cold Brew 500ml', 'Minuman kopi siap minum', 30000, 40, 'https://example.com/images/products/coldbrew500.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina' limit 1), (select id from public.product_categories where slug='makanan'), 'Nasi Ayam Geprek', 'Ayam geprek pedas level bisa pilih', 25000, 60, 'https://example.com/images/products/geprek.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina' limit 1), (select id from public.product_categories where slug='makanan'), 'Nasi Rendang', 'Rendang sapi rumahan', 30000, 50, 'https://example.com/images/products/rendang.jpg'),
((select id from public.vendors where name='Dapur Mbak Rina' limit 1), (select id from public.product_categories where slug='snack'), 'Keripik Tempe', 'Keripik tempe renyah 150g', 12000, 100, 'https://example.com/images/products/keripiktempe.jpg'),
((select id from public.vendors where name='Warung Bu Sari' limit 1), (select id from public.product_categories where slug='produce'), 'Pisang Cavendish 1kg', 'Pisang segar 1kg', 18000, 70, 'https://example.com/images/products/pisang.jpg');

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
