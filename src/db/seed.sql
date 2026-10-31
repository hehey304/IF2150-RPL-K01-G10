-- Semua akun uji memakai password fiktif: Password123!
INSERT INTO pengguna (username, email, no_hp, password_hash, role) VALUES
 ('admin',     'admin@antri.test',     '0800000001', crypt('Password123!', gen_salt('bf', 10)), 'ADMIN'),
 ('budi',      'budi@antri.test',      '0800000002', crypt('Password123!', gen_salt('bf', 10)), 'PELANGGAN'),
 ('bakso_jaya','bakso@antri.test',     '0800000003', crypt('Password123!', gen_salt('bf', 10)), 'RESTORAN');

INSERT INTO pelanggan (id_akun, nama, no_hp, email)
SELECT id_pengguna, 'Budi Fiktif', no_hp, email FROM pengguna WHERE username = 'budi';

INSERT INTO restoran (id_akun, nama_restoran, kategori, lokasi, alamat, email_kontak, rating_rerata)
SELECT id_pengguna, 'Bakso Jaya (Fiktif)', 'Bakso', 'Bandung', 'Jl. Contoh No. 1', email, 4.6
FROM pengguna WHERE username = 'bakso_jaya';

UPDATE pengaturan_kuota SET kuota_maksimum = 100, kapasitas_meja = 10;

INSERT INTO menu (restoran_id, nama_menu, deskripsi_menu, harga, stok)
SELECT restoran_id, m.n, m.d, m.h, m.s FROM restoran,
 (VALUES ('Bakso Urat','Bakso urat besar',25000,50),
         ('Mie Ayam','Mie ayam spesial',20000,40),
         ('Es Teh','Es teh manis',5000,100)) AS m(n,d,h,s);