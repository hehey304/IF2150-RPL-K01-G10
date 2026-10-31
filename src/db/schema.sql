-- antri.in schema (PostgreSQL 15). Diturunkan dari DPPL Bab 5.
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid(), crypt()

-- ============ AKUN (C25, C29) ============
CREATE TABLE pengguna (
  id_pengguna     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  no_hp           TEXT UNIQUE,                 -- tambahan: UC10 minta nomor telepon unik
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'PELANGGAN'
                  CHECK (role IN ('PELANGGAN','RESTORAN','ADMIN')),
  terakhir_logout TIMESTAMPTZ,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sesi_pengguna (
  id_sesi           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pengguna       UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  token             TEXT NOT NULL UNIQUE,
  status_aktif      BOOLEAN NOT NULL DEFAULT TRUE,
  waktu_login       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_kedaluwarsa TIMESTAMPTZ NOT NULL
);

CREATE TABLE pelanggan (
  pelanggan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_akun      UUID NOT NULL UNIQUE REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  nama         TEXT NOT NULL,
  no_hp        TEXT,
  email        TEXT
);

-- ============ RESTORAN (C02, C03, C20) ============
CREATE TABLE restoran (
  restoran_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_akun       UUID REFERENCES pengguna(id_pengguna) ON DELETE SET NULL,
  nama_restoran TEXT NOT NULL,
  kategori      TEXT NOT NULL,
  lokasi        TEXT,
  alamat        TEXT,
  email_kontak  TEXT NOT NULL,
  rating_rerata NUMERIC(2,1) NOT NULL DEFAULT 0,
  status_aktif  BOOLEAN NOT NULL DEFAULT TRUE,
  dihapus_pada  TIMESTAMPTZ,
  dibuat_pada   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ulasan (                          -- DPPL: daftarUlasan belum punya tabel
  id_ulasan    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id  UUID NOT NULL REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  pelanggan_id UUID REFERENCES pelanggan(pelanggan_id) ON DELETE SET NULL,
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar     TEXT,
  dibuat_pada  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu (
  menu_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id    UUID NOT NULL REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  nama_menu      TEXT NOT NULL,
  deskripsi_menu TEXT,
  harga          NUMERIC(12,2) NOT NULL CHECK (harga > 0),
  stok           INT NOT NULL DEFAULT 0 CHECK (stok >= 0),   -- KNF03: stok tak boleh negatif
  aktif          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE pengaturan_kuota (
  restoran_id     UUID PRIMARY KEY REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  kuota_maksimum  INT NOT NULL DEFAULT 0 CHECK (kuota_maksimum >= 0),
  kapasitas_meja  INT NOT NULL DEFAULT 0 CHECK (kapasitas_meja >= 0)
);

-- ============ ANTREAN (C04, C09) ============
CREATE TABLE antrean (
  antrean_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id           UUID NOT NULL UNIQUE REFERENCES restoran(restoran_id) ON DELETE CASCADE,
  nomor_dilayani        INT NOT NULL DEFAULT 0,
  total_antrean         INT NOT NULL DEFAULT 0,
  estimasi_waktu_tunggu INT NOT NULL DEFAULT 0,
  status_antrean        TEXT NOT NULL DEFAULT 'TERBUKA'
                        CHECK (status_antrean IN ('TERBUKA','TUTUP'))
);

-- ============ PESANAN & PEMBAYARAN (C06, C07, C08) ============
CREATE TABLE pesanan (
  pesanan_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelanggan_id       UUID NOT NULL REFERENCES pelanggan(pelanggan_id),
  restoran_id        UUID NOT NULL REFERENCES restoran(restoran_id),
  mode_pemesanan     TEXT NOT NULL CHECK (mode_pemesanan IN ('DINE_IN','TAKEAWAY','PRE_ORDER','BOOKING')),
  jumlah_rombongan   INT CHECK (jumlah_rombongan > 0),
  tanggal_booking    DATE,
  slot_waktu_booking TEXT,
  total_harga        NUMERIC(12,2) NOT NULL,
  status_pemesanan   TEXT NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN'
                     CHECK (status_pemesanan IN ('MENUNGGU_PEMBAYARAN','DIBAYAR','DIKONFIRMASI',
                                                 'DIPROSES','SELESAI','DIBATALKAN')),
  dibuat_pada        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE detail_pesanan (
  pesanan_id UUID NOT NULL REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  menu_id    UUID NOT NULL REFERENCES menu(menu_id),
  jumlah     INT NOT NULL CHECK (jumlah > 0),
  subtotal   NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (pesanan_id, menu_id)
);

CREATE TABLE pembayaran (
  id_pembayaran     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pesanan_id        UUID NOT NULL REFERENCES pesanan(pesanan_id) ON DELETE CASCADE,
  tipe_pembayaran   TEXT NOT NULL CHECK (tipe_pembayaran IN ('QRIS','TRANSFER_BANK','E_WALLET')),
  jumlah            NUMERIC(12,2) NOT NULL,
  kode_bayar        TEXT,
  batas_waktu_bayar TIMESTAMPTZ NOT NULL,
  status_pembayaran TEXT NOT NULL DEFAULT 'MENUNGGU'
                    CHECK (status_pembayaran IN ('MENUNGGU','LUNAS','GAGAL','KEDALUWARSA'))
);

CREATE TABLE riwayat_transaksi (
  id_transaksi      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pembayaran     UUID NOT NULL UNIQUE REFERENCES pembayaran(id_pembayaran),  -- cegah double-charge (KNF14)
  tanggal_transaksi TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jumlah_dibayar    NUMERIC(12,2) NOT NULL,
  status_pelunasan  TEXT NOT NULL DEFAULT 'LUNAS'
);

CREATE TABLE tiket_antrean (
  id_tiket              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  antrean_id            UUID NOT NULL REFERENCES antrean(antrean_id) ON DELETE CASCADE,
  pelanggan_id          UUID NOT NULL REFERENCES pelanggan(pelanggan_id),
  pesanan_id            UUID NOT NULL UNIQUE REFERENCES pesanan(pesanan_id),
  nomor_urut            INT NOT NULL,
  tipe_antrean          TEXT NOT NULL,
  tanggal_antre         DATE NOT NULL DEFAULT CURRENT_DATE,
  waktu_terbit          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  waktu_dipanggil       TIMESTAMPTZ,                    -- untuk job auto-dequeue
  status_antrean        TEXT NOT NULL DEFAULT 'MENUNGGU'
                        CHECK (status_antrean IN ('MENUNGGU','DIPANGGIL','HADIR','SELESAI','DILEWATI','DIBATALKAN')),
  estimasi_waktu_tunggu INT NOT NULL DEFAULT 0,
  UNIQUE (antrean_id, tanggal_antre, nomor_urut)         -- KNF03: nomor unik per hari
);

-- ============ MITRA (C12, C13) ============
CREATE TABLE pengajuan_mitra (
  id_pengajuan     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_restoran    TEXT NOT NULL,
  kategori         TEXT NOT NULL,
  email_kontak     TEXT NOT NULL,
  alamat           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'MENUNGGU'
                   CHECK (status IN ('MENUNGGU','DISETUJUI','DITOLAK')),
  alasan_penolakan TEXT,
  tgl_pengajuan    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dokumen_verifikasi (
  id_dokumen    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pengajuan  UUID NOT NULL REFERENCES pengajuan_mitra(id_pengajuan) ON DELETE CASCADE,
  jenis_dokumen TEXT NOT NULL,
  path_file     TEXT NOT NULL
);

-- ============ KELUHAN & LOG (C30, C15) ============
CREATE TABLE keluhan (
  id_keluhan   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pelanggan_id UUID NOT NULL REFERENCES pelanggan(pelanggan_id),
  pesanan_id   UUID REFERENCES pesanan(pesanan_id),
  isi_keluhan  TEXT NOT NULL,
  waktu_kirim  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status       TEXT NOT NULL DEFAULT 'BARU'
               CHECK (status IN ('BARU','DIPROSES','DITANGGAPI','SELESAI')),
  tanggapan    TEXT
);

CREATE TABLE log_notifikasi (
  id_log      BIGSERIAL PRIMARY KEY,
  penerima    TEXT NOT NULL,
  jenis       TEXT NOT NULL,
  status      TEXT NOT NULL,
  waktu_kirim TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ INDEKS (KNF02: daftar restoran < 1 detik) ============
CREATE INDEX idx_restoran_aktif   ON restoran(status_aktif, nama_restoran);
CREATE INDEX idx_menu_restoran    ON menu(restoran_id) WHERE aktif;
CREATE INDEX idx_tiket_antrean    ON tiket_antrean(antrean_id, status_antrean, nomor_urut);
CREATE INDEX idx_pesanan_booking  ON pesanan(restoran_id, tanggal_booking, slot_waktu_booking);
CREATE INDEX idx_pembayaran_tunggu ON pembayaran(batas_waktu_bayar) WHERE status_pembayaran = 'MENUNGGU';
CREATE INDEX idx_sesi_token       ON sesi_pengguna(token);

-- ============ TRIGGER: restoran baru otomatis punya antrean & kuota ============
CREATE OR REPLACE FUNCTION init_restoran() RETURNS trigger AS $$
BEGIN
  INSERT INTO antrean (restoran_id) VALUES (NEW.restoran_id);
  INSERT INTO pengaturan_kuota (restoran_id) VALUES (NEW.restoran_id);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_init_restoran AFTER INSERT ON restoran
FOR EACH ROW EXECUTE FUNCTION init_restoran();