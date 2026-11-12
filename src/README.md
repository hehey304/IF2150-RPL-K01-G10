# antri.in

**antri.in** adalah aplikasi web pemesanan makanan viral dengan antrean digital. Pelanggan cukup mencari restoran, memesan, dan membayar dari rumah. Setelah itu mereka mendapat nomor antrean, bisa memantau sisa antrean secara *real-time*, dan baru datang saat gilirannya tiba. Restoran mengelola antrean, kuota, meja, serta menu dan stok. Admin memverifikasi mitra, menanggapi keluhan, dan menonaktifkan restoran yang melanggar ketentuan.

Proyek Tugas Besar IF2150 Rekayasa Perangkat Lunak, Kelas K01, Kelompok 10 (Ducklings).

---

## 1. Teknologi

| Komponen | Versi | Keterangan |
| :--- | :--- | :--- |
| Node.js | 20 LTS atau lebih baru (diuji pada v26.13.0) | Runtime |
| TypeScript | 7.0.2 | Bahasa server dan klien |
| Express | 4.22.3 | REST API dan penyaji berkas statis |
| PostgreSQL | 15+ (diuji pada 16) | DBMS sesuai DPPL, lewat `DATABASE_URL` |
| PGlite (`@electric-sql/pglite`) | 0.5.13 | PostgreSQL *embedded* (WASM). Dipakai otomatis bila `DATABASE_URL` kosong, sehingga tidak perlu memasang DBMS |
| bcryptjs | 3.0.3 | Hash kata sandi |
| multer | 2.5.0 | Unggah dokumen pendaftaran mitra |
| tsx | 4.23.15 | Menjalankan TypeScript di server dan test runner |

Antarmuka klien ditulis dengan TypeScript tanpa *framework* (*vanilla*), lalu dikompilasi `tsc` ke `public/js`. Pembaruan antrean *real-time* memakai **Server-Sent Events**.

## 2. Prasyarat & instalasi

1. Pasang **Node.js 20+** (sudah termasuk npm).
2. Dari folder `src/`, pasang dependensi:

```bash
cd src
npm install
```

Aplikasi secara otomatis memakai PGlite dan menyimpan data lokal di `src/data/pglite`.

## 3. Konfigurasi

Salin `.env.example` menjadi `.env`. Semua variabel bersifat opsional dan sudah punya nilai bawaan.

```bash
cp .env.example .env
```

| Variabel | Bawaan | Keterangan |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port HTTP |
| `DATABASE_URL` | *(kosong)* | URL PostgreSQL. Kosong berarti memakai PGlite |
| `PGLITE_DIR` | `./data/pglite` | Lokasi data PGlite. Isi `memory` untuk basis data sementara |
| `SEED_ON_START` | `true` | Mengisi data contoh saat basis data masih kosong |
| `PAYMENT_TIMEOUT_MINUTES` | `15` | Batas waktu pembayaran |
| `AUTO_DEQUEUE_MINUTES` | `30` | Batas hadir pelanggan yang sudah dipanggil sebelum dilewati otomatis |
| `MENIT_PER_ANTREAN` | `3` | Dasar perhitungan estimasi waktu tunggu |
| `BIAYA_LAYANAN` | `2000` | Biaya layanan per pesanan (Rp) |
| `UPLOAD_DIR` | `./uploads` | Folder dokumen pengajuan mitra, foto restoran, dan foto menu |
| `EMAIL_SIMULASI` | `true` | Email tidak benar-benar dikirim; tautan "lupa kata sandi" ditampilkan di layar |
| `SIMULASI_ANTREAN` | `true` | Menjalankan simulator antrean dummy (lihat bagian 5) |
| `SIMULASI_INTERVAL_DETIK` | `15` | Selang waktu simulator antrean dummy |
| `GATEWAY_SERVER_KEY` | *(kunci dev)* | Kunci HMAC tanda tangan notifikasi payment gateway |

Tabel dibuat otomatis saat server pertama kali berjalan (`server/db/schema.sql`), lalu data contoh dimasukkan. Seed juga bisa dijalankan manual:

```bash
npm run seed
```

Untuk mengulang dari awal dengan PGlite, hapus folder `data/` dan `uploads/`.

## 4. Menjalankan aplikasi

```bash
npm start
```

Perintah ini mengompilasi klien lalu menjalankan server. Buka **http://localhost:3000** di Google Chrome. Saat pertama kali dijalankan, seed membutuhkan sekitar 10 detik.

Mode pengembangan (server dimuat ulang otomatis saat kode berubah):

```bash
npm run dev
```

### Pengujian dan profiling

```bash
npm test
```

Ada 68 test yang dipecah per modul (`tests/<modul>.test.ts`): unit test aturan bisnis dan keranjang, test alur seluruh use case terhadap basis data, serta test REST API. Secara bawaan test memakai PGlite in-memory.

Pemeriksaan tipe:

```bash
npm run typecheck
```

Profiling dashboard antrean (lihat laporan M9 B.2.1):

```bash
npm run profile
```

## 5. Akun uji

Semua data contoh fiktif. Pada halaman login juga tersedia tombol **"Akun uji coba"** untuk mengisi kredensial secara otomatis.

| Peran | Email | Kata sandi | Catatan |
| :--- | :--- | :--- | :--- |
| Pelanggan | `pelanggan@antri.in` | `pelanggan123` | Sudah punya 1 tiket antrean aktif di Bakso Mang Ujang |
| Restoran | `bakso@antri.in` | `restoran123` | Bakso Mang Ujang, dengan 7 antrean aktif |
| Restoran lain | `seblak@`, `geprek@`, `kopi@`, `martabak@`, `cilok@`, `miekocok@`, `batagor@antri.in` | `restoran123` | `kopi@` antreannya ditutup; `martabak@` hanya melayani takeaway |
| Calon mitra | `mitrabaru@antri.in` | `restoran123` | Akun restoran yang belum mendaftar mitra (untuk UC04) |
| Admin | `admin@antri.in` | `admin12345` | Ada 1 pengajuan "Surabi Enhaii" yang menunggu verifikasi |

Akun tambahan:
- `dinda@contoh.id`, `fajar@contoh.id`, `nadia@contoh.id`, `yoga@contoh.id`, `salsa@contoh.id`, `bima@contoh.id` (kata sandi `pelanggan123`): pelanggan yang sedang antre di Bakso Mang Ujang.
- `pelanggan@antri.in` juga punya 1 pesanan **selesai** di Batagor Riri Viral, sehingga fitur ulasan bisa langsung dicoba.

**Sistem dummy (simulasi).** Karena belum ada layanan pihak ketiga sungguhan, beberapa bagian disimulasikan:

| Bagian | Cara kerja simulasi |
| :--- | :--- |
| **Payment gateway** | **AntriPay Sandbox**, payment gateway simulasi yang berperilaku seperti penyedia sungguhan. "Bayar" membuka halaman checkout terpisah (`/pg/checkout/:id`): **e-wallet** menampilkan QR plus simulator aplikasi e-wallet (Bayar/Tolak), **virtual account** menampilkan nomor VA plus simulator m-banking (nominal harus tepat), dan **kartu** hanya menerima kartu uji (`4811 1111 1111 1114` atau `5211 1111 1111 1117` berhasil, OTP `112233`; `4911 1111 1111 1113` ditolak). Status dikirim ke antri.in sebagai notifikasi bertanda tangan HMAC-SHA256 (`GATEWAY_SERVER_KEY`). Halaman pembayaran antri.in memantau status dan otomatis lanjut ke tiket. Pembatalan, ganti metode, kedaluwarsa, dan pengembalian dana (stok habis / bayar terlambat) ditangani otomatis. |
| **Email** | Tidak benar-benar dikirim. Isinya dicetak di konsol server dan dicatat di tabel `log_notifikasi`. Tautan "Lupa kata sandi" langsung ditampilkan di layar (`EMAIL_SIMULASI=true`) |
| **Antrean restoran** | `SimulatorAntrean`: pelanggan dummy (`dummyNN@dummy.antri.in`) memesan dan membayar lewat alur yang sama dengan pelanggan asli, setiap `SIMULASI_INTERVAL_DETIK` detik. Mode per restoran: **Mati**, **Pelanggan dummy** (pelanggan datang, restoran melayani sendiri), atau **Otomatis penuh** (restoran dummy juga menyiapkan, melayani, dan mengisi ulang stok). Semua restoran contoh berjalan dalam mode *Otomatis penuh*, kecuali Bakso Mang Ujang yang dikelola manual oleh akun uji `bakso@antri.in`. Mode bisa diubah di bagian bawah Dashboard Antrean, dan ada tombol "+ Tambah 1 pelanggan dummy" |

> Basis data dari iterasi 1 ikut termigrasi otomatis (kolom/tabel baru ditambahkan), tetapi mode simulasi restoran lama tetap *Mati*. Agar data contoh iterasi 2 lengkap, hapus folder `data/` dan `uploads/` lalu jalankan ulang.

## 5a. Fitur iterasi 2

| Fitur | Di mana |
| :--- | :--- |
| Filter **area/lokasi** dan foto restoran di beranda | I-05 |
| **Ulasan & rating**: pelanggan memberi bintang 1-5 setelah pesanan selesai, rating restoran dihitung ulang | Detail pesanan, I-06 |
| **Notifikasi dalam aplikasi** (ikon lonceng): giliran dipanggil, pesanan selesai/dilewati, pesanan & booking baru, hasil verifikasi mitra, tanggapan keluhan, restoran dinonaktifkan | Navbar & sidebar |
| **Ubah profil**, **ganti kata sandi** (sesi lain otomatis keluar), **lupa kata sandi** (token sekali pakai 30 menit) | I-02, I-03 |
| **Detail & riwayat pesanan** dengan bukti pembayaran yang bisa dicetak | Profil → Detail |
| Instruksi pembayaran per metode: **QR e-wallet**, nomor VA dengan tombol salin, info 3-D Secure kartu | I-09 |
| Tombol **"Mulai siapkan"** di dashboard. Status "Sedang disiapkan" muncul di layar pelanggan | I-14, I-11 |
| **Estimasi waktu tunggu** dari waktu layanan nyata (median jeda antar-penyelesaian, 1-15 menit) | I-11, I-14 |
| **Tutup antrean sementara** tanpa menghapus nilai kuota | I-16 |
| Halaman **Profil Restoran** (deskripsi, alamat, jam buka, kontak, foto) dan **foto menu** | Panel restoran |
| Filter pengajuan mitra per status. Foto pengajuan dipakai sebagai foto restoran | I-18 |
| Filter keluhan **Ditanggapi**, serta filter restoran **Aktif/Nonaktif** (perbaikan bug) | I-19, I-20 |
| **Simulator antrean dummy** | Dashboard antrean |
| **Payment gateway AntriPay Sandbox**: halaman checkout QR/VA/kartu + OTP, webhook HMAC, refund otomatis *(iterasi 3)* | I-09 → `/pg/checkout/:id` |

## 6. Arsitektur (MVC sesuai DPPL)

```
src/
  server/
    models/        Model    - ModelAkun (akun.ts), ModelRestoran (restoran.ts, menu.ts, kuota.ts, mitra.ts),
                              ModelAntrean (antrean.ts), ModelPesanan (pesanan.ts, pembayaran.ts), ModelKeluhan (keluhan.ts),
                              iterasi 2: notifikasi.ts, ulasan.ts, profilRestoran.ts
    controllers/   Controller - 11 controller sesuai DPPL 2.3 + 4 controller iterasi 2 (notifikasi, profil restoran, ulasan, simulasi)
    services/      SimulatorAntrean (sistem antrean dummy)
    adapters/      Integrasi eksternal - PaymentGatewayAdapter, NotifikasiEmail
    routes/        Pemetaan REST API -> controller, satu file per modul (index.ts merakit semuanya)
    realtime/      Kanal event untuk pembaruan antrean (SSE)
    db/            BasisDataPostgreSQL - adapter pg/PGlite, schema.sql, seed
    middleware/    Autentikasi sesi, penanganan error, logging waktu respons
  client/          View - halaman I-01 s.d. I-21 (views/*View.ts) + Keranjang (models/keranjang.ts)
  public/          index.html, CSS, aset; hasil kompilasi klien di public/js
  tests/           Pengujian (node:test)
  scripts/         Skrip profiling
```

## 7. Modul / fitur dan pembagian anggota

> Checklist kerja tiap anggota ada di [`docs/M9/K01_G10_Pembagian-Tugas.md`](../docs/M9/K01_G10_Pembagian-Tugas.md).

| Use case | Fitur | Layar | Controller utama | Penanggung jawab |
| :--- | :--- | :--- | :--- | :--- |
| UC01 | Mencari & filter restoran | I-05, I-06 | `PencarianController` | Chatima Anandakhorita |
| UC02 | Pemesanan (dine-in, takeaway, booking) & pembayaran digital | I-06 - I-10 | `PemesananController`, `MetodePembayaranController` | Bayu Palamarta Wirawan & *[belum ditentukan]* |
| UC03 | Status antrean real-time & notifikasi giliran | I-11 | `PemantauAntreanController` | Muhammad Nur Fikri Hariyawan |
| UC04 | Pendaftaran mitra restoran | I-13 | `PengajuanMitraController` | Chatima Anandakhorita |
| UC05 | Verifikasi pendaftaran restoran + email | I-18 | `PengajuanMitraController` | Chatima Anandakhorita |
| UC06 | Kelola antrean, dequeue manual & otomatis 30 menit | I-14, I-15 | `KelolaAntreanController` | Muhammad Nur Fikri Hariyawan |
| UC07 | Kuota antrean & kapasitas meja, tutup sementara | I-16 | `PengaturanKuotaController` | Muhammad Nur Fikri Hariyawan |
| UC08 | Kelola menu & stok | I-17 | `KelolaMenuController` | Muhammad Fauzi Muharam |
| UC09 | Dashboard antrean restoran | I-14 | `KelolaAntreanController` | Muhammad Nur Fikri Hariyawan |
| UC10 | Registrasi akun | I-01 | `AutentikasiController` | Bayu Palamarta Wirawan |
| UC11 | Login | I-02 | `AutentikasiController` | Bayu Palamarta Wirawan |
| UC12 | Logout | I-03, I-04 | `AutentikasiController` | Bayu Palamarta Wirawan |
| UC13 | Penyampaian keluhan pelanggan | I-12 | `KeluhanController` | Athallah Nanda Andita |
| UC14 | Penanggapan keluhan oleh admin | I-19 | `KeluhanController` | Athallah Nanda Andita |
| UC15 | Penghapusan restoran | I-20, I-21 | `KelolaDataRestoranController` | Athallah Nanda Andita |
| Iterasi 2 | Notifikasi, profil restoran, foto menu | Lonceng, Profil Restoran | `NotifikasiController`, `ProfilRestoranController` | Muhammad Fauzi Muharam |
| Iterasi 2 | Ulasan & rating | Detail pesanan, I-06 | `UlasanController` | Athallah Nanda Andita |
| Iterasi 2 | Simulator antrean dummy | Dashboard antrean | `SimulatorAntrean`, `SimulasiController` | Partner UC02 *[belum ditentukan]* |

Basis data (skema, adapter, seed): Bayu Palamarta Wirawan.

## 8. Basis data

