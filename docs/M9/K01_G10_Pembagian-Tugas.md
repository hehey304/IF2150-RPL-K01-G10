# Pembagian Tugas & Checklist M9 - antri.in

Checklist kerja setiap anggota untuk Tugas 9 (Implementasi). Basis kodenya ada di [`src/`](../../src) (lihat [`src/README.md`](../../src/README.md)). Daftar lengkap file yang di-push setiap anggota beserta urutannya ada di [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md). Centang (`- [x]`) setiap butir yang sudah selesai, lalu commit perubahan file ini.

| Anggota | Bagian | Use case |
| :--- | :--- | :--- |
| Chatima Anandakhorita (Atim) | Pencarian restoran, pendaftaran & verifikasi mitra | UC01, UC04, UC05 |
| Bayu Palamarta Wirawan | Pembelian & riwayat pesanan, login/logout & kata sandi, database & ERD | UC02 (berdua), UC10, UC11, UC12, Database |
| *[belum ditentukan]* | Pembayaran (partner Bayu), simulator antrean dummy | UC02 |
| Muhammad Nur Fikri Hariyawan | Antrean & pengaturan kuota | UC03, UC06, UC07, UC09 |
| Muhammad Fauzi Muharam | Menu & stok, profil restoran, notifikasi, fondasi & penyatuan | UC08 |
| Athallah Nanda Andita | Keluhan, penanggapan, hapus restoran, ulasan & rating | UC13, UC14, UC15 |

> **Iterasi 2:** semua butir "Pengembangan / perbaikan" di bawah sudah diimplementasikan di branch referensi (✅). Ditambah fitur baru berikut: notifikasi (Fauzi), ulasan & rating (Athallah), dan simulator antrean dummy (partner UC02). Tugas setiap anggota sekarang: **memahami, menguji, mempresentasikan, lalu mem-push** file miliknya sesuai [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md). Silakan tambahkan pengembangan lanjutan sendiri bila sempat.

---

## 0. Untuk semua anggota

Lakukan sekali di awal:
- [ ] Clone repo, jalankan `cd src && npm install && npm start`, buka http://localhost:3000
- [ ] Jalankan `npm test` dan pastikan 68 test lulus
- [ ] Coba aplikasi dengan akun uji untuk peran yang terkait bagianmu (`src/README.md` bagian 5)
- [ ] Baca file-file milik bagianmu (daftar per orang di bawah) sampai paham alurnya dari View → Controller → Model → tabel

