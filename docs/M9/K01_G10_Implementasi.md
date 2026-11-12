<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 9
<br>
IMPLEMENTASI PERANGKAT LUNAK
</h1>
<br>

## *antri.in*
<img alt="Logo antri.in" src="../M8/assets/Logo_Antri_in.png" width="40%"><br>

### Untuk: *Angel*

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | *01* |
| Kelompok | *10*  |

| NIM | Nama |
|---|---|
| *13525145* | *Muhammad Nur Fikri Hariyawan* |
| *13525085* | *Bayu Palamarta Wirawan*       |
| *13525133* | *Chatima Anandakhorita*        |
| *13525148* | *Athallah Nanda Andita*        |
| *13525091* | *Muhammad Fauzi Muharam*       |
---

> **Petunjuk pengerjaan:** *[Silahkan hapus bagian ini setelah selesai mengerjakan]*
>
> Dokumen ini adalah **spesifikasi sekaligus template laporan singkat** Tugas 9. Bagian **Ketentuan Implementasi** (Bagian A) adalah aturan yang harus kalian ikuti, boleh dihapus dari laporan akhir. Bagian **Laporan Implementasi** (Bagian B) adalah yang **wajib kalian isi**. Gunakan nama, ID, kebutuhan, use case, dan kelas yang konsisten dengan SKPL, APL, dan DPPL.

---

**Deadline:** Rabu, 11 November 2026, 21.50 WIB
**Asistensi akbar:** *[Hari, DD Bulan YYYY, HH.MM WIB, lokasi/link]*

---

# BAGIAN A: Ketentuan Implementasi

## A.1 Deskripsi Tugas

Pada tugas ini, kalian mengimplementasikan perangkat lunak yang telah dirancang pada tugas-tugas sebelumnya (SKPL, APL, DPPL) menjadi aplikasi yang **dapat dijalankan**. Platform bebas (web, desktop, atau mobile) selama aplikasi dapat dijalankan ulang oleh asisten mengikuti petunjuk kalian.

Ketentuan umum:
- Setiap anggota bertanggung jawab atas **minimal satu fitur atau modul** dan harus terlihat jelas di riwayat commit/PR.
- Implementasi harus **mengacu pada DPPL**. Jika ada yang berubah (kelas, layar, basis data, dsb.), catat di Bagian B.1. Perubahan itu wajar, tetapi harus tercatat dan beralasan.
- Implementasi **tidak harus berupa kelas** (misalnya fungsi, komponen, *route/handler*, *stored procedure*, atau skrip). Namun, setiap kelas perancangan pada DPPL **wajib dapat ditelusuri** ke implementasinya, dan penelusuran ini dicatat di Bagian B.5.
- Seluruh use case pada SKPL **diprioritaskan** untuk diimplementasikan. Status tiap use case akan dilaporkan pada HIUPL (Tugas 10).
- Seluruh mahasiswa **wajib** mengikuti asistensi akbar.

## A.2 Platform, Bahasa, dan Teknologi

Kalian **bebas** memilih bahasa, framework, library, dan basis data, dengan syarat:

1. **Dapat dijalankan ulang** oleh asisten pada mesin biasa dengan mengikuti README. Versi bahasa/runtime dan seluruh dependensi harus tertulis jelas.
2. **Dependensi dikelola lewat file standar**, misalnya `package.json` + lockfile, `requirements.txt`/`pyproject.toml`, `pom.xml`/`build.gradle`, `composer.json`, `pubspec.yaml`, dan sejenisnya. Jangan meng-commit folder hasil instalasi (`node_modules/`, `venv/`, `build/`, dll.).
3. **Jika memakai layanan eksternal** (basis data cloud, API pihak ketiga, auth, dll.), sediakan cara menjalankan tanpa akun pribadi kalian, atau sediakan data/akun uji pada README. Basis data **sangat disarankan** dapat dijalankan lokal (SQLite, atau Docker Compose untuk PostgreSQL/MySQL/MongoDB).
4. **Arsitektur sesuai DPPL.** Pola arsitektur yang kalian pilih di APL/DPPL (MVC, layered, client-server, dll.) harus terlihat pada struktur kode.

Ketentuan tambahan per platform:

| Platform | Ketentuan |
| :--- | :--- |
| **Web** | Berjalan lokal lewat satu-dua perintah yang terdokumentasi. Boleh juga di-*deploy*; jika ya, cantumkan URL, tetapi **tetap wajib bisa dijalankan lokal** (URL deploy bisa mati). |
| **Desktop** | Berjalan dari source lewat perintah yang terdokumentasi. Build/installer opsional. |
| **Mobile** | Berjalan di emulator/simulator atau perangkat. Sertakan langkah menjalankan, dan **sangat disarankan** melampirkan APK/build di Release. |

## A.3 Keamanan Repository

Repo fork kelompok bersifat **public**, sehingga:

- **Dilarang** meng-commit password, API key, token, `.env` asli, sertifikat/private key, atau data pribadi. Hal ini dapat mengurangi nilai.
- Sediakan `.env.example` berisi nama variabel tanpa nilai rahasia, dan masukkan `.env` ke `.gitignore`.
- Jika sudah terlanjur ter-commit, **cabut/ganti** kredensial tersebut. Menghapus commit saja tidak cukup.
- Data uji/seed harus berupa data fiktif.