Skema lengkap ada di [`server/db/schema.sql`](server/db/schema.sql), dan diagram ERD-nya di [`docs/M9/K01_G10_ERD.md`](../docs/M9/K01_G10_ERD.md). Nama tabel dan kolom mengikuti query pada DPPL BAB 5.

| Tabel | Atribut utama |
| :--- | :--- |
| `pengguna` | id_pengguna, username, email, no_hp, nama, password_hash, role (PELANGGAN/RESTORAN/ADMIN), dibuat_pada, terakhir_logout |
| `sesi_pengguna` | id_sesi, id_pengguna, token, status_aktif, waktu_login, waktu_kedaluwarsa |
| `pelanggan` | pelanggan_id, nama, no_hp, id_akun, email |
| `admin` | id_admin, nama, email_admin, id_akun |
| `restoran` | restoran_id, nama_restoran, kategori, lokasi, alamat, deskripsi, jam_buka, email_kontak, no_hp, rating_rerata, jumlah_ulasan, warna, status_aktif, id_akun, bergabung_pada, dihapus_pada, foto_path, mode_simulasi (MATI/PELANGGAN/PENUH) |
| `menu` | menu_id, restoran_id, nama_menu, deskripsi_menu, kategori_menu, harga, stok, terjual, aktif, foto_path |
| `pengaturan_kuota` | restoran_id, kuota_maksimum, kapasitas_meja, antrean_ditutup |
| `antrean` | antrean_id, restoran_id, nomor_dilayani, total_antrean, estimasi_waktu_tunggu, status_antrean (BUKA/PENUH/TUTUP) |
| `pesanan` | pesanan_id, pelanggan_id, restoran_id, mode_pemesanan (DINE_IN/TAKEAWAY/BOOKING), jumlah_rombongan, tanggal_booking, slot_waktu_booking, subtotal, biaya_layanan, total_harga, status_pemesanan, dibuat_pada |
| `detail_pesanan` | pesanan_id, menu_id, jumlah, subtotal |
| `pembayaran` | id_pembayaran, pesanan_id, tipe_pembayaran, jumlah, kode_bayar, batas_waktu_bayar, status_pembayaran, dibuat_pada |
| `riwayat_transaksi` | id_transaksi, id_pembayaran, tanggal_transaksi, jumlah_dibayar, status_pelunasan |
| `tiket_antrean` | id_tiket, antrean_id, pelanggan_id, pesanan_id, nomor_urut, tipe_antrean, waktu_terbit, waktu_dipanggil, status_antrean (TERJADWAL/MENUNGGU/DIPANGGIL/SELESAI/DILEWATI/DIBATALKAN), estimasi_waktu_tunggu, disiapkan_pada, selesai_pada |
| `pengajuan_mitra` | id_pengajuan, id_pengguna, nama_restoran, kategori, lokasi, alamat, email_kontak, no_hp, daftar_menu (JSONB), status, tgl_pengajuan, alasan_penolakan, restoran_id |
| `dokumen_verifikasi` | id_dokumen, id_pengajuan, jenis_dokumen, nama_file, path_file, mime_type |
| `log_notifikasi` | id_log, penerima, jenis, subjek, isi_pesan, status, waktu_kirim |
| `keluhan` | id_keluhan, pelanggan_id, pesanan_id, restoran_id, kategori, isi_keluhan, waktu_kirim, status (BARU/DIBACA/DITANGGAPI), tanggapan |
| `ulasan` *(iterasi 2)* | id_ulasan, pesanan_id (unik), pelanggan_id, restoran_id, rating (1-5), komentar, waktu |
| `notifikasi` *(iterasi 2)* | id_notifikasi, id_pengguna, judul, isi, tautan, dibaca, waktu |
| `reset_kata_sandi` *(iterasi 2)* | token, id_pengguna, kedaluwarsa, dipakai |
| `gateway_transaksi` *(AntriPay Sandbox)* | id_transaksi, order_id, kode_bayar, metode, jumlah, status (MENUNGGU/OTP/LUNAS/GAGAL/KEDALUWARSA/DIKEMBALIKAN), kedaluwarsa, detail (hanya 4 digit akhir kartu), dibuat_pada, diperbarui |

## 9. Ringkasan REST API

| Metode & path | Peran | Keterangan |
| :--- | :--- | :--- |
| `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | - / login | UC10-UC12 |
| `GET /api/restoran`, `GET /api/restoran/:id`, `GET /api/restoran/:id/slot-booking`, `GET /api/restoran/:id/stream` (SSE) | publik | UC01, UC03 |
| `POST /api/pesanan`, `GET /api/pesanan`, `GET /api/pesanan/:id`, `POST /api/pesanan/:id/batal` | pelanggan | UC02 |
| `POST /api/pesanan/:id/pembayaran`, `POST /api/pembayaran/:id/verifikasi`, `POST /api/pembayaran/:id/simulasi` | pelanggan | UC02 |
| `GET /api/antrean-saya`, `GET /api/tiket/:id`, `GET /api/tiket/:id/status` | pelanggan | UC03 |
| `POST /api/keluhan`, `GET /api/keluhan/saya` | pelanggan | UC13 |
| `GET /api/mitra/pengajuan-saya`, `POST /api/mitra/pengajuan` (multipart) | restoran | UC04 |
| `GET /api/kelola/antrean`, `POST /api/kelola/antrean/dequeue`, `POST /api/kelola/booking/:id/hadir` | restoran | UC06, UC09 |
| `GET/PUT /api/kelola/kuota` | restoran | UC07 |
| `GET/POST /api/kelola/menu`, `PUT/DELETE /api/kelola/menu/:id`, `PATCH /api/kelola/menu/:id/stok` | restoran | UC08 |
| `GET /api/admin/pengajuan[/:id]`, `POST .../setujui`, `POST .../tolak`, `GET /api/admin/dokumen/:id` | admin | UC05 |
| `GET /api/admin/keluhan[/:id]`, `POST /api/admin/keluhan/:id/tanggapan` | admin | UC14 |
| `GET /api/admin/restoran`, `DELETE /api/admin/restoran/:id` | admin | UC15 |
| `PUT /api/auth/profil`, `PUT /api/auth/kata-sandi`, `POST /api/auth/lupa-kata-sandi`, `POST /api/auth/reset-kata-sandi` | login / - | Iterasi 2: profil & kata sandi |
| `GET /api/pesanan/:id/tagihan`, `POST /api/pembayaran/notifikasi` (webhook, header `X-Signature`) | pelanggan / gateway | Tagihan aktif & notifikasi status gateway |
| `GET /pg/checkout/:id`, `GET/POST /pg/api/:id[/qr\|/ewallet\|/va\|/kartu\|/otp]` | publik (pemegang ID transaksi) | Halaman & API AntriPay Sandbox |
| `POST /api/kelola/antrean/:idTiket/siapkan` | restoran | Iterasi 2: mulai siapkan |
| `GET/PUT /api/kelola/profil`, `POST /api/kelola/profil/foto`, `POST /api/kelola/menu/:id/foto` | restoran | Iterasi 2: profil restoran & foto |
| `GET /api/restoran/:id/foto`, `GET /api/menu/:id/foto` | publik | Iterasi 2: gambar |
| `GET /api/restoran/:id/ulasan`, `GET/POST /api/pesanan/:id/ulasan` | publik / pelanggan | Iterasi 2: ulasan |
| `GET /api/notifikasi`, `GET /api/notifikasi/jumlah`, `POST /api/notifikasi[/:id]/dibaca` | login | Iterasi 2: notifikasi |
| `GET/PUT /api/kelola/simulasi`, `POST /api/kelola/simulasi/pelanggan` | restoran | Iterasi 2: simulator antrean dummy |