Untuk setiap pekerjaan (aturan M9 A.6):
- [ ] Buat **GitHub Issue** untuk tugasmu, *assign* ke dirimu sendiri
- [ ] Kerjakan di branch `feat/<nama-fitur>` atau `fix/<nama-bug>` dari `main` terbaru, jangan langsung di `main`
- [ ] Commit dengan format semantic, misalnya `feat(pencarian): tambah filter lokasi`
- [ ] Jalankan `npm run typecheck` dan `npm test` sebelum push
- [ ] Buka **Pull Request** ke `main` berisi deskripsi, tangkapan layar, dan `Closes #<issue>`
- [ ] Minta **minimal 1 anggota lain** me-review PR-mu
- [ ] **Review minimal 1 PR** milik anggota lain dan beri komentar atau approve
- [ ] Catat penggunaan AI di [`docs/K01_G10_AI-Usage.md`](../K01_G10_AI-Usage.md)
- [ ] Isi logbook M9 di [`docs/K01_G10_Logbook.md`](../K01_G10_Logbook.md)
- [ ] Isi baris dirimu di laporan [B.4 Kontribusi Anggota](K01_G10_Implementasi.md#b4-kontribusi-anggota)

---

## 1. Chatima Anandakhorita (Atim): UC01, UC04, UC05

**File milikmu:** lihat [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)

**Uji manual (skenario SKPL)**
- [ ] UC01 normal: cari "bakso", "geprek" (nama menu), dan pakai chip kategori & "Rating 4.5+"
- [ ] UC01 alt 1: kata kunci tidak ditemukan → muncul "Restoran tidak ditemukan" dan saran restoran viral
- [ ] UC04 normal: login `mitrabaru@antri.in`, isi formulir lengkap + unggah NIB & izin usaha (PDF/JPG) → status "Menunggu verifikasi"
- [ ] UC04 alt 1: kirim formulir kosong atau unggah file `.zip`/>5 MB → kolom bermasalah ditandai merah
- [ ] UC05 normal: login admin, setujui pengajuan → restoran muncul di beranda, email tercatat di konsol server
- [ ] UC05 alt 1: tolak tanpa alasan (harus ditolak), lalu tolak dengan alasan → akun mitra melihat alasan dan bisa mengajukan ulang

**Uji manual iterasi 2**
- [ ] Beranda → pilih Area "Dago" → hanya restoran di Dago
- [ ] Daftar mitra dengan foto restoran → setelah disetujui, foto tampil di kartu & banner restoran
- [ ] Verifikasi mitra → chip filter Menunggu/Disetujui/Ditolak

**Pengembangan / perbaikan (pilih minimal 1 per UC)**
- [x] UC01: tambahkan filter **lokasi/area**. API sudah mendukung `?lokasi=`, tapi belum ada di UI I-05 ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC01: tampilkan **foto restoran** dari pengajuan mitra pada kartu & banner (saat ini masih gradien + ikon) ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC05: tambahkan filter status (Menunggu/Disetujui/Ditolak) pada daftar pengajuan I-18 ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*

**Pengujian & laporan**
- [ ] Tambah test di `tests/pencarian.test.ts` / `tests/mitra.test.ts` untuk fitur baru (contoh: filter lokasi)
- [ ] Laporan B.5: periksa baris C02, C12, C13, C34-C37

---

## 2. Bayu Palamarta Wirawan: UC02 (bersama partner), UC10-UC12, Database

**File milikmu:** lihat [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)

**Pembagian UC02 dengan partner (sepakati dulu, contoh):**
- [ ] Bayu: keranjang, mode layanan, booking (I-06, I-07, I-08)
- [ ] Partner: pembayaran & tiket (I-09, I-10)

**Uji manual**
- [ ] UC02 normal: dine-in → bayar → tiket terbit, stok berkurang
- [ ] UC02 alt 1 takeaway, alt 2 booking (pilih tanggal ≤ 7 hari & slot)
- [ ] UC02 alt 3: tambahkan "Es Jeruk" (stok 0) → tidak bisa dipilih. Ubah stok jadi kecil lalu checkout → menu ditandai habis
- [ ] UC02 alt 4: "Simulasikan gagal" dan tunggu timer habis (jalankan dengan `PAYMENT_TIMEOUT_MINUTES=1`)
- [ ] UC02 alt 5: slot booking penuh tidak bisa dipilih (Cilok Gang Senggol: kapasitas 4 meja)
- [ ] UC10: registrasi normal, email/nomor duplikat, kata sandi < 8 / konfirmasi beda
- [ ] UC11: login benar & salah, centang/tidak "Ingat saya"
- [ ] UC12: keluar → batal (sesi tetap), keluar → ya (kembali ke login, token tidak berlaku)
- [ ] Database: jalankan dengan PostgreSQL (`docker compose up -d` + `DATABASE_URL`) dan dengan PGlite

**Uji manual iterasi 2**
- [ ] Lupa kata sandi → tautan simulasi → atur ulang → login dengan kata sandi baru
- [ ] Profil → Ubah profil (nomor telepon duplikat ditolak) dan Keamanan akun (sesi di browser lain otomatis keluar)
- [ ] Profil → Detail pesanan → bukti pembayaran → Cetak bukti
- [ ] Buka `docs/M9/K01_G10_ERD.md` di GitHub dan cocokkan dengan `schema.sql`

**Pengembangan / perbaikan**
- [x] UC10-UC12: implementasikan **ganti kata sandi** ("Keamanan akun" di I-03, saat ini hanya pesan "belum tersedia") ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC10-UC12 (opsional): **ubah profil** (nama & nomor telepon) ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC02: halaman/riwayat pesanan yang menampilkan bukti pembayaran (`RiwayatTransaksi.getBuktiPembayaran`) ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] Database: buat **ERD** dari `schema.sql` (simpan di `docs/M9/assets/`) dan tautkan dari `src/README.md` bagian 8 ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*

**Pengujian & laporan**
- [ ] Jalankan test di PostgreSQL: `TEST_DATABASE_URL=... npm run test:pg` (pakai database khusus test karena isinya dihapus)
- [ ] Tambah test untuk ganti kata sandi di `tests/autentikasi.test.ts`
- [ ] Laporan B.1: periksa baris no. 1, 3, 5, 6, 12. Laporan B.5: periksa C01, C05-C09, C25, C26-C29, C38, C39 dan baris BasisDataPostgreSQL

---

## 3. *[Partner UC02, belum ditentukan]*: UC02

**Uji manual iterasi 2**
- [ ] AntriPay Sandbox: e-wallet (QR + simulator Bayar/Tolak), VA (nominal harus tepat), kartu uji `4811 1111 1111 1114` + OTP `112233`, kartu `4911…` ditolak
- [ ] Ganti metode, batalkan pesanan, dan biarkan waktu habis → transaksi di AntriPay ikut batal/kedaluwarsa
- [ ] Dashboard `bakso@antri.in` → Simulasi antrean dummy → mode "Pelanggan dummy" → pesanan dummy masuk tiap 15 detik
- [ ] Mode "Otomatis penuh" → antrean juga dilayani otomatis; beranda pelanggan menunjukkan antrean restoran lain bergerak
- [ ] Jalankan dengan `SIMULASI_ANTREAN=false` → simulator berhenti, tombol "+ Tambah 1 pelanggan dummy" tetap jalan

- [ ] Sepakati pembagian UC02 dengan Bayu (lihat bagian 2)
- [ ] Jalankan uji manual UC02 di bagian 2 untuk bagian yang menjadi tanggung jawabmu
- [x] Pengembangan (contoh): tampilkan instruksi pembayaran berbeda per metode (QR untuk e-wallet, nomor VA yang bisa disalin) ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [ ] Tambah test pembayaran di `tests/pembayaran.test.ts` (contoh: ganti metode pembayaran membatalkan tagihan lama)
- [ ] Pahami & presentasikan simulator antrean dummy (`server/services/simulatorAntrean.ts`)
- [ ] Laporan B.5: periksa C06-C09 dan baris simulator

---

## 4. Muhammad Nur Fikri Hariyawan: UC03, UC06, UC07, UC09

**File milikmu:** lihat [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)

**Uji manual** (buka 2 jendela browser: pelanggan & `bakso@antri.in`)
- [ ] UC03: status antrean pelanggan berubah sendiri saat restoran melakukan dequeue (tanpa reload), dan muncul notifikasi "Giliranmu"
- [ ] UC06 normal & alt 1: dequeue → konfirmasi "Ya" / "Batal"
- [ ] UC06 alt 2: jalankan dengan `AUTO_DEQUEUE_MINUTES=1` → pelanggan terdepan dilewati otomatis
- [ ] UC07 normal: ubah kuota & meja. Alt 1: isi angka negatif/huruf. Alt 2: toggle "Tutup antrean sementara" → beranda menampilkan "Antrean ditutup"
- [ ] UC09 normal: pesanan baru muncul otomatis di dashboard. Alt 1: login `martabak@antri.in` → "Belum ada antrean saat ini"

**Uji manual iterasi 2**
- [ ] Dashboard → "Mulai siapkan" → layar status pelanggan menampilkan langkah "Sedang disiapkan"
- [ ] Kuota → tutup sementara → buka lagi → nilai kuota masih sama
- [ ] Layani beberapa antrean → kartu status antrean menampilkan "± N mnt/antrean" sesuai waktu layanan nyata

**Pengembangan / perbaikan**
- [x] UC09: status "Disiapkan" saat ini hanya tebakan dari estimasi. Tambahkan tombol **"Mulai siapkan"** agar restoran bisa mengubah status secara nyata ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC07: saat antrean dibuka kembali, kuota sebelumnya hilang (diganti 50). Simpan kuota terakhir sebelum ditutup ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC03: estimasi waktu tunggu memakai angka tetap 3 menit per antrean. Pertimbangkan rata-rata waktu layanan nyata ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*

**Pengujian & laporan**
- [ ] Tambah test untuk perubahan yang dibuat
- [ ] Jalankan ulang `npm run profile` dan perbarui angka di laporan **B.2.1** dengan hasil di laptopmu (kamu pemilik bagian profiling)
- [ ] Laporan B.5: periksa C04, C09-C11, C16-C22

---

## 5. Muhammad Fauzi Muharam: UC08 (+ koordinasi repo)

**File milikmu:** lihat [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)

**Uji manual**
- [ ] UC08 normal: ubah info menu lewat ikon edit, lalu cek perubahan di halaman restoran pelanggan
- [ ] UC08 alt 1: tambah menu baru (coba juga input tidak valid: harga < 500, stok huruf)
- [ ] UC08 alt 2: hapus menu → hilang dari halaman pelanggan
- [ ] UC08 alt 3: ubah stok jadi 0 → badge "Habis" muncul di halaman pelanggan tanpa reload

**Uji manual iterasi 2**
- [ ] Lonceng notifikasi (pelanggan, restoran, admin): pesanan baru, giliran dipanggil, tanggapan keluhan, hasil verifikasi mitra
- [ ] Profil Restoran → ubah jam buka (format salah ditolak) & foto → tampil di beranda pelanggan
- [ ] Menu & stok → klik gambar kecil untuk unggah foto menu → tampil di halaman restoran

**Pengembangan / perbaikan**
- [x] Halaman **Profil Restoran** (menu sidebar I-14-01 saat ini mengarah ke profil akun). Buat halaman untuk mengubah deskripsi, alamat, dan jam buka ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] (opsional) Unggah foto menu ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*

**Pengujian & laporan**
- [ ] Tambah test untuk fitur Profil Restoran
- [ ] Laporan B.5: periksa C03, C23, C24

**Koordinasi (pemilik repo)**
- [ ] **Jangan merge PR #1.** Tutup PR #1 dan atur urutan push sesuai [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)
- [ ] Buat GitHub Issues/Projects untuk seluruh butir di file ini, atau minta tiap anggota membuat issue sendiri
- [ ] Pastikan setiap anggota menjadi collaborator repo
- [ ] Isi laporan **B.2** (tautan branch, commit, issues, 2-3 PR representatif beserta reviewer-nya)
- [ ] Setelah semua PR di-merge: `npm test` di `main`, lalu buat release tag **`v9.0`** sebelum deadline (Rabu, 11 November 2026, 21.50 WIB)

---

## 6. Athallah Nanda Andita: UC13, UC14, UC15

**File milikmu:** lihat [`K01_G10_Daftar-File.md`](K01_G10_Daftar-File.md)

**Uji manual**
- [ ] UC13: kirim keluhan dengan/tanpa pesanan terkait. Isi < 10 karakter dan tanpa kategori harus ditolak
- [ ] UC14: admin membuka keluhan → status jadi "Dibaca", kirim tanggapan → pelanggan melihat tanggapan di halaman Keluhan
- [ ] UC15 normal & alt 1: hapus restoran → konfirmasi "Hapus restoran" / "Batal". Cek restoran hilang dari beranda dan antrean pelanggannya dibatalkan

**Uji manual iterasi 2**
- [ ] `pelanggan@antri.in` → notifikasi "Pesanan selesai" → beri ulasan 1-5 bintang → muncul di halaman restoran, rating berubah
- [ ] Keluhan admin → filter "Ditanggapi"; Kelola restoran → filter "Aktif"/"Nonaktif"

**Pengembangan / perbaikan**
- [x] **Bug UC15:** chip "Aktif" di I-20 belum memfilter apa pun (hasilnya sama dengan "Semua"). Perbaiki di `KelolaDataRestoranController.daftarRestoran`, misalnya dengan menampilkan juga restoran nonaktif pada "Semua" ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC14: tambahkan chip filter "Ditanggapi" di I-19 ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*
- [x] UC13: tandai keluhan yang sudah ditanggapi agar mudah terlihat pelanggan, misalnya dengan badge di navbar ✅ *(sudah dibuat di iterasi 2: pahami, uji, lalu push sebagai bagianmu)*

**Pengujian & laporan**
- [ ] Tambah test untuk perbaikan filter UC15
- [ ] Laporan B.5: periksa C14, C30-C33, C40-C42

---

## Ringkasan progres

| Anggota | Uji manual | Pengembangan | Test | Issue/PR/Review | Laporan |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Atim | ☐ | ☐ | ☐ | ☐ | ☐ |
| Bayu | ☐ | ☐ | ☐ | ☐ | ☐ |
| Partner UC02 | ☐ | ☐ | ☐ | ☐ | ☐ |
| Fikri | ☐ | ☐ | ☐ | ☐ | ☐ |
| Fauzi | ☐ | ☐ | ☐ | ☐ | ☐ |
| Athallah | ☐ | ☐ | ☐ | ☐ | ☐ |