## A.4 Struktur Folder

Seluruh kode ditempatkan di `src/` pada repo fork. Jangan mengubah folder milestone lama.

```
src/                              # SELURUH kode implementasi
	README.md                     # dokumentasi utama aplikasi (lihat A.5)
	.env.example                  # jika memakai environment variable
	<struktur kode kalian>        # bebas, mengikuti pola arsitektur DPPL
	tests/                        # test case (jika ada)
docs/
	M9/
		KXX_GYY_Implementasi.md   # laporan ini (Bagian B)
		KXX_GYY_Form-Asistensi.md
```

Catatan:
- `README.md` aplikasi diletakkan di **`src/README.md`**, bukan di root repo.
- Jika kerangka kerja kalian mewajibkan struktur tertentu (misalnya Maven `src/main/java`, Flutter `lib/`, monorepo `frontend/` dan `backend/`), letakkan semuanya **di dalam `src/`**.
- Nama file dan folder pada `docs/M9/` mengikuti aturan penamaan milestone sebelumnya (`KXX_GYY_...`).

## A.5 Isi Minimal `src/README.md`

README harus cukup bagi orang yang belum pernah melihat proyek kalian untuk menjalankan aplikasi dari nol. Minimal berisi:

1. **Deskripsi singkat** aplikasi.
2. **Teknologi yang digunakan** beserta versi (bahasa, framework, basis data).
3. **Prasyarat dan instalasi** (software yang harus ada, perintah instalasi dependensi).
4. **Konfigurasi** (environment variable, setup basis data, migrasi/seed) dan langkah demi langkah menjalankannya.
5. **Cara menjalankan aplikasi** (dan cara menjalankan test, jika ada).
6. **Akun/data uji** untuk mencoba tiap peran pengguna (jika ada login).
7. **Daftar modul/fitur yang diimplementasi** beserta pembagian anggota.
8. **Daftar tabel/koleksi basis data** beserta atributnya (atau tautan ke skema/ERD).

## A.6 Best Practices

Kalian dianjurkan menerapkan praktik berikut. Bukti penerapannya dirangkum pada Bagian B.2.

### 1. Branching
Sesuai aturan umum di README repository, `main` fork kelompok dijaga agar tetap bisa menerima sync dari asisten. Pada tugas ini **sangat disarankan** memakai branch per fitur dengan format `<tipe>/<nama-fitur>` (contoh: `feat/login-page`, `fix/null-cart`), lalu digabungkan ke `main` melalui Pull Request. Skema Gitflow penuh (dengan `develop`) boleh dipakai, tetapi tidak diwajibkan.

### 2. Semantic Commit
Gunakan format `<tipe>(<scope>): <deskripsi>`, misalnya `feat(auth): tambah validasi email`.

| Tipe | Kegunaan |
| :--- | :--- |
| `feat` | Menambahkan fitur baru |
| `fix` | Memperbaiki bug |
| `docs` | Mengubah dokumentasi |
| `style` | Perubahan format/spasi, tanpa mengubah logika |
| `refactor` | Perubahan kode yang tidak menambah fitur atau memperbaiki bug |
| `test` | Menambah/memperbaiki pengujian |
| `chore` | Tugas rutin (build, dependensi, konfigurasi) |

### 3. Track Tasks
Gunakan **GitHub Issues** (dan opsional GitHub Projects) untuk membagi tugas dan melacak progres.
- Pecah fitur besar menjadi issue yang lebih kecil dan tetapkan penanggung jawabnya.
- Hubungkan PR dengan issue (`Closes #12`) dan tutup issue ketika selesai.

### 4. Pull Request dan Code Review
- Setiap PR berisi penjelasan deskriptif tentang apa yang dikerjakan, beserta bukti (tangkapan layar/rekaman/hasil test).
- Setiap PR di-*review* minimal **1 anggota lain**, dengan komentar konstruktif atau approval.

### 5. Pengujian dan Optimasi Performa
- Tulis pengujian untuk logika inti (unit test dan/atau pengujian alur utama). Cakupan penuh tidak diwajibkan, tetapi pengujian pada logika utama dinilai.
- Lakukan **profiling** pada setidaknya satu fitur yang berat (query besar, proses pengolahan data, render list panjang, dsb.), lalu catat temuan dan perbaikannya. Contoh alat:

| Platform | Contoh alat |
| :--- | :--- |
| Web (frontend) | Chrome DevTools (Performance/Network), Lighthouse |
| Web (backend) | Profiler bawaan bahasa, `EXPLAIN` pada query basis data, logging waktu respons |
| Python | `cProfile`, `PyInstrument` |
| Java | VisualVM, JProfiler |
| Mobile | Android Studio Profiler, Flutter DevTools, Xcode Instruments |

### 6. Penggunaan AI
Penggunaan AI **tetap harus dicatat** pada `docs/KXX_GYY_AI-Usage.md` sesuai ketentuan yang sudah berlaku.

## A.7 Pengumpulan

Pengumpulan dinilai dari **tag release**, bukan commit terakhir.

1. Pastikan seluruh pekerjaan sudah di-*commit* dan di-*push* ke `main` fork kelompok.
2. Buat release dengan tag **`v9.0`** (revisi berikutnya `v9.1`, `v9.2`, dst.) dengan target branch `main`.
3. Yang dinilai adalah **tag terakhir yang dibuat sebelum deadline**.

## A.8 Aturan Tanya Jawab

Agar semua kelompok mendapat jawaban yang sama, pertanyaan dibagi menjadi dua jalur:

| Jenis Pertanyaan | Jalur |
| :--- | :--- |
| **Ketentuan tugas**, misalnya teknologi yang diperbolehkan, struktur folder, format pengumpulan, dan penilaian | **Sheets QnA:** *[tautan sheets QnA]* |
| **Kendala teknis kelompok sendiri**, misalnya error, setup, dan penggunaan git | Grup kelompok bersama asisten masing-masing |

Ketentuan:
1. Pertanyaan tentang ketentuan tugas **wajib** diajukan melalui Sheets QnA. Periksa terlebih dahulu apakah pertanyaan serupa sudah dijawab.
2. Jika pertanyaan tentang ketentuan tugas tetap diajukan langsung kepada asisten kelompok, asisten **berhak menolak menjawab** dan meminta kelompok memasukkan pertanyaannya ke Sheets QnA.
3. Jika pertanyaan di Sheets QnA **belum dijawab dalam 24 jam**, kelompok boleh menghubungi asisten kelompok masing-masing. Cantumkan pertanyaan yang sudah diajukan di sheets tersebut.
4. Jawaban pada Sheets QnA berlaku untuk **seluruh kelompok** dan menjadi acuan jika terjadi perbedaan pemahaman.

---

# BAGIAN B: Laporan Implementasi

Kode implementasi ada di [`src/`](../../src). Petunjuk menjalankan aplikasi ada di [`src/README.md`](../../src/README.md).

## B.1 Perubahan dari DPPL

Tabel B.1. Perubahan dari DPPL

| No | Bagian DPPL | Rancangan Awal | Implementasi Akhir | Alasan |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 2.1 Lingkungan implementasi (DBMS) | PostgreSQL 15+ | PostgreSQL 15+ tetap didukung lewat `DATABASE_URL`. Bila kosong, aplikasi memakai PGlite (PostgreSQL *embedded*) secara otomatis | Agar asisten bisa menjalankan aplikasi tanpa memasang DBMS (ketentuan A.2 butir 1 dan 3). SQL yang dipakai sama persis. Seluruh test lulus pada PGlite maupun PostgreSQL 16 |
| 2 | Proses real-time (Process View 2.4.2) | "Kanal real-time" tanpa teknologi spesifik | Server-Sent Events (`GET /api/restoran/:id/stream`) | Hanya butuh arah server ke klien, tanpa dependensi tambahan |
| 3 | `PaymentGatewayAdapter` / Payment Gateway | Penyedia belum ditentukan | Antarmuka `PaymentGatewayAdapter` dengan implementasi **AntriPay Sandbox** (`server/sandbox-pg/`): halaman checkout terpisah (QR e-wallet, VA, kartu uji + OTP 3-D Secure), transaksi tersimpan di tabel `gateway_transaksi`, notifikasi status bertanda tangan HMAC-SHA256, pembatalan & pengembalian dana | Belum ada akun penyedia sungguhan. Adapter dapat diganti penyedia nyata tanpa mengubah `MetodePembayaranController` |
| 4 | `NotifikasiEmail` (C15) / Layanan Email | Mengirim email melalui layanan pihak ketiga | Email dicatat di tabel `log_notifikasi` dan dicetak di konsol server | Aplikasi tidak bergantung pada akun layanan email pribadi (ketentuan A.2 butir 3) |
| 5 | Kelas `Keranjang` (C05) | Bagian dari ModelPesanan di server | Kelas `Keranjang` di sisi klien (`client/models/keranjang.ts`, disimpan di localStorage). Harga dan stok selalu dihitung ulang server saat pesanan dibuat | Keranjang hanya draf sebelum checkout, sehingga tidak perlu disimpan di basis data |
| 6 | Tabel `pesanan.mode_pemesanan` (Q-023) | Nilai `PRE_ORDER` | Nilai `DINE_IN`, `TAKEAWAY`, `BOOKING` | Mengikuti tiga mode pada UC02 dan layar I-07. Pre-order diwujudkan sebagai dine-in/takeaway yang dibayar di muka |
| 7 | Status tiket antrean | MENUNGGU, DIPANGGIL, DILEWATI | Ditambah `TERJADWAL` (booking), `SELESAI`, `DIBATALKAN` serta kolom `waktu_dipanggil` | Booking tidak masuk antrean harian. Kolom `waktu_dipanggil` diperlukan untuk timer dequeue otomatis 30 menit |
| 8 | Hapus restoran (Q-010) | `DELETE FROM pengaturan_kuota` | Kuota diatur menjadi 0, restoran di-*soft delete*, tiket aktif dan pesanan belum selesai dibatalkan | Menjaga riwayat transaksi tetap utuh dan antrean pelanggan tidak menggantung |
| 9 | Hapus menu (Q-018/Q-062) | Menghapus data menu | *Soft delete* (`aktif = false`) | Riwayat `detail_pesanan` tetap merujuk menu yang valid |
| 10 | Tabel `pengajuan_mitra` | Tanpa daftar menu dan tautan akun | Ditambah `daftar_menu` (JSONB), `id_pengguna`, `lokasi`, `no_hp`, `restoran_id` | Layar I-13 meminta menu dan nomor telepon. Saat disetujui, restoran ditautkan ke akun pengaju |
| 11 | Tabel `keluhan` | id, isi, waktu, status, tanggapan | Ditambah `pesanan_id`, `restoran_id`, `kategori`. Status `BARU`/`DIBACA`/`DITANGGAPI` | Layar I-12 memilih pesanan dan kategori. Layar I-19 menampilkan jumlah keluhan per restoran |
| 12 | Login (Q-063) | Login dengan username atau email | Username diisi sama dengan email saat registrasi | Formulir I-01 tidak memiliki kolom username |
| 13 | Layar I-03 "Ubah profil", "Keamanan akun", dan I-02 "Lupa kata sandi?" | Tersedia | Iterasi 2: diimplementasikan (ubah nama & telepon, ganti kata sandi yang mengakhiri sesi lain, reset lewat token sekali pakai 30 menit) | Melengkapi tombol yang ada di rancangan antarmuka |
| 14 | Status pesanan "Sedang disiapkan" (I-11-04, I-14) | Tidak ada kelas/operasi khusus | Iterasi 2: kolom `tiket_antrean.disiapkan_pada` dan tombol "Mulai siapkan" (`KelolaAntreanController.tandaiDisiapkan`) | Sebelumnya status hanya ditebak dari posisi antrean |
| 15 | Estimasi waktu tunggu (`Antrean.getEstimasiWaktu`) | Waktu tunggu per antrean tetap | Iterasi 2: median jeda antar-penyelesaian tiket 3 jam terakhir (1-15 menit), dengan `MENIT_PER_ANTREAN` sebagai nilai cadangan | Estimasi lebih realistis (KNF02) |
| 16 | Tutup antrean sementara (UC07 Alt 2) | Kuota diisi 0 | Iterasi 2: kolom `pengaturan_kuota.antrean_ditutup`; nilai kuota tetap tersimpan | Pengelola tidak perlu mengisi ulang kuota saat membuka antrean lagi |
| 17 | Fitur baru di luar DPPL | - | Iterasi 2: **ulasan & rating** (`UlasanController`, tabel `ulasan`), **notifikasi dalam aplikasi** (`NotifikasiController`, tabel `notifikasi`), **profil restoran & foto menu** (`ProfilRestoranController`), **simulator antrean dummy** (`SimulatorAntrean`, `SimulasiController`) | Rating pada KF01 sebelumnya hanya dari data contoh; lonceng notifikasi ada di rancangan I-14; menu "Profil Restoran" ada di sidebar I-14-01; simulator diperlukan agar antrean terlihat hidup saat demo |
| 18 | Filter "Aktif" pada I-20 | Memfilter restoran aktif | Iterasi 2: daftar menampilkan restoran nonaktif juga, dengan filter Semua/Aktif/Nonaktif/Banyak keluhan | Perbaikan bug: sebelumnya "Aktif" sama dengan "Semua" |

## B.2 Bukti Penerapan Best Practices

Tabel B.2. Bukti Best Practices

| Praktik | Bukti | Keterangan |
| :--- | :--- | :--- |
| Branching | ['Branches'](https://github.com/hehey304/IF2150-RPL-K01-G10/branches) | *Git Flow (development-based branching strategy)* |
| Semantic commit | ['Commits'](https://github.com/hehey304/IF2150-RPL-K01-G10/commits) | *Pengembangan aplikasi dilakukan secara bertahap, dimulai dari inisialisasi proyek menggunakan TypeScript dan Express, pembangunan struktur frontend dan backend, konfigurasi database, serta implementasi sistem autentikasi yang mencakup registrasi, login, dan logout. Selanjutnya, tim mengembangkan berbagai fitur utama aplikasi, seperti pengelolaan restoran, menu dan stok, pemesanan, pembayaran, pencarian, kemitraan, notifikasi, keluhan pelanggan, ulasan, dan sistem antrean. Tim juga melakukan pengujian dan profiling pada website* |
| Track tasks | ['Issues'](https://github.com/hehey304/IF2150-RPL-K01-G10/issues) | *7 Issues: Pencarian Resto, Pemesanan, Antrean, Pendaftaran Restoran, Pengaturan Restoran, Pengaturan Akun, Keluhan* |
| Pull request dan review | *['PR 18'](https://github.com/hehey304/IF2150-RPL-K01-G10/pull/18) ['PR 20'](https://github.com/hehey304/IF2150-RPL-K01-G10/pull/20) ['PR 40'](https://github.com/hehey304/IF2150-RPL-K01-G10/pull/40)* | *Atha memeriksa Bayu, Atim memeriksa Atha, Fikri memeriksa Atim* |
| Pengujian | [`src/tests/`](../../src/tests) | 68 test dengan `node:test`, dijalankan lewat `npm test`. Isinya: unit test aturan bisnis (validasi booking 7 hari, status kuota, estimasi, format dokumen, input kuota) dan kelas `Keranjang`; test alur UC01-UC15 terhadap basis data (registrasi/login/logout, pemesanan, stok habis, antrean ditutup, slot penuh, pembayaran gagal & kedaluwarsa, dequeue manual & otomatis, kuota, menu, pengajuan mitra tolak/setujui, keluhan, hapus restoran); serta test hak akses REST API. Iterasi 2 menambah test profil & kata sandi, ulasan, notifikasi, profil restoran & foto, filter area, QR pembayaran, "Mulai siapkan", tutup antrean, estimasi median, filter keluhan/restoran, dan simulator antrean dummy, serta payment gateway sandbox (QR, VA nominal tepat, kartu uji + OTP, kartu ditolak, ganti metode, refund stok habis & bayar terlambat, transaksi kedaluwarsa, verifikasi HMAC webhook). Test dipecah per modul (`tests/<modul>.test.ts`). Semua lulus pada PGlite dan PostgreSQL 16 (`TEST_DATABASE_URL=... npm run test:pg`) |
### B.2.1 Profiling dan Optimasi

| Informasi | Keterangan |
| :--- | :--- |
| Fitur / proses yang diprofil | Dashboard antrean restoran (I-14, `KelolaAntreanController.getAntrean` → `Antrean.getDetailAntrean`). Layar ini dimuat ulang setiap ada perubahan antrean, sehingga sering dipanggil |
| Alat | Skrip `npm run profile` (`src/scripts/profile-dashboard.ts`): `performance.now()`, 20 kali pengulangan, dan `EXPLAIN ANALYZE`. Middleware `Server-Timing` mencatat request API yang lebih lambat dari 300 ms |
| Temuan (sebelum) | Pendekatan awal mengambil daftar tiket, lalu menjalankan satu query `detail_pesanan` **per tiket** (pola N+1). Dengan 507 tiket aktif waktu rata-rata **298,4 ms** (median 283,5 ms, p95 371,7 ms). Waktu ini tumbuh linear terhadap jumlah antrean |
| Perbaikan | Rincian pesanan diambil dalam **satu query** dengan subquery `string_agg` (lihat `server/models/antrean.ts`). Juga ditambahkan indeks `idx_tiket_antrean_status (antrean_id, status_antrean, nomor_urut)` dan `idx_detail_pesanan_pesanan` |
| Hasil (sesudah) | Rata-rata **16,0 ms** (median 14,2 ms, p95 21,8 ms) untuk 507 tiket, sekitar **18,6x lebih cepat**. `EXPLAIN ANALYZE` daftar tiket aktif: eksekusi 1,46 ms. Pada data uji ini planner memilih *seq scan* karena hampir semua baris cocok; indeks akan terpakai saat tabel berisi banyak tiket lama yang sudah selesai |

## B.3 Kendala dan Catatan Penting

- **Cara menjalankan tercepat:** `cd src && npm install && npm start`, lalu buka http://localhost:3000. Tidak perlu PostgreSQL atau Docker. Data contoh dan akun uji dibuat otomatis (lihat `src/README.md` bagian 5).
- **Pembayaran, email, dan antrean restoran disimulasikan** (lihat B.1 no. 3, 4, 17 dan `src/README.md` bagian 5). Pembayaran diselesaikan di halaman AntriPay Sandbox: e-wallet (tombol Bayar di simulator), VA (simulator m-banking), atau kartu uji `4811 1111 1111 1114` dengan OTP `112233`. Email muncul di konsol server, dan tautan lupa kata sandi ditampilkan di layar. Restoran contoh selain Bakso Mang Ujang menerima pelanggan dummy dan melayaninya otomatis setiap 15 detik. Matikan dengan `SIMULASI_ANTREAN=false`.
- **Dequeue otomatis** berjalan setiap 30 detik. Pelanggan yang sudah dipanggil dan tidak hadir dalam `AUTO_DEQUEUE_MINUTES` (bawaan 30 menit) akan ditandai *dilewati*. Untuk mencoba lebih cepat, jalankan dengan `AUTO_DEQUEUE_MINUTES=1`.
- **Notifikasi giliran (UC03)** masuk ke lonceng notifikasi dan tampil sebagai toast di halaman status antrean. Bila izin notifikasi browser diberikan, notifikasi browser juga muncul. Belum ada *push notification* saat aplikasi ditutup.
- **Estimasi waktu tunggu** memakai median waktu layanan nyata restoran. Bila datanya kurang dari 3 penyelesaian, dipakai `MENIT_PER_ANTREAN` (bawaan 3 menit).
- **Kuota harian** dihitung dari tiket dine-in/takeaway yang terbit pada hari kalender server. Booking dihitung terpisah terhadap kapasitas meja per slot jam.
- **Iterasi 2** melengkapi seluruh *known issues* iterasi 1: ubah profil, ganti/lupa kata sandi, foto restoran & menu, ulasan & rating, notifikasi, profil restoran, status "Sedang disiapkan", estimasi berbasis data, tutup antrean tanpa kehilangan kuota, filter area, filter pengajuan/keluhan/restoran, dan simulator antrean dummy.
- **Known issues:** belum ada *push notification* saat aplikasi ditutup; QR e-wallet berisi kode simulasi (bukan QRIS sungguhan); rating awal restoran contoh berasal dari data fiktif lalu bergeser mengikuti ulasan baru; akun pelanggan dummy (`@dummy.antri.in`) ikut tercatat di basis data.

## B.4 Kontribusi Anggota

Tabel B.4. Kontribusi Anggota

| NIM | Nama | Modul / Fitur yang Dikerjakan | Persentase Kontribusi |
| :--- | :--- | :--- | :--- |
| *13525145* | *Muhammad Nur Fikri Hariyawan* | *Antrean & pengaturan kuota* | *18* |
| *13525085* | *Bayu Palamarta Wirawan* | *Pembelian & riwayat pesanan, login/logout & kata sandi, database & ERD* | *20* |
| *13525133* | *Chatima Anandakhorita* | *Pencarian restoran, pendaftaran & verifikasi mitra, Pembayaran (partner Bayu), simulator antrean dummy* | *21* |
| *13525148* | *Athallah Nanda Andita* | *Keluhan, penanggapan, hapus restoran, ulasan & rating* | *20* |
| *13525091* | *Muhammad Fauzi Muharam* | *Menu & stok, profil restoran, notifikasi, fondasi & penyatuan* | *21* |

## B.5 Traceability Kelas Perancangan ke Implementasi

Tabel B.5. Traceability Kelas Perancangan ke Implementasi

| ID Kelas | Nama Kelas Perancangan | Bentuk Implementasi | Lokasi (File dan Nama) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| C01 | Pelanggan | Modul model + tabel | `src/server/models/akun.ts` - `Pelanggan`; tabel `pelanggan` | `accountRegister()` dan `getDetails()` (`getByAkun`). Operasi `cariRestoran`, `pilihMenu`, `pilihMetodeBayar`, `konfirmasiPembayaran`, `lihatStatusAntrean`, `kirimKeluhan` diwujudkan sebagai aksi pelanggan pada View yang memanggil controller terkait |
| C02 | Restoran | Modul model + tabel | `src/server/models/restoran.ts` - `Restoran`; tabel `restoran` | `getDetailRestoran()`, `cari()`, `buat()` (Q-044, Q-008), `setSoftDelete()` (sekaligus `purgeData()`), `daftarUntukAdmin()`. `getMenu`/`getDaftarMenu` ada di `Menu`, `getPengaturan` di `Kuota`, `getAntrean` di `Antrean` |
| C03 | Menu | Modul model + tabel | `src/server/models/menu.ts` - `Menu`; tabel `menu` | `getInfoMenu`, `isTersedia`/`cekStok`, `kurangiStok` (atomik), `tambahMenu`, `updateStok`, `updateInfoMenu`, `hapusMenu` (*soft delete*) |
| C04 | Antrean | Modul model + tabel | `src/server/models/antrean.ts` - `Antrean`; tabel `antrean` | `getFrontCustomer`, `dequeueCustomer`, `updateStatus` (status, total, estimasi, memanggil pelanggan terdepan), `getDetailAntrean`, `hitungEstimasi` (`getEstimasiWaktu`), `tentukanStatusAntrean` |
| C05 | Keranjang | Kelas (klien) | `src/client/models/keranjang.ts` - `Keranjang` | `tambahItem`, `hapusItem`, `hitungTotal`, `kosongkanKeranjang`. Atribut `daftarMenu` menjadi `data.items` |
| C06 | Pesanan | Modul model + tabel | `src/server/models/pesanan.ts` - `Pesanan`, `validasiJadwalBooking`; tabel `pesanan`, `detail_pesanan` | `validasiBooking` (`validasiJadwalBooking` + `hitungBookingSlot`), `simpan` (bagian penyimpanan `buatTagihan`), `batalkanPesanan`, `updateStatus`, `getDetailPesanan`. `showOrderDetails` ada di View I-09/I-11 |
| C07 | MetodePembayaranController | Kelas controller + tabel | `src/server/controllers/metodePembayaranController.ts` - `MetodePembayaranController`; `models/pembayaran.ts` - `Pembayaran`; tabel `pembayaran` | `buatTagihan`, `verifikasiPembayaran` (sekaligus menerbitkan tiket), `cekTimeout`. Atribut menjadi kolom tabel `pembayaran` |
| C08 | RiwayatTransaksi | Modul model + tabel | `src/server/models/pembayaran.ts` - `RiwayatTransaksi`; tabel `riwayat_transaksi` | `catatLogTransaksi`, `getBuktiPembayaran` |
| C09 | TiketAntrean | Modul model + tabel | `src/server/models/antrean.ts` - `TiketAntrean`; tabel `tiket_antrean` | `generateNomorAntrean`, `terbitkan`, `getDetailTiket`, `updateStatusTiket`. `cetakRincianTiket` ada di View I-10 (`client/views/pembayaranView.ts` - `tiketPage`) |
| C10 | PemantauAntreanController | Kelas controller + SSE | `src/server/controllers/pemantauAntreanController.ts` - `PemantauAntreanController`; `server/realtime/eventBus.ts` | `getStatusAntrean`, `subscribe` (`updateTampilanAntrean` lewat Server-Sent Events) |
| C11 | HalamanStatusAntrean | Fungsi view | `src/client/views/statusAntreanView.ts` - `halamanStatusAntrean` | `renderData`, berlangganan SSE (`tampilkanStatusAntrean`), notifikasi giliran |
| C12 | PengajuanMitraController | Kelas controller + tabel | `src/server/controllers/pengajuanMitraController.ts` - `PengajuanMitraController`; `models/mitra.ts` - `PengajuanMitra`; tabel `pengajuan_mitra` | `validasiKelengkapan`, `simpanPengajuan`, `setujui`, `tolak(alasan)` |
| C13 | DokumenVerifikasi | Modul model + tabel | `src/server/models/mitra.ts` - `DokumenVerifikasi`; tabel `dokumen_verifikasi` | `unggahDokumen` (berkas disimpan multer di `UPLOAD_DIR`), `validasiFormat` (PDF/JPG/PNG, maks. 5 MB) |
| C14 | Admin | Modul model + tabel | `src/server/models/akun.ts` - `Admin`; tabel `admin` | `accountRegister`. `tinjauPengajuan`, `lihatKeluhan`, `konfirmasiPenghapusan` diwujudkan di View I-18, I-19, I-21 |
| C15 | NotifikasiEmail | Kelas adapter | `src/server/adapters/notifikasiEmail.ts` - `NotifikasiEmail` | `kirimEmail` (log ke `log_notifikasi`, Q-049). Lihat B.1 no. 4 |
| C16 | KelolaAntreanController | Kelas controller | `src/server/controllers/kelolaAntreanController.ts` - `KelolaAntreanController` | `getAntrean`, `processDequeue`, `mulaiTimer` + `autoDequeue` (dequeue otomatis), `tandaiHadirBooking` |
| C17 | KonfirmasiDequeuePage | Fungsi dialog | `src/client/core/ui.ts` - `konfirmasi`; dipanggil di `views/kelolaAntreanView.ts` | `onConfirm`/`onCancel` menjadi nilai `true`/`false` dari Promise. `showConfirmationModal`/`hideModal` ditangani `konfirmasi()` |
| C18 | KelolaAntreanPage | Fungsi view | `src/client/views/kelolaAntreanView.ts` - `dashboardAntreanPage` (handler `[data-dequeue]`) | `displayDashboard`, `dequeue` |
| C19 | DashboardAntreanPage | Fungsi view | `src/client/views/kelolaAntreanView.ts` - `dashboardAntreanPage` (`render`, `muatUlang`) | `displayQueue`, `updateQueueStatus` (SSE). C18 dan C19 digabung dalam satu layar I-14 |
| C20 | Kuota | Modul model + tabel | `src/server/models/kuota.ts` - `Kuota`; tabel `pengaturan_kuota` | `updateKapasitas`, `isAntreanTutup`, `get` |
| C21 | PengaturanKuotaController | Kelas controller | `src/server/controllers/pengaturanKuotaController.ts` - `PengaturanKuotaController` | `displaySettings`, `onSaveSettings`. `showErrorPeringatan` diwujudkan sebagai respons 400 berisi galat per kolom |
| C22 | PengaturanKuotaPage | Fungsi view | `src/client/views/pengaturanKuotaView.ts` - `pengaturanKuotaPage` | `handleViewSettings`, `handleSaveSettings`, validasi input (toggle tutup antrean) |
| C23 | PengaturanMenuPage | Fungsi view | `src/client/views/pengaturanMenuView.ts` - `pengaturanMenuPage` | `displayDaftarMenu` (`render`), `showFormTambahMenu` (`formMenu`), `onSaveMenu`, `onDeleteMenu` |
| C24 | KelolaMenuController | Kelas controller | `src/server/controllers/kelolaMenuController.ts` - `KelolaMenuController` | `handleFetchMenu`, `handleAddMenu`, `handleUpdateMenu`, `handleUpdateStok`, `handleDeleteMenu`. `handleFetchMenuDetail` digabung ke `handleFetchMenu` |
| C25 | Pengguna | Modul model + tabel | `src/server/models/akun.ts` - `Pengguna`; tabel `pengguna` | `validateAccount`, `logout`, `getUserInfo`, `saveCredentials` (bcrypt), `isDuplikat` |
| C26 | HalamanProfilPage | Fungsi view | `src/client/views/akunView.ts` - `halamanProfilPage` | `tekanTombolLogout` (handler `#keluar`) |
| C27 | KonfirmasiLogoutPage | Fungsi dialog | `src/client/core/ui.ts` - `konfirmasi`; dipanggil di `halamanProfilPage` | `konfirmasiYa` / `konfirmasiBatal` |
| C28 | AutentikasiController | Kelas controller | `src/server/controllers/autentikasiController.ts` - `AutentikasiController` | `createAccount`, `validation`, `validateSession`, `processLogout` (sekaligus `handleSessionDeletion`) |
| C29 | SesiPengguna | Modul model + tabel | `src/server/models/akun.ts` - `SesiPengguna`; tabel `sesi_pengguna`; `server/middleware/auth.ts` | `buat`, `validateToken` (sekaligus `validateSession`), `hapusSesi` |
| C30 | Keluhan | Modul model + tabel | `src/server/models/keluhan.ts` - `Keluhan`; tabel `keluhan` | `simpanKeluhan`, `updateStatusKeluhan`, `tanggapi`, `daftar` |
| C31 | DashboardKelolaRestoranPage | Fungsi view | `src/client/views/kelolaRestoranView.ts` - `dashboardKelolaRestoranPage` | `pilihRestoran` (pencarian & filter), `klikHapusRestoran` |
| C32 | KonfirmasiHapusRestoranPage | Fungsi dialog | `src/client/core/ui.ts` - `konfirmasi`; dipanggil di `kelolaRestoranView.ts` | `setujuiPenghapusan` / `batalHapus` |
| C33 | KelolaDataRestoranController | Kelas controller | `src/server/controllers/kelolaDataRestoranController.ts` - `KelolaDataRestoranController` | `hapusDataRestoran` (`nonaktifkanRelasiMenu` ada di `Restoran.setSoftDelete`), `daftarRestoran` |
| C34 | PencarianRestoPage | Fungsi view | `src/client/views/pencarianView.ts` - `pencarianRestoPage`, `detailRestoranPage` | `renderHalamanPencarian`, `onClickTombolCari` (submit), `onPilihFilter` (chip), `tampilkanDaftarRestoran`, `tampilkanPesanKosong` |
| C35 | PencarianController | Kelas controller | `src/server/controllers/pencarianController.ts` - `PencarianController` | `cariRestoran` (sekaligus `terapkanFilter`), `getDetailRestoran` (`ambilStatusAntrean` + `ambilPreviewMenu`) |
| C36 | VerifikasiRestoranPage | Fungsi view | `src/client/views/mitraView.ts` - `verifikasiRestoranPage` | `tampilkanDetailBerkas`, `renderStatusVerifikasi`, membuka dokumen |
| C37 | RegistrasiRestoPage | Fungsi view | `src/client/views/mitraView.ts` - `registrasiRestoPage` | `renderFormRegistrasi`, `onSubmitRegistrasi` (multipart), status pengajuan menunggu/ditolak |
| C38 | RegistrasiPage | Fungsi view | `src/client/views/akunView.ts` - `registrasiPage` | `renderFormRegistrasi`, `onSubmitRegister` |
| C39 | LoginPage | Fungsi view | `src/client/views/akunView.ts` - `loginPage` | `renderFormLogin`, `onSubmitLogin` |
| C40 | KeluhanFormPage | Fungsi view | `src/client/views/keluhanView.ts` - `keluhanFormPage` | `renderFormKeluhan`, `onSubmitKeluhan`, riwayat keluhan beserta tanggapan |
| C41 | KeluhanController | Kelas controller | `src/server/controllers/keluhanController.ts` - `KeluhanController` | `kirimKeluhan`, `tampilkanKeluhan`, `detailKeluhan`, `tanggapiKeluhan` |
| C42 | KeluhanDashboardPage | Fungsi view | `src/client/views/keluhanView.ts` - `keluhanDashboardPage` | `displayKeluhanList`, `showDetailKeluhan` (dialog + form tanggapan) |
| - | PemesananController (DPPL 2.3) | Kelas controller | `src/server/controllers/pemesananController.ts` - `PemesananController` | Komponen DPPL 2.3 tanpa ID kelas di Tabel 4.1: `buatPesanan` (validasi stok, kuota, meja, booking), `getSlotBooking`, `getPesanan`, `getTiket` |
| - | PaymentGatewayAdapter (DPPL 2.3) | Interface + kelas adapter | `src/server/adapters/paymentGatewayAdapter.ts` - `PaymentGatewayAdapter`; `src/server/sandbox-pg/sandboxGateway.ts` - `SandboxPaymentGateway`; `src/server/sandbox-pg/routes.ts`; `src/client/pg/checkout.ts` | Lihat B.1 no. 3 |
| - | BasisDataPostgreSQL (DPPL 2.3) | Modul adapter + skema | `src/server/db/database.ts`, `src/server/db/schema.sql` | Antarmuka `Database` untuk `pg` (PostgreSQL) dan PGlite |
| - | *(Iterasi 2)* Notifikasi | Model + controller + komponen | `src/server/models/notifikasi.ts`, `src/server/controllers/notifikasiController.ts`, `src/client/views/notifikasiView.ts` | Di luar Tabel 4.1, lihat B.1 no. 17 |
| - | *(Iterasi 2)* Ulasan | Model + controller + komponen | `src/server/models/ulasan.ts`, `src/server/controllers/ulasanController.ts`, `src/client/views/ulasanView.ts` | Di luar Tabel 4.1, lihat B.1 no. 17 |
| - | *(Iterasi 2)* Profil restoran | Model + controller + view | `src/server/models/profilRestoran.ts`, `src/server/controllers/profilRestoranController.ts`, `src/client/views/profilRestoranView.ts` | Di luar Tabel 4.1, lihat B.1 no. 17 |
| - | *(Iterasi 2)* Simulator antrean dummy | Service + controller + komponen | `src/server/services/simulatorAntrean.ts` - `SimulatorAntrean`, `src/server/controllers/simulasiController.ts`, `src/client/views/simulasiView.ts` | Di luar Tabel 4.1, lihat B.1 no. 17 |
| - | *(Iterasi 2)* Detail pesanan | View | `src/client/views/riwayatPesananView.ts` - `detailPesananPage` | Mewujudkan `Pesanan.showOrderDetails` dan `RiwayatTransaksi.getBuktiPembayaran` |
