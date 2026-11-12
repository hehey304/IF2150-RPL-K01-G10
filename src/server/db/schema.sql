-- Skema basis data antri.in (PostgreSQL 15+). Nama tabel dan kolom mengikuti query pada DPPL BAB 5.

CREATE TABLE IF NOT EXISTS pengguna (
  id_pengguna      TEXT PRIMARY KEY,
  username         TEXT NOT NULL UNIQUE,
  email            TEXT NOT NULL UNIQUE,
  no_hp            TEXT UNIQUE,
  nama             TEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('PELANGGAN', 'RESTORAN', 'ADMIN')),
  dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terakhir_logout  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sesi_pengguna (
  id_sesi            TEXT PRIMARY KEY,
  id_pengguna        TEXT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  token              TEXT NOT NULL UNIQUE,
  status_aktif       BOOLEAN NOT NULL DEFAULT TRUE,
  waktu_login        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_kedaluwarsa  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pelanggan (
  pelanggan_id  TEXT PRIMARY KEY,
  nama          TEXT NOT NULL,
  no_hp         TEXT,
  id_akun       TEXT NOT NULL UNIQUE REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  email         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin (
  id_admin     TEXT PRIMARY KEY,
  nama         TEXT NOT NULL,
  email_admin  TEXT NOT NULL,
  id_akun      TEXT NOT NULL UNIQUE REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS restoran (
  restoran_id    TEXT PRIMARY KEY,
  nama_restoran  TEXT NOT NULL,
  kategori       TEXT NOT NULL,
  lokasi         TEXT NOT NULL,
  alamat         TEXT,
  deskripsi      TEXT,
  jam_buka       TEXT DEFAULT '10.00 - 22.00',
  email_kontak   TEXT NOT NULL,
  no_hp          TEXT,
  rating_rerata  NUMERIC(2,1) NOT NULL DEFAULT 0,
  jumlah_ulasan  INTEGER NOT NULL DEFAULT 0,
  warna          TEXT NOT NULL DEFAULT 'oranye',
  status_aktif   BOOLEAN NOT NULL DEFAULT TRUE,
  id_akun        TEXT REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
  bergabung_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dihapus_pada   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS menu (
  menu_id         TEXT PRIMARY KEY,
  restoran_id     TEXT NOT NULL REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  nama_menu       TEXT NOT NULL,
  deskripsi_menu  TEXT NOT NULL DEFAULT '',
  kategori_menu   TEXT NOT NULL DEFAULT 'Lainnya',
  harga           INTEGER NOT NULL CHECK (harga >= 0),
  stok            INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
  terjual         INTEGER NOT NULL DEFAULT 0,
  aktif           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pengaturan_kuota (
  restoran_id     TEXT PRIMARY KEY REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  kuota_maksimum  INTEGER NOT NULL DEFAULT 50 CHECK (kuota_maksimum >= 0),
  kapasitas_meja  INTEGER NOT NULL DEFAULT 10 CHECK (kapasitas_meja >= 0)
);

CREATE TABLE IF NOT EXISTS antrean (
  antrean_id             TEXT PRIMARY KEY,
  restoran_id            TEXT NOT NULL UNIQUE REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  nomor_dilayani         INTEGER NOT NULL DEFAULT 0,
  total_antrean          INTEGER NOT NULL DEFAULT 0,
  estimasi_waktu_tunggu  INTEGER NOT NULL DEFAULT 0,
  status_antrean         TEXT NOT NULL DEFAULT 'BUKA' CHECK (status_antrean IN ('BUKA', 'PENUH', 'TUTUP'))
);

CREATE TABLE IF NOT EXISTS pesanan (
  pesanan_id          TEXT PRIMARY KEY,
  pelanggan_id        TEXT NOT NULL REFERENCES pelanggan(pelanggan_id) ON DELETE CASCADE,
  restoran_id         TEXT NOT NULL REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  mode_pemesanan      TEXT NOT NULL CHECK (mode_pemesanan IN ('DINE_IN', 'TAKEAWAY', 'BOOKING')),
  jumlah_rombongan    INTEGER NOT NULL DEFAULT 1,
  tanggal_booking     DATE,
  slot_waktu_booking  TEXT,
  subtotal            INTEGER NOT NULL DEFAULT 0,
  biaya_layanan       INTEGER NOT NULL DEFAULT 0,
  total_harga         INTEGER NOT NULL,
  status_pemesanan    TEXT NOT NULL CHECK (status_pemesanan IN ('MENUNGGU_PEMBAYARAN', 'DIKONFIRMASI', 'SELESAI', 'DIBATALKAN')),
  dibuat_pada         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detail_pesanan (
  pesanan_id  TEXT NOT NULL REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  menu_id     TEXT NOT NULL REFERENCES menu(menu_id) ON DELETE CASCADE,
  jumlah      INTEGER NOT NULL CHECK (jumlah > 0),
  subtotal    INTEGER NOT NULL,
  PRIMARY KEY (pesanan_id, menu_id)
);

CREATE TABLE IF NOT EXISTS pembayaran (
  id_pembayaran      TEXT PRIMARY KEY,
  pesanan_id         TEXT NOT NULL REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  tipe_pembayaran    TEXT NOT NULL CHECK (tipe_pembayaran IN ('EWALLET', 'VIRTUAL_ACCOUNT', 'KARTU')),
  jumlah             INTEGER NOT NULL,
  kode_bayar         TEXT NOT NULL,
  batas_waktu_bayar  TIMESTAMPTZ NOT NULL,
  status_pembayaran  TEXT NOT NULL CHECK (status_pembayaran IN ('MENUNGGU', 'LUNAS', 'GAGAL', 'KEDALUWARSA')),
  dibuat_pada        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS riwayat_transaksi (
  id_transaksi       TEXT PRIMARY KEY,
  id_pembayaran      TEXT NOT NULL UNIQUE REFERENCES pembayaran(id_pembayaran) ON DELETE CASCADE,
  tanggal_transaksi  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jumlah_dibayar     INTEGER NOT NULL,
  status_pelunasan   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tiket_antrean (
  id_tiket               TEXT PRIMARY KEY,
  antrean_id             TEXT NOT NULL REFERENCES antrean(antrean_id) ON DELETE CASCADE,
  pelanggan_id           TEXT NOT NULL REFERENCES pelanggan(pelanggan_id) ON DELETE CASCADE,
  pesanan_id             TEXT NOT NULL UNIQUE REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  nomor_urut             INTEGER NOT NULL,
  tipe_antrean           TEXT NOT NULL CHECK (tipe_antrean IN ('DINE_IN', 'TAKEAWAY', 'BOOKING')),
  waktu_terbit           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_dipanggil        TIMESTAMPTZ,
  status_antrean         TEXT NOT NULL CHECK (status_antrean IN ('TERJADWAL', 'MENUNGGU', 'DIPANGGIL', 'SELESAI', 'DILEWATI', 'DIBATALKAN')),
  estimasi_waktu_tunggu  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tiket_antrean_status ON tiket_antrean (antrean_id, status_antrean, nomor_urut);
CREATE INDEX IF NOT EXISTS idx_detail_pesanan_pesanan ON detail_pesanan (pesanan_id);
CREATE INDEX IF NOT EXISTS idx_pesanan_booking ON pesanan (restoran_id, tanggal_booking, slot_waktu_booking);

CREATE TABLE IF NOT EXISTS pengajuan_mitra (
  id_pengajuan      TEXT PRIMARY KEY,
  id_pengguna       TEXT REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
  nama_restoran     TEXT NOT NULL,
  kategori          TEXT NOT NULL,
  lokasi            TEXT NOT NULL,
  alamat            TEXT NOT NULL,
  email_kontak      TEXT NOT NULL,
  no_hp             TEXT NOT NULL,
  daftar_menu       JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL CHECK (status IN ('MENUNGGU', 'DISETUJUI', 'DITOLAK')),
  tgl_pengajuan     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alasan_penolakan  TEXT,
  restoran_id       TEXT REFERENCES restoran(restoran_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS dokumen_verifikasi (
  id_dokumen     TEXT PRIMARY KEY,
  id_pengajuan   TEXT NOT NULL REFERENCES pengajuan_mitra(id_pengajuan) ON DELETE CASCADE,
  jenis_dokumen  TEXT NOT NULL,
  nama_file      TEXT NOT NULL,
  path_file      TEXT NOT NULL,
  mime_type      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS log_notifikasi (
  id_log       SERIAL PRIMARY KEY,
  penerima     TEXT NOT NULL,
  jenis        TEXT NOT NULL,
  subjek       TEXT NOT NULL DEFAULT '',
  isi_pesan    TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL,
  waktu_kirim  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS keluhan (
  id_keluhan    TEXT PRIMARY KEY,
  pelanggan_id  TEXT NOT NULL REFERENCES pelanggan(pelanggan_id) ON DELETE CASCADE,
  pesanan_id    TEXT REFERENCES pesanan(pesanan_id) ON DELETE SET NULL,
  restoran_id   TEXT REFERENCES restoran(restoran_id) ON DELETE SET NULL,
  kategori      TEXT NOT NULL DEFAULT 'Lainnya',
  isi_keluhan   TEXT NOT NULL,
  waktu_kirim   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL CHECK (status IN ('BARU', 'DIBACA', 'DITANGGAPI')),
  tanggapan     TEXT
);

-- ===================== Iterasi 2 =====================
-- Kolom baru memakai ADD COLUMN IF NOT EXISTS agar basis data iterasi 1 ikut termigrasi.

ALTER TABLE restoran ADD COLUMN IF NOT EXISTS foto_path TEXT;
ALTER TABLE restoran ADD COLUMN IF NOT EXISTS mode_simulasi TEXT NOT NULL DEFAULT 'MATI';
ALTER TABLE menu ADD COLUMN IF NOT EXISTS foto_path TEXT;
ALTER TABLE pengaturan_kuota ADD COLUMN IF NOT EXISTS antrean_ditutup BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tiket_antrean ADD COLUMN IF NOT EXISTS disiapkan_pada TIMESTAMPTZ;
ALTER TABLE tiket_antrean ADD COLUMN IF NOT EXISTS selesai_pada TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS reset_kata_sandi (
  token        TEXT PRIMARY KEY,
  id_pengguna  TEXT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  kedaluwarsa  TIMESTAMPTZ NOT NULL,
  dipakai      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ulasan (
  id_ulasan     TEXT PRIMARY KEY,
  pesanan_id    TEXT NOT NULL UNIQUE REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  pelanggan_id  TEXT NOT NULL REFERENCES pelanggan(pelanggan_id) ON DELETE CASCADE,
  restoran_id   TEXT NOT NULL REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar      TEXT NOT NULL DEFAULT '',
  waktu         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ulasan_restoran ON ulasan (restoran_id, waktu DESC);

CREATE TABLE IF NOT EXISTS notifikasi (
  id_notifikasi  TEXT PRIMARY KEY,
  id_pengguna    TEXT NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  judul          TEXT NOT NULL,
  isi            TEXT NOT NULL DEFAULT '',
  tautan         TEXT,
  dibaca         BOOLEAN NOT NULL DEFAULT FALSE,
  waktu          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifikasi_pengguna ON notifikasi (id_pengguna, dibaca, waktu DESC);

-- ===================== Iterasi 3: Payment gateway sandbox =====================
-- Tabel milik "penyedia" gateway sandbox (AntriPay Sandbox). Dipisah dari tabel pembayaran milik antri.in
-- agar perilakunya menyerupai sistem eksternal: antri.in hanya mengenal kode bayar dan notifikasi status.
CREATE TABLE IF NOT EXISTS gateway_transaksi (
  id_transaksi   TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL UNIQUE,
  kode_bayar     TEXT NOT NULL UNIQUE,
  metode         TEXT NOT NULL CHECK (metode IN ('EWALLET', 'VIRTUAL_ACCOUNT', 'KARTU')),
  jumlah         INTEGER NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('MENUNGGU', 'OTP', 'LUNAS', 'GAGAL', 'KEDALUWARSA', 'DIKEMBALIKAN')),
  kedaluwarsa    TIMESTAMPTZ NOT NULL,
  detail         JSONB NOT NULL DEFAULT '{}',
  dibuat_pada    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diperbarui     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
