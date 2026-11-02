-- Bersihkan data lama agar script aman dijalankan berulang kali (urutan penting karena foreign key)
TRUNCATE TABLE pembayaran, pesanan, menu, pengaturan_kuota, antrean, restoran, pelanggan, pengguna RESTART IDENTITY CASCADE;

-- Semua akun uji memakai password fiktif: Password123!
INSERT INTO pengguna (username, email, no_hp, password_hash, role) VALUES
 ('admin',     'admin@antri.test',    '0800000001', crypt('Password123!', gen_salt('bf', 10)), 'ADMIN'),
 ('budi',      'budi@antri.test',     '0800000002', crypt('Password123!', gen_salt('bf', 10)), 'PELANGGAN'),
 ('bakso_jaya','bakso@antri.test',    '0800000003', crypt('Password123!', gen_salt('bf', 10)), 'RESTORAN');

INSERT INTO pelanggan (id_akun, nama, no_hp, email)
SELECT id_pengguna, 'Budi Fiktif', no_hp, email FROM pengguna WHERE username = 'budi';

-- Restoran 1: normal
INSERT INTO restoran (id_akun, nama_restoran, kategori, lokasi, alamat, email_kontak, rating_rerata)
SELECT id_pengguna, 'Bakso Jaya (Fiktif)', 'Bakso', 'Bandung', 'Jl. Contoh No. 1', email, 4.6
FROM pengguna WHERE username = 'bakso_jaya';

UPDATE pengaturan_kuota SET kuota_maksimum = 100, kapasitas_meja = 10
WHERE restoran_id = (SELECT restoran_id FROM restoran WHERE nama_restoran = 'Bakso Jaya (Fiktif)' LIMIT 1);

INSERT INTO menu (restoran_id, nama_menu, deskripsi_menu, harga, stok)
SELECT restoran_id, m.n, m.d, m.h, m.s FROM restoran,
 (VALUES ('Bakso Urat','Bakso urat besar',25000,50),
         ('Mie Ayam','Mie ayam spesial',20000,40),
         ('Es Teh','Es teh manis',5000,100)) AS m(n,d,h,s)
WHERE nama_restoran = 'Bakso Jaya (Fiktif)';

-- ============ Data uji UC02 ============
-- Skenario: normal, stok habis (Alt 3), slot booking penuh (Alt 5), timeout (Alt 4), antrean tutup.

-- Restoran 2: stok menipis & kapasitas meja kecil (kapasitas_meja = 2)
INSERT INTO restoran (nama_restoran, kategori, lokasi, alamat, email_kontak, rating_rerata)
VALUES ('Warung Uji Stok (Fiktif)', 'Warung', 'Bandung', 'Jl. Uji No. 2', 'uji@antri.test', 4.0);

UPDATE pengaturan_kuota SET kuota_maksimum = 50, kapasitas_meja = 2
WHERE restoran_id = (SELECT restoran_id FROM restoran WHERE nama_restoran = 'Warung Uji Stok (Fiktif)' LIMIT 1);

INSERT INTO menu (restoran_id, nama_menu, deskripsi_menu, harga, stok)
SELECT restoran_id, m.n, m.d, m.h, m.s FROM restoran,
 (VALUES ('Nasi Goreng','Nasi goreng biasa',18000,10),
         ('Soto Ayam (HABIS)','Stok 0 untuk uji Alt 3',22000,0),
         ('Teh Tarik (sisa 1)','Sisa 1 untuk uji stok kurang',8000,1)) AS m(n,d,h,s)
WHERE nama_restoran = 'Warung Uji Stok (Fiktif)';

-- Alt 5: slot besok 12:00 sudah penuh (2 booking aktif = kapasitas_meja 2)
INSERT INTO pesanan (pelanggan_id, restoran_id, mode_pemesanan, jumlah_rombongan,
                     tanggal_booking, slot_waktu_booking, total_harga, status_pemesanan)
SELECT p.pelanggan_id, r.restoran_id, 'BOOKING', 2, CURRENT_DATE + 1, '12:00', 0, 'DIBAYAR'
FROM pelanggan p, restoran r, generate_series(1,2)
WHERE p.nama = 'Budi Fiktif' AND r.nama_restoran = 'Warung Uji Stok (Fiktif)';

-- Alt 4: tagihan yang sudah lewat batas waktu (akan dibatalkan job cekTimeout)
WITH ps AS (
  INSERT INTO pesanan (pelanggan_id, restoran_id, mode_pemesanan, total_harga, status_pemesanan)
  SELECT p.pelanggan_id, r.restoran_id, 'TAKEAWAY', 5000, 'MENUNGGU_PEMBAYARAN'
  FROM pelanggan p, restoran r
  WHERE p.nama = 'Budi Fiktif' AND r.nama_restoran = 'Bakso Jaya (Fiktif)'
  RETURNING pesanan_id
)
INSERT INTO pembayaran (pesanan_id, tipe_pembayaran, jumlah, kode_bayar, batas_waktu_bayar)
SELECT pesanan_id, 'QRIS', 5000, 'KODE-KEDALUWARSA', NOW() - INTERVAL '1 minute' FROM ps;

-- Restoran 3: antrean TUTUP (tiket tidak boleh terbit)
INSERT INTO restoran (nama_restoran, kategori, lokasi, alamat, email_kontak)
VALUES ('Kafe Tutup (Fiktif)', 'Kafe', 'Bandung', 'Jl. Tutup No. 3', 'tutup@antri.test');

UPDATE antrean SET status_antrean = 'TUTUP'
WHERE restoran_id = (SELECT restoran_id FROM restoran WHERE nama_restoran = 'Kafe Tutup (Fiktif)' LIMIT 1);

INSERT INTO menu (restoran_id, nama_menu, harga, stok)
SELECT restoran_id, 'Kopi Hitam', 12000, 20 FROM restoran WHERE nama_restoran = 'Kafe Tutup (Fiktif)';