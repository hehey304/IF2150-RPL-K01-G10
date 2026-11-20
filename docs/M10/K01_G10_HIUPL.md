<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 10
<br>
HASIL IMPLEMENTASI DAN UJI PERANGKAT LUNAK (HIUPL)
</h1>
<br>

## *Antri.in*
<img alt="Logo antri.in" src="../M10/assets/Logo_Antri_in.png" width="40%"><br>

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

## Daftar Isi

- [BAB 1: Pendahuluan](#bab-1-pendahuluan)
  - [1.1 Tujuan Penulisan Dokumen](#11-tujuan-penulisan-dokumen)
  - [1.2 Lingkup Masalah](#12-lingkup-masalah)
  - [1.3 Definisi, Istilah, dan Singkatan](#13-definisi-istilah-dan-singkatan)
  - [1.4 Aturan Penomoran](#14-aturan-penomoran)
  - [1.5 Referensi](#15-referensi)
  - [1.6 Deskripsi Umum Dokumen (Ikhtisar)](#16-deskripsi-umum-dokumen-ikhtisar)
- [BAB 2: Deskripsi Umum Perangkat Lunak](#bab-2-deskripsi-umum-perangkat-lunak)
- [BAB 3: Implementasi](#bab-3-implementasi)
  - [3.1 Lingkungan Implementasi](#31-lingkungan-implementasi)
  - [3.2 Implementasi Modul](#32-implementasi-modul)
  - [3.3 Implementasi Antarmuka](#33-implementasi-antarmuka)
  - [3.4 File Lain](#34-file-lain)
- [BAB 4: Hasil Pengujian](#bab-4-hasil-pengujian)
  - [4.1 Strategi dan Kedalaman Pengujian Kelas](#41-strategi-dan-kedalaman-pengujian-kelas)
  - [4.2 Pengujian Unit Kelas](#42-pengujian-unit-kelas)
  - [4.3 Pengujian Integrasi](#43-pengujian-integrasi)
  - [4.4 Pengujian Use Case](#44-pengujian-use-case)
  - [4.5 Pengujian Kebutuhan Non-Fungsional (KNF)](#45-pengujian-kebutuhan-non-fungsional-knf)
  - [4.6 Tangkapan Layar dan Bukti Hasil Pengujian](#46-tangkapan-layar-dan-bukti-hasil-pengujian)
- [BAB 5: Traceability](#bab-5-traceability)

---

## Daftar Perubahan

| Revisi | Deskripsi |
| :--- | :--- |
| *A* | *Deskripsikan perubahan yang dilakukan dari dokumen sebelumnya pada dokumen ini. Jika tidak terdapat perubahan, harap kosongkan tabel.* |
| *B* |  |
| *C* |  |
| ... |  |

---

# BAB 1: Pendahuluan

## 1.1 Tujuan Penulisan Dokumen
Dokumen Hasil Implementasi dan Uji Perangkat Lunak (HIUPL) ini bertujuan untuk melaporkan hasil implementasi dan pengujian perangkat lunak antri.in, yaitu sistem pemesanan makanan viral dengan antrean digital berbasis web. Dokumen ini memuat informasi mengenai lingkungan implementasi, modul/kelas dan antarmuka yang telah diimplementasikan, hasil pengujian unit, integrasi, use case, dan kebutuhan non-fungsional, serta matriks kerunutan yang memetakan kebutuhan fungsional ke implementasi dan pengujiannya. Target pembaca dokumen ini adalah tim pengembang (kelompok Ducklings), asisten dosen, dan dosen mata kuliah IF2150 Rekayasa Perangkat Lunak.

## 1.2 Lingkup Masalah
Fenomena makanan viral memicu antrean panjang berjam-jam yang membebani pelanggan, karena mereka harus datang lebih awal, menunggu di lokasi, dan mengantre tanpa informasi stok menu maupun estimasi waktu tunggu, ditambah proses pemesanan dan pembayaran di kasir yang memakan waktu 2-5 menit per transaksi. Aplikasi pesan-antar seperti GoFood, GrabFood, dan ShopeeFood pun hanya berfokus pada pengantaran dan tidak membatasi kuota transaksi per rentang waktu, sehingga restoran kewalahan saat pesanan online dan pelanggan fisik datang bersamaan. Celah utamanya adalah belum adanya integrasi antara pemantauan antrean real-time, pengaturan slot waktu, serta pemesanan dan pembayaran awal, sehingga antri.in hadir untuk menghapus waktu berpikir di kasir, meratakan kedatangan pelanggan berbasis kuota jam, dan memberi kebebasan bagi konsumen selama menunggu. Dari fenomena tersebut perangkat lunak bernama antri.in yang akan kami kembangkan merupakan sistem pemesanan makanan viral dengan antrean digital berbasis web yang bertujuan agar pengguna tidak perlu mengantri secara langsung pada restoran. Sistem ini memungkinkan pengguna untuk mencari restoran makanan viral, melihat informasi makanan dan restoran, melakukan pemesanan, memantau antrean dan estimasi pesanan akan selesai, serta fitur booking tempat jika pengguna memutuskan untuk dine-in. Cara kerja dari aplikasi berbasis web ini adalah pertama pengguna memilih restoran yang tersedia, kemudian pengguna dapat membaca informasi mengenai makanan yang terdapat di restoran tersebut. Jika sudah, pengguna dapat memilih makanan yang akan dibeli dan lanjut ke proses pembayaran. Ketika pengguna sudah membayar, barulah akan mendapatkan nomor antrian dan estimasi pesanan selesai sehingga pengguna dapat memperkirakan waktu kedatangan.

## 1.3 Definisi, Istilah, dan Singkatan
Semua definisi dan singkatan yang digunakan dalam dokumen ini beserta penjelasannya.

Tabel 1.3. Definisi Istilah dan Singkatan

| Singkatan, Akronim, atau Istilah | Penjelasan |
| :--- | :--- |
| *P/L* | *Singkatan dari Perangkat Lunak, yaitu aplikasi yang memberikan perintah kepada komputer untuk menjalankan tugas tertentu.* |
| *SKPL* | *Singkatan dari Spesifikasi Kebutuhan Perangkat Lunak, yaitu dokumen yang merangkum kriteria-kriteria yang diperlukan untuk membangun aplikasi menjalankan tugasnya.* |
| *DPPL* | *Singkatan dari Deskripsi Perancangan Perangkat Lunak, yaitu dokumen yang menjelaskan rancangan arsitektur, kelas, dan antarmuka P/L.* |
| *HIUPL* | *Singkatan dari Hasil Implementasi dan Uji Perangkat Lunak, yaitu dokumen yang melaporkan hasil implementasi dan pengujian P/L.* |
| *KF* | *Singkatan dari Kebutuhan Fungsional.* |
| *KNF* | *Singkatan dari Kebutuhan Non-Fungsional.* |
| *UC* | *Singkatan dari Use Case.* |
| *TC* | *Singkatan dari Test Case, yaitu satu kasus uji untuk skenario tertentu.* |
| *UT* | *Singkatan dari Unit Test, yaitu test case tingkat kelas/operasi.* |
| *INT* | *Singkatan dari Integration Test, yaitu test case yang menguji interaksi antarkomponen.* |
| *Boundary* | *Kasus uji pada nilai batas masukan, misalnya nilai minimum, maksimum, atau tepat di ambang aturan.* |
| *Coverage* | *Persentase baris/cabang kode yang dieksekusi oleh pengujian.* |
| *...* | *...* |

## 1.4 Aturan Penomoran
Tuliskan aturan penomoran (ID) yang digunakan dalam dokumen ini. Gunakan pola ID yang **sama** dengan yang sudah dipakai pada dokumen-dokumen sebelumnya (SKPL, APL, DPPL), kecuali untuk ID pengujian yang baru diperkenalkan pada dokumen ini.

Tabel 1.4. Aturan Penomoran

| Hal/Bagian | Penomoran | Keterangan |
| :--- | :--- | :--- |
| *Kebutuhan Fungsional* | *KFXX* | *Sesuai SKPL* |
| *Kebutuhan Non-Fungsional* | *KNFXX* | *Sesuai SKPL* |
| *Use Case* | *UCXX* | *Sesuai SKPL* |
| *Kelas* | *CXX* | *Sesuai DPPL* |
| *Antarmuka* | *I-XX* | *Sesuai DPPL* |
| *Test Case Unit* | *CXX-UTYY* | *XX adalah nomor kelas, YY adalah nomor urut test case unit pada kelas tersebut* |
| *Test Case Integrasi* | *INT-TCYY* | *YY adalah nomor urut test case integrasi* |
| *Test Case Use Case* | *UCXX-TCYY* | *XX adalah nomor use case, YY adalah nomor urut test case pada use case tersebut* |
| *Test Case KNF* | *KNFXX-TCYY* | *XX adalah nomor KNF, YY adalah nomor urut test case pada KNF tersebut* |
| *...* | *...* | *...* |

## 1.5 Referensi
Cantumkan daftar buku, panduan, atau dokumentasi lain yang dirujuk dalam pembuatan dokumen dan pengembangan P/L, **minimal dokumen SKPL, APL, DPPL, dan Implementasi (Tugas 9)**. Tambahkan dokumentasi *framework*/*library*/*testing tool* atau referensi lain apabila digunakan.
SKPL.md <br>APL.md <br>DPPL2.md<br>Implementasi.md<br>
Pressman, R. S., _Software Engineering: A Practitioner's Approach_, _8th Edition_, McGraw-Hill, 2015.  
Sommerville, I., _Software Engineering_, _10th Edition_, Pearson, 2016.  
Larman, C., _Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design and Iterative Development_, _3rd Edition_, Prentice Hall, 2004.

## 1.6 Deskripsi Umum Dokumen (Ikhtisar)
Dokumen ini disusun dalam lima bab. Bab 1 berisi pendahuluan yang mencakup tujuan penulisan dokumen, lingkup masalah, definisi dan singkatan, aturan penomoran, referensi, serta ikhtisar dokumen. Bab 2 memaparkan deskripsi umum perangkat lunak antri.in beserta konteks, batasan, dan keterkaitannya dengan sistem eksternal, dilengkapi use case diagram. Bab 3 menjelaskan implementasi, yaitu lingkungan implementasi, daftar modul/kelas, daftar antarmuka, dan file lain yang dihasilkan, serta perubahannya terhadap rancangan pada DPPL. Bab 4 melaporkan hasil pengujian pada tingkat unit, integrasi, use case, dan kebutuhan non-fungsional beserta buktinya. Bab 5 menyajikan matriks kerunutan (traceability) yang memetakan KF, KNF, use case, kelas, file implementasi, dan test case.
<br>

---

# BAB 2: Deskripsi Umum Perangkat Lunak

Bagian ini diisi dengan *System Overview*, dalam bentuk gambar dan narasi yang memberikan gambaran tentang aplikasi dan konteksnya. **Batasan dan keterkaitan** antara sistem yang dibangun dengan sistem lain di luarnya harus jelas. Deskripsi umum sistem perlu dilengkapi dengan pemodelan kasus yang dihadapi, seperti *use case diagram*. Berikan narasi yang jelas untuk setiap gambar yang ditampilkan.

Bagian ini dapat menyalin atau meringkas dari dokumen SKPL atau DPPL.

## Gambaran Sistem

antri.in adalah aplikasi berbasis web untuk pemesanan makanan viral dengan antrean digital. Pelanggan tidak perlu mengantre secara fisik di restoran. Pelanggan mencari restoran viral, melihat menu dan status antrean, memesan (dine-in, takeaway/pre-order, atau booking tempat), membayar secara digital, lalu menerima nomor antrean beserta estimasi waktu tunggu. Nomor antrean hanya diterbitkan setelah pembayaran lunas.

Sistem melayani tiga aktor dengan hak akses berbeda:

- **Pelanggan**: mencari restoran, memesan dan membayar, memantau status antrean, serta menyampaikan keluhan.
- **Restoran**: mendaftar sebagai mitra, mengelola antrean (dequeue), kuota antrean dan meja, serta menu dan stok.
- **Admin**: memverifikasi pendaftaran mitra, menanggapi keluhan, dan menghapus restoran yang melanggar ketentuan.

Registrasi, login, dan logout tersedia untuk ketiga aktor.

## Batasan dan Keterkaitan dengan Sistem Lain

Sistem dirancang dengan arsitektur MVC. Lapisan View berjalan di browser Google Chrome. Lapisan Controller dan Model berjalan pada server aplikasi (localhost, Windows 11) berbasis TypeScript dan REST API. Seluruh data transaksional dan operasional disimpan pada basis data PostgreSQL 15+ yang berada di lingkungan sistem sendiri.

Dua sistem eksternal berada di luar batas tanggung jawab langsung antri.in:

| Sistem Eksternal | Keterkaitan dengan antri.in | Komponen Penghubung |
| :--- | :--- | :--- |
| *Payment Gateway* | antri.in tidak memproses transaksi sendiri. Sistem mengirim permintaan transaksi saat checkout dan menerima status lunas, gagal, atau kedaluwarsa untuk menentukan penerbitan tiket antrean dan ID pesanan. | `PaymentGatewayAdapter` dan `MetodePembayaranController` (C07) |
| *Layanan Email* | Sistem mengirim email hasil verifikasi pendaftaran mitra (diterima atau ditolak) ke alamat email restoran. | `NotifikasiEmail` (C15) |

## Pemodelan Use Case

Sistem memiliki 15 use case (UC01–UC15) yang memetakan KF01–KF21.

Tabel 2.1. Daftar Use Case antri.in

| ID UC | Nama Use Case | Aktor | ID KF |
| :--- | :--- | :--- | :--- |
| UC01 | Mencari dan filter resto | Pelanggan | KF01, KF02 |
| UC02 | Melakukan pemesanan dan pembayaran digital | Pelanggan | KF05–KF13 |
| UC03 | Menampilkan status antrean | Pelanggan | KF03 |
| UC04 | Pendaftaran mitra restoran baru | Restoran | KF14 |
| UC05 | Memverifikasi pendaftaran restoran | Admin | KF15, KF16 |
| UC06 | Mengelola antrean | Restoran | KF04 |
| UC07 | Mengatur kuota antrean dan meja | Restoran | KF17, KF18 |
| UC08 | Mengelola stok dan menu makanan | Restoran | KF07 |
| UC09 | Menampilkan dashboard antrean restoran | Restoran | KF13 |
| UC10 | Registrasi akun | Pelanggan, Restoran, Admin | KF21 |
| UC11 | Login akun | Pelanggan, Restoran, Admin | KF21 |
| UC12 | Keluar akun | Pelanggan, Restoran, Admin | KF21 |
| UC13 | Penyampaian keluhan pelanggan | Pelanggan | KF19 |
| UC14 | Penanggapan keluhan pelanggan | Admin | KF19 |
| UC15 | Penghapusan restoran | Admin | KF20 |

<p align="center">
<img alt="System Overview / Use Case Diagram" src="./assets/UCfinal.drawio.png" width="90%">
</p>
<p align="center">
<i>Gambar 2.1. Use Case Diagram antri.in</i>
</p>

<br>
Sistem Informasi Pemesanan dan Manajemen Antrean Restoran merupakan sistem yang dirancang untuk mempermudah proses pemesanan, pembayaran, serta pengelolaan operasional restoran. Sistem ini melibatkan tiga aktor utama, yaitu Admin, Pelanggan, dan Restoran. Admin bertugas melakukan verifikasi terhadap pendaftaran restoran yang ingin bergabung sebagai mitra baru. Pelanggan dapat melakukan registrasi dan login untuk mengakses layanan sistem, mencari dan memfilter restoran, melakukan pemesanan serta pembayaran, memantau status antrean, dan menyampaikan keluhan apabila terdapat kendala dalam pelayanan. Sementara itu, Restoran dapat melakukan pendaftaran sebagai mitra baru dan setelah memperoleh akses ke sistem, restoran dapat login untuk mengelola antrean, memantau aktivitas antrean melalui dashboard, mengelola stok dan menu makanan, serta mengatur kuota antrean dan meja sesuai kapasitas yang tersedia. Selain itu, restoran juga dapat menanggapi keluhan yang disampaikan oleh pelanggan serta mengajukan penghapusan restoran melalui sistem. Seluruh aktor dapat mengakhiri sesi penggunaan sistem dengan melakukan logout. Dengan adanya sistem ini, diharapkan proses pemesanan dan pengelolaan antrean restoran menjadi lebih efektif, terorganisasi, dan memudahkan interaksi antara pelanggan dengan pihak restoran.
<br>
---

# BAB 3: Implementasi

Bagian ini diisi dengan informasi tentang elemen P/L yang dikembangkan (*executable files*, *configuration files*, *data files*, dan sebagainya) serta perubahannya terhadap rancangan pada DPPL (jika ada).

## 3.1 Lingkungan Implementasi

Tuliskan *hardware* dan *software* yang digunakan untuk implementasi, mencakup *operating system*, bahasa pemrograman beserta versinya, *framework*/*library*, DBMS, *development tools*, dan *version control*. Lingkungan ini harus konsisten dengan **Subbab 2.1 DPPL**; jelaskan jika ada perubahan. Cantumkan juga *framework* dan alat pengujian yang dipakai.

Tabel 3.1. Lingkungan Implementasi

| Aspek | Keterangan |
| :--- | :--- |
| *Hardware* | *Processor: Intel(R) Core(TM) 7 240H (2.50 GHz), RAM	16.0 GB, NVIDIA GeForce RTX 5060* |
| *Operating System* | *Windows 11* |
| *Bahasa Pemrograman* | *Typescript 7.0.2* |
| *Framework/Library* | *Node.js 20 LTS, Express 4.22.3, bcryptjs 3.0.3* |
| *DBMS* | *PostgreSQL 15+* |
| *Development Tools* | *Visual Studio Code, GitHub* |
| *Testing Tools* | *`node:test` (`npm test`, `npm run test:pg` untuk PostgreSQL), `npm run profile` (`performance.now()` dan `EXPLAIN ANALYZE`), middleware `Server-Timing` untuk waktu respons API, [isi: Chrome DevTools dan alat coverage yang dipakai]* |

## 3.2 Implementasi Modul

Daftar modul/kelas yang **TELAH** diimplementasikan. Gunakan nama dan ID kelas yang sama dengan DPPL, dan konsisten dengan Tabel B.5 pada dokumen Implementasi (Tugas 9).

Tabel 3.2. Implementasi Modul

| No | ID Kelas | Nama Modul/Kelas | Nama File Fisik | Nama File Executable |
| :--- | :--- | :--- | :--- | :--- |
| 1 | C01 | Pelanggan | `src/server/models/akun.ts` | - |
| 2 | C02 | Restoran | `src/server/models/restoran.ts` | - |
| 3 | C03 | Menu | `src/server/models/menu.ts` | - |
| 4 | C04 | Antrean | `src/server/models/antrean.ts` | - |
| 5 | C05 | Keranjang | `src/client/models/keranjang.ts` | - |
| 6 | C06 | Pesanan | `src/server/models/pesanan.ts` | - |
| 7 | C07 | MetodePembayaranController | `src/server/controllers/metodePembayaranController.ts`, `src/server/models/pembayaran.ts` | - |
| 8 | C08 | RiwayatTransaksi | `src/server/models/pembayaran.ts` | - |
| 9 | C09 | TiketAntrean | `src/server/models/antrean.ts` | - |
| 10 | C10 | PemantauAntreanController | `src/server/controllers/pemantauAntreanController.ts`, `src/server/realtime/eventBus.ts` | - |
| 11 | C11 | HalamanStatusAntrean | `src/client/views/statusAntreanView.ts` | - |
| 12 | C12 | PengajuanMitraController | `src/server/controllers/pengajuanMitraController.ts` | - |
| 13 | C13 | DokumenVerifikasi | `src/server/models/mitra.ts` | - |
| 14 | C14 | Admin | `src/server/models/akun.ts` | - |
| 15 | C15 | NotifikasiEmail | `src/server/adapters/notifikasiEmail.ts` | - |
| 16 | C16 | KelolaAntreanController | `src/server/controllers/kelolaAntreanController.ts` | - |
| 17 | C17 | KonfirmasiDequeuePage | `src/client/core/ui.ts` (`konfirmasi`) | - |
| 18 | C18 | KelolaAntreanPage | `src/client/views/kelolaAntreanView.ts` | - |
| 19 | C19 | DashboardAntreanPage | `src/client/views/kelolaAntreanView.ts` | - |
| 20 | C20 | Kuota | `src/server/models/kuota.ts` | - |
| 21 | C21 | PengaturanKuotaController | `src/server/controllers/pengaturanKuotaController.ts` | - |
| 22 | C22 | PengaturanKuotaPage | `src/client/views/pengaturanKuotaView.ts` | - |
| 23 | C23 | PengaturanMenuPage | `src/client/views/pengaturanMenuView.ts` | - |
| 24 | C24 | KelolaMenuController | `src/server/controllers/kelolaMenuController.ts` | - |
| 25 | C25 | Pengguna | `src/server/models/akun.ts` | - |
| 26 | C26 | HalamanProfilPage | `src/client/views/akunView.ts` | - |
| 27 | C27 | KonfirmasiLogoutPage | `src/client/core/ui.ts` (`konfirmasi`) | - |
| 28 | C28 | AutentikasiController | `src/server/controllers/autentikasiController.ts` | - |
| 29 | C29 | SesiPengguna | `src/server/models/akun.ts`, `src/server/middleware/auth.ts` | - |
| 30 | C30 | Keluhan | `src/server/models/keluhan.ts` | - |
| 31 | C31 | DashboardKelolaRestoranPage | `src/client/views/kelolaRestoranView.ts` | - |
| 32 | C32 | KonfirmasiHapusRestoranPage | `src/client/core/ui.ts` (`konfirmasi`) | - |
| 33 | C33 | KelolaDataRestoranController | `src/server/controllers/kelolaDataRestoranController.ts` | - |
| 34 | C34 | PencarianRestoPage | `src/client/views/pencarianView.ts` | - |
| 35 | C35 | PencarianController | `src/server/controllers/pencarianController.ts` | - |
| 36 | C36 | VerifikasiRestoranPage | `src/client/views/mitraView.ts` | - |
| 37 | C37 | RegistrasiRestoPage | `src/client/views/mitraView.ts` | - |
| 38 | C38 | RegistrasiPage | `src/client/views/akunView.ts` | - |
| 39 | C39 | LoginPage | `src/client/views/akunView.ts` | - |
| 40 | C40 | KeluhanFormPage | `src/client/views/keluhanView.ts` | - |
| 41 | C41 | KeluhanController | `src/server/controllers/keluhanController.ts` | - |
| 42 | C42 | KeluhanDashboardPage | `src/client/views/keluhanView.ts` | - |

## 3.3 Implementasi Antarmuka

Daftar antarmuka yang telah diimplementasikan. Gunakan ID dan nama layar yang sama dengan ID dan nama layar pada tugas DPPL.

Tabel 3.3. Implementasi Antarmuka

| No | ID Antarmuka | Nama Antarmuka | Nama File Fisik | Nama File Executable |
| :--- | :--- | :--- | :--- | :--- |
| 1 | I-01 | Registrasi Akun | `src/client/views/akunView.ts` (`registrasiPage`) | `src/public/index.html` |
| 2 | I-02 | Login | `src/client/views/akunView.ts` (`loginPage`) | `src/public/index.html` |
| 3 | I-03 | Profil Akun | `src/client/views/akunView.ts` (`halamanProfilPage`) | `src/public/index.html` |
| 4 | I-04 | Dialog Konfirmasi Keluar | `src/client/core/ui.ts` (`konfirmasi`), dipanggil dari `akunView.ts` | `src/public/index.html` |
| 5 | I-05 | Beranda & Pencarian Restoran | `src/client/views/pencarianView.ts` (`pencarianRestoPage`), `src/client/views/komponen.ts` | `src/public/index.html` |
| 6 | I-06 | Detail Restoran & Menu | `src/client/views/pencarianView.ts` (`detailRestoranPage`) | `src/public/index.html` |
| 7 | I-07 | Keranjang & Mode Layanan | `src/client/views/pemesananView.ts` | `src/public/index.html` |
| 8 | I-08 | Pilih Jadwal Booking | `src/client/views/pemesananView.ts` | `src/public/index.html` |
| 9 | I-09 | Pembayaran | `src/client/views/pembayaranView.ts` | `src/public/index.html` |
| 10 | I-10 | Tiket Antrean | `src/client/views/pembayaranView.ts` (`tiketPage`) | `src/public/index.html` |
| 11 | I-11 | Status Antrean | `src/client/views/statusAntreanView.ts` (`halamanStatusAntrean`) | `src/public/index.html` |
| 12 | I-12 | Formulir Keluhan | `src/client/views/keluhanView.ts` (`keluhanFormPage`) | `src/public/index.html` |
| 13 | I-13 | Pendaftaran Mitra | `src/client/views/mitraView.ts` (`registrasiRestoPage`) | `src/public/index.html` |
| 14 | I-14 | Dashboard & Kelola Antrean | `src/client/views/kelolaAntreanView.ts` (`dashboardAntreanPage`) | `src/public/index.html` |
| 15 | I-15 | Dialog Konfirmasi Dequeue | `src/client/core/ui.ts` (`konfirmasi`), dipanggil dari `kelolaAntreanView.ts` | `src/public/index.html` |
| 16 | I-16 | Pengaturan Kuota & Meja | `src/client/views/pengaturanKuotaView.ts` | `src/public/index.html` |
| 17 | I-17 | Pengaturan Menu & Stok | `src/client/views/pengaturanMenuView.ts` | `src/public/index.html` |
| 18 | I-18 | Verifikasi Pengajuan Mitra | `src/client/views/mitraView.ts` (`verifikasiRestoranPage`) | `src/public/index.html` |
| 19 | I-19 | Daftar Keluhan | `src/client/views/keluhanView.ts` (`keluhanDashboardPage`) | `src/public/index.html` |
| 20 | I-20 | Kelola Restoran Mitra | `src/client/views/kelolaRestoranView.ts` (`dashboardKelolaRestoranPage`) | `src/public/index.html` |
| 21 | I-21 | Dialog Konfirmasi Hapus Restoran | `src/client/core/ui.ts` (`konfirmasi`), dipanggil dari `kelolaRestoranView.ts` | `src/public/index.html` |

## 3.4 File Lain

Daftar file lain yang dibuat selain file kelas dan antarmuka, misalnya file *utility*, *configuration*, *database schema/seed*, *file test*, atau *data*.

Tabel 3.4. File Lain

| No | Nama File | Keterangan |
| :--- | :--- | :--- |
| 1 | `src/package.json`, `src/package-lock.json` | Dependensi dan skrip npm (`start`, `dev`, `test`, `test:pg`, `profile`) |
| 2 | `src/tsconfig.json`, `src/tsconfig.client.json` | Konfigurasi TypeScript untuk server/test dan klien |
| 3 | `src/.env.example`, `src/.gitignore` | Contoh environment variable tanpa nilai rahasia, dan daftar berkas yang tidak di-commit (`node_modules/`, `data/`, `uploads/`, `.env`, `public/js/`) |
| 4 | `src/server/config.ts` | Konfigurasi aturan bisnis (timeout pembayaran, dequeue otomatis, kuota, biaya layanan) |
| 5 | `src/server/context.ts` | Tipe dependensi bersama controller dan pengguna yang login |
| 6 | `src/server/utils/errors.ts`, `ids.ts`, `validasi.ts`, `unggah.ts` | Utilitas error HTTP, pembuat ID dan nomor antrean, validasi umum, unggah gambar |
| 7 | `src/server/middleware/auth.ts`, `errorHandler.ts`, `timing.ts` | Validasi token dan peran, penanganan error, header `Server-Timing` |
| 8 | `src/server/routes/*.ts` (`util`, `autentikasi`, `pencarian`, `menu`, `pemesanan`, `pembayaran`, `antrean`, `mitra`, `keluhan`, `ulasan`, `notifikasi`, `profilRestoran`, `simulasi`) | Definisi endpoint REST API per modul |
| 9 | `src/server/db/schema.sql` | Skema basis data (17 tabel) dan indeks |
| 10 | `src/server/db/seed.ts`, `src/server/db/seed-cli.ts` | Data contoh fiktif dan akun uji (`npm run seed`) |
| 11 | `src/docker-compose.yml` | PostgreSQL 16 lokal (opsional) |
| 12 | `src/client/core/html.ts`, `api.ts`, `konfigurasi.ts`, `session.ts` | Template HTML aman, pemanggil REST dan SSE, konfigurasi klien, penyimpanan token |
| 13 | `src/client/views/layout.ts` | Navbar pelanggan dan sidebar restoran/admin |
| 14 | `src/public/css/style.css`, `src/public/img/logo.png`, `src/public/img/favicon.svg` | Gaya tampilan dan aset gambar |
| 15 | `src/scripts/profile-dashboard.ts` | Skrip profiling dashboard antrean (`npm run profile`) |
| 16 | `src/tests/helpers.ts` | Helper pengujian bersama (aplikasi uji, login) |
| 17 | `src/tests/autentikasi.test.ts` | Test UC10–UC12 |
| 18 | `src/tests/pencarian.test.ts` | Test UC01 |
| 19 | `src/tests/pemesanan.test.ts`, `src/tests/keranjang.test.ts` | Test UC02 bagian pemesanan dan unit test `Keranjang` |
| 20 | `src/tests/pembayaran.test.ts` | Test pembayaran dan AntriPay Sandbox |
| 21 | `src/tests/antrean.test.ts` | Test UC03, UC06, UC07, UC09 |
| 22 | `src/tests/menu.test.ts` | Test UC08 |
| 23 | `src/tests/mitra.test.ts` | Test UC04, UC05 |
| 24 | `src/tests/keluhan.test.ts` | Test UC13–UC15 |
| 25 | `src/tests/ulasan.test.ts`, `notifikasi.test.ts`, `profilRestoran.test.ts`, `simulasi.test.ts` | Test fitur tambahan |
| 26 | `src/tests/api.test.ts` | Test hak akses REST API |

<br>

---

# BAB 4: Hasil Pengujian

Bab ini melaporkan hasil pengujian P/L pada level unit, integrasi, dan sistem. Pengujian dilakukan pada tag release terakhir Tugas 9. Hasil aktual diisi berdasarkan pengamatan saat pengujian. Kesimpulan diisi `Pass` atau `Fail`, dan untuk `Fail` dilengkapi penyebab serta usulan perbaikan.

## 4.1 Strategi dan Kedalaman Pengujian Kelas

Setiap kelas perancangan pada Tabel 4.1 DPPL diklasifikasikan ke dalam tiga tingkat kedalaman pengujian. Tingkat **Mendalam** diberikan pada kelas yang memuat logika bisnis, perhitungan, validasi, aturan status, algoritma, integrasi eksternal, atau keamanan. Tingkat **Sedang** diberikan pada kelas yang hanya mengoordinasikan atau mendelegasikan proses. Tingkat **Tidak perlu** diberikan pada kelas tanpa logika, seperti *entity/DTO* dan kelas konfigurasi, yang teruji secara tidak langsung melalui test case use case. Seluruh kelas wajib dicantumkan beserta alasan penentuan tingkatnya.

Tabel 4.1.1. Identifikasi Tingkat Pengujian Kelas

| ID Kelas | Nama Kelas | Tingkat | Alasan | Test Case Terkait |
| :--- | :--- | :--- | :--- | :--- |
| C01 | Pelanggan | Sedang | Hanya mendelegasikan `accountRegister()` ke AutentikasiController dan menyimpan profil, serta `getDetails()` berupa pembacaan data | C01-UT01 s.d. C01-UT03 |
| C02 | Restoran | Mendalam | Memuat aturan status aktif (`getDetailRestoran()` hanya restoran aktif), pencarian, `setSoftDelete()`, dan pembersihan data (`purgeData()`) | C02-UT01 s.d. C02-UT13 |
| C03 | Menu | Mendalam | Memuat validasi harga dan stok, `isTersedia()`, `kurangiStok()` yang atomik dan tidak boleh negatif, serta soft delete | C03-UT01 s.d. C03-UT14 |
| C04 | Antrean | Mendalam | Memuat algoritma dequeue, penentuan tiket terdepan, estimasi waktu tunggu (median waktu layanan), dan pembaruan status antrean | C04-UT01 s.d. C04-UT10 |
| C05 | Keranjang | Mendalam | Memuat perhitungan `hitungTotal()` dan aturan tambah/hapus item (jumlah item yang sama digabung) | C05-UT01 s.d. C05-UT11 |
| C06 | Pesanan | Mendalam | Memuat validasi booking (maksimal 7 hari, kapasitas meja per slot), transisi status pesanan, dan pembatalan yang hanya berlaku untuk status tertentu | C06-UT01 s.d. C06-UT15 |
| C07 | MetodePembayaranController | Mendalam | Integrasi eksternal ke Payment Gateway, batas waktu pembayaran, verifikasi lunas, pencegahan double-charge, dan pembatalan saat timeout | C07-UT01 s.d. C07-UT14 |
| C08 | RiwayatTransaksi | Sedang | Hanya mencatat transaksi lunas dan membaca bukti pembayaran, dipanggil oleh MetodePembayaranController | C08-UT01 s.d. C08-UT03 |
| C09 | TiketAntrean | Mendalam | Memuat algoritma nomor urut unik per hari (KNF03), estimasi waktu tunggu, dan aturan status final yang tidak boleh diubah | C09-UT01 s.d. C09-UT09 |
| C10 | PemantauAntreanController | Sedang | Hanya mengoordinasikan pembacaan status antrean dan pengiriman pembaruan lewat Server-Sent Events | C10-UT01 s.d. C10-UT04 |
| C11 | HalamanStatusAntrean | Tidak perlu | Kelas boundary yang hanya menampilkan data status antrean dari server. Teruji lewat UC03 | - |
| C12 | PengajuanMitraController | Mendalam | Memuat validasi kelengkapan data, aturan status pengajuan (hanya status menunggu yang dapat disetujui/ditolak), alasan penolakan wajib, dan pemicu email | C12-UT01 s.d. C12-UT11 |
| C13 | DokumenVerifikasi | Mendalam | Memuat validasi format (PDF/JPG/PNG) dan ukuran maksimal 5 MB | C13-UT01 s.d. C13-UT08 |
| C14 | Admin | Sedang | Hanya mendelegasikan `accountRegister()` ke AutentikasiController. Peninjauan pengajuan, keluhan, dan penghapusan dilakukan lewat controller lain | C14-UT01 s.d. C14-UT02 |
| C15 | NotifikasiEmail | Mendalam | Integrasi eksternal: validasi format email, penentuan subjek, pencatatan status kirim (terkirim/gagal) ke `log_notifikasi` | C15-UT01 s.d. C15-UT05 |
| C16 | KelolaAntreanController | Mendalam | Memuat algoritma dequeue dalam transaksi, pembaruan kapasitas, serta timer dequeue otomatis bagi pelanggan yang tidak hadir | C16-UT01 s.d. C16-UT08 |
| C17 | KonfirmasiDequeuePage | Tidak perlu | Kelas boundary berupa dialog konfirmasi tanpa logika bisnis. Teruji lewat UC06 | - |
| C18 | KelolaAntreanPage | Tidak perlu | Kelas boundary yang hanya menampilkan daftar antrean dan membuka dialog. Teruji lewat UC06 | - |
| C19 | DashboardAntreanPage | Tidak perlu | Kelas boundary yang menampilkan antrean dan memuat ulang data. Teruji lewat UC09 | - |
| C20 | Kuota | Mendalam | Memuat perhitungan kapasitas, aturan antrean tutup bila kapasitas habis atau ditutup manual, serta penyimpanan kuota terakhir | C20-UT01 s.d. C20-UT07 |
| C21 | PengaturanKuotaController | Mendalam | Memuat validasi input kuota dan meja (angka, lebih dari 0) serta penyimpanan yang memicu pembaruan kapasitas | C21-UT01 s.d. C21-UT06 |
| C22 | PengaturanKuotaPage | Tidak perlu | Kelas boundary. Validasi dilakukan ulang oleh C21 di server. Teruji lewat UC07 | - |
| C23 | PengaturanMenuPage | Tidak perlu | Kelas boundary berupa daftar dan formulir menu. Validasi berada di C24. Teruji lewat UC08 | - |
| C24 | KelolaMenuController | Mendalam | Memuat validasi nama, harga, dan stok menu, serta alur tambah, ubah, ubah stok, dan hapus menu | C24-UT01 s.d. C24-UT08 |
| C25 | Pengguna | Mendalam | Aspek keamanan: hash kata sandi, pencocokan kredensial, pengecekan duplikasi, dan pengambilan profil | C25-UT01 s.d. C25-UT07 |
| C26 | HalamanProfilPage | Tidak perlu | Kelas boundary yang hanya memicu dialog logout. Teruji lewat UC12 | - |
| C27 | KonfirmasiLogoutPage | Tidak perlu | Kelas boundary berupa dialog konfirmasi tanpa logika. Teruji lewat UC12 | - |
| C28 | AutentikasiController | Mendalam | Aspek keamanan: validasi registrasi (email, kata sandi minimal 8 karakter, duplikasi), penerbitan token sesi, login, dan logout | C28-UT01 s.d. C28-UT11 |
| C29 | SesiPengguna | Mendalam | Aspek keamanan: validasi token, masa berlaku sesi, dan penonaktifan sesi saat logout | C29-UT01 s.d. C29-UT06 |
| C30 | Keluhan | Mendalam | Memuat aturan status keluhan (BARU, DIBACA, DITANGGAPI) dan penyimpanan keluhan | C30-UT01 s.d. C30-UT05 |
| C31 | DashboardKelolaRestoranPage | Tidak perlu | Kelas boundary berupa daftar, pencarian, dan filter restoran. Teruji lewat UC15 | - |
| C32 | KonfirmasiHapusRestoranPage | Tidak perlu | Kelas boundary berupa dialog konfirmasi. Teruji lewat UC15 | - |
| C33 | KelolaDataRestoranController | Mendalam | Memuat aturan penghapusan dalam satu transaksi: soft delete restoran, penonaktifan menu, dan pembatalan antrean/pesanan aktif | C33-UT01 s.d. C33-UT03 |
| C34 | PencarianRestoPage | Tidak perlu | Kelas boundary yang hanya menerima kata kunci/filter dan menampilkan hasil. Teruji lewat UC01 | - |
| C35 | PencarianController | Mendalam | Memuat algoritma pencarian dan penerapan filter (nama, kategori, lokasi, rating) serta pengambilan status antrean dan pratinjau menu | C35-UT01 s.d. C35-UT09 |
| C36 | VerifikasiRestoranPage | Tidak perlu | Kelas boundary yang menampilkan detail pengajuan dan tombol setujui/tolak. Teruji lewat UC05 | - |
| C37 | RegistrasiRestoPage | Tidak perlu | Kelas boundary berupa formulir pendaftaran mitra. Validasi berada di C12 dan C13. Teruji lewat UC04 | - |
| C38 | RegistrasiPage | Tidak perlu | Kelas boundary berupa formulir registrasi. Validasi berada di C28. Teruji lewat UC10 | - |
| C39 | LoginPage | Tidak perlu | Kelas boundary berupa formulir login. Validasi berada di C28. Teruji lewat UC11 | - |
| C40 | KeluhanFormPage | Tidak perlu | Kelas boundary berupa formulir keluhan. Validasi berada di C41. Teruji lewat UC13 | - |
| C41 | KeluhanController | Mendalam | Memuat validasi isi dan kategori keluhan, pencatatan tanggapan admin, dan pembaruan status | C41-UT01 s.d. C41-UT08 |
| C42 | KeluhanDashboardPage | Tidak perlu | Kelas boundary berupa daftar dan detail keluhan. Teruji lewat UC14 | - |

## 4.2 Pengujian Unit Kelas

Pengujian unit dilakukan pada kelas bertingkat Mendalam dan Sedang. Kelas Mendalam diuji pada seluruh operasi public dengan kasus normal, batas, dan negatif, serta mencapai *coverage* minimal 70%. Kelas Sedang diuji minimal dengan satu kasus normal dan satu kasus gagal pada operasi public utama.

Cara menjalankan unit test: *`npx tsx --test --experimental-test-coverage --test-coverage-include='server/**/*.ts' --test-coverage-include='client/models/keranjang.ts'   tests/*.test.ts`*.

Lokasi file test: *`src/tests/`*.

### 4.2.1 Kelas Pelanggan

**ID Kelas:** C01  
**Nama Kelas:** Pelanggan  
**Tingkat:** Sedang

Tabel 4.2.1. Hasil Pengujian Unit Kelas C01

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C01-UT01 | `accountRegister(data)` | Normal | `autentikasi.test.ts › registrasi, login, dan logout`. Registrasi akun uji lalu login memakai email berhuruf besar. | Akun tersimpan, login berhasil dengan peran PELANGGAN | Akun terbuat dan login berhasil (teruji tidak langsung lewat C28) | Pass |
| C01-UT02 | `accountRegister(data)` | Negatif | `autentikasi.test.ts › email/nomor duplikat dan kata sandi lemah ditolak`. Email sudah terdaftar. | Ditolak status 409 | Ditolak 409 | Pass |
| C01-UT03 | `getDetails()` (`Pelanggan.getByAkun`) | Normal / Negatif | Daftarkan akun lalu baca profilnya; ID akun `USR-tidak-ada`. | Nama dan email sesuai; akun tidak ada menghasilkan `null` | Sesuai | Pass |


### 4.2.2 Kelas Restoran

**ID Kelas:** C02  
**Nama Kelas:** Restoran  
**Tingkat:** Mendalam

Tabel 4.2.2. Hasil Pengujian Unit Kelas C02

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C02-UT01 | `getDetailRestoran(restoranId)` | Normal | `profilRestoran.test.ts › ubah profil memvalidasi jam buka dan alamat`. Ambil detail restoran Bakso. | Detail memuat deskripsi yang baru disimpan | Deskripsi sesuai | Pass |
| C02-UT02 | `getDetailRestoran(restoranId)` | Negatif | `pencarian.test.ts › C35-UT03`. ID `RST-tidak-ada`. Juga `keluhan.test.ts › hapus restoran…` untuk restoran nonaktif. | Galat 404 | 404 pada kedua kasus | Pass |
| C02-UT03 | `getDaftarMenu(restoranId)` | Normal | `menu.test.ts › C03-UT04`. | Hanya menu aktif yang dikembalikan | Semua menu berstatus aktif | Pass |
| C02-UT04 | `Restoran.cari` (dipakai C35) | Normal / Batas | `pencarian.test.ts` (kata kunci menu, rating, lokasi) dan `pencarian.test.ts › C35-UT01, C35-UT02`. | Hasil sesuai filter, kosong bila tidak ada | Sesuai | Pass |
| C02-UT05 | `setSoftDelete()` | Normal | `keluhan.test.ts › hapus restoran menonaktifkan menu dan membatalkan antrean aktif`. | Restoran nonaktif, tidak muncul di detail (404) | Sesuai | Pass |
| C02-UT06 | `ajukanPendaftaran()` dan `accountRegister(idAkun)` | Normal | `mitra.test.ts › ajukan -> tolak -> ajukan ulang -> setujui…`. Setujui membuat restoran tertaut ke akun. | Sesi pengguna memuat `restoranId` dan restoran dapat dicari | Sesuai | Pass |
| C02-UT07 | `getPengaturan(restoranId)` | Normal / Negatif | `antrean.test.ts › C20-UT02`. ID ada dan ID `RST-tidak-ada`. | Data kuota, atau `null` | Sesuai | Pass |
| C02-UT08 | `getAntrean()` (`Antrean.getByRestoran`) | Normal / Negatif | Antrean restoran Bakso; ID `RST-tidak-ada`. | Antrean ada; `null` untuk ID tidak ada | Sesuai | Pass |
| C02-UT09 | `purgeData()` (digabung dalam `setSoftDelete()`) | Normal | Dua pesanan aktif (satu lunas, satu menunggu bayar), lalu `hapusDataRestoran()`. | Menu nonaktif dan stok 0, kuota 0, antrean TUTUP dengan total 0, kedua pesanan DIBATALKAN, pembayaran menunggu GAGAL, `dihapus_pada` terisi | Sesuai | Pass |
| C02-UT10 | `setSoftDelete()` | Normal / Negatif | Panggil `Restoran.setSoftDelete` langsung pada restoran aktif, lalu sekali lagi, dan pada ID tidak ada. | `true` dan restoran tidak tampil; panggilan kedua dan ID tidak ada menghasilkan `false` | Sesuai | Pass |
| C02-UT11 | `getDaftarMenu(restoranId)` | Negatif / Batas | ID `RST-tidak-ada`; lalu restoran Cilok sebelum dan sesudah `hapusDataRestoran()`. | Daftar kosong untuk ID tidak ada; menu aktif ada sebelum, kosong sesudah dihapus | Sesuai | Pass |
| C02-UT12 | `ajukanPendaftaran()` dan `accountRegister(idAkun)` (`Restoran.buat`) | Normal / Negatif | Buat restoran baru; lalu dengan `idAkun` `USR-tidak-ada`; `Restoran.getByAkun` untuk akun tidak ada. | Restoran tersimpan dengan kuota 50 dan antrean BUKA; akun tidak ada ditolak; `getByAkun` menghasilkan `null` | Sesuai | Pass |
| C02-UT13 | `purgeData()` (`setSoftDelete`) | Negatif | `setSoftDelete` pada ID `RST-tidak-ada`; bandingkan jumlah menu aktif sebelum dan sesudah. | `false`; restoran lain tidak berubah | Sesuai | Pass |

Tabel 4.2.2b. Ringkasan Cakupan Kelas C02

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `getDetailRestoran()`, `getMenu()`, `getAntrean()`, `ajukanPendaftaran()`, `getPengaturan()`, `getDaftarMenu()`, `showDashboard()`, `accountRegister()`, `setSoftDelete()`, `purgeData()` |
| Operasi yang diuji | `getDetailRestoran()`, `getDaftarMenu()`, `ajukanPendaftaran()`, `getAntrean()`, `getPengaturan()`, `accountRegister()`, `setSoftDelete()`, `purgeData()` (8 dari 10) |
| ID Algoritma yang tercakup | Algo-009, Algo-011, Algo-012, Algo-014, Algo-016, Algo-017 (perkiraan pemetaan, perlu dicocokkan dengan DPPL) |
| Coverage (wajib ≥ 70%) | `models/restoran.ts`: 98,17% baris / 100% *branch* / 100% fungsi |

### 4.2.3 Kelas Menu

**ID Kelas:** C03  
**Nama Kelas:** Menu  
**Tingkat:** Mendalam

Tabel 4.2.3. Hasil Pengujian Unit Kelas C03

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C03-UT01 | `kurangiStok(jumlah)` | Normal / Batas | Kurangi 1, lalu kurangi sisa stok tepat habis. | Keduanya berhasil, stok akhir 0 | Stok 0 | Pass |
| C03-UT02 | `kurangiStok(jumlah)` | Negatif | Kurangi stok + 1. | Mengembalikan `false`, stok tidak berubah dan tidak negatif | `false`, stok tetap | Pass |
| C03-UT03 | `isTersedia(jumlah)` | Batas / Negatif | Stok 5 dengan jumlah 5, 6, 0, dan menu nonaktif. | `true`, `false`, `false`, `false` | Sesuai | Pass |
| C03-UT04 | `getInfoMenu()` / daftar menu | Normal | Daftar menu restoran Geprek. | Hanya menu aktif | Sesuai | Pass |
| C03-UT05 | `tambahMenu()`, `hapusMenu()` | Normal | `menu.test.ts › tambah, ubah stok, dan hapus menu`. Tambah menu lalu hapus. | Menu muncul lalu hilang dari daftar | Sesuai | Pass |
| C03-UT06 | `updateStok(stokBaru)` | Batas | Sama dengan C03-UT05, stok diubah ke `'0'`. | Stok = 0 | Stok 0 | Pass |
| C03-UT07 | `tambahMenu()` (validasi) | Negatif | Nama `X`, harga `-1`, stok `a`. | Galat 400 pada kolom `harga`, `namaMenu`, `stok` | Ketiga kolom ditolak | Pass |
| C03-UT08 | `updateStok()` lintas restoran | Negatif | `menu.test.ts › restoran lain tidak bisa mengubah menu milik restoran lain`. | Galat 404 | 404 | Pass |
| C03-UT09 | `getInfoMenu()` | Normal / Negatif | Menu ada; ID `MNU-tidak-ada`. | Menu dikembalikan; `null` untuk ID tidak ada | Sesuai | Pass |
| C03-UT10 | `updateInfoMenu()` | Normal / Negatif | Ubah nama, harga 600, stok 3 pada restoran pemilik; coba dari restoran lain. | Perubahan tersimpan; restoran lain mendapat `null` | Sesuai | Pass |
| C03-UT11 | `cekStok()` (digabung dalam `isTersedia()`) | Normal / Batas | Menu nyata dari basis data; jumlah sama dengan stok, lalu stok + 1. | Stok sama diterima; stok + 1 ditolak | Sesuai | Pass |
| C03-UT12 | `hapusMenu()` | Negatif / Batas | Hapus dari restoran lain, ID `MNU-tidak-ada`, pemilik, lalu pemilik sekali lagi. | `false`, `false`, `true`, `false` (menu lain tetap aktif) | Sesuai | Pass |
| C03-UT13 | `tambahMenu()` | Batas / Negatif | Harga `499`; lalu harga `500` dengan stok `0`. | 499 ditolak 400 pada kolom `harga`; 500 dan stok 0 diterima | Sesuai | Pass |
| C03-UT14 | `updateInfoMenu()` | Batas / Negatif | Ubah stok menjadi 0; lalu ubah menu yang sudah dihapus. | Stok 0 tersimpan; menu yang dihapus mendapat `null` | Sesuai | Pass |

Catatan: `cekStok()` digabung dalam `isTersedia()` pada kode (komentar `menu.ts`: `isTersedia() / cekStok()`), dipakai `pemesananController` untuk menolak pesanan melebihi stok.

Tabel 4.2.3b. Ringkasan Cakupan Kelas C03

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `getInfoMenu()`, `cekStok()`, `kurangiStok()`, `tambahMenu()`, `updateStok()`, `updateInfoMenu()`, `isTersedia()`, `hapusMenu()` |
| Operasi yang diuji | `getInfoMenu()`, `kurangiStok()`, `tambahMenu()`, `updateStok()`, `updateInfoMenu()`, `isTersedia()` (juga berperan `cekStok()`), `hapusMenu()` (8 dari 8) |
| ID Algoritma yang tercakup | Algo-019 s.d. Algo-026 sebagian (perlu dicocokkan) |
| Coverage (wajib ≥ 70%) | `models/menu.ts`: 94.59% baris / 100% *branch* / 90.00% fungsi |

### 4.2.4 Kelas Antrean

**ID Kelas:** C04  
**Nama Kelas:** Antrean  
**Tingkat:** Mendalam

Tabel 4.2.4. Hasil Pengujian Unit Kelas C04

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C04-UT01 | `getQueueStatus()` | Normal / Batas | `antrean.test.ts › status antrean dari kuota`. `(0,0)`, `(30,29)`, `(30,30)`. | TUTUP, BUKA, PENUH | Sesuai | Pass |
| C04-UT02 | `getEstimasiWaktu()` | Normal / Negatif | `antrean.test.ts › estimasi waktu tunggu`. `(6,3)` dan `(-1,3)`. | 18 dan 0 | Sesuai | Pass |
| C04-UT03 | `getEstimasiWaktu()` (median) | Batas | `antrean.test.ts › menit per antrean dari median jeda…`. Data kurang, normal, dan terlalu besar. | 3 (bawaan), 5, 15 (maksimum) | Sesuai | Pass |
| C04-UT04 | `dequeueCustomer()`, `updateStatus()` | Normal | `antrean.test.ts › dequeue memanggil pelanggan berikutnya…`. | Antrean aktif berkurang 1, `nomorDilayani`=1, sisa dan estimasi pelanggan berkurang | Sesuai | Pass |
| C04-UT05 | `getFrontCustomer()` | Normal | Pada test yang sama, `daftar[0]` berstatus DIPANGGIL. | Pelanggan terdepan DIPANGGIL | Sesuai | Pass |
| C04-UT06 | `updateStatus()` + notifikasi | Normal | `antrean.test.ts › pelanggan yang dipanggil mendapat notifikasi "Giliranmu"`. | Notifikasi berjudul "Giliranmu…" | Ada | Pass |
| C04-UT07 | `dequeueCustomer()` | Negatif | `antrean.test.ts › restoran tanpa antrean tidak dapat dequeue`. | Galat "Belum ada antrean" | Sesuai | Pass |
| C04-UT08 | `getDetailAntrean()` | Normal / Negatif | Detail antrean restoran Bakso; ID `RST-tidak-ada`. | Hanya tiket MENUNGGU/DIPANGGIL beserta rincian; daftar kosong untuk ID tidak ada | Sesuai | Pass |
| C04-UT09 | `updateStatus()`, `getFrontCustomer()`, `dequeueCustomer()` | Negatif | Restoran `RST-tidak-ada`; antrean `ANT-tidak-ada`. | `null` untuk ketiganya | Sesuai | Pass |
| C04-UT10 | `dequeueCustomer()` | Batas | Keluarkan tiket sampai tersisa satu, lalu keluarkan tiket terakhir. | Tiket SELESAI; `total_antrean` 0; tidak ada pelanggan terdepan (`null`) | Sesuai | Pass |

Tidak diuji: `getPesananPreOrder`, `updateMenu`.

Tabel 4.2.4b. Ringkasan Cakupan Kelas C04

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `getFrontCustomer()`, `getEstimasiWaktu()`, `getDetailAntrean()`, `updateStatus()`, `dequeueCustomer()`, `getPesananPreOrder()`, `getQueueStatus()`, `updateMenu()` |
| Operasi yang diuji | `getFrontCustomer()`, `getEstimasiWaktu()`, `getDetailAntrean()`, `updateStatus()`, `dequeueCustomer()`, `getQueueStatus()` (6 dari 8) |
| ID Algoritma yang tercakup | Algo-027, Algo-028, Algo-030, Algo-031, Algo-033 (perlu dicocokkan) |
| Coverage (wajib ≥ 70%) | `models/antrean.ts` (bersama C09): 98,18% baris / 89,29% *branch* / 95,45% fungsi |

### 4.2.5 Kelas Keranjang

**ID Kelas:** C05  
**Nama Kelas:** Keranjang  
**Tingkat:** Mendalam

Tabel 4.2.5. Hasil Pengujian Unit Kelas C05

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C05-UT01 | `tambahItem()`, `hitungTotal()` | Normal | `keranjang.test.ts › tambahItem dan hitungTotal`. M1 25.000 x 2 dan M2 6.000 x 3. | Total = 68.000, total item 5 | Sesuai | Pass |
| C05-UT02 | `tambahItem()` | Normal | Item sama ditambah dua kali. | Jumlah digabung = 2 | 2 | Pass |
| C05-UT03 | `tambahItem()` | Batas | `keranjang.test.ts › jumlah per item dibatasi 50…`. Tambah 70. | Jumlah = 50 | 50 | Pass |
| C05-UT04 | `tambahItem()` | Negatif | Tambah dengan jumlah 0. | Melempar galat | Galat dilempar | Pass |
| C05-UT05 | `tambahItem()` | Normal | `keranjang.test.ts › menambah dari restoran lain mengosongkan keranjang`. | Hanya item restoran baru | Sesuai | Pass |
| C05-UT06 | `hapusItem()` / `ubahJumlah(…,0)` | Batas | `keranjang.test.ts › ubahJumlah ke 0 menghapus item…`. | Item hilang, `restoranId` = null | Sesuai | Pass |
| C05-UT07 | Persistensi (penyimpanan) | Normal | `keranjang.test.ts › keranjang tersimpan dan dimuat ulang…`. | Isi, mode BOOKING, dan rombongan terbaca ulang | Sesuai | Pass |
| C05-UT08 | `aturMode()` dan muat data rusak | Negatif | `keranjang.test.ts › aturMode non-booking…; data rusak…`. | Jadwal dihapus, data rusak diabaikan | Sesuai | Pass |
| C05-UT09 | `kosongkanKeranjang()` | Normal | Tambah item lalu kosongkan; muat ulang dari penyimpanan. | Item 0, restoran `null`, penyimpanan ikut kosong | Sesuai | Pass |
| C05-UT10 | `hitungTotal()` | Negatif | Keranjang tanpa item. | Total = 0 | 0 | Pass |
| C05-UT11 | `hapusItem()` | Normal / Negatif | Dua item, hapus satu, lalu hapus ID tidak ada. | Sisa satu item, total 12.000, ID tidak ada diabaikan | Sesuai | Pass |

Seluruh operasi public diuji, termasuk `kosongkanKeranjang()` dan `hitungTotal()` pada keranjang kosong.

Tabel 4.2.5b. Ringkasan Cakupan Kelas C05

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `tambahItem()`, `hapusItem()`, `hitungTotal()`, `kosongkanKeranjang()` |
| Operasi yang diuji | `tambahItem()`, `hapusItem()`, `hitungTotal()`, `kosongkanKeranjang()` (4 dari 4) |
| ID Algoritma yang tercakup | Algo-035, Algo-036, Algo-037 |
| Coverage (wajib ≥ 70%) | `client/models/keranjang.ts`: 90,96% baris / 90,90% *branch* / 92,00% fungsi |

### 4.2.6 Kelas Pesanan

**ID Kelas:** C06  
**Nama Kelas:** Pesanan  
**Tingkat:** Mendalam

Tabel 4.2.6. Hasil Pengujian Unit Kelas C06

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C06-UT01 | `validasiBooking()` | Batas | `pemesanan.test.ts › booking: maksimal 7 hari ke depan`. H+7, H+8, kemarin. | H+7 valid; H+8 dan kemarin ditolak ("maksimal 7 hari") | Sesuai | Pass |
| C06-UT02 | `validasiBooking()` | Negatif | `pemesanan.test.ts › booking: slot hari ini yang sudah lewat…`. Slot lewat, slot tidak terdaftar, rombongan 0, tanggal `besok`. | Ditolak dengan pesan sesuai | Sesuai | Pass |
| C06-UT03 | `validasiBooking()` | Batas | Slot 17:00 pada hari ini (belum lewat). | Valid (`null`) | `null` | Pass |
| C06-UT04 | `buatTagihan()` / pembuatan pesanan | Normal | `pemesanan.test.ts › pesanan lunas menerbitkan tiket dan mengurangi stok`. | Total = harga x 2 + biaya layanan, stok berkurang 2, status DIKONFIRMASI | Sesuai | Pass |
| C06-UT05 | pembuatan pesanan | Negatif | `pemesanan.test.ts › stok habis ditolak…`. Menu stok 0. | 409 dan `menuHabis` memuat menu | Sesuai | Pass |
| C06-UT06 | pembuatan pesanan | Negatif / Normal | `pemesanan.test.ts › antrean ditutup…`. Takeaway pada antrean tutup, lalu booking. | Takeaway ditolak ("ditutup"), booking berhasil | Sesuai | Pass |
| C06-UT07 | `validasiBooking()` (kapasitas meja) | Batas | `pemesanan.test.ts › slot booking penuh ditolak`. 4 booking pada kapasitas 4, lalu ke-5. | Ke-5 ditolak 409, slot `tersedia=false` | Sesuai | Pass |
| C06-UT08 | `getDetailPesanan()` | Negatif | `pemesanan.test.ts › pelanggan lain tidak dapat melihat pesanan`. | 403 | 403 | Pass |
| C06-UT09 | `batalkanPesanan()` | Normal | `pembayaran.test.ts › pembatalan pesanan oleh pelanggan ikut membatalkan transaksi…`. | Transaksi gateway GAGAL | Sesuai | Pass |
| C06-UT10 | `updateStatus()` | Normal | `pembayaran.test.ts › pembayaran gagal membatalkan pesanan`. | Status DIBATALKAN, tiket `null` | Sesuai | Pass |
| C06-UT11 | `batalkanPesanan()` | Negatif | Pesanan yang sudah dibayar dibatalkan pelanggan. | Ditolak 409 ("sudah dibayar") | 409 | Pass |
| C06-UT12 | `batalkanPesanan()` | Negatif | Pesanan tidak ada, dan pesanan milik pelanggan lain. | Ditolak (404/403) | Sesuai | Pass |
| C06-UT13 | `getDetailPesanan()` | Normal / Negatif | Pesanan lunas; lalu ID `PSN-tidak-ada`. | Memuat item, restoran, pembayaran, dan tiket; `null` untuk ID tidak ada | Sesuai | Pass |
| C06-UT14 | `updateStatus()` | Normal / Negatif | Ubah pesanan DIKONFIRMASI ke SELESAI; lalu status `NGAWUR`. | SELESAI tersimpan; status di luar daftar ditolak | Sesuai | Pass |
| C06-UT15 | pembuatan pesanan | Batas | Stok diatur 3; pesan 3, lalu pesan 4. | 3 diterima; 4 ditolak 409 | Sesuai | Pass |

Tidak diuji: `showOrderDetails` (UI).

Tabel 4.2.6b. Ringkasan Cakupan Kelas C06

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `validasiBooking()`, `buatTagihan()`, `batalkanPesanan()`, `updateStatus()`, `getDetailPesanan()`, `showOrderDetails()` |
| Operasi yang diuji | 5 dari 6 (kecuali `showOrderDetails()`) |
| ID Algoritma yang tercakup | Algo-039, Algo-040, Algo-041, Algo-042, Algo-043 |
| Coverage (wajib ≥ 70%) | `models/pesanan.ts`: 97,77% baris / 94,44% branch / 100,00% fungsi; `pemesananController.ts`: 95,21% baris / 76,67% branch / 100.00 % fungsi |

### 4.2.7 Kelas MetodePembayaranController

**ID Kelas:** C07  
**Nama Kelas:** MetodePembayaranController  
**Tingkat:** Mendalam

Tabel 4.2.7. Hasil Pengujian Unit Kelas C07

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C07-UT01 | `buatTagihan()` | Normal | `pembayaran.test.ts › e-wallet: setujui di aplikasi…`. Metode EWALLET. | URL checkout, status MENUNGGU, jumlah = total, QR SVG tersedia | Sesuai | Pass |
| C07-UT02 | `verifikasiPembayaran()` | Normal | Setujui e-wallet lalu verifikasi. | Pesanan DIKONFIRMASI, tiket terbit, status LUNAS | Sesuai | Pass |
| C07-UT03 | `verifikasiPembayaran()` | Batas / Negatif | `pembayaran.test.ts › virtual account: nominal harus tepat`. Total - 1 lalu total. | Total - 1 ditolak 400; total tepat berhasil | Sesuai | Pass |
| C07-UT04 | Kartu (3-D Secure) | Negatif / Normal | `pembayaran.test.ts › kartu: hanya kartu uji, OTP…`. Kartu asli, OTP salah, OTP benar. | Kartu asli ditolak, OTP salah 400, OTP benar LUNAS | Sesuai | Pass |
| C07-UT05 | `verifikasiPembayaran()` | Negatif | Kartu ditolak gateway. | Status GAGAL, pesanan DIBATALKAN | Sesuai | Pass |
| C07-UT06 | `buatTagihan()` (cegah double-charge) | Negatif | `pembayaran.test.ts › ganti metode membatalkan transaksi lama…`. | Transaksi lama GAGAL, pesanan tetap MENUNGGU_PEMBAYARAN, tagihan aktif = baru | Sesuai | Pass |
| C07-UT07 | `verifikasiPembayaran()` | Negatif | `pembayaran.test.ts › stok habis saat lunas…`. | Dana dikembalikan, pesanan DIBATALKAN, notifikasi refund | Sesuai | Pass |
| C07-UT08 | `cekTimeout()` / verifikasi kedaluwarsa | Batas | `pembayaran.test.ts › tagihan kedaluwarsa dibatalkan, dan pembayaran yang terlambat dikembalikan`. | 410, pesanan DIBATALKAN, dana DIKEMBALIKAN | Sesuai | Pass |
| C07-UT09 | Gateway kedaluwarsa | Batas | `pembayaran.test.ts › transaksi gateway yang lewat batas waktu…`. | Status KEDALUWARSA dan bayar 410 | Sesuai | Pass |
| C07-UT10 | `terimaNotifikasi()` (HMAC) | Negatif | `pembayaran.test.ts › tanda tangan HMAC diverifikasi`. | Tanda tangan salah atau data diubah ditolak, 401 | Sesuai | Pass |
| C07-UT11 | `terimaNotifikasi()` | Negatif | `pembayaran.test.ts › notifikasi palsu dengan tanda tangan sah…`. Nominal 1. | Ditolak 404 | Sesuai | Pass |
| C07-UT12 | Validasi kartu (Luhn) | Normal / Negatif | `pembayaran.test.ts › algoritma Luhn`. | Nomor sah lolos, nomor salah tidak | Sesuai | Pass |
| C07-UT13 | `cekTimeout()` | Batas | Setel `batas_waktu_bayar` ke 1 menit lalu, panggil `cekTimeout()` dua kali. | Pesanan DIBATALKAN, panggilan kedua mengembalikan 0 | Sesuai | Pass |
| C07-UT14 | `buatTagihan()` | Batas | Pesanan satu item (total terkecil). | Nominal tagihan = harga + biaya layanan = total pesanan | Sesuai | Pass |
| KNF07-TC01 | `config.paymentTimeoutMinutes` | Batas | `pembayaran.test.ts › KNF07-TC01`. | = 5 menit (SKPL KNF07) | **15 menit** | **Fail** |

Penyebab Fail: nilai bawaan `paymentTimeoutMinutes` pada `server/config.ts` adalah 15, sedangkan SKPL meminta 5 menit (DPPL Algo-045 juga menulis 15).

Tabel 4.2.7b. Ringkasan Cakupan Kelas C07

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `buatTagihan()`, `verifikasiPembayaran()`, `cekTimeout()` |
| Operasi yang diuji | Ketiganya |
| ID Algoritma yang tercakup | Algo-045, Algo-046, Algo-047 |
| Coverage (wajib ≥ 70%) | `metodePembayaranController.ts`: 95,45% baris / 76,39% branch / 100.00% fungsi ; `models/pembayaran.ts`: 95,24% baris / 86,67% branch / 100,00% fungsi; `paymentGatewayAdapter.ts`: 81,97% baris / 83,33% branch / 100.00% fungsi |

### 4.2.8 Kelas RiwayatTransaksi

**ID Kelas:** C08  
**Nama Kelas:** RiwayatTransaksi  
**Tingkat:** Sedang

Tabel 4.2.8. Hasil Pengujian Unit Kelas C08

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C08-UT01 | `catatLogTransaksi()` | Normal | Tidak langsung lewat C07-UT02: pembayaran lunas lalu `verifikasiPembayaran`. | Transaksi lunas tercatat, status LUNAS | Sesuai | Pass |
| C08-UT02 | `getBuktiPembayaran()` | Normal / Negatif | Sebelum bayar, lalu setelah e-wallet lunas. | `null` sebelum bayar; sesudahnya status LUNAS, metode EWALLET, jumlah = total | Sesuai | Pass |
| C08-UT03 | `catatLogTransaksi()` | Negatif | Pembayaran kartu dengan hasil GAGAL. | Tidak ada transaksi tercatat (`null`) | `null` | Pass |

### 4.2.9 Kelas TiketAntrean

**ID Kelas:** C09  
**Nama Kelas:** TiketAntrean  
**Tingkat:** Mendalam

Tabel 4.2.9. Hasil Pengujian Unit Kelas C09

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C09-UT01 | `generateNomorAntrean()` | Normal | Tiga pelanggan memesan dan membayar pada restoran yang sama. | Tiga nomor unik dan menaik (KNF03) | Unik dan menaik | Pass |
| C09-UT02 | `generateNomorAntrean()` | Batas | Bandingkan dengan `MAX(nomor_urut)` hari ini. | Nomor = maks + 1 | Sesuai | Pass |
| C09-UT03 | `updateStatusTiket()` | Negatif | Ubah tiket SELESAI ke MENUNGGU. | Ditolak, status tetap SELESAI (DPPL: status final tidak boleh diubah) | Status berubah menjadi MENUNGGU | **Fail** |
| C09-UT04 | `formatNomorAntrean` | Normal / Batas | `antrean.test.ts › format nomor antrean`. 7 dan 1234. | `A-007` dan `A-1234` | Sesuai | Pass |
| C09-UT05 | `generateNomorAntrean()` / penerbitan | Normal | `pemesanan.test.ts › pesanan lunas menerbitkan tiket…`. | `idTiket` terbit setelah lunas | Sesuai | Pass |
| C09-UT06 | `getDetailTiket()` | Normal / Negatif | Tidak langsung: C10-UT02. | Tiket tersedia, atau 404 | Sesuai | Pass |
| C09-UT07 | `generateNomorAntrean()` | Batas | Geser `waktu_terbit` semua tiket antrean ke 1 hari lalu. | Nomor kembali ke 1 (reset harian) | 1 | Pass |
| C09-UT08 | `updateStatusTiket()` | Normal / Batas | Ubah tiket MENUNGGU ke DIPANGGIL; lalu ID `TKT-tidak-ada`. | DIPANGGIL tersimpan; ID tidak ada tidak menimbulkan galat | Sesuai | Pass |
| C09-UT09 | `cetakRincianTiket()` (`getTiket`) | Normal / Negatif | Pemilik membuka tiket; pelanggan lain; ID `TKT-tidak-ada`. | Tiket dan bukti LUNAS terbaca; 403; 404 | Sesuai | Pass |

Penyebab Fail (C09-UT03): `TiketAntrean.updateStatusTiket` (`models/antrean.ts`) menjalankan `UPDATE` tanpa memeriksa status saat ini. Usulan: tambahkan kondisi `AND status_antrean NOT IN ('SELESAI','DILEWATI','DIBATALKAN')` pada query.

Tabel 4.2.9b. Ringkasan Cakupan Kelas C09

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `generateNomorAntrean()`, `cetakRincianTiket()`, `getDetailTiket()`, `updateStatusTiket()` |
| Operasi yang diuji | 4 dari 4 (`cetakRincianTiket()` teruji lewat `getTiket`) |
| ID Algoritma yang tercakup | Algo-050, Algo-052, Algo-053 |
| Coverage (wajib ≥ 70%) | `models/antrean.ts` (bersama C04): 98,18% baris / 89,29% *branch* / 95,45% fungsi |

### 4.2.10 Kelas PemantauAntreanController

**ID Kelas:** C10  
**Nama Kelas:** PemantauAntreanController  
**Tingkat:** Sedang

Tabel 4.2.10. Hasil Pengujian Unit Kelas C10

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C10-UT01 | `updateTampilanAntrean()` (`subscribe`) | Normal | Buka kanal SSE palsu, pancarkan event, tutup koneksi, pancarkan lagi. | Event `siap` dan `antrean` terkirim; setelah tutup tidak ada tulisan baru | Sesuai | Pass |
| C10-UT02 | `getStatusAntrean()` | Negatif | Tiket tidak ada, dan tiket milik pelanggan lain. | 404 dan 403 | Sesuai | Pass |
| C10-UT03 | `getStatusAntrean()` | Normal | `antrean.test.ts › dequeue memanggil pelanggan berikutnya…`. | `sisaAntrean` dan `estimasiMenit` mengikuti dequeue | Sesuai | Pass |
| C10-UT04 | `getAntreanAktifSaya()` | Normal | `antrean.test.ts › "Mulai siapkan"…`. | Tiket aktif dan flag `disiapkan` terbaca | Sesuai | Pass |

### 4.2.11 Kelas PengajuanMitraController

**ID Kelas:** C12  
**Nama Kelas:** PengajuanMitraController  
**Tingkat:** Mendalam

Tabel 4.2.11. Hasil Pengujian Unit Kelas C12

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C12-UT01 | `setujui()`, `tolak()` | Negatif | Setujui pengajuan MENUNGGU, lalu setujui dan tolak lagi. | Keduanya 409 | 409 | Pass |
| C12-UT02 | `tinjauPengajuan` (`detailPengajuan`) | Negatif | ID `PGJ-tidak-ada`. | 404 | 404 | Pass |
| C12-UT03 | `validasiKelengkapan()` | Negatif | `mitra.test.ts › pengajuan tidak lengkap ditolak per kolom`. Hanya nama `AB`. | 400 dengan kolom `namaRestoran`, `kategori`, `alamat`, `daftarMenu`, `nib`, `izinUsaha` | Semua kolom ada | Pass |
| C12-UT04 | `simpanPengajuan()` | Negatif | `mitra.test.ts › ajukan -> tolak -> …`. Pengajuan ganda. | 409 | 409 | Pass |
| C12-UT05 | `tolak()` | Negatif | Alasan kosong. | 400 | 400 | Pass |
| C12-UT06 | `tolak()` | Normal | Alasan valid. | Status ditolak, email MITRA_DITOLAK tercatat | Sesuai | Pass |
| C12-UT07 | `simpanPengajuan()` | Normal | Ajukan ulang setelah ditolak. | Pengajuan baru MENUNGGU | Sesuai | Pass |
| C12-UT08 | `setujui()` | Normal | Setujui pengajuan ulang. | Restoran aktif, sesi memuat `restoranId`, restoran dapat dicari, email MITRA_DITERIMA | Sesuai | Pass |
| C12-UT09 | `setujui()` (notifikasi dalam aplikasi) | Normal | `mitra.test.ts › akun pengaju mendapat notifikasi saat pengajuan disetujui`. | Notifikasi "disetujui" | Sesuai | Pass |
| C12-UT10 | `tolak()` | Batas | Pengajuan baru; alasan `abcd` lalu `abcde`. | 4 karakter ditolak 400; 5 karakter diterima, status DITOLAK | Sesuai | Pass |
| C12-UT11 | `validasiKelengkapan()` | Normal / Batas | Nama 3 karakter, alamat 10 karakter, harga Rp500, NIB dan izin usaha PDF; lalu nama `AB`, alamat 8 karakter, harga Rp499. | Tanpa galat; galat pada `namaRestoran`, `alamat`, `daftarMenu` | Sesuai | Pass |

Tabel 4.2.11b. Ringkasan Cakupan Kelas C12

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `validasiKelengkapan()`, `simpanPengajuan()`, `setujui()`, `tolak()` |
| Operasi yang diuji | Keempatnya |
| ID Algoritma yang tercakup | Algo-058, Algo-059, Algo-060, Algo-061 |
| Coverage (wajib ≥ 70%) | `pengajuanMitraController.ts`: 91,16% baris / 88,14% branch / 85,71% fungsi |

### 4.2.12 Kelas DokumenVerifikasi

**ID Kelas:** C13  
**Nama Kelas:** DokumenVerifikasi  
**Tingkat:** Mendalam

Tabel 4.2.12. Hasil Pengujian Unit Kelas C13

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C13-UT01 | `validasiFormat()` | Normal | `mitra.test.ts › validasi format dokumen mitra (Algo-063)`. NIB PDF 1000 byte. | `null` (valid) | `null` | Pass |
| C13-UT02 | `validasiFormat()` | Negatif | NIB berformat `application/zip`. | Pesan "format" | Sesuai | Pass |
| C13-UT03 | `validasiFormat()` | Negatif | Jenis `foto` dengan PDF. | Pesan "format" | Sesuai | Pass |
| C13-UT04 | `validasiFormat()` | Batas / Negatif | Izin usaha PNG 6 MB. | Pesan "5 MB" | Sesuai | Pass |
| C13-UT05 | `unggahDokumen()` | Normal | Tidak langsung lewat C12-UT04 dan C12-UT08 (berkas PDF diunggah pada pengajuan). | Dokumen tersimpan pada pengajuan | Sesuai | Pass |
| C13-UT06 | `validasiFormat()` | Batas | Izin usaha PNG berukuran tepat 5 MB dan 5 MB + 1 byte. | 5 MB diterima; lebih sedikit ditolak ("5 MB") | Sesuai | Pass |
| C13-UT07 | `validasiFormat()` | Normal / Negatif | Foto JPG, PNG, dan PDF. | JPG dan PNG diterima, PDF ditolak | Sesuai | Pass |
| C13-UT08 | `unggahDokumen()` | Normal / Negatif | Panggil langsung untuk pengajuan yang ada; lalu `PGJ-tidak-ada`. | Jumlah dokumen bertambah 1; pengajuan tidak ada ditolak | Sesuai | Pass |

`unggahDokumen` kini teruji langsung (C13-UT08) selain lewat pengajuan (C13-UT05).

Tabel 4.2.12b. Ringkasan Cakupan Kelas C13

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `unggahDokumen()`, `validasiFormat()` |
| Operasi yang diuji | Keduanya |
| ID Algoritma yang tercakup | Algo-062, Algo-063 |
| Coverage (wajib ≥ 70%) | `models/mitra.ts`: 95,07% baris / 100% branch / 91,67% fungsi |

### 4.2.13 Kelas Admin

**ID Kelas:** C14  
**Nama Kelas:** Admin  
**Tingkat:** Sedang

Tabel 4.2.13. Hasil Pengujian Unit Kelas C14

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C14-UT01 | `accountRegister()` | Normal / Negatif | Buat akun ADMIN lalu `Admin.accountRegister`; ulangi untuk akun yang sama. | Baris `admin` tersimpan; pendaftaran ganda ditolak (kunci unik) | Sesuai | Pass |
| C14-UT02 | Login akun admin | Normal | Login `admin@antri.in`. | Peran ADMIN dan tanpa `restoranId` | Sesuai | Pass |

Operasi `tinjauPengajuan`, `lihatKeluhan`, dan `konfirmasiPenghapusan` hanya diteruskan ke controller lain dan teruji lewat C12-UT02, C41-UT08, dan C33-UT01.

Catatan: `AutentikasiController.createAccount` hanya membuat peran RESTORAN atau PELANGGAN (peran lain dijadikan PELANGGAN), sehingga akun admin tidak dapat dibuat lewat registrasi seperti yang tertulis pada Tabel 4.1.1 dan Bab 2. Akun admin dibuat lewat *seed*. Tingkat Sedang terpenuhi (satu kasus normal dan satu kasus gagal pada `Admin.accountRegister`).

### 4.2.14 Kelas NotifikasiEmail

**ID Kelas:** C15  
**Nama Kelas:** NotifikasiEmail  
**Tingkat:** Mendalam

Tabel 4.2.14. Hasil Pengujian Unit Kelas C15

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C15-UT01 | `kirimEmail()` | Normal | Kirim email ke `uji-email@contoh.id`. | Baris `log_notifikasi` berstatus TERKIRIM | TERKIRIM | Pass |
| C15-UT02 | `kirimEmail()` | Negatif | `console.log` dibuat melempar galat. | Baris `log_notifikasi` berstatus GAGAL | GAGAL | Pass |
| C15-UT03 | `kirimEmail()` (validasi format) | Negatif | Penerima `bukan-email`. | Ditolak (HIUPL 4.1: validasi format email) | Diterima dan dicatat | **Fail** |
| C15-UT04 | `kirimEmail()` | Normal | `mitra.test.ts › ajukan -> tolak…`. Dua email ke satu penerima. | Log berurutan `MITRA_DITOLAK`, `MITRA_DITERIMA` | Sesuai | Pass |
| C15-UT05 | `kirimEmail()` | Batas | Isi pesan 5000 karakter. | Tercatat utuh (panjang 5000) berstatus TERKIRIM | Sesuai | Pass |

Penyebab Fail (C15-UT03): `kirimEmail` pada `adapters/notifikasiEmail.ts` tidak memvalidasi alamat. Status GAGAL hanya muncul bila pencetakan ke konsol melempar galat. Usulan: validasi format penerima (galat atau status GAGAL).

Tabel 4.2.14b. Ringkasan Cakupan Kelas C15

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `kirimEmail()` |
| Operasi yang diuji | `kirimEmail()` |
| ID Algoritma yang tercakup | Algo-068 |
| Coverage (wajib ≥ 70%) | `adapters/notifikasiEmail.ts`: 100,00% baris / 100,00% *branch* / 100,00% fungsi |

### 4.2.15 Kelas KelolaAntreanController

**ID Kelas:** C16  
**Nama Kelas:** KelolaAntreanController  
**Tingkat:** Mendalam

Tabel 4.2.15. Hasil Pengujian Unit Kelas C16

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C16-UT01 | `getAntrean()` | Normal | `antrean.test.ts › dequeue memanggil pelanggan berikutnya…`. | Ringkasan dan daftar, terdepan berstatus DIPANGGIL | Sesuai | Pass |
| C16-UT02 | `processDequeue()` | Normal | Dequeue tiket terdepan. | Nomor `A-001` dilayani, antrean aktif berkurang 1 | Sesuai | Pass |
| C16-UT03 | `processDequeue()` | Negatif | `antrean.test.ts › dequeue dengan data layar usang ditolak`. ID `TKT-usang`. | 409 | 409 | Pass |
| C16-UT04 | `processDequeue()` | Negatif | `antrean.test.ts › restoran tanpa antrean tidak dapat dequeue`. | Galat "Belum ada antrean" | Sesuai | Pass |
| C16-UT05 | `mulaiTimer()` (`autoDequeue`) | Normal | `antrean.test.ts › dequeue otomatis setelah 30 menit tidak hadir`. Dipanggil 31 menit lalu. | Tiket DILEWATI, restoran diproses | DILEWATI | Pass |
| C16-UT06 | `tandaiDisiapkan()` | Normal / Negatif | `antrean.test.ts › "Mulai siapkan" menandai tiket…`. Tandai dua kali. | Pertama berhasil, kedua 409 | Sesuai | Pass |
| C16-UT07 | `mulaiTimer()` (`autoDequeue`) | Batas | Tiket DIPANGGIL 29 menit 55 detik lalu. | Belum dilewati, status tetap DIPANGGIL | DIPANGGIL | Pass |
| C16-UT08 | `getAntrean()`, `mulaiTimer()` (`autoDequeue`) | Batas / Negatif | Antrean kosong (Martabak); akun pelanggan; `autoDequeue` saat semua tiket baru dipanggil. | Ringkasan 0 dan daftar kosong; pelanggan 403; `autoDequeue` mengembalikan daftar kosong | Sesuai | Pass |

Tidak diuji: kegagalan di tengah transaksi dan timer 300 detik pada Algo-071 (kode memakai 30 menit dari `autoDequeueMinutes`). Baris 90-100 dan 125-132 pada `kelolaAntreanController.ts` tidak tercakup (86,23% baris). Batas 29 menit 55 detik teruji pada C16-UT07.

Tabel 4.2.15b. Ringkasan Cakupan Kelas C16

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `getAntrean()`, `processDequeue()`, `mulaiTimer()` |
| Operasi yang diuji | Ketiganya (`mulaiTimer` sebagai `autoDequeue`) |
| ID Algoritma yang tercakup | Algo-069, Algo-070, Algo-071 |
| Coverage (wajib ≥ 70%) | `kelolaAntreanController.ts`: 86,23% baris / 82,35% branch /  86.67% fungsi |

### 4.2.16 Kelas Kuota

**ID Kelas:** C20  
**Nama Kelas:** Kuota  
**Tingkat:** Mendalam

Tabel 4.2.16. Hasil Pengujian Unit Kelas C20

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C20-UT01 | `isAntreanTutup()` | Normal / Batas | Kuota 10 tidak ditutup, kuota 10 ditutup, kuota 0. | `false`, `true`, `true` | Sesuai | Pass |
| C20-UT02 | `updateKapasitas()` | Normal | Simpan kuota 21 dan meja 5, lalu baca. Juga ID tidak ada. | Nilai tersimpan; ID tidak ada `null` | Sesuai | Pass |
| C20-UT03 | `isAntreanTutup()` | Batas | `antrean.test.ts › kuota negatif ditolak; kuota 0 menutup antrean`. | Kuota 0 menutup (TUTUP), kuota 40 membuka (BUKA) | Sesuai | Pass |
| C20-UT04 | `updateKapasitas()` | Normal | `antrean.test.ts › tutup sementara tidak menghapus nilai kuota`. | Kuota 35 tetap setelah tutup dan buka | Sesuai | Pass |
| C20-UT05 | Status dari kuota | Batas | `antrean.test.ts › status antrean dari kuota`. `(30,30)`. | PENUH | PENUH | Pass |
| C20-UT06 | `updateKapasitas()` | Negatif / Batas | Kuota `-1`; kuota 0; kuota 10000. | `-1` ditolak basis data; 0 menutup antrean; 10000 tersimpan dan antrean terbuka | Sesuai | Pass |
| C20-UT07 | `updateKapasitas()` | Negatif | ID `RST-tidak-ada`. | Tidak ada baris berubah (`undefined`) | Sesuai | Pass |

Tabel 4.2.16b. Ringkasan Cakupan Kelas C20

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `updateKapasitas()`, `isAntreanTutup()` |
| Operasi yang diuji | Keduanya |
| ID Algoritma yang tercakup | Algo-080, Algo-081 |
| Coverage (wajib ≥ 70%) | `models/kuota.ts`: 72,97% baris / 100% branch / 100% fungsi |

### 4.2.17 Kelas PengaturanKuotaController

**ID Kelas:** C21  
**Nama Kelas:** PengaturanKuotaController  
**Tingkat:** Mendalam

Tabel 4.2.17. Hasil Pengujian Unit Kelas C21

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C21-UT01 | `onSaveSettings()` | Negatif | `antrean.test.ts › kuota negatif ditolak…`. Kuota `-5`. | 400 | 400 | Pass |
| C21-UT02 | `onSaveSettings()` | Normal / Batas | Kuota 0 (tutup), lalu kuota 40. | `antreanTutup=true` lalu status BUKA | Sesuai | Pass |
| C21-UT03 | validasi input (`bilanganCacah`) | Normal / Batas / Negatif | `antrean.test.ts › input kuota: hanya bilangan bulat tidak negatif`. `'12'`, `0`, `'-3'`, `'abc'`, `2.5`. | 12, 0, `null`, `null`, `null` | Sesuai | Pass |
| C21-UT04 | `onSaveSettings()` | Normal | `antrean.test.ts › tutup sementara tidak menghapus nilai kuota`. | Kuota 35 dipertahankan | Sesuai | Pass |
| C21-UT05 | `onSaveSettings()` | Batas / Negatif | Meja `-1`; kuota `abc`; kuota `10001`; kuota `10000`. | Tiga pertama ditolak per kolom (400); 10000 diterima | Sesuai | Pass |
| C21-UT06 | `displaySettings()` | Normal / Negatif | Pengaturan restoran Cilok; akses oleh pelanggan. | Kuota dan status tutup terbaca; pelanggan ditolak (401/403) | Sesuai | Pass |

Tidak diuji: `showErrorPeringatan` (UI). Catatan konsistensi: Tabel 4.1.1 menyebut validasi "lebih dari 0", sedangkan kode menerima 0 sampai 10000 (kuota) dan 0 sampai 1000 (meja); kuota 0 berarti antrean ditutup.

Tabel 4.2.17b. Ringkasan Cakupan Kelas C21

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `displaySettings()`, `onSaveSettings()`, `showErrorPeringatan()` |
| Operasi yang diuji | `displaySettings()`, `onSaveSettings()` (2 dari 3; `showErrorPeringatan()` adalah UI) |
| ID Algoritma yang tercakup | Algo-083 |
| Coverage (wajib ≥ 70%) | `pengaturanKuotaController.ts`: 100% baris / 91,30% branch / 100% fungsi |

### 4.2.18 Kelas KelolaMenuController

**ID Kelas:** C24  
**Nama Kelas:** KelolaMenuController  
**Tingkat:** Mendalam

Tabel 4.2.18. Hasil Pengujian Unit Kelas C24

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C24-UT01 | `handleAddMenu()` | Normal | `menu.test.ts › tambah, ubah stok, dan hapus menu`. Harga 30000, stok 10. | Menu tersimpan | Sesuai | Pass | `src/tests/menu.test.ts:25` |
| C24-UT02 | `handleAddMenu()` | Negatif | Nama `X`, harga `-1`, stok `a`. | 400 untuk tiga kolom | Sesuai | Pass | `src/tests/menu.test.ts:25` |
| C24-UT03 | `handleFetchMenu()`, `handleDeleteMenu()` | Normal | Hapus menu lalu ambil daftar. | Menu tidak ada di daftar | Sesuai | Pass | `src/tests/menu.test.ts:25` |
| C24-UT04 | `handleUpdateStok()` | Batas | Stok diubah ke `'0'`. | Stok 0 | Sesuai | Pass | `src/tests/menu.test.ts:25` |
| C24-UT05 | `handleUpdateStok()` | Negatif | `menu.test.ts › restoran lain tidak bisa mengubah menu…`. | 404 | 404 | Pass | `src/tests/menu.test.ts:36` |
| C24-UT06 | `handleUpdateMenu()` | Batas | Harga `500` (batas bawah), stok 7. | Tersimpan | Sesuai | Pass | `src/tests/menu.test.ts:88` |
| C24-UT07 | `handleUpdateMenu()` | Batas / Negatif | Harga `499`; menu `MNU-tidak-ada`. | 400 pada kolom `harga`; 404 | Sesuai | Pass | `src/tests/menu.test.ts:95` |
| C24-UT08 | `handleFetchMenuDetail()` | Normal | Memeriksa operasi pada `KelolaMenuController`. | Operasi tersedia | Operasi tidak ada | **Fail** | `src/tests/menu.test.ts:104` |

`handleFetchMenuDetail()` tidak ada di kode (C24-UT08 Fail). 

Tabel 4.2.18b. Ringkasan Cakupan Kelas C24

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `handleFetchMenu()`, `handleFetchMenuDetail()`, `handleAddMenu()`, `handleUpdateMenu()`, `handleDeleteMenu()` |
| Operasi yang diuji | `handleFetchMenu()`, `handleAddMenu()`, `handleUpdateMenu()`, `handleDeleteMenu()` (4 dari 5 operasi DPPL), ditambah `handleUpdateStok()` |
| ID Algoritma yang tercakup | Algo-092, Algo-094, Algo-096 |
| Coverage (wajib ≥ 70%) | `kelolaMenuController.ts`: 88,89% / 86,67% |

### 4.2.19 Kelas Pengguna

**ID Kelas:** C25  
**Nama Kelas:** Pengguna  
**Tingkat:** Mendalam

Tabel 4.2.19. Hasil Pengujian Unit Kelas C25

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C25-UT01 | `saveCredentials()` (hash) | Normal | Baca kolom `password_hash` seluruh pengguna. | Semua berformat bcrypt, bukan plain-text (KNF08) | Sesuai | Pass | `src/tests/autentikasi.test.ts:106` |
| C25-UT02 | `validateAccount()` | Normal | `autentikasi.test.ts › registrasi, login, dan logout`. Email `UJI@contoh.id` (huruf besar). | Login berhasil, peran PELANGGAN | Sesuai | Pass | `src/tests/autentikasi.test.ts:30` |
| C25-UT03 | `validateAccount()` | Negatif | `autentikasi.test.ts › kredensial salah memberi pesan umum`. | 401, pesan umum | Sesuai | Pass | `src/tests/autentikasi.test.ts:51` |
| C25-UT04 | pengecekan duplikasi | Negatif | Email sudah terdaftar. | 409 | 409 | Pass | `src/tests/autentikasi.test.ts:41` |
| C25-UT05 | `getUserInfo()` (ubah profil) | Normal / Negatif | `autentikasi.test.ts › ubah profil memvalidasi nomor telepon…`. Nomor `12`, nomor duplikat, lalu nilai valid. | 400, 409, lalu nama tersimpan di basis data | Sesuai | Pass | `src/tests/autentikasi.test.ts:59` |
| C25-UT06 | `saveCredentials()` (ganti sandi) | Negatif / Normal | `autentikasi.test.ts › ganti kata sandi…`. Sandi lama salah, lalu benar. | 400, lalu login dengan sandi baru berhasil | Sesuai | Pass | `src/tests/autentikasi.test.ts:71` |
| C25-UT07 | `logout()` | Normal | Lihat C28-UT05. | Sesi nonaktif | Sesuai | Pass | `src/tests/autentikasi.test.ts:30` |

Tabel 4.2.19b. Ringkasan Cakupan Kelas C25

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `validateAccount()`, `logout()`, `getUserInfo()`, `saveCredentials()` |
| Operasi yang diuji | Keempatnya |
| ID Algoritma yang tercakup | Algo-097, Algo-098, Algo-099, Algo-100 |
| Coverage (wajib ≥ 70%) | `models/akun.ts` (bersama C01, C14, C29): 98,51% / 96,67% |

### 4.2.20 Kelas AutentikasiController

**ID Kelas:** C28  
**Nama Kelas:** AutentikasiController  
**Tingkat:** Mendalam

Tabel 4.2.20. Hasil Pengujian Unit Kelas C28

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C28-UT01 | `createAccount()` | Normal | `autentikasi.test.ts › registrasi, login, dan logout`. | Akun terbentuk | Sesuai | Pass | `src/tests/autentikasi.test.ts:30` |
| C28-UT02 | `createAccount()` | Negatif | Email duplikat `pelanggan@antri.in`. | 409 | 409 | Pass | `src/tests/autentikasi.test.ts:41` |
| C28-UT03 | `createAccount()` | Negatif | Kata sandi `pendek`. | 400 dengan kolom `password` | Sesuai | Pass | `src/tests/autentikasi.test.ts:41` |
| C28-UT04 | `validation()` | Negatif | Kata sandi salah. | 401, "Email atau kata sandi yang Anda masukkan salah" | Sesuai | Pass | `src/tests/autentikasi.test.ts:51` |
| C28-UT05 | `processLogout()` | Normal | Logout lalu validasi token yang sama. | Token tidak valid (`null`) | `null` | Pass | `src/tests/autentikasi.test.ts:30` |
| C28-UT06 | `handleSessionDeletion()` | Normal | `autentikasi.test.ts › ganti kata sandi mengakhiri sesi lain…`. | Sesi lain berakhir, sesi saat ini tetap | Sesuai | Pass | `src/tests/autentikasi.test.ts:71` |
| C28-UT07 | token reset (lupa sandi) | Normal / Negatif | `autentikasi.test.ts › lupa kata sandi: token sekali pakai…`. | Reset berhasil; pemakaian ulang token 404; email lupa sandi tercatat | Sesuai | Pass | `src/tests/autentikasi.test.ts:82` |
| C28-UT08 | `createAccount()` | Negatif | Nama `A`, email `bukan-email`, nomor `123`, konfirmasi sandi berbeda, persetujuan tidak dicentang. | 400 pada kolom `nama`, `email`, `noHp`, `password`, `setuju` | Sesuai | Pass | `src/tests/autentikasi.test.ts:118` |
| C28-UT09 | `createAccount()` | Batas | Sandi 7 karakter, lalu tepat 8 karakter. | 7 ditolak; 8 diterima | Sesuai | Pass | `src/tests/autentikasi.test.ts:124` |
| C28-UT10 | `handleSessionDeletion()` (`gantiKataSandi`) | Negatif | Kata sandi baru `pendek`; konfirmasi berbeda; masukan kosong. | 400 pada ketiganya (kolom `baru` terisi); sandi lama tetap berlaku | Sesuai | Pass | `src/tests/autentikasi.test.ts:153` |
| C28-UT11 | `getProfil()` | Normal | Akun RESTORAN baru tanpa restoran: sebelum dan sesudah mengajukan kemitraan; lalu akun pelanggan. | `pengajuan` `null`, lalu `MENUNGGU` bernama "Warung Calon"; pelanggan `null` | Sesuai | Pass | `src/tests/autentikasi.test.ts:165` |

Semua baris `autentikasiController.ts` tercakup. *Branch* semula 69,86% (di bawah 70%) karena dua cabang belum diuji: penolakan kata sandi baru pada `gantiKataSandi` (baris 136-139) dan status pengajuan mitra pada `getProfil` (baris 89 dan 96-97). Keduanya kini diuji oleh C28-UT10 dan C28-UT11, sehingga *branch* naik menjadi 80,95%.

Tabel 4.2.20b. Ringkasan Cakupan Kelas C28

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `createAccount()`, `validation()`, `processLogout()`, `handleSessionDeletion()` |
| Operasi yang diuji | Keempatnya |
| ID Algoritma yang tercakup | Algo-104, Algo-105, Algo-106, Algo-107 |
| Coverage (wajib ≥ 70%) | `autentikasiController.ts`: 100% baris / 80,95% *branch* / 100% fungsi |

### 4.2.21 Kelas SesiPengguna

**ID Kelas:** C29  
**Nama Kelas:** SesiPengguna  
**Tingkat:** Mendalam

Tabel 4.2.21. Hasil Pengujian Unit Kelas C29

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C29-UT01 | `validateSession()` | Batas | Setel `waktu_kedaluwarsa` ke 1 menit yang lalu. | Sesi tidak valid (`null`) | `null` | Pass | `src/tests/autentikasi.test.ts:97` |
| C29-UT02 | `validateToken()` | Negatif | Token `token-ngawur`. | `null` | `null` | Pass | `src/tests/autentikasi.test.ts:103` |
| C29-UT03 | `validateSession()` | Normal | Login lalu validasi token. | Pengguna dikembalikan | Sesuai | Pass | `src/tests/autentikasi.test.ts:30` |
| C29-UT04 | `hapusSesi()` | Normal | Logout lalu validasi (lihat C28-UT05). | `null` | `null` | Pass | `src/tests/autentikasi.test.ts:30` |
| C29-UT05 | `hapusSesi()` (sesi lain) | Normal | Lihat C28-UT06. | Sesi lain nonaktif | Sesuai | Pass | `src/tests/autentikasi.test.ts:71` |
| C29-UT06 | `validateToken()` (middleware) | Normal / Negatif | `api.test.ts › endpoint terlindungi…`. Tanpa token, peran salah, peran benar. | 401, 403, 200 | Sesuai | Pass | `src/tests/api.test.ts:23` |

Tabel 4.2.21b. Ringkasan Cakupan Kelas C29

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `validateSession()`, `hapusSesi()`, `validateToken()` |
| Operasi yang diuji | Ketiganya |
| ID Algoritma yang tercakup | Algo-108, Algo-109, Algo-110 |
| Coverage (wajib ≥ 70%) | `models/akun.ts`: 98,51% / 96,67%; `middleware/auth.ts`: 85,71% / 86,67% |

### 4.2.22 Kelas Keluhan

**ID Kelas:** C30  
**Nama Kelas:** Keluhan  
**Tingkat:** Mendalam

Tabel 4.2.22. Hasil Pengujian Unit Kelas C30

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C30-UT01 | `updateStatusKeluhan()` | Batas | Keluhan dikirim lalu ditanggapi admin, kemudian dibuka ulang lewat `detailKeluhan()`. | Status tetap `DITANGGAPI`, tidak turun menjadi `DIBACA` | Sesuai | Pass | `src/tests/keluhan.test.ts:99` |
| C30-UT02 | `simpanKeluhan()` | Normal | `keluhan.test.ts › keluhan dikirim, dibaca, dan ditanggapi admin`. Pelanggan mengirim keluhan kategori `Pelayanan` dengan pesanan terkait. | Keluhan tersimpan berstatus `BARU` dan terhubung ke restoran pesanan | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C30-UT03 | `updateStatusKeluhan()` | Normal | Admin membuka detail keluhan yang berstatus `BARU`. | Status berubah menjadi `DIBACA` | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C30-UT04 | `tanggapi()` | Normal | Admin mengirim tanggapan pada keluhan yang sama. | Tanggapan tersimpan, status `DITANGGAPI` | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C30-UT05 | `daftar()` | Normal / Negatif | Cari keluhan dengan lima huruf awal nama restoran, lalu dengan kata kunci `zzz-tidak-ada-zzz`. | Keluhan ditemukan; kata kunci yang tidak cocok menghasilkan daftar kosong | Sesuai | Pass | `src/tests/keluhan.test.ts:123` |

Tidak diuji secara unit: `daftarMilikPelanggan()` (baris 50-54), yang dipakai halaman riwayat keluhan pelanggan dan teruji lewat UC13.

Tabel 4.2.22b. Ringkasan Cakupan Kelas C30

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `simpanKeluhan()`, `updateStatusKeluhan()` |
| Operasi yang diuji | Keduanya, ditambah `tanggapi()` dan `daftar()` yang ditambahkan saat implementasi |
| ID Algoritma yang tercakup | Algo-111, Algo-112 |
| Coverage (wajib ≥ 70%) | `models/keluhan.ts`: 91,25% / 87,50% |

### 4.2.23 Kelas KelolaDataRestoranController

**ID Kelas:** C33  
**Nama Kelas:** KelolaDataRestoranController  
**Tingkat:** Mendalam

Tabel 4.2.23. Hasil Pengujian Unit Kelas C33

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C33-UT01 | `hapusDataRestoran()`, `nonaktifkanRelasiMenu()` | Normal | `keluhan.test.ts › hapus restoran menonaktifkan menu dan membatalkan antrean aktif`. Hapus restoran "Seblak Teh Nining". | Tidak ada tiket berstatus `MENUNGGU`/`DIPANGGIL`, tidak ada menu aktif, detail restoran 404, dan akun restoran tidak lagi terhubung ke restoran | Sesuai | Pass | `src/tests/keluhan.test.ts:44` |
| C33-UT02 | `daftarRestoran()` | Normal | Ambil daftar dengan filter `semua`, `aktif`, dan `nonaktif`. | Filter `aktif` hanya berisi restoran aktif, `nonaktif` hanya restoran nonaktif, dan jumlah `semua` = `aktif` + `nonaktif` | Sesuai | Pass | `src/tests/keluhan.test.ts:74` |
| C33-UT03 | `hapusDataRestoran()` | Negatif / Normal | Hapus ID `RST-tidak-ada`; hapus "Bakso Mang Ujang" lalu hapus sekali lagi. | ID tidak ada dan penghapusan kedua ditolak 404; pelanggan terdampak menerima notifikasi "dibatalkan"; email `RESTORAN_DIHAPUS` tercatat di `log_notifikasi` | Sesuai | Pass | `src/tests/keluhan.test.ts:112` |

`nonaktifkanRelasiMenu()` tidak berdiri sebagai method terpisah. Penonaktifan menu dijalankan di dalam `Restoran.setSoftDelete()` pada transaksi yang sama, sehingga teruji melalui C33-UT01. *Branch* yang belum tercakup adalah filter `banyak-keluhan` pada `daftarRestoran()` dan cabang kegagalan `setSoftDelete()` di dalam transaksi.

Tabel 4.2.23b. Ringkasan Cakupan Kelas C33

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `hapusDataRestoran()`, `nonaktifkanRelasiMenu()` |
| Operasi yang diuji | Keduanya (`nonaktifkanRelasiMenu()` melalui `Restoran.setSoftDelete()`), ditambah `daftarRestoran()` |
| ID Algoritma yang tercakup | Algo-117, Algo-118 |
| Coverage (wajib ≥ 70%) | `kelolaDataRestoranController.ts`: 100% / 77,78% |

### 4.2.24 Kelas PencarianController

**ID Kelas:** C35  
**Nama Kelas:** PencarianController  
**Tingkat:** Mendalam

Tabel 4.2.24. Hasil Pengujian Unit Kelas C35

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C35-UT01 | `terapkanFilter()` (kategori) | Normal | Ambil daftar kategori, lalu cari dengan kategori pertama. | Minimal satu restoran ditemukan dan semuanya berkategori tersebut | Sesuai | Pass | `src/tests/pencarian.test.ts:47` |
| C35-UT02 | `terapkanFilter()` (rating, antrean) | Negatif / Batas | `minRating` = `abc`; lalu `antreanPendek` = `true`. | Rating tidak valid diabaikan (jumlah hasil sama dengan tanpa filter); filter antrean pendek tidak menambah hasil | Sesuai | Pass | `src/tests/pencarian.test.ts:53` |
| C35-UT03 | `getDetailRestoran()` | Negatif | ID restoran `RST-tidak-ada`. | 404 | 404 | Pass | `src/tests/pencarian.test.ts:60` |
| C35-UT04 | `cariRestoran()` | Normal | `pencarian.test.ts › cari berdasarkan kata kunci menu dan filter rating`. Kata kunci `geprek`. | Hanya "Ayam Geprek Bu Rini" yang dikembalikan | Sesuai | Pass | `src/tests/pencarian.test.ts:26` |
| C35-UT05 | `terapkanFilter()` (rating) | Batas | `minRating` = `4.7`. | Semua hasil memiliki rating rata-rata ≥ 4,7 | Sesuai | Pass | `src/tests/pencarian.test.ts:26` |
| C35-UT06 | `cariRestoran()` | Negatif | Kata kunci `tidak-ada-xyz`. | Daftar hasil kosong dan saran restoran viral tetap diberikan | Sesuai | Pass | `src/tests/pencarian.test.ts:32` |
| C35-UT07 | `terapkanFilter()` (lokasi) | Normal | `lokasi` = `Dago`. | Minimal dua restoran, semuanya berlokasi Dago; daftar pilihan lokasi tetap memuat "Braga" | Sesuai | Pass | `src/tests/pencarian.test.ts:39` |
| C35-UT08 | `cariRestoran()` (melalui REST API) | Normal | `api.test.ts › endpoint terlindungi…`. `GET /api/restoran?q=bakso` tanpa login. | Pencarian dapat diakses publik dan mengembalikan minimal satu restoran | Sesuai | Pass | `src/tests/api.test.ts:23` |
| C35-UT09 | `ambilStatusAntrean()`, `ambilPreviewMenu()` | Normal | `getDetailRestoran()` untuk "Bakso Mang Ujang". | Status antrean bernilai `BUKA`, `TUTUP`, atau `PENUH`; pratinjau menu tidak kosong dan seluruhnya menu aktif | Sesuai | Pass | `src/tests/pencarian.test.ts:67` |

Pada implementasi, `terapkanFilter()` digabung ke dalam `cariRestoran()`. Begitu pula `ambilStatusAntrean()` dan `ambilPreviewMenu()`, yang dijalankan di dalam `getDetailRestoran()`. Keempat operasi DPPL tetap teruji melalui dua method tersebut.

Tabel 4.2.24b. Ringkasan Cakupan Kelas C35

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `cariRestoran()`, `terapkanFilter()`, `ambilStatusAntrean()`, `ambilPreviewMenu()` |
| Operasi yang diuji | Keempatnya (melalui `cariRestoran()` dan `getDetailRestoran()`) |
| ID Algoritma yang tercakup | Algo-125, Algo-126, Algo-127, Algo-128 |
| Coverage (wajib ≥ 70%) | `pencarianController.ts`: 100% / 100% |

### 4.2.25 Kelas KeluhanController

**ID Kelas:** C41  
**Nama Kelas:** KeluhanController  
**Tingkat:** Mendalam

Tabel 4.2.25. Hasil Pengujian Unit Kelas C41

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan | Lokasi Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| C41-UT01 | `kirimKeluhan()` | Negatif | Kategori `Ngawur`, isi `pendek`. | 400 dengan galat pada kolom `isi` dan `kategori` | Sesuai | Pass | `src/tests/keluhan.test.ts:86` |
| C41-UT02 | `kirimKeluhan()`, `tanggapiKeluhan()` | Batas / Negatif | Isi tepat 500 karakter; lalu tanggapan kosong; lalu tanggapan untuk ID `KLH-tidak-ada`. | 500 karakter diterima (status `BARU`); tanggapan kosong 400; ID tidak ada 404 | Sesuai | Pass | `src/tests/keluhan.test.ts:92` |
| C41-UT03 | `kirimKeluhan()` | Negatif | Akun admin mencoba mengirim keluhan. | 403, karena hanya pelanggan yang boleh mengirim keluhan | 403 | Pass | `src/tests/keluhan.test.ts:105` |
| C41-UT04 | `kirimKeluhan()` | Normal / Batas | `keluhan.test.ts › keluhan dikirim, dibaca, dan ditanggapi admin`. Keluhan kategori `Pelayanan` dengan pesanan terkait; lalu isi 501 karakter. | Keluhan berstatus `BARU` dan terhubung ke restoran pesanan; isi 501 karakter ditolak 400 | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C41-UT05 | `detailKeluhan()` | Normal | Admin membuka detail keluhan tersebut. | Status berubah menjadi `DIBACA` | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C41-UT06 | `tanggapiKeluhan()` | Normal | Admin mengirim tanggapan. | Status `DITANGGAPI` | Sesuai | Pass | `src/tests/keluhan.test.ts:31` |
| C41-UT07 | `tampilkanKeluhan()` | Normal | `keluhan.test.ts › filter keluhan Ditanggapi…`. Filter status `DITANGGAPI`. | Semua keluhan pada hasil berstatus `DITANGGAPI` dan keluhan yang baru ditanggapi ikut tampil | Sesuai | Pass | `src/tests/keluhan.test.ts:63` |
| C41-UT08 | `tanggapiKeluhan()` | Normal | Daftar notifikasi pelanggan setelah keluhannya ditanggapi. | Ada notifikasi berjudul "…ditanggapi" untuk pelanggan | Sesuai | Pass | `src/tests/keluhan.test.ts:63` |

Tidak diuji secara unit: `keluhanSaya()` (baris 39-41), yaitu daftar keluhan milik pelanggan yang teruji lewat UC13.

Tabel 4.2.25b. Ringkasan Cakupan Kelas C41

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | `kirimKeluhan()`, `tampilkanKeluhan()`, `tanggapiKeluhan()` |
| Operasi yang diuji | Ketiganya, ditambah `detailKeluhan()` |
| ID Algoritma yang tercakup | Algo-139, Algo-140, Algo-141 |
| Coverage (wajib ≥ 70%) | `keluhanController.ts`: 95,77% / 94,44% |

<br>

## 4.3 Pengujian Integrasi

Pengujian integrasi memeriksa interaksi antarkomponen yang melewati batas, yaitu *Controller* ke *Model*, aplikasi ke basis data, dan aplikasi ke sistem eksternal. Daftar antarmuka mengacu pada dokumen DPPL, dengan minimal satu test case untuk setiap antarmuka. Pengujian memakai komponen nyata, bukan *mock*. Apabila ada antarmuka tambahan yang belum didaftarkan pada dokumen DPPL, cantumkan juga.

Tabel 4.3.1. Daftar Antarmuka Antarkomponen

| ID Antarmuka | Nama Antarmuka | Komponen Asal | Komponen Tujuan | Jenis Batas | Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| *I-01* | *Registrasi Akun* | *AutentikasiController* | *ModelAkun (Pengguna, Pelanggan) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC01, INT-TC02* |
| *I-02* | *Login* | *AutentikasiController* | *SesiPengguna dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC01* |
| *I-03* | *Profil Akun* | *AutentikasiController* | *ModelAkun, SesiPengguna, dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC01, INT-TC03* |
| *I-04* | *Dialog Konfirmasi Keluar* | *AutentikasiController (logout)* | *SesiPengguna dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC03* |
| *I-05* | *Beranda & Pencarian Restoran* | *PencarianController* | *ModelRestoran, ModelAntrean, dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC04, INT-TC05, INT-TC22* |
| *I-06* | *Detail Restoran & Menu* | *PencarianController* | *ModelRestoran (Menu, Kuota) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC04, INT-TC05, INT-TC23* |
| *I-07* | *Keranjang & Mode Layanan* | *PemesananController* | *ModelPesanan, ModelRestoran (Menu), dan BasisDataPostgreSQL* | *Controller - Model - Basis data; Klien - Server (REST API)* | *INT-TC06, INT-TC07, INT-TC09, INT-TC29, INT-TC30, INT-TC31* |
| *I-08* | *Pilih Jadwal Booking* | *PemesananController* | *ModelPesanan (slot booking) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC08, INT-TC10* |
| *I-09* | *Pembayaran* | *MetodePembayaranController* | *PaymentGatewayAdapter, Payment Gateway (sandbox), dan BasisDataPostgreSQL* | *Aplikasi - Sistem eksternal* | *INT-TC11, INT-TC12, INT-TC13, INT-TC14, INT-TC15, INT-TC16, INT-TC17, INT-TC30, INT-TC36* |
| *I-10* | *Tiket Antrean* | *MetodePembayaranController* | *ModelAntrean (TiketAntrean) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC12, INT-TC18, INT-TC30* |
| *I-11* | *Status Antrean* | *PemantauAntreanController* | *ModelAntrean, ModelPesanan, dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC20* |
| *I-12* | *Formulir Keluhan* | *KeluhanController* | *ModelKeluhan dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC28* |
| *I-13* | *Pendaftaran Mitra* | *PengajuanMitraController* | *ModelRestoran (PengajuanMitra, DokumenVerifikasi) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC25, INT-TC26, INT-TC37* |
| *I-14* | *Dashboard & Kelola Antrean* | *KelolaAntreanController, PemantauAntreanController* | *ModelAntrean, kanal real-time (SSE), dan BasisDataPostgreSQL* | *Controller - Model dan kanal real-time* | *INT-TC19, INT-TC20, INT-TC21* |
| *I-15* | *Dialog Konfirmasi Dequeue* | *KelolaAntreanController* | *ModelAntrean dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC20* |
| *I-16* | *Pengaturan Kuota & Meja* | *PengaturanKuotaController* | *ModelRestoran (Kuota), ModelAntrean, dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC22* |
| *I-17* | *Pengaturan Menu & Stok* | *KelolaMenuController* | *ModelRestoran (Menu) dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC23* |
| *I-18* | *Verifikasi Pengajuan Mitra* | *PengajuanMitraController* | *ModelRestoran, NotifikasiEmail, dan Layanan Email* | *Controller - Model dan Aplikasi - Sistem eksternal* | *INT-TC24, INT-TC25, INT-TC26* |
| *I-19* | *Daftar Keluhan* | *KeluhanController* | *ModelKeluhan dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC28* |
| *I-20* | *Kelola Restoran Mitra* | *KelolaDataRestoranController* | *ModelRestoran, ModelAntrean, dan NotifikasiEmail* | *Controller - Model dan Aplikasi - Sistem eksternal* | *INT-TC27* |
| *I-21* | *Dialog Konfirmasi Hapus Restoran* | *KelolaDataRestoranController* | *ModelRestoran, ModelAntrean, dan BasisDataPostgreSQL* | *Controller - Model - Basis data* | *INT-TC27* |
| *Lapisan data* | *Seluruh antarmuka* | *Seluruh Model* | *BasisDataPostgreSQL* | *Aplikasi - Basis data* | *INT-TC32, INT-TC33, INT-TC34, INT-TC35* |

Tabel 4.3.2. Hasil Pengujian Integrasi

| ID Pengujian | ID Antarmuka | Skenario | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *INT-TC01* | *I-01, I-02* | *Normal: registrasi dan login* | *Panggil `createAccount()` dengan data valid, lalu `validation()`; baca tabel `pengguna`, `pelanggan`, `sesi_pengguna`* | *Akun berperan PELANGGAN tersimpan dengan kata sandi ter-hash bcrypt, profil pelanggan terbentuk, sesi aktif tercatat* | *Sesuai: data tersimpan pada ketiga tabel, kata sandi berformat bcrypt, sesi aktif* | *Pass* |
| *INT-TC02* | *I-01* | *Gagal: email sudah terdaftar* | *Registrasi dengan email `pelanggan@antri.in`* | *Ditolak 409; jumlah baris `pengguna` dan `pelanggan` tidak berubah* | *Sesuai: status 409, jumlah baris tetap* | *Pass* |
| *INT-TC03* | *I-03, I-04* | *Normal: logout* | *Login, lalu `processLogout()`; baca `sesi_pengguna`* | *Sesi tidak lagi aktif dan token tidak valid* | *Sesuai: tidak ada sesi aktif, `validateSession()` mengembalikan null* | *Pass* |
| *INT-TC04* | *I-05, I-06* | *Normal: pencarian dan detail restoran* | *`cariRestoran({q:'bakso'})` dan `getDetailRestoran()`; bandingkan dengan tabel `restoran`, `menu`, `pengaturan_kuota`* | *Hasil sama dengan isi tabel; jumlah menu dan kuota sesuai basis data* | *Sesuai: nama, status aktif, jumlah menu, dan kuota sama dengan basis data* | *Pass* |
| *INT-TC05* | *I-05, I-06* | *Alternatif: restoran nonaktif* | *Set `status_aktif = false` melalui SQL, lalu cari dan buka detail* | *Tidak muncul pada pencarian; detail 404* | *Sesuai: hilang dari hasil, detail 404* | *Pass* |
| *INT-TC06* | *I-07* | *Normal: buat pesanan takeaway* | *`buatPesanan()` 2 porsi; baca `pesanan`, `detail_pesanan`, `menu`* | *Status MENUNGGU_PEMBAYARAN, total = subtotal + biaya layanan, detail tersimpan, stok belum berkurang* | *Sesuai: nilai total, detail, dan stok sama dengan harapan* | *Pass* |
| *INT-TC07* | *I-07* | *Alternatif 3: stok tidak cukup* | *Pesan melebihi stok* | *Ditolak 409 beserta daftar menu habis; tidak ada pesanan baru; stok tetap* | *Sesuai: 409, jumlah baris `pesanan` dan stok tidak berubah* | *Pass* |
| *INT-TC08* | *I-08* | *Alternatif 5: booking lebih dari 7 hari* | *Booking tanggal hari ini + 8* | *Ditolak 400 dengan pesan maksimal 7 hari; tidak tersimpan* | *Sesuai: 400, pesan memuat "maksimal 7 hari", tidak ada baris baru* | *Pass* |
| *INT-TC09* | *I-07* | *Gagal: satu menu tidak valid pada pesanan* | *Dua item: satu valid, satu ID menu tidak ada* | *Ditolak 409; tidak ada baris `pesanan` maupun `detail_pesanan`* | *Sesuai: tidak ada data parsial* | *Pass* |
| *INT-TC10* | *I-08* | *Alternatif 2: booking tempat* | *Booking besok pukul 12:00 pada restoran yang antreannya ditutup; baca `pesanan` dan `getSlotBooking()`* | *Mode, rombongan, tanggal, dan slot tersimpan; slot terpakai bertambah 1* | *Sesuai: data tersimpan dan slot terpakai bertambah 1* | *Pass* |
| *INT-TC11* | *I-09* | *Normal: membuat tagihan* | *`buatTagihan()` metode EWALLET; baca `pembayaran` dan `gateway_transaksi`* | *Kode bayar, jumlah, dan status MENUNGGU konsisten di kedua sisi* | *Sesuai: order id, kode bayar, jumlah, metode, dan status sama* | *Pass* |
| *INT-TC12* | *I-09, I-10* | *Normal: gateway melunasi (webhook)* | *Setujui pembayaran e-wallet di gateway; baca seluruh tabel terkait* | *Pembayaran LUNAS; stok berkurang; riwayat transaksi dicatat; pesanan DIKONFIRMASI; tiket antrean terbit; notifikasi restoran bertambah 1* | *Sesuai pada seluruh tabel* | *Pass* |
| *INT-TC13* | *I-09* | *Alternatif 4: gateway menolak kartu* | *Bayar dengan kartu uji yang ditolak* | *Pembayaran GAGAL; pesanan DIBATALKAN; tanpa tiket dan riwayat; stok tetap* | *Sesuai* | *Pass* |
| *INT-TC14* | *I-09* | *Alternatif 4: pembayaran melewati batas waktu* | *Majukan batas waktu, bayar via virtual account, lalu `verifikasiPembayaran()`* | *410; pembayaran KEDALUWARSA; pesanan DIBATALKAN; dana dikembalikan di gateway; tanpa tiket* | *Sesuai: status gateway DIKEMBALIKAN* | *Pass* |
| *INT-TC15* | *I-09* | *Gagal: tanda tangan webhook tidak valid* | *POST `/api/pembayaran/notifikasi` dengan `X-Signature` salah* | *Ditolak 401; pembayaran dan pesanan tidak berubah* | *Sesuai: 401, status tetap MENUNGGU* | *Pass* |
| *INT-TC16* | *I-09* | *Normal: webhook GAGAL bertanda tangan sah* | *POST notifikasi status GAGAL dengan HMAC valid* | *Diterima 200; pembayaran GAGAL; pesanan DIBATALKAN* | *Sesuai* | *Pass* |
| *INT-TC17* | *I-09* | *Alternatif 3: stok habis saat pembayaran diproses* | *Kurangi stok menjadi 1, lalu bayar pesanan 2 porsi* | *Dana dikembalikan; pesanan DIBATALKAN; transaksi di-rollback (tanpa riwayat/tiket); stok tidak negatif* | *Sesuai: gateway DIKEMBALIKAN, stok tetap 1* | *Pass* |
| *INT-TC36* | *I-09* | *Alternatif 5: pelanggan membatalkan pesanan sebelum membayar* | *`batalkanPesanan()` pada pesanan dengan tagihan virtual account MENUNGGU; lalu pelanggan mentransfer ke gateway; baca `pesanan`, `pembayaran`, `gateway_transaksi`* | *Pesanan DIBATALKAN; pembayaran GAGAL; transaksi gateway GAGAL; transfer susulan ditolak 409; tanpa tiket dan riwayat; stok tetap* | *Sesuai* | *Pass* |
| *INT-TC18* | *I-10* | *Normal: dua pembayaran berturut-turut* | *Dua pelanggan membayar pada restoran yang sama* | *Nomor urut tiket berurutan; `total_antrean` bertambah 2* | *Sesuai* | *Pass* |
| *INT-TC19* | *I-14* | *Normal: pembaruan real-time* | *Buka kanal SSE restoran, lalu bayar pesanan* | *Event `tiket-baru` diterima kanal* | *Sesuai: event diterima* | *Pass* |
| *INT-TC20* | *I-11, I-14, I-15* | *Normal: dequeue manual* | *`processDequeue()` pada pelanggan terdepan; baca `tiket_antrean` dan `antrean`; pelanggan memantau status* | *Tiket SELESAI; `nomor_dilayani` +1; `total_antrean` -1; tiket berikutnya DIPANGGIL; sisa antrean pelanggan berkurang 1* | *Sesuai* | *Pass* |
| *INT-TC21* | *I-14* | *Alternatif 2: pelanggan tidak hadir* | *Tiket dipanggil 31 menit lalu; jalankan `autoDequeue()`* | *Restoran diproses dan tiket berstatus DILEWATI* | *Sesuai* | *Pass* |
| *INT-TC22* | *I-16* | *Alternatif 2: menutup antrean (kuota 0)* | *`onSaveSettings()` kuota 0; cek pencarian dan pemesanan; lalu buka kembali* | *Kuota 0 tersimpan; antrean TUTUP; pencarian menampilkan TUTUP; takeaway ditolak 409; setelah dibuka kembali BUKA* | *Sesuai* | *Pass* |
| *INT-TC23* | *I-17* | *Normal: tambah, ubah stok, hapus menu* | *`handleAddMenu()`, `handleUpdateStok()`, `handleDeleteMenu()`; cek pencarian dan pemesanan; input tidak valid* | *Menu tersimpan dan tampil di pencarian; stok 0 menolak pemesanan; menu terhapus hilang dari pencarian; input salah 400 tanpa menyimpan* | *Sesuai* | *Pass* |
| *INT-TC24* | *I-18* | *Normal: pengajuan disetujui* | *`setujui()` pengajuan Surabi Enhaii; baca `pengajuan_mitra`, `restoran`, `pengaturan_kuota`, `antrean`, `log_notifikasi`* | *Restoran aktif beserta kuota dan antrean dibuat; akun tertaut; email diterima berstatus TERKIRIM* | *Sesuai* | *Pass* |
| *INT-TC25* | *I-13, I-18* | *Alternatif 1: pengajuan ditolak* | *`tolak()` dengan alasan; baca `pengajuan_mitra`, `notifikasi`, `log_notifikasi`* | *Status DITOLAK dan alasan tersimpan; notifikasi dalam aplikasi dibuat; email memuat alasan* | *Sesuai* | *Pass* |
| *INT-TC26* | *I-13, I-18* | *Gagal: layanan email tidak dapat dihubungi* | *Paksa pengiriman email gagal saat `tolak()`* | *Penolakan tetap tersimpan; log email berstatus GAGAL* | *Sesuai* | *Pass* |
| *INT-TC37* | *I-13* | *Normal dan gagal: pendaftaran mitra* | *`simpanPengajuan()` dengan dokumen berformat salah, lalu dokumen valid, lalu pengajuan ganda; baca `pengajuan_mitra` dan `dokumen_verifikasi`* | *Dokumen berformat salah ditolak 400 tanpa menyimpan; pengajuan valid tersimpan berstatus MENUNGGU beserta dokumen verifikasi; pengajuan ganda ditolak 409* | *Sesuai: 400 dan 409, satu baris pengajuan, dua dokumen PDF tersimpan* | *Pass* |
| *INT-TC27* | *I-20, I-21* | *Normal: hapus restoran* | *`hapusDataRestoran()` pada restoran dengan antrean aktif* | *Restoran dan menu nonaktif; antrean TUTUP; tiket aktif DIBATALKAN; pelanggan terdampak dan email pemilik tercatat; detail 404* | *Sesuai* | *Pass* |
| *INT-TC28* | *I-12, I-19* | *Normal: keluhan dan tanggapan* | *`kirimKeluhan()` terkait pesanan, lalu `tanggapiKeluhan()`* | *Keluhan BARU tersimpan beserta pelanggan, pesanan, dan restoran; status DITANGGAPI; pelanggan menerima notifikasi* | *Sesuai* | *Pass* |
| *INT-TC29* | *I-07* | *Gagal: tanpa token dan peran salah* | *POST `/api/pesanan` tanpa token dan dengan token restoran* | *401 dan 403; tidak ada pesanan tersimpan* | *Sesuai* | *Pass* |
| *INT-TC30* | *I-07, I-09, I-10* | *Normal: alur REST lengkap* | *Login, pesan, buat tagihan, bayar di gateway, verifikasi, lihat tiket* | *Pesanan MENUNGGU_PEMBAYARAN, lalu LUNAS dengan tiket tersimpan; tiket dapat dibaca (200)* | *Sesuai* | *Pass* |
| *INT-TC31* | *I-07* | *Gagal: pemetaan kesalahan bisnis ke HTTP* | *Pesan menu habis dan keranjang kosong lewat REST* | *409 dengan daftar menu habis; 400 untuk keranjang kosong* | *Sesuai* | *Pass* |
| *INT-TC32* | *Lapisan data* | *Gagal: constraint CHECK* | *Set stok = -1 melalui SQL* | *Ditolak basis data; stok tidak berubah* | *Sesuai* | *Pass* |
| *INT-TC33* | *Lapisan data* | *Gagal: kesalahan di tengah transaksi* | *`db.tx()` mengurangi stok lalu melempar error* | *Perubahan di-rollback; stok tetap* | *Sesuai* | *Pass* |
| *INT-TC34* | *Lapisan data* | *Normal: relasi ON DELETE CASCADE* | *Hapus baris `pesanan`* | *`detail_pesanan` dan `pembayaran` ikut terhapus* | *Sesuai* | *Pass* |
| *INT-TC35* | *Lapisan data* | *Normal: migrasi skema berulang* | *Jalankan `migrate()` kedua kalinya* | *Tanpa error; jumlah baris tabel tidak berubah* | *Sesuai* | *Pass* |

Ringkasan: 37 test case integrasi dijalankan dengan `node:test`; 37 Pass, 0 Fail. Bukti hasil aktual (keluaran test runner dan isi basis data) dilampirkan pada Subbab 4.6.

<br>

## 4.4 Pengujian Use Case

Pengujian use case dilakukan pada seluruh skenario normal dan alternatif sesuai Subbab 4.4 SKPL, dengan minimal satu test case untuk setiap skenario. Kolom ID KF menunjukkan KF yang diverifikasi oleh test case tersebut.

Pengujian ini berada pada tingkat **sistem**: aplikasi dirakit utuh (basis data dengan data contoh, *payment gateway sandbox*, dan notifikasi email), lalu diuji dari luar sesuai skenario use case pada SKPL. Test case dirancang dengan teknik kotak hitam:

- **Partisi ekuivalen.** Satu wakil untuk setiap kelompok masukan yang diperlakukan sama oleh spesifikasi, misalnya peran pengguna (pelanggan, restoran, admin), mode pemesanan (dine-in, takeaway, booking), dan metode pembayaran (e-wallet, virtual account, kartu).
- **Analisis nilai batas.** Batas yang disebut spesifikasi diuji di kedua sisinya, misalnya booking hari ke-7 dan ke-8, kata sandi 7 dan 8 karakter, stok 0 dan 1, rating 4,4 dan 4,5, dokumen tepat 5 MB dan sedikit di atasnya, serta kuota sama dengan dan lebih satu dari jumlah tiket hari ini.

Hasil yang diharapkan ditulis dari SKPL **sebelum** aplikasi dijalankan, bukan disalin dari keluaran aplikasi. Bila SKPL tidak menentukan suatu hasil, acuan lain (KF atau DPPL) disebutkan pada sel hasil yang diharapkan. Bila SKPL bermakna ganda, bacaan yang dipakai dicatat sebagai asumsi di bawah tabel use case yang bersangkutan.

Kolom Prosedur Pengujian ditulis sebagai langkah aktor. Langkah yang sama dijalankan otomatis oleh test di `src/tests/usecase.test.ts` (nama setiap test diawali ID pengujiannya, misalnya `[UC01-TC01]`) melalui REST API yang dipanggil antarmuka web, lalu diperiksa dari respons, data tersimpan, dan *event real-time*. Bagian hasil yang berupa tampilan (dialog konfirmasi, pesan, pengalihan halaman) dibuktikan dengan tangkapan layar antarmuka pada Subbab 4.6. Tiga test case yang hanya berupa menekan "Batal" pada dialog (UC06-TC02, UC12-TC02, UC15-TC02) tidak mengirim permintaan ke server, sehingga diuji lewat antarmuka.

Cara menjalankan pengujian use case: `cd src && npm test` (seluruh test), atau `npx tsx --test tests/usecase.test.ts` (hanya use case).

Lokasi file test: `src/tests/usecase.test.ts`.

Notasi H pada kolom Masukan berarti tanggal pelaksanaan pengujian (19 November 2026), dan H+7 berarti tujuh hari setelahnya. Batas waktu pembayaran (UC02-TC07) dan batas hadir 30 menit (UC06-TC03) tidak ditunggu sungguhan: stempel waktunya dimundurkan langsung di basis data, lalu pemeriksaan sistem dijalankan. Akun uji berasal dari data contoh, dengan kata sandi `pelanggan123` untuk pelanggan, `restoran123` untuk restoran, dan `admin12345` untuk admin.

### 4.4.1 Use Case Mencari dan Filter Resto

**ID Use Case:** UC01  
**Nama Use Case:** Mencari dan filter resto

Tabel 4.4.1. Hasil Pengujian Use Case UC01

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC01-TC01 | KF01 | Normal: cari dengan kata kunci | 1. Buka Beranda.<br>2. Ketik kata kunci pada kolom pencarian.<br>3. Klik "Cari". | Kata kunci: `bakso` | Daftar hasil memuat Bakso Mang Ujang dan tidak memuat restoran yang tidak berkaitan dengan bakso (mis. Kopi Senja Braga). | Hasil memuat Bakso Mang Ujang; Kopi Senja Braga tidak muncul. | Pass |
| UC01-TC02 | KF01 | Normal: filter rating (nilai batas 4,5) | 1. Buka Beranda.<br>2. Klik filter "Rating 4.5+". | Filter rating ≥ 4,5 | Restoran ber-rating tepat 4,5 (Kopi Senja Braga, Batagor Riri Viral) tetap tampil. Restoran ber-rating 4,4 (Martabak Kubang 99) dan 4,3 (Cilok Gang Senggol) tidak tampil. (Ambang 4,5 mengikuti filter "Rating 4.5+" pada rancangan antarmuka I-05.) | Kopi Senja Braga dan Batagor Riri Viral tampil; Martabak Kubang 99 dan Cilok Gang Senggol tidak tampil; semua hasil ber-rating ≥ 4,5. | Pass |
| UC01-TC03 | KF01 | Normal: filter jenis makanan | 1. Buka Beranda.<br>2. Klik filter kategori "Mie". | Kategori: Mie | Hanya restoran berkategori Mie (Mie Kocok Pak Haji) yang tampil. | Hasil hanya Mie Kocok Pak Haji. | Pass |
| UC01-TC04 | KF01, KF02 | Normal: membuka detail restoran (langkah 2) | 1. Lakukan UC01-TC01.<br>2. Klik kartu Bakso Mang Ujang. | Restoran: Bakso Mang Ujang | Halaman detail menampilkan informasi menu (nama, harga, ketersediaan), rating, ulasan, dan status antrean saat ini (jumlah antrean, estimasi tunggu, meja tersisa). | Detail memuat rating 4,8 beserta jumlah ulasan, status antrean, jumlah antrean, estimasi tunggu, meja tersisa, dan menu lengkap dengan harga dan stok; daftar ulasan dapat dimuat. | Pass |
| UC01-TC05 | KF02 | Normal: restoran yang belum disetujui admin | Prasyarat: pengajuan "Surabi Enhaii" masih menunggu verifikasi (data awal).<br>1. Buka Beranda.<br>2. Cari "Surabi". | Kata kunci: `Surabi` | Surabi Enhaii tidak tampil pada daftar restoran karena belum disetujui admin. (Setelah disetujui, lihat UC05-TC02.) | Hasil pencarian kosong. | Pass |
| UC01-TC06 | KF01 | Alternatif 1: hasil pencarian tidak ditemukan | 1. Buka Beranda.<br>2. Cari kata kunci yang tidak ada di sistem. | Kata kunci: `sushi` | Muncul pesan "Restoran tidak ditemukan" disertai daftar restoran lain secara default, diurutkan dari yang paling viral. | Hasil kosong; daftar saran terisi dan terurut dari skor viral tertinggi. Antarmuka menampilkan "Restoran tidak ditemukan" beserta restoran yang sedang viral. | Pass |
| UC01-TC07 | KF01 | Alternatif 1: mereset pencarian (langkah 2) | 1. Lakukan UC01-TC06.<br>2. Klik "Lihat semua ›" untuk mereset kata kunci dan filter. | - | Kembali ke langkah 1 skenario normal: daftar seluruh restoran aktif ditampilkan. | Seluruh 8 restoran aktif tampil kembali; Surabi Enhaii (belum disetujui) tidak termasuk. | Pass |

### 4.4.2 Use Case Melakukan Pemesanan dan Pembayaran Digital

**ID Use Case:** UC02  
**Nama Use Case:** Melakukan pemesanan dan pembayaran digital

Tabel 4.4.2. Hasil Pengujian Use Case UC02

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC02-TC01 | KF05, KF06, KF08, KF10, KF11, KF12 | Normal: dine-in, bayar e-wallet | Prasyarat: login sebagai `pelanggan@antri.in`.<br>1. Buka detail Bakso Mang Ujang, tambah menu dan atur jumlahnya.<br>2. Buka Keranjang, pilih "Dine-in", atur jumlah rombongan.<br>3. Klik "Lanjut ke pembayaran".<br>4. Pilih "E-wallet", klik "Bayar".<br>5. Bayar pada simulator e-wallet. | Bakso Urat × 2 (@Rp25.000), Es Teh Manis × 1 (@Rp6.000); dine-in, 2 orang; e-wallet | Menu tercatat di keranjang. Total tagihan Rp58.000 (subtotal Rp56.000 + biaya layanan Rp2.000 sesuai konfigurasi `BIAYA_LAYANAN`). Tagihan dan batas waktu pembayaran ditampilkan. Setelah lunas, tampil halaman tiket berisi ID pesanan, nomor antrean, dan rincian pesanan. | Pesanan tersimpan dengan subtotal Rp56.000, biaya layanan Rp2.000, dan total Rp58.000. Tagihan Rp58.000 terbit dengan batas waktu. Setelah lunas, tiket terbit memuat ID pesanan, nomor antrean, dan 2 item pesanan. | Pass |
| UC02-TC02 | KF07, KF10, KF13 | Normal: data pesanan tersimpan dan tampil di restoran | Prasyarat: catat stok Bakso Urat dan meja tersisa **sebelum** UC02-TC01.<br>1. Setelah UC02-TC01, login `bakso@antri.in`.<br>2. Buka "Dashboard Antrean" dan "Menu & Stok". | Pesanan dari UC02-TC01 | Pesanan UC02-TC01 tampil di dashboard restoran dengan nomor antrean dan rincian yang sama. Stok Bakso Urat berkurang tepat 2. Meja tersisa berkurang karena kuota meja dipotong oleh pesanan dine-in. | Pesanan tampil di dashboard restoran dengan rincian "Bakso Urat x2". Stok Bakso Urat berkurang 2 dan meja tersisa berkurang 1. | Pass |
| UC02-TC03 | KF06, KF08, KF11, KF12 | Alternatif 1: pre-order takeaway, bayar virtual account | 1. Buka detail Martabak Kubang 99 (restoran tanpa meja dine-in).<br>2. Tambah menu, pilih "Takeaway".<br>3. Pilih "Virtual account", bayar nominal yang tepat. | Martabak Telor Spesial × 1 (@Rp45.000); takeaway; VA Rp47.000 | Pesanan diproses tanpa pemeriksaan kuota meja. Setelah lunas, tampil nomor panggilan pengambilan, ID pesanan, dan bukti pembayaran. | Restoran berkapasitas meja 0 tetap menerima takeaway. Total Rp47.000 lunas lewat VA. Tiket takeaway bernomor terbit beserta bukti pembayaran. | Pass |
| UC02-TC04 | KF06, KF09, KF10 | Alternatif 2: booking tempat pada batas H+7, bayar kartu | 1. Buka detail Bakso Mang Ujang, tambah menu.<br>2. Pilih "Booking tempat", tanggal H+7, slot 19:00, 2 kursi.<br>3. Bayar dengan kartu. | Mie Bakso × 2 (@Rp22.000); booking H+7 pukul 19:00; kartu | Tanggal H+7 (batas terakhir yang sah) diterima. Setelah lunas, kuota meja pada jadwal tersebut terkunci dan tampil bukti reservasi berisi nomor booking, jadwal, dan rincian pesanan. | Booking H+7 pukul 19:00 diterima dan lunas (Rp46.000). Tiket berstatus Terjadwal sebagai bukti reservasi; slot 19:00 tercatat terpakai 1. | Pass |
| UC02-TC05 | KF07 | Alternatif 3: stok menu habis saat checkout | 1. Pelanggan menambahkan menu ke keranjang.<br>2. Restoran mengubah stok menu itu menjadi 0.<br>3. Pelanggan klik "Lanjut ke pembayaran".<br>4. Pelanggan menghapus menu yang habis, lalu lanjut lagi. | Bakso Mercon × 1 dan Es Teh Manis × 1; stok Bakso Mercon diubah ke 0 | Langkah 3: checkout ditolak, menu ditandai habis, muncul pesan "Mohon maaf, terdapat menu pilihan yang telah habis". Langkah 4: total tagihan diperbarui dan pemesanan dapat dilanjutkan. | Langkah 3 ditolak dengan pesan "Mohon maaf, terdapat menu pilihan yang telah habis" dan Bakso Mercon ditandai habis. Langkah 4: total menjadi Rp8.000 dan pesanan tersimpan. | Pass |
| UC02-TC06 | KF07 | Alternatif 3: jumlah pesanan melebihi stok (nilai batas) | 1. Restoran mengubah stok menu menjadi 2.<br>2. Pelanggan memesan 3 porsi.<br>3. Pelanggan menurunkan jumlah menjadi 2. | Mie Bakso Komplit: jumlah 3 lalu 2; stok 2 | Jumlah 3 (stok + 1) ditolak dengan pesan menu habis dan keterangan sisa stok. Jumlah 2 (sama dengan stok) diterima. | Jumlah 3 ditolak dengan pesan menu habis dan sisa stok 2; jumlah 2 diterima. | Pass |
| UC02-TC07 | KF12 | Alternatif 4: batas waktu pembayaran habis | 1. Buat pesanan takeaway, pilih metode, klik "Bayar".<br>2. Biarkan pembayaran tidak diselesaikan hingga batas waktu terlewati (stempel batas waktu tagihan dimundurkan).<br>3. Periksa status pembayaran dan pesanan. | Seblak Original × 1; takeaway; e-wallet tidak dibayar | Muncul pesan "Batas waktu pembayaran habis. Transaksi dibatalkan". Pesanan berstatus dibatalkan dan tidak ada tiket antrean yang terbit. | Verifikasi pembayaran menjawab "Batas waktu pembayaran habis. Transaksi dibatalkan". Pesanan berstatus Dibatalkan dan tidak memiliki tiket. | Pass |
| UC02-TC08 | KF12 | Alternatif 4: pembayaran gagal (ditolak) | 1. Buat pesanan takeaway, pilih "E-wallet", klik "Bayar".<br>2. Pada simulator e-wallet, klik "Tolak". | Seblak Original × 1; takeaway; e-wallet ditolak | Pesanan dibatalkan, tidak ada tiket antrean yang terbit, dan muncul pesan bahwa transaksi gagal/dibatalkan (lihat asumsi A2). | Status pembayaran Gagal; pesanan Dibatalkan dan tidak memiliki tiket. | Pass |
| UC02-TC09 | KF09 | Alternatif 5: tanggal booking melebihi 7 hari (nilai batas H+8) | 1. Pilih "Booking tempat", periksa tanggal terakhir yang dapat dipilih.<br>2. Kirim permintaan booking H+8 langsung ke server. | Tanggal H+8, slot 19:00, 2 kursi | Tanggal H+8 tidak dapat dipilih. Permintaan langsung ke server ditolak dengan pesan bahwa reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan, dan tidak ada pesanan yang tersimpan. | Semua slot H+8 berstatus tidak tersedia. Permintaan langsung ditolak dengan pesan "Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan"; jumlah pesanan tidak bertambah. | Pass |
| UC02-TC10 | KF09 | Alternatif 5: slot booking sudah penuh | Prasyarat: kapasitas meja Bakso Mang Ujang diubah menjadi 1; `dinda@contoh.id` sudah booking H+2 pukul 19:00 dan lunas.<br>1. Pelanggan memilih H+2, slot 19:00.<br>2. Pelanggan memilih slot 20:00. | Tanggal H+2; slot 19:00 lalu 20:00 | Slot 19:00 ditolak dan muncul pesan bahwa kuota meja pada jam tersebut telah penuh. Slot 20:00 dapat dipilih. | Slot 19:00 berstatus "Penuh"; pemesanan pada slot itu ditolak dengan pesan "Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan atau kuota meja pada jam tersebut telah penuh". Slot 20:00 tersedia dan diterima. | Pass |

Asumsi dan catatan UC02:

- **A1.** "Maksimal 7 hari ke depan" (KF09) dibaca inklusif: H+7 sah dan H+8 tidak sah.
- **A2.** SKPL alternatif 4 memakai satu pesan, "Batas waktu pembayaran habis. Transaksi dibatalkan", untuk dua kejadian berbeda, yaitu kedaluwarsa dan gagal. Pesan tersebut dipakai sebagai acuan UC02-TC07. Untuk UC02-TC08, hasil yang diharapkan adalah pembatalan pesanan tanpa tiket. Usulan: teks SKPL alternatif 4 dipisahkan untuk kedua kejadian tersebut.
- **C1.** Durasi batas waktu pembayaran (5 menit pada KNF07, sedangkan nilai bawaan `PAYMENT_TIMEOUT_MINUTES` adalah 15) diverifikasi pada Subbab 4.5, bukan di sini.

### 4.4.3 Use Case Menampilkan Status Antrean

**ID Use Case:** UC03  
**Nama Use Case:** Menampilkan status antrean

Tabel 4.4.3. Hasil Pengujian Use Case UC03

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC03-TC01 | KF03 | Normal: menampilkan informasi antrean (langkah 1) | 1. Login `pelanggan@antri.in`.<br>2. Buka "Antrean saya", pilih tiket di Bakso Mang Ujang. | Tiket A-007 (data awal) | Halaman status menampilkan nomor antrean pelanggan, nomor yang sedang dilayani, sisa antrean, estimasi waktu tunggu, dan rincian pesanan. | Status memuat nomor A-007, nomor yang sedang dilayani, sisa antrean 6, estimasi waktu tunggu, dan 2 item pesanan. | Pass |
| UC03-TC02 | KF03, KF17 | Normal: pembaruan otomatis (langkah 2) | 1. Biarkan halaman status terbuka.<br>2. Restoran melakukan dequeue pelanggan terdepan. | Satu kali dequeue | Tanpa memuat ulang halaman, sisa antrean pelanggan berkurang 1 dan nomor yang sedang dilayani berganti. | Kanal *real-time* (Server-Sent Events) menerima event "dequeue"; sisa antrean berkurang 1 dan nomor yang dilayani bertambah. | Pass |
| UC03-TC03 | KF03 | Normal: notifikasi giliran (langkah 2) | 1. Restoran melakukan dequeue berulang sampai tiket pelanggan menjadi terdepan.<br>2. Amati status dan notifikasi pelanggan. | Dequeue berulang | Saat tiket pelanggan menjadi terdepan, muncul notifikasi bahwa sudah giliran pelanggan untuk mengambil pesanan atau menuju restoran. | Tiket berstatus Dipanggil (giliranmu) dan notifikasi "Giliranmu! Nomor A-007 dipanggil" masuk ke pelanggan. | Pass |
| UC03-TC04 | KF03 | Normal: validasi ID antrean (partisi tidak sah) | 1. Login sebagai `dinda@contoh.id`.<br>2. Buka status tiket milik `pelanggan@antri.in`. | ID tiket milik pelanggan lain | Akses ditolak; informasi antrean dan pesanan milik pelanggan lain tidak ditampilkan. | Status maupun detail tiket ditolak (403) tanpa data antrean. | Pass |

### 4.4.4 Use Case Pendaftaran Mitra Restoran Baru

**ID Use Case:** UC04  
**Nama Use Case:** Pendaftaran mitra restoran baru

Tabel 4.4.4. Hasil Pengujian Use Case UC04

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC04-TC01 | KF14 | Normal: pendaftaran lengkap | Dijalankan setelah UC04-TC02 s.d. TC04, sekaligus sebagai langkah 3 alternatif 1 (data diperbaiki lalu dikirim ulang).<br>1. Login `mitrabaru@antri.in`, buka "Pendaftaran Mitra".<br>2. Isi seluruh formulir dan unggah dokumen.<br>3. Klik "Daftar". | Nama: Warung Nasi Ampera Uji; kategori: Nasi; area: Coblong; telepon: 081234567890; alamat: Jl. Dipatiukur No. 10, Bandung; NIB dan izin usaha: PDF; menu: Nasi Ampera Rp20.000 | Data tersimpan dengan status "Menunggu Verifikasi" dan muncul pesan bahwa pendaftaran berhasil. Pengajuan tampil di daftar verifikasi admin. | Pengajuan tersimpan berstatus Menunggu dan tampil di daftar verifikasi admin. | Pass |
| UC04-TC02 | KF14 | Alternatif 1: data tidak lengkap | 1. Isi formulir, kosongkan nama restoran dan jangan unggah NIB.<br>2. Klik "Daftar". | Nama restoran kosong; NIB tidak diunggah | Formulir tidak disimpan; kolom nama restoran dan NIB ditandai beserta masalahnya, dan muncul peringatan untuk melengkapi data. | Ditolak (400); kolom nama restoran dan NIB ditandai; pengajuan tidak tersimpan. | Pass |
| UC04-TC03 | KF14 | Alternatif 1: format dokumen tidak sesuai | 1. Isi formulir lengkap, unggah NIB berformat .docx.<br>2. Klik "Daftar". | NIB: berkas .docx | Formulir tidak disimpan; kolom NIB ditandai dengan keterangan format harus PDF/JPG/PNG (acuan format: DPPL kelas C13). | Ditolak (400); kolom NIB ditandai "NIB harus berformat PDF/JPEG/PNG"; tidak tersimpan. | Pass |
| UC04-TC04 | KF14 | Alternatif 1: ukuran dokumen di atas batas (nilai batas) | 1. Isi formulir lengkap, unggah NIB sedikit di atas 5 MB.<br>2. Klik "Daftar". | NIB: PDF 5.243.904 byte | Formulir tidak disimpan; kolom NIB ditandai bahwa ukuran melebihi 5 MB (batas 5 MB mengacu pada DPPL kelas C13). | Ditolak (400) dengan pesan umum "Ukuran berkas melebihi batas (dokumen maks. 5 MB, foto maks. 2 MB)" dan tidak tersimpan, **tetapi kolom NIB tidak ditandai**. | **Fail**. Batas 5 MB ditegakkan `multer` sebelum validasi formulir, sehingga galat tidak menandai kolom NIB. Solusi: `errorHandler` mengembalikan `fields` untuk kolom berkas yang melebihi batas (rincian di bawah tabel). |
| UC04-TC05 | KF14 | Normal: ukuran dokumen tepat di batas (nilai batas) | Prasyarat: daftarkan akun Restoran baru `resto.batas@contoh.id`, lalu login.<br>1. Isi formulir lengkap, unggah NIB tepat 5 MB.<br>2. Klik "Daftar". | NIB: PDF 5.242.880 byte | Dokumen diterima; pengajuan tersimpan dengan status "Menunggu Verifikasi". | Diterima; pengajuan tersimpan berstatus Menunggu. | Pass |

Penyebab Fail (UC04-TC04): batas ukuran berkas ditegakkan lebih dulu oleh `multer` (`limits.fileSize` pada `server/routes/mitra.ts`), sebelum validasi `DokumenVerifikasi.validasiFormat()`. Galat `LIMIT_FILE_SIZE` lalu dijawab oleh `server/middleware/errorHandler.ts` tanpa `fields`, sehingga formulir tidak dapat menandai kolom NIB seperti diminta SKPL alternatif 1 ("menandai bagian yang bermasalah"). Usulan: pada `errorHandler`, kembalikan juga `fields: { [err.field]: 'NIB melebihi ukuran maksimum 5 MB' }` (objek `MulterError` menyimpan nama kolom pada `err.field`), atau naikkan batas `multer` dan biarkan `validasiFormat()` yang menolak.

### 4.4.5 Use Case Memverifikasi Pendaftaran Restoran

**ID Use Case:** UC05  
**Nama Use Case:** Memverifikasi pendaftaran restoran

Tabel 4.4.5. Hasil Pengujian Use Case UC05

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC05-TC01 | KF15 | Normal: membuka detail pengajuan (langkah 1) | 1. Login `admin@antri.in`, buka "Verifikasi Mitra".<br>2. Pilih pengajuan Surabi Enhaii. | Pengajuan: Surabi Enhaii | Tampil rincian profil restoran, dokumen verifikasi (NIB dan izin usaha dapat dibuka), dan daftar menu yang diajukan (Surabi Oncom, Surabi Cokelat Keju). | Detail memuat alamat, email, telepon, dokumen NIB dan Izin usaha (terbuka sebagai PDF), serta menu Surabi Oncom dan Surabi Cokelat Keju. | Pass |
| UC05-TC02 | KF15, KF16, KF02 | Normal: menyetujui pengajuan (langkah 2) | 1. Klik "Setujui", lalu konfirmasi.<br>2. Periksa log email.<br>3. Sebagai pelanggan, cari "Surabi". | Pengajuan: Surabi Enhaii | Status pengajuan menjadi "Disetujui". Email penerimaan tercatat terkirim ke surabi@antri.in. Surabi Enhaii tampil di daftar restoran pelanggan (kebalikan UC01-TC05). | Status Disetujui; log email "MITRA_DITERIMA" ke surabi@antri.in berstatus Terkirim; Surabi Enhaii muncul di pencarian. | Pass |
| UC05-TC03 | KF15 | Alternatif 1: menolak tanpa alasan (partisi tidak sah) | 1. Pilih pengajuan Warung Nasi Ampera Uji.<br>2. Kosongkan alasan, klik "Tolak". | Alasan: kosong | Penolakan tidak diproses dan muncul pesan bahwa alasan penolakan wajib diisi; status tetap menunggu verifikasi. (Acuan: SKPL alternatif 1 langkah 2, admin memasukkan alasan penolakan.) | Ditolak (400) dengan kolom alasan ditandai; status tetap Menunggu. | Pass |
| UC05-TC04 | KF15, KF16 | Alternatif 1: menolak dengan alasan | 1. Isi alasan, klik "Tolak".<br>2. Periksa log email.<br>3. Login `mitrabaru@antri.in`, buka "Pendaftaran Mitra". | Alasan: "Dokumen NIB tidak terbaca, mohon unggah ulang." | Status pengajuan menjadi "Ditolak". Email penolakan beserta alasannya tercatat terkirim. Akun pemohon melihat alasan penolakan. Restoran tidak tampil di daftar pelanggan. | Status Ditolak; log email "MITRA_DITOLAK" memuat alasan; akun pemohon melihat status Ditolak beserta alasannya; restoran tidak muncul di pencarian. | Pass |

### 4.4.6 Use Case Mengelola Antrean

**ID Use Case:** UC06  
**Nama Use Case:** Mengelola antrean

Tabel 4.4.6. Hasil Pengujian Use Case UC06

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC06-TC01 | KF04, KF17 | Normal: dequeue pelanggan terdepan | 1. Login `bakso@antri.in`, buka "Dashboard Antrean".<br>2. Klik "Dequeue terdepan".<br>3. Klik "Ya, dequeue". | Pelanggan terdepan A-001 | Langkah 2: muncul pesan konfirmasi dequeue. Langkah 3: pelanggan terdepan hilang dari daftar, pelanggan berikutnya menjadi terdepan, dan jumlah antrean aktif berkurang 1. | Dialog "Dequeue antrean A-001?" tampil (bukti UI UC06-TC02). A-001 keluar dari daftar, A-002 menjadi terdepan berstatus Dipanggil, dan antrean aktif berkurang 1. | Pass |
| UC06-TC02 | KF04 | Alternatif 1: membatalkan dequeue | 1. Buka "Dashboard Antrean"; catat terdepan dan jumlah antrean.<br>2. Klik "Dequeue terdepan".<br>3. Klik "Batal". | - | Pesan konfirmasi tertutup; nomor terdepan dan jumlah antrean tidak berubah. | Dialog tertutup. Antrean aktif tetap 7 dan terdepan tetap A-001 (dicek lewat API sebelum dan sesudah). | Pass |
| UC06-TC03 | KF04, KF17 | Alternatif 2: pelanggan tidak hadir (dequeue otomatis, nilai batas waktu) | 1. Pelanggan terdepan sudah dipanggil tetapi tidak hadir; restoran tidak melakukan dequeue.<br>2. Periksa antrean saat 29 menit sejak dipanggil.<br>3. Periksa lagi saat 31 menit.<br>4. Pelanggan tersebut membuka status antreannya. | Batas hadir 30 menit (`AUTO_DEQUEUE_MINUTES`) | Sebelum batas waktu, pelanggan terdepan tetap di antrean. Setelah batas waktu terlewati, sistem melakukan dequeue otomatis, pelanggan berikutnya menjadi terdepan, dan status antrean di sisi pelanggan ikut diperbarui. | Pada 29 menit tiket tetap Dipanggil. Pada 31 menit tiket berubah menjadi Dilewati, pelanggan berikutnya dipanggil, dan status di sisi pelanggan menjadi Dilewati dengan sisa antrean 0. | Pass |

### 4.4.7 Use Case Mengatur Kuota Antrean dan Meja

**ID Use Case:** UC07  
**Nama Use Case:** Mengatur kuota antrean dan meja

Tabel 4.4.7. Hasil Pengujian Use Case UC07

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC07-TC01 | KF18 | Normal: mengubah kuota dan kapasitas meja | 1. Login `bakso@antri.in`, buka "Kuota & Meja".<br>2. Ubah nilai, klik "Simpan pengaturan".<br>3. Muat ulang; sebagai pelanggan buka detail Bakso Mang Ujang. | Kuota: 30 → 40; meja: 12 → 10 | Langkah 1: kuota dan kapasitas meja saat ini tampil. Langkah 2: nilai baru tersimpan. Langkah 3: nilai baru tetap tersimpan dan informasi meja di halaman pelanggan ikut berubah. | Nilai awal 30/12 tampil. Kuota 40 dan meja 10 tersimpan dan tetap setelah dibaca ulang. Halaman pelanggan menunjukkan kapasitas meja 10 dengan meja tersisa terhitung ulang. | Pass |
| UC07-TC02 | KF18 | Alternatif 1: kuota negatif, lalu diperbaiki | 1. Isi kuota -5, klik "Simpan pengaturan".<br>2. Perbaiki kuota menjadi 40, simpan. | Kuota: -5, lalu 40 | Langkah 1: pembaruan ditolak dan muncul peringatan agar kuota diisi dengan format yang valid; nilai tidak berubah. Langkah 2: nilai 40 tersimpan. | Ditolak dengan pesan "Input tidak valid. Masukkan angka bulat yang tidak negatif" dan kolom kuota ditandai; kuota tetap 40. Nilai 40 berhasil disimpan. | Pass |
| UC07-TC03 | KF18 | Alternatif 1: kuota bukan angka | 1. Isi kuota dengan teks, klik "Simpan pengaturan". | Kuota: `abc` | Pembaruan ditolak dan muncul peringatan format kuota tidak valid; nilai tidak berubah. | Ditolak (400) dengan kolom kuota ditandai; kuota tetap 40. | Pass |
| UC07-TC04 | KF18, KF08 | Alternatif 2: kuota 0 menutup antrean | 1. Isi kuota 0, simpan.<br>2. Sebagai pelanggan, buka detail restoran dan coba pesan dine-in dan takeaway. | Kuota: 0 | Tampilan kuota di sisi pelanggan berubah menjadi "Antrean penuh/Ditutup". Pesanan dine-in/takeaway baru ditolak. | Status antrean restoran menjadi Tutup. Pesanan dine-in dan takeaway ditolak dengan pesan "Antrean restoran sedang ditutup". | Pass |
| UC07-TC05 | KF18, KF08 | Alternatif 2: booking saat kuota 0 | 1. Dengan kuota 0, pelanggan memilih "Booking tempat" untuk H+1 pukul 12:00 dan melanjutkan ke pembayaran. | Kuota: 0; booking H+1 pukul 12:00 | Sesuai SKPL alternatif 2, "tidak ada antrean atau pesanan baru yang bisa masuk ketika kuota ditutup", sehingga booking ditolak (lihat asumsi A3). | **Booking diterima** (200) dan pesanan tersimpan menunggu pembayaran. | **Fail**. `buatPesanan()` tidak memeriksa status antrean untuk mode booking, sehingga booking tetap diterima saat kuota 0. Solusi: tolak booking saat antrean ditutup, atau revisi SKPL bila booking hari lain memang boleh (rincian di bawah tabel). |
| UC07-TC06 | KF18 | Alternatif 2: kuota sama dengan jumlah tiket hari ini (nilai batas) | 1. Catat jumlah tiket hari ini (T) di dashboard.<br>2. Isi kuota = T, simpan; coba pesan takeaway.<br>3. Isi kuota = T + 1, simpan; coba pesan lagi. | Kuota: T, lalu T + 1 | Kuota = T: status antrean penuh dan pesanan baru ditolak. Kuota = T + 1: status kembali dibuka dan pesanan baru dapat masuk. | Kuota = T: status Penuh dan takeaway ditolak dengan pesan "Kuota antrean restoran hari ini sudah penuh". Kuota = T + 1: status Buka dan takeaway diterima. | Pass |

Asumsi UC07:

- **A3.** SKPL alternatif 2 menyatakan tidak ada antrean atau pesanan baru yang bisa masuk saat kuota ditutup. Di sisi lain, kuota bersifat harian, sehingga booking untuk hari lain dapat dibaca sebagai pesanan di luar kuota hari ini. UC07-TC05 memakai bacaan SKPL apa adanya.

Penyebab Fail (UC07-TC05): `PemesananController.buatPesanan()` hanya memeriksa status antrean Tutup/Penuh untuk mode selain booking (`if (mode !== 'BOOKING')`), sehingga booking tetap diterima saat kuota 0. Usulan: tim memutuskan bacaan yang dipakai (asumsi A3). Bila mengikuti SKPL, tolak booking saat antrean ditutup. Bila booking hari lain memang tetap boleh, revisi teks SKPL UC07 alternatif 2, lalu ubah hasil yang diharapkan UC07-TC05 dan uji ulang.

### 4.4.8 Use Case Mengelola Stok dan Menu Makanan

**ID Use Case:** UC08  
**Nama Use Case:** Mengelola stok dan menu makanan

Tabel 4.4.8. Hasil Pengujian Use Case UC08

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC08-TC01 | KF07 | Normal: mengubah informasi menu | 1. Login `bakso@antri.in`, buka "Menu & Stok".<br>2. Ubah harga Mie Bakso, klik "Simpan".<br>3. Sebagai pelanggan, buka detail restoran. | Mie Bakso: Rp22.000 → Rp23.000 | Daftar menu, stok, dan harga tampil. Harga baru tersimpan dan tampil di halaman pelanggan. | Harga awal Rp22.000 tampil; harga Rp23.000 tersimpan dan tampil di halaman pelanggan. | Pass |
| UC08-TC02 | KF07 | Normal: mengubah stok | 1. Ubah kolom stok Bakso Mercon.<br>2. Muat ulang daftar menu. | Bakso Mercon: stok → 30 | Stok baru tersimpan dan tetap 30 setelah dimuat ulang. | Stok Bakso Mercon tersimpan 30. | Pass |
| UC08-TC03 | KF07 | Alternatif 1: menambah menu baru | 1. Klik "+ Tambah menu", isi formulir, simpan.<br>2. Sebagai pelanggan, buka detail restoran. | Bakso Keju; kategori Bakso; Rp30.000; stok 20 | Menu baru tersimpan, tampil di daftar menu restoran dan di halaman pelanggan. | Bakso Keju (Rp30.000, stok 20) tampil di daftar menu restoran dan halaman pelanggan. | Pass |
| UC08-TC04 | KF07 | Alternatif 2: menghapus menu | 1. Klik hapus pada Bakso Keju, konfirmasi.<br>2. Sebagai pelanggan, buka detail restoran. | Menu: Bakso Keju | Menu terhapus dari daftar restoran dan tidak lagi tampil di halaman pelanggan. | Bakso Keju hilang dari daftar menu restoran dan halaman pelanggan. | Pass |
| UC08-TC05 | KF07 | Alternatif 3: stok diubah menjadi 0 (nilai batas) | 1. Ubah stok Mie Bakso menjadi 0.<br>2. Sebagai pelanggan, coba pesan Mie Bakso. | Mie Bakso: stok 0 | Stok 0 langsung tersimpan. Halaman pelanggan menandai Mie Bakso habis dan menu tidak dapat dipesan. | Stok 0 tersimpan dan terlihat oleh pelanggan; pemesanan ditolak dengan pesan "Mohon maaf, terdapat menu pilihan yang telah habis". | Pass |
| UC08-TC06 | KF07 | Alternatif 3: stok 1 (nilai batas) | 1. Ubah stok Mie Bakso menjadi 1.<br>2. Pelanggan memesan 2 porsi, lalu 1 porsi. | Mie Bakso: stok 1 | Mie Bakso kembali tersedia dan dapat dipesan 1 porsi, tetapi tidak lebih dari 1. | Pesanan 2 porsi ditolak; pesanan 1 porsi diterima. | Pass |

### 4.4.9 Use Case Menampilkan Dashboard Antrean Restoran

**ID Use Case:** UC09  
**Nama Use Case:** Menampilkan dashboard antrean restoran

Tabel 4.4.9. Hasil Pengujian Use Case UC09

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC09-TC01 | KF13 | Normal: menampilkan daftar antrean (langkah 1) | Prasyarat: ada booking lunas H+1 pukul 12:00.<br>1. Login `bakso@antri.in`.<br>2. Buka "Dashboard Antrean". | - | Tampil daftar antrean beserta rincian pesanan, nomor antrean, kapasitas meja tersisa, dan meja yang sudah di-booking. | Dashboard memuat seluruh antrean aktif dengan nomor, nama pelanggan, mode, dan rincian pesanan; kapasitas meja 12 dan meja terisi; booking H+1 pukul 12:00 tampil. | Pass |
| UC09-TC02 | KF13 | Normal: pembaruan tanpa memuat ulang (langkah 2) | 1. Biarkan dashboard terbuka.<br>2. Pelanggan memesan takeaway dan membayar lunas. | Es Teh Manis × 1, takeaway | Antrean baru muncul di dashboard tanpa memuat ulang halaman. | Kanal *real-time* menerima event "tiket-baru" dan pesanan baru langsung ada di daftar antrean. | Pass |
| UC09-TC03 | KF13 | Alternatif 1: antrean kosong pada restoran baru | Prasyarat: Surabi Enhaii sudah disetujui.<br>1. Login `surabi@antri.in`.<br>2. Buka "Dashboard Antrean". | Restoran baru tanpa pesanan | Tampil pesan "Belum ada antrean saat ini". | Daftar antrean kosong (antrean aktif 0). Antarmuka menampilkan "Belum ada antrean saat ini". | Pass |

### 4.4.10 Use Case Registrasi Akun

**ID Use Case:** UC10  
**Nama Use Case:** Registrasi akun

Tabel 4.4.10. Hasil Pengujian Use Case UC10

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC10-TC01 | KF21 | Normal: registrasi pelanggan | 1. Buka halaman "Daftar".<br>2. Pilih peran Pelanggan, isi data, centang Syarat & Ketentuan.<br>3. Klik "Daftar". | Uji Pelanggan; uji.pelanggan@contoh.id; 081299990001; `rahasia123` | Formulir meminta nama lengkap, email, nomor telepon, dan kata sandi. Akun tersimpan, muncul notifikasi registrasi berhasil, dan pengguna diarahkan ke halaman login. | Akun tersimpan berperan Pelanggan dan dapat dipakai login. Antarmuka menampilkan "Registrasi berhasil. Silakan masuk." dan membuka halaman Masuk dengan email terisi. | Pass |
| UC10-TC02 | KF21 | Normal: registrasi restoran (partisi peran) | 1. Pilih peran Restoran, isi data, klik "Daftar".<br>2. Login dengan akun tersebut. | Uji Resto; uji.resto@contoh.id; 081299990002; `rahasia123` | Registrasi berhasil. Setelah login, akun berperan Restoran (diarahkan ke "Pendaftaran Mitra"). | Akun tersimpan berperan Restoran; login berhasil tanpa restoran tertaut (belum bermitra). | Pass |
| UC10-TC03 | KF21 | Alternatif 1: email sudah terdaftar | 1. Isi data dengan email terdaftar, klik "Daftar".<br>2. Klik tautan "Masuk". | Email: pelanggan@antri.in; telepon: 081299990003 | Pendaftaran ditolak dengan pesan "Email atau nomor telepon sudah terdaftar. Silakan gunakan akun lain atau lakukan login". Tautan "Masuk" mengarahkan ke halaman login. | Ditolak (409) dengan pesan tersebut; kolom email ditandai "Email sudah terdaftar". Tautan "Masuk" membuka halaman login. | Pass |
| UC10-TC04 | KF21 | Alternatif 1: nomor telepon sudah terdaftar | 1. Isi data dengan nomor telepon terdaftar, klik "Daftar". | Email: uji.telepon@contoh.id; telepon: 081200000001 | Pendaftaran ditolak dengan pesan yang sama seperti UC10-TC03; akun tidak tersimpan. | Ditolak (409) dengan pesan yang sama; kolom telepon ditandai; email tersebut tidak dapat dipakai login. | Pass |
| UC10-TC05 | KF21 | Alternatif 2: kata sandi 7 karakter (nilai batas) | 1. Isi data valid dengan kata sandi 7 karakter, klik "Daftar". | `abc1234` | Pendaftaran ditolak dengan pesan "Konfirmasi kata sandi tidak cocok atau kata sandi minimal 8 karakter". | Ditolak (400); kolom kata sandi memuat pesan tersebut. | Pass |
| UC10-TC06 | KF21 | Alternatif 2: kata sandi tepat 8 karakter (nilai batas) | 1. Isi data valid dengan kata sandi 8 karakter, klik "Daftar". | `abcd1234` | Pendaftaran berhasil (8 karakter memenuhi syarat minimal). | Registrasi berhasil. | Pass |
| UC10-TC07 | KF21 | Alternatif 2: konfirmasi kata sandi tidak cocok, lalu diperbaiki | 1. Isi konfirmasi kata sandi berbeda, klik "Daftar".<br>2. Perbaiki konfirmasi, klik "Daftar". | `rahasia123` dengan konfirmasi `rahasia124`, lalu `rahasia123` | Langkah 1: ditolak dengan pesan "Konfirmasi kata sandi tidak cocok atau kata sandi minimal 8 karakter". Langkah 2: pendaftaran berhasil. | Langkah 1 ditolak dengan pesan tersebut; langkah 2 berhasil. | Pass |

Catatan UC10:

- **C2.** SKPL Subbab 4.2 mencantumkan Admin sebagai aktor UC10, tetapi formulir registrasi hanya menyediakan peran Pelanggan dan Restoran; akun admin dibuat melalui data awal. Partisi peran Admin tidak dapat diuji melalui antarmuka. Hal ini perlu dikonfirmasi tim: revisi SKPL (admin tidak mendaftar sendiri) atau tambahkan mekanisme pembuatan akun admin.

### 4.4.11 Use Case Login Akun

**ID Use Case:** UC11  
**Nama Use Case:** Login akun

Tabel 4.4.11. Hasil Pengujian Use Case UC11

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC11-TC01 | KF21 | Normal: login pelanggan | 1. Buka halaman "Masuk".<br>2. Masukkan email dan kata sandi.<br>3. Klik "Masuk". | pelanggan@antri.in / pelanggan123 | Sesi terbentuk dan pengguna diarahkan ke Beranda pelanggan. | Sesi berperan Pelanggan terbentuk; antarmuka membuka Beranda. | Pass |
| UC11-TC02 | KF21 | Normal: login restoran (partisi peran) | Sama dengan UC11-TC01. | bakso@antri.in / restoran123 | Sesi terbentuk dan pengguna diarahkan ke "Dashboard Antrean". | Sesi berperan Restoran dengan restoran tertaut; antarmuka membuka Dashboard Antrean. | Pass |
| UC11-TC03 | KF21 | Normal: login admin (partisi peran) | Sama dengan UC11-TC01. | admin@antri.in / admin12345 | Sesi terbentuk dan pengguna diarahkan ke halaman admin ("Verifikasi Mitra"). | Sesi berperan Admin; antarmuka membuka Verifikasi Mitra. | Pass |
| UC11-TC04 | KF21 | Alternatif 1: kata sandi salah, lalu diperbaiki | 1. Masukkan kata sandi salah, klik "Masuk".<br>2. Masukkan kata sandi benar, klik "Masuk". | pelanggan@antri.in / pelanggan124, lalu pelanggan123 | Langkah 1: akses ditolak dengan pesan "Email atau kata sandi yang Anda masukkan salah". Langkah 2: login berhasil. | Langkah 1 ditolak (401) tanpa token dan pesan tersebut tampil di formulir; langkah 2 berhasil. | Pass |
| UC11-TC05 | KF21 | Alternatif 1: email tidak terdaftar | 1. Masukkan email tidak terdaftar, klik "Masuk". | tidakada@contoh.id / pelanggan123 | Akses ditolak dengan pesan yang sama seperti UC11-TC04. | Ditolak (401) dengan pesan yang sama. | Pass |

### 4.4.12 Use Case Keluar Akun

**ID Use Case:** UC12  
**Nama Use Case:** Keluar akun

Tabel 4.4.12. Hasil Pengujian Use Case UC12

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC12-TC01 | KF21 | Normal: pelanggan keluar akun | 1. Login `pelanggan@antri.in`, buka Profil.<br>2. Klik "Keluar dari akun".<br>3. Klik "Ya, keluar".<br>4. Buka `#/profil` lewat bilah alamat. | - | Langkah 2: muncul pesan konfirmasi keluar akun. Langkah 3: sesi dihapus dan pengguna diarahkan ke halaman login. Langkah 4: halaman profil tidak dapat dibuka dan pengguna diarahkan ke halaman login. | Dialog "Keluar dari akun?" tampil; setelah dikonfirmasi pengguna diarahkan ke halaman Masuk. Token lama ditolak (401), dan membuka Profil kembali diarahkan ke Masuk. | Pass |
| UC12-TC02 | KF21 | Alternatif 1: membatalkan keluar akun | 1. Buka Profil, klik "Keluar dari akun".<br>2. Klik "Batal".<br>3. Buka "Antrean saya". | - | Pesan konfirmasi tertutup, pengguna tetap di halaman Profil, dan sesi tetap aktif. | Dialog tertutup dan halaman Profil tetap tampil. Sesi masih berlaku (`/auth/me` 200) dan Antrean saya dapat dibuka. | Pass |
| UC12-TC03 | KF21 | Normal: restoran keluar akun (partisi peran) | 1. Login `bakso@antri.in`, buka "Akun".<br>2. Klik "Keluar dari akun", lalu "Ya, keluar". | - | Sesi dihapus dan pengguna diarahkan ke halaman login. | Logout berhasil; token lama ditolak (401) saat membuka dashboard restoran. | Pass |

### 4.4.13 Use Case Penyampaian Keluhan Pelanggan

**ID Use Case:** UC13  
**Nama Use Case:** Penyampaian keluhan pelanggan

Tabel 4.4.13. Hasil Pengujian Use Case UC13

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC13-TC01 | KF19 | Normal: mengirim keluhan | 1. Login `pelanggan@antri.in`, buka "Keluhan".<br>2. Pilih pesanan terkait dan kategori, isi keluhan.<br>3. Klik "Kirim keluhan". | Pesanan Bakso Mang Ujang; kategori Waktu tunggu; isi: "Estimasi 10 menit, tetapi saya menunggu 35 menit di lokasi." | Keluhan tersimpan, muncul pesan berhasil, dan keluhan tampil di "Keluhan saya" dengan status Baru sehingga dapat diperiksa admin. | Keluhan tersimpan berstatus Baru, tampil di "Keluhan saya" dan di daftar keluhan admin. | Pass |
| UC13-TC02 | KF19 | Normal: formulir tidak lengkap (partisi tidak sah) | 1. Jangan pilih kategori, isi keluhan sangat singkat.<br>2. Klik "Kirim keluhan". | Kategori kosong; isi: "Lama" | Keluhan tidak tersimpan; kolom kategori dan isi ditandai. (SKPL tidak menyebut validasi; acuan: DPPL kelas C41.) | Ditolak (400); kolom kategori dan isi ditandai; jumlah keluhan tidak bertambah. | Pass |

### 4.4.14 Use Case Penanggapan Keluhan Pelanggan

**ID Use Case:** UC14  
**Nama Use Case:** Penanggapan keluhan pelanggan

Tabel 4.4.14. Hasil Pengujian Use Case UC14

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC14-TC01 | KF19 | Normal: menampilkan daftar keluhan | 1. Login `admin@antri.in`.<br>2. Buka menu "Keluhan". | - | Tampil daftar keluhan dari semua pelanggan. | Daftar memuat keluhan dari data awal dan keluhan baru dari pelanggan. | Pass |
| UC14-TC02 | KF19 | Normal: membaca detail keluhan | 1. Klik salah satu keluhan berstatus Baru. | Keluhan baru | Detail keluhan tampil dan status berubah dari Baru menjadi Dibaca (acuan: aturan status keluhan pada DPPL kelas C30). | Detail tampil dan status menjadi Dibaca; status tersimpan (muncul pada filter Dibaca). | Pass |
| UC14-TC03 | KF19 | Normal: menanggapi keluhan | 1. Isi tanggapan, klik "Kirim tanggapan".<br>2. Sebagai pelanggan, buka "Keluhan". | "Mohon maaf, kami sudah menindaklanjuti restoran terkait." | Status keluhan menjadi Ditanggapi dan pelanggan melihat tanggapan admin. (Acuan: KF19, "admin dapat memproses keluhan".) | Status Ditanggapi; pelanggan melihat tanggapan tersebut pada "Keluhan saya". | Pass |

Catatan UC14:

- **C3.** Skenario UC14 pada SKPL hanya memuat langkah menampilkan daftar keluhan, sedangkan KF19 menyebut admin dapat memproses keluhan. UC14-TC02 dan TC03 mengacu pada KF19. Usulan: tambahkan langkah membaca dan menanggapi keluhan ke skenario UC14 pada SKPL.

### 4.4.15 Use Case Penghapusan Restoran

**ID Use Case:** UC15  
**Nama Use Case:** Penghapusan restoran

Tabel 4.4.15. Hasil Pengujian Use Case UC15

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC15-TC01 | KF20 | Normal: menghapus restoran | 1. Login `admin@antri.in`, buka "Kelola Restoran", pilih Seblak Teh Nining.<br>2. Klik "Hapus".<br>3. Klik "Hapus restoran" pada konfirmasi.<br>4. Sebagai pelanggan, cari "Seblak". | Restoran: Seblak Teh Nining | Langkah 1: tampil detail profil restoran beserta tombol "Hapus Restoran". Langkah 2: muncul pesan konfirmasi penghapusan. Langkah 3: muncul pesan "Restoran berhasil dihapus" dan status restoran menjadi nonaktif. Langkah 4: restoran tidak lagi tampil di daftar pelanggan. | Profil ringkas restoran (nama, area, kategori, rating, keluhan, tanggal bergabung, status) tampil dalam baris tabel beserta tombol "Hapus". Dialog konfirmasi tampil; setelah dikonfirmasi muncul "Restoran berhasil dihapus" dan status menjadi Nonaktif. Seblak Teh Nining tidak muncul di pencarian dan halaman detailnya tidak dapat dibuka (404). | Pass |
| UC15-TC02 | KF20 | Alternatif 1: membatalkan penghapusan | 1. Buka "Kelola Restoran", klik "Hapus" pada Cilok Gang Senggol.<br>2. Klik "Batal". | Restoran: Cilok Gang Senggol | Pesan konfirmasi tertutup, penghapusan dibatalkan, dan restoran tetap aktif serta tampil bagi pelanggan. | Dialog "Hapus Cilok Gang Senggol?" tertutup; Cilok tetap berstatus Aktif dan tetap muncul di pencarian pelanggan. | Pass |
| UC15-TC03 | KF20 | Normal: dampak pada antrean aktif | 1. Setelah UC15-TC01, login `seblak1@contoh.id` (sedang antre di Seblak Teh Nining).<br>2. Buka "Antrean saya" dan notifikasi. | Tiket aktif di Seblak Teh Nining | Antrean pelanggan dibatalkan dan pelanggan diberi tahu bahwa restoran dinonaktifkan. (SKPL tidak menyebut nasib antrean aktif; acuan: DPPL kelas C33.) | Tiket berstatus Dibatalkan dan hilang dari antrean aktif; notifikasi "Antrean di Seblak Teh Nining dibatalkan" diterima. | Pass |

Catatan UC15:

- **C4.** SKPL menyebut data restoran "dihapus dari database", sedangkan DPPL merancang penghapusan sebagai *soft delete* (`setSoftDelete()` pada kelas C02) agar riwayat pesanan tetap ada. Hasil UC15-TC01 karena itu diperiksa dari sisi yang terlihat pengguna: restoran nonaktif dan hilang dari daftar pelanggan. Usulan: selaraskan teks SKPL dengan rancangan DPPL.
- **C5.** SKPL menyebut "detail profil restoran", sedangkan antarmuka menampilkan profil ringkas restoran dalam baris tabel Kelola Restoran (tanpa halaman detail tersendiri). Informasi dan tombol hapus tetap tersedia, sehingga UC15-TC01 dinyatakan Pass.

<br>

## 4.5 Pengujian Kebutuhan Non-Fungsional (KNF)

Setiap KNF pada Tabel 3.2 SKPL diuji secara terukur berdasarkan parameter yang telah didefinisikan. Setiap pengujian memuat target terukur, metode dan alat yang sesuai dengan parameter (misalnya Chrome DevTools untuk *response time* dan inspeksi basis data untuk *security*), serta hasil aktual berupa angka atau data. KNF yang belum dipenuhi atau tidak diimplementasikan dicantumkan beserta alasan dan rencana perbaikan.

Tabel 4.5. Hasil Pengujian KNF

| ID Pengujian | ID KNF | Parameter | Target Terukur | Metode dan Alat | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *KNF01-TC01* | *KNF01* | *Availability* | *Seluruh data profil restoran, status antrean, dan menu tetap tersedia dan dapat diakses setiap saat* | *Uji persistensi data pada layar Beranda (`I-05`) sebelum dan sesudah restart server (`npm start`) pada Google Chrome* | *Seluruh daftar restoran beserta kategori, rating, dan detail menu tampil lengkap serta tetap persisten setelah server dimatikan dan dijalankan ulang* | *Pass* |
| *KNF02-TC01* | *KNF02* | *Response time* | *Waktu muat informasi daftar restoran dan detail restoran ≤ 1 detik (1.000 ms)* | *Pengukuran Fetch/XHR tanpa cache (5× muat ulang) menggunakan Google Chrome DevTools (Network) pada layar `I-05` dan `I-06`* | *Daftar restoran (`GET /api/restoran`): rata-rata 16,6 ms (maks 30 ms); Detail restoran (`GET /api/restoran/:id`): rata-rata 20,2 ms (maks 29 ms). Seluruhnya jauh di bawah ≤ 1.000 ms* | *Pass* |
| *KNF03-TC01* | *KNF03* | *Reliability* | *Sistem memberikan nomor antrean berbeda (`nomor_urut` unik, 0 duplikasi) saat transaksi terjadi bersamaan* | *Pengujian konkurensi otomatis (`tests/knf.test.ts` via `node:test`) dengan 7 pembayaran simultan (`Promise.all`) pada restoran yang sama* | *Kueri tabel `tiket_antrean` memverifikasi 7 pembayaran simultan menghasilkan tepat 7 tiket dengan `nomor_urut` unik berurutan tanpa tabrakan nomor* | *Pass* |
| *KNF04-TC01* | *KNF04* | *Ergonomy* | *Tampilan nomor antrean, nomor dilayani, sisa antrean, dan estimasi tunggu bersih serta mudah dibaca* | *Inspeksi antarmuka visual layar Status Antrean (`I-11`) pada resolusi desktop Google Chrome* | *Layar `I-11` menampilkan tipografi kontras tinggi untuk nomor antrean (`A-002`), nomor dilayani (`A-005`), sisa antrean (`3 antrean lagi`), estimasi (`± 9 menit`), dan bilah progres tanpa elemen mengganggu* | *Pass* |
| *KNF05-TC01* | *KNF05* | *Availability* | *Nomor antrean tetap tersimpan dan dapat diakses kembali setelah diterbitkan* | *Uji persistensi sesi pada layar Antrean Saya (`I-11`) dengan menutup aplikasi, logout, dan login ulang* | *Setelah aplikasi ditutup dan pengguna login kembali, seluruh tiket aktif (`A-036`, `A-001`, `A-002`, `A-007`) dan jadwal booking tetap tampil beserta posisi antrean terkininya* | *Pass* |
| *KNF06-TC01* | *KNF06* | *Reliability* | *Sistem mencegah 1 slot meja dipesan oleh 2 pelanggan berbeda pada tanggal dan jam yang sama* | *Pengujian race condition otomatis (`tests/knf.test.ts`) dengan `kapasitas_meja = 1` dan 2 permintaan booking paralel (`Promise.allSettled`) pada slot yang sama* | *Dari 2 permintaan booking bersamaan pada tanggal dan slot yang sama, 1 pesanan berhasil disimpan dan 1 pesanan ditolak (kueri `pesanan` mencatat tepat 1 booking aktif)* | *Pass* |
| *KNF07-TC01* | *KNF07* | *Availability* | *Batas waktu pembayaran pesanan berlaku selama 5 menit sejak tagihan dibuat* | *Inspeksi konfigurasi `src/server/config.ts` dan pengujian otomatis `tests/pembayaran.test.ts` (`KNF07-TC01`)* | *Nilai bawaan `config.paymentTimeoutMinutes` pada kode masih 15 menit, sehingga tidak memenuhi spesifikasi SKPL sebesar 5 menit* | *Fail* |
| *KNF08-TC01* | *KNF08* | *Security* | *Sistem menjaga kerahasiaan data finansial (tidak menyimpan nomor rekening bank, kartu, maupun nomor e-wallet)* | *Inspeksi skema basis data `src/server/db/schema.sql` pada tabel `pembayaran`, `riwayat_transaksi`, dan `pengguna`* | *Tabel `pembayaran` dan `riwayat_transaksi` hanya menyimpan `kode_bayar`, `tipe_pembayaran`, dan `jumlah` tanpa kolom nomor rekening/kartu/e-wallet, serta kata sandi disimpan dalam bentuk `password_hash`* | *Pass* |
| *KNF09-TC01* | *KNF09* | *Response time* | *Konfirmasi pembayaran dan penerbitan tiket otomatis selesai dalam waktu ≤ 10 detik (10.000 ms)* | *Pengukuran Fetch/XHR 5× transaksi lintas metode (3 E-Wallet, 1 Virtual Account, 1 Kartu + OTP) pada Google Chrome DevTools* | *Konfirmasi gateway + webhook rata-rata 44,8 ms (maks 52 ms), dan total hingga layar tiket (`I-10`) tampil rata-rata 90,8 ms (maks 115 ms) — seluruhnya ≤ 10 detik* | *Pass* |
| *KNF10-TC01* | *KNF10* | *Reliability* | *100% transaksi pembayaran valid (E-Wallet, VA, Kartu + OTP) terkonfirmasi tanpa gagal* | *Pengujian otomatis `tests/pembayaran.test.ts` (`C07-UT01`–`UT05`, `C08-UT02`) melalui AntriPay Sandbox* | *Seluruh skenario pembayaran valid pada E-Wallet, Virtual Account, dan Kartu + OTP berhasil terkonfirmasi `LUNAS` (`100%` sukses, `0` gagal) dan tercatat pada `riwayat_transaksi`* | *Pass* |
| *KNF10-TC02* | *KNF10* | *Reliability* | *Pembayaran tidak valid (nominal salah, OTP salah, kartu ditolak) ditangani dengan aman tanpa crash* | *Pengujian otomatis `tests/pembayaran.test.ts` (`C07-UT03`–`UT05`, `C06-UT10`, `C08-UT03`)* | *Pembayaran tidak valid ditolak dengan status `GAGAL`, membatalkan pesanan terkait, dan tidak tercatat sebagai transaksi lunas pada `riwayat_transaksi`* | *Pass* |
| *KNF11-TC01* | *KNF11* | *Availability* | *Calon mitra restoran dapat mengakses dan mengirimkan formulir pendaftaran kapan saja tanpa saling memblokir* | *Uji pengajuan pendaftaran mitra (`I-13`) secara berturut-turut oleh 2 akun mitra berbeda (Fikri Ganyang & Saingan Fik)* | *Kedua pengajuan berhasil dikirim dan tercatat bersamaan dengan status `Menunggu verifikasi` pada dashboard Admin (`I-18`) tanpa saling mengunci formulir* | *Pass* |
| *KNF12-TC01* | *KNF12* | *Response time* | *Admin dapat memeriksa dokumen dan mengirim respon verifikasi mitra dalam batas waktu maksimal ≤ 4 hari kerja* | *Uji pemeriksaan dokumen (`NIB` & `Izin usaha`) serta persetujuan mitra pada layar `I-18` dengan Chrome DevTools dan log server* | *Berkas PDF pendaftaran berhasil dibuka, aksi persetujuan (`setujui`) diproses dalam 179 ms, status berubah menjadi `Disetujui`, dan notifikasi email terkirim secara instan (jauh di bawah SLA ≤ 4 hari kerja)* | *Pass* |
| *KNF13-TC01* | *KNF13* | *Ergonomy* | *Pengguna baru mampu menyelesaikan alur pemesanan hingga melihat nomor antrean dalam waktu ≤ 8 menit* | *Uji kegunaan (usability testing) berwaktu terhadap 1 responden di luar tim pengembang (menjalankan aplikasi sesuai panduan `src/README.md`, lalu melakukan alur login, pencarian restoran, pemesanan & pembayaran, hingga memeriksa antrean)* | *Responden berhasil menyelesaikan seluruh alur dari login, mencari restoran, melakukan pemesanan dan pembayaran, hingga melihat nomor antrean dalam waktu sekitar 2 menit tanpa kendala (jauh di bawah batas ≤ 8 menit)* | *Pass* |
| *KNF14-TC01* | *KNF14* | *Reliability* | *Sistem memastikan 0 pesanan terkena double-charged saat terjadi pembayaran/notifikasi ganda* | *Pengujian idempotensi & konkurensi otomatis (`tests/knf.test.ts`) dengan panggilan `bayarEwallet` ganda bersamaan dan percobaan penagihan ulang* | *Panggilan pembayaran ganda bersamaan hanya mencatat tepat `1` baris pada `riwayat_transaksi` dan `1` tiket pada `tiket_antrean`, serta penagihan ulang ditolak dengan status `409` (`0` double-charge)* | *Pass* |

<br>

## 4.6 Tangkapan Layar dan Bukti Hasil Pengujian

Bukti pengujian dilampirkan sesuai ID Pengujian pada Subbab 4.2 sampai 4.5, berupa tangkapan layar aplikasi, keluaran *test runner*, laporan *coverage* untuk setiap kelas Mendalam, atau hasil alat ukur.

Tabel 4.6. Bukti Hasil Pengujian

| ID Pengujian | Bukti Hasil Pengujian |
| :--- | :--- |
| C01-UT01 – C01-UT03 (Pelanggan, 3 test case) | ![Bukti 1](assets/image-1.png) |
| C02-UT01 – C02-UT13 (Restoran, 10 test case) | ![Bukti 1](assets/image-2.png) ![Bukti 2](assets/image-3.png) ![Bukti 3](assets/image-4.png) ![Bukti 4](assets/image-6.png) ![Bukti 5](assets/image-7.png) ![Bukti 6](assets/image-8.png) ![Bukti 7](assets/image-9.png) ![Bukti 8](assets/image-10.png) ![Bukti 9](assets/image-11.png) ![Bukti 10](assets/c02_11_13.png) |
| C03-UT01 – C03-UT14 (Menu) | ![Bukti 1](assets/image-12.png) ![Bukti 2](assets/c03.png) |
| C04-UT01 – C04-UT10 (Antrean) | ![Bukti 1](assets/image-13.png) ![Bukti 2](assets/image-14.png) ![Bukti 3](assets/c04_20.png)|
| C05-UT01 – C05-UT11 (Keranjang) | ![Bukti 1](assets/image-15.png) |
| C06-UT01 – C06-UT15 (Pesanan) | ![Bukti 1](assets/image-16.png) ![Bukti 2](assets/image-17.png) ![Bukti 3](assets/c06.png) |
| C07-UT01 – C07-UT14 (MetodePembayaranController) | ![Bukti 1](assets/image-18.png) ![Bukti 2](assets/image-19.png) ![Bukti 3](assets/c07.png) |
| C08-UT01 – C08-UT03 (RiwayatTransaksi) | ![Bukti 1](assets/image-20.png) ![Bukti 2](assets/image-21.png) |
| C09-UT01 – C09-UT09 (TiketAntrean) | ![Bukti 1](assets/image-22.png) ![Bukti 2](assets/image-23.png) ![Bukti 3](assets/image-24.png) ![Bukti 4](assets/image-25.png) ![Bukti 3](assets/c04_20.png) |
| C10-UT01 – C10-UT04 (PemantauAntreanController) | ![Bukti 1](assets/image-27.png) ![Bukti 2](assets/image-28.png) |
| C12-UT01 – C12-UT11 (PengajuanMitraController) | ![Bukti 1](assets/image-30.png) ![Bukti 2](assets/c12_15.png) |
| C13-UT01 – C13-UT08 (DokumenVerifikasi) | ![Bukti 1](assets/image-31.png) |
| C14-UT01 – C14-UT02 (Admin) | ![Bukti 1](assets/image-32.png) |
| C15-UT01 – C15-UT05 (NotifikasiEmail) | ![Bukti 1](assets/image-33.png) |
| C16-UT01 – C16-UT08 (KelolaAntreanController) | ![Bukti 1](assets/image-34.png) ![Bukti 2](assets/image-35.png) ![Bukti 3](assets/c04_20.png) |
| C20-UT01 – C20-UT07 (Kuota) | ![Bukti 1](assets/image-36.png) ![Bukti 2](assets/image-37.png) ![Bukti 3](assets/c04_20.png) |
| C21-UT01 – C21-UT06 (PengaturanKuotaController) | ![Bukti 1](assets/image-38.png) ![Bukti 2](assets/image-39.png) |
| C24-UT01 – C24-UT08 (KelolaMenuController, 8 test case) | ![Bukti 1](assets/image-60.png) |
| C25-UT01 – C25-UT07 (Pengguna, 7 test case) | ![Bukti 1](assets/image-59.png) |
| C28-UT01 – C28-UT11 (AutentikasiController, 11 test case) | ![Bukti 1](assets/image-59.png) |
| C29-UT01 – C29-UT06 (SesiPengguna, 6 test case) | ![Bukti 1](assets/image-59.png) |
| C30-UT01 – C30-UT05 (Keluhan, 5 test case) | ![Bukti 1](assets/image-57.png) ![Bukti 2](assets/image-58.png) |
| C33-UT01 – C33-UT03 (KelolaDataRestoranController, 3 test case) | ![Bukti 1](assets/image-57.png) ![Bukti 2](assets/image-58.png) |
| C35-UT01 – C35-UT09 (PencarianController, 9 test case) | ![Bukti 1](assets/image-57.png) ![Bukti 2](assets/image-58.png) |
| C41-UT01 – C41-UT08 (KeluhanController, 8 test case) | ![Bukti 1](assets/image-57.png) ![Bukti 2](assets/image-58.png) |
| Coverage | <img width="1373" height="897" alt="image" src="https://github.com/user-attachments/assets/67adcd1e-c2ab-4f68-80fa-5a793f9de71c" /> <img width="1362" height="895" alt="image" src="https://github.com/user-attachments/assets/f548eb81-9ab4-4871-8428-254e4b1d54b2" />|
| INT-TC01 – INT-TC03 (I-01 s.d. I-04, AutentikasiController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152143.png) |
| INT-TC04 – INT-TC05 (I-05, I-06, PencarianController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152202.png) |
| INT-TC06 – INT-TC10 (I-07, I-08, PemesananController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152209.png) ![Bukti 2](assets/Screenshot%202026-11-20%20163157.png) ![Bukti 3](assets/Screenshot%202026-11-20%20163235.png) |
| INT-TC11 – INT-TC17, INT-TC36 (I-09, MetodePembayaranController dan Payment Gateway) | ![Bukti 1](assets/Screenshot%202026-11-20%20152218.png) ![Bukti 2](assets/Screenshot%202026-11-20%20152225.png) ![Bukti 3](assets/Screenshot%202026-11-20%20152232.png) ![Bukti 4](assets/Screenshot%202026-11-20%20163306.png) ![Bukti 5](assets/Screenshot%202026-11-20%20163325.png) ![Bukti 6](assets/Screenshot%202026-11-20%20163352.png) ![Bukti 7](assets/Screenshot%202026-11-20%20163428.png) |
| INT-TC18 – INT-TC19 (I-10, I-14, tiket antrean dan kanal real-time) | ![Bukti 1](assets/Screenshot%202026-11-20%20152238.png) ![Bukti 2](assets/Screenshot%202026-11-20%20163044.png) |
| INT-TC20 – INT-TC21 (I-11, I-14, I-15, KelolaAntreanController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152245.png) ![Bukti 2](assets/Screenshot%202026-11-20%20163025.png) |
| INT-TC22 – INT-TC23 (I-16, I-17, PengaturanKuotaController dan KelolaMenuController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152252.png) |
| INT-TC24 – INT-TC26, INT-TC37 (I-13, I-18, PengajuanMitraController dan NotifikasiEmail) | ![Bukti 1](assets/Screenshot%202026-11-20%20152300.png) |
| INT-TC27 (I-20, I-21, KelolaDataRestoranController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152306.png) |
| INT-TC28 (I-12, I-19, KeluhanController) | ![Bukti 1](assets/Screenshot%202026-11-20%20152328.png) |
| INT-TC29 – INT-TC31 (I-07, I-09, I-10, klien REST) | ![Bukti 1](assets/Screenshot%202026-11-20%20152321.png) |
| INT-TC32 – INT-TC35 (lapisan data Model dan basis data) | ![Bukti 1](assets/Screenshot%202026-11-20%20152316.png) |
| UC01-TC01 – UC01-TC07 (Mencari dan filter resto, keluaran test otomatis) | ![Keluaran test UC01](assets/UC01-test.png) ![UI UC01-TC06](assets/UC01-TC06-ui.png) |
| UC02-TC01 – UC02-TC10 (Pemesanan dan pembayaran digital, keluaran test otomatis) | ![Keluaran test UC02](assets/UC02-test.png) |
| UC03-TC01 – UC03-TC04 (Menampilkan status antrean, keluaran test otomatis) | ![Keluaran test UC03](assets/UC03-test.png) |
| UC04-TC01 – UC04-TC05 (Pendaftaran mitra restoran baru, keluaran test otomatis) | ![Keluaran test UC04](assets/UC04-test.png) |
| UC05-TC01 – UC05-TC04 (Memverifikasi pendaftaran restoran, keluaran test otomatis) | ![Keluaran test UC05](assets/UC05-test.png) |
| UC06-TC01 – UC06-TC03 (Mengelola antrean, keluaran test otomatis; kecuali UC06-TC02) | ![Keluaran test UC06](assets/UC06-test.png) |
| UC06-TC02 (Batal dequeue, antarmuka) | ![Sebelum](assets/UC06-TC02-a-sebelum.png) ![Dialog](assets/UC06-TC02-b-dialog.png) ![Setelah Batal](assets/UC06-TC02-c-setelah-batal.png) |
| UC07-TC01 – UC07-TC06 (Mengatur kuota antrean dan meja, keluaran test otomatis) | ![Keluaran test UC07](assets/UC07-test.png) |
| UC08-TC01 – UC08-TC06 (Mengelola stok dan menu makanan, keluaran test otomatis) | ![Keluaran test UC08](assets/UC08-test.png) |
| UC09-TC01 – UC09-TC03 (Dashboard antrean restoran, keluaran test otomatis) | ![Keluaran test UC09](assets/UC09-test.png) ![UI UC09-TC03](assets/UC09-TC03-ui.png) |
| UC10-TC01 – UC10-TC07 (Registrasi akun, keluaran test otomatis) | ![Keluaran test UC10](assets/UC10-test.png) ![UI UC10-TC01 formulir](assets/UC10-TC01-a-formulir.png) ![UI UC10-TC01 berhasil](assets/UC10-TC01-b-berhasil.png) ![UI UC10-TC03 ditolak](assets/UC10-TC03-a-ditolak.png) ![UI UC10-TC03 tautan Masuk](assets/UC10-TC03-b-tautan-masuk.png) |
| UC11-TC01 – UC11-TC05 (Login akun, keluaran test otomatis) | ![Keluaran test UC11](assets/UC11-test.png) ![UI UC11-TC01](assets/UC11-TC01-ui.png) ![UI UC11-TC02](assets/UC11-TC02-ui.png) ![UI UC11-TC03](assets/UC11-TC03-ui.png) ![UI UC11-TC04](assets/UC11-TC04-ui.png) |
| UC12-TC01 – UC12-TC03 (Keluar akun, keluaran test otomatis; kecuali UC12-TC02) | ![Keluaran test UC12](assets/UC12-test.png) ![UI UC12-TC01 dialog](assets/UC12-TC01-a-dialog.png) ![UI UC12-TC01 halaman Masuk](assets/UC12-TC01-b-halaman-login.png) ![UI UC12-TC01 akses Profil](assets/UC12-TC01-c-akses-profil.png) |
| UC12-TC02 (Batal keluar akun, antarmuka) | ![Dialog](assets/UC12-TC02-a-dialog.png) ![Setelah Batal](assets/UC12-TC02-b-setelah-batal.png) ![Antrean saya](assets/UC12-TC02-c-antrean-saya.png) |
| UC13-TC01 – UC13-TC02 (Penyampaian keluhan pelanggan, keluaran test otomatis) | ![Keluaran test UC13](assets/UC13-test.png) |
| UC14-TC01 – UC14-TC03 (Penanggapan keluhan pelanggan, keluaran test otomatis) | ![Keluaran test UC14](assets/UC14-test.png) |
| UC15-TC01 – UC15-TC03 (Penghapusan restoran, keluaran test otomatis; kecuali UC15-TC02) | ![Keluaran test UC15](assets/UC15-test.png) ![UI UC15-TC01 dialog](assets/UC15-TC01-a-dialog.png) ![UI UC15-TC01 berhasil](assets/UC15-TC01-b-berhasil.png) |
| UC15-TC02 (Batal hapus restoran, antarmuka) | ![Dialog](assets/UC15-TC02-a-dialog.png) ![Setelah Batal](assets/UC15-TC02-b-setelah-batal.png) |
| Ringkasan pengujian use case dan rincian Fail (UC04-TC04, UC07-TC05) | ![Ringkasan dan Fail](assets/ringkasan-dan-fail-test.png) |
| KNF01-TC01 (Availability — Ketersediaan Data Restoran) | ![Bukti KNF01](assets/image-40.png) |
| KNF02-TC01 (Response Time — Waktu Muat Restoran ≤ 1 detik) | ![Bukti KNF02 Beranda](assets/image-40.png)<br>![Bukti KNF02 Detail](assets/image-41.png) |
| KNF03-TC01 (Reliability — Nomor Antrean Unik) | ![Bukti KNF03](assets/image-42.png) |
| KNF04-TC01 (Ergonomy — Tampilan Nomor Antrean `I-11`) | ![Bukti KNF04](assets/image-43.png) |
| KNF05-TC01 (Availability — Persistensi Tiket Antrean) | ![Bukti KNF05](assets/image-44.png) |
| KNF06-TC01 (Reliability — Pencegahan Double-Booking Meja) | ![Bukti KNF06](assets/image-42.png) |
| KNF07-TC01 (Availability — Batas Waktu Pembayaran 5 Menit) | ![Bukti KNF07](assets/image-45.png) |
| KNF08-TC01 (Security — Skema Basis Data `schema.sql`) | ![Bukti KNF08 Tabel Pembayaran](assets/image-46.png)<br>![Bukti KNF08 Tabel Pengguna](assets/image-47.png) |
| KNF09-TC01 (Response Time — Konfirmasi Pembayaran ≤ 10 detik) | ![Bukti KNF09](assets/image-48.png) |
| KNF10-TC01, KNF10-TC02 (Reliability — Keandalan & Penanganan Gagal Pembayaran) | ![Bukti KNF10](assets/image-45.png) |
| KNF11-TC01 (Availability — Pendaftaran Mitra Bersamaan) | ![Bukti KNF11 Mitra 1](assets/image-49.png)<br>![Bukti KNF11 Mitra 2](assets/image-50.png)<br>![Bukti KNF11 Admin](assets/image-51.png) |
| KNF12-TC01 (Response Time — Verifikasi Mitra ≤ 4 Hari Kerja) | ![Bukti KNF12 Dokumen](assets/image-52.png)<br>![Bukti KNF12 Setujui](assets/image-53.png)<br>![Bukti KNF12 Email](assets/image-54.png) |
| KNF13-TC01 (Ergonomy — Usability Testing ≤ 8 menit) | ![Bukti KNF13 Ketersediaan Responden](assets/image-55.jpg)<br>![Bukti KNF13 Hasil Waktu Pengujian](assets/image-56.jpg) |
| KNF14-TC01 (Reliability — Pencegahan Double-Charge) | ![Bukti KNF14](assets/image-42.png) |


| *...* | *...* |

<br>

---

# BAB 5: Traceability

Petakan setiap KF ke KNF, use case, kelas perancangan, file implementasi, dan test case. Tabel traceability berikut akan menjadi sarana verifikasi KF. Setiap KF memiliki minimal satu test case dan dinyatakan terpenuhi apabila **seluruh** test case terkaitnya berkesimpulan `Pass`. KF yang tidak diimplementasikan tetap dicantumkan beserta alasannya.

Tabel 5.1. Matriks Kerunutan KF terhadap Implementasi dan Pengujian

| KF ID | KNF Terkait | Use Case ID | Kelas Terkait | Implementasi File Terkait | Test Case (UC) | Test Case (Unit/Integrasi/KNF) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| KF01 | KNF01, KNF02, KNF13 | UC01 | C02 - Restoran<br>C34 - PencarianRestoPage<br>C35 - PencarianController | `src/server/models/restoran.ts`<br>`src/client/views/pencarianView.ts`<br>`src/server/controllers/pencarianController.ts` | UC01-TC01, UC01-TC02, UC01-TC03, UC01-TC04, UC01-TC06, UC01-TC07 | C02-UT04, C35-UT01 s.d. C35-UT09<br>INT-TC04, INT-TC05<br>KNF01-TC01, KNF02-TC01, KNF13-TC01 |
| KF02 | KNF01, KNF02 | UC01<br>UC05 | C02 - Restoran<br>C12 - PengajuanMitraController<br>C35 - PencarianController | `src/server/models/restoran.ts`<br>`src/server/controllers/pengajuanMitraController.ts`<br>`src/server/controllers/pencarianController.ts` | UC01-TC04, UC01-TC05<br>UC05-TC02 | C02-UT01, C02-UT02, C02-UT06, C12-UT08<br>INT-TC04, INT-TC05, INT-TC24<br>KNF01-TC01, KNF02-TC01 |
| KF03 | KNF03, KNF04, KNF05, KNF13 | UC03 | C04 - Antrean<br>C09 - TiketAntrean<br>C10 - PemantauAntreanController<br>C11 - HalamanStatusAntrean | `src/server/models/antrean.ts`<br>`src/server/controllers/pemantauAntreanController.ts`<br>`src/server/realtime/eventBus.ts`<br>`src/client/views/statusAntreanView.ts` | UC03-TC01, UC03-TC02, UC03-TC03, UC03-TC04 | C04-UT01 s.d. C04-UT03, C04-UT08, C09-UT04, C09-UT06, C09-UT09, C10-UT01 s.d. C10-UT04<br>INT-TC19, INT-TC20<br>KNF03-TC01, KNF04-TC01, KNF05-TC01, KNF13-TC01 |
| KF04 | - | UC06 | C04 - Antrean<br>C16 - KelolaAntreanController<br>C17 - KonfirmasiDequeuePage<br>C18 - KelolaAntreanPage | `src/server/models/antrean.ts`<br>`src/server/controllers/kelolaAntreanController.ts`<br>`src/client/core/ui.ts`<br>`src/client/views/kelolaAntreanView.ts` | UC06-TC01, UC06-TC02, UC06-TC03 | C04-UT04 s.d. C04-UT07, C04-UT09, C04-UT10, C16-UT01 s.d. C16-UT08<br>INT-TC20, INT-TC21 |
| KF05 | - | UC02 | C03 - Menu<br>C05 - Keranjang<br>C06 - Pesanan | `src/server/models/menu.ts`<br>`src/client/models/keranjang.ts`<br>`src/server/models/pesanan.ts` | UC02-TC01 | C03-UT04, C05-UT01 s.d. C05-UT11, C06-UT04<br>INT-TC06 |
| KF06 | - | UC02 | C05 - Keranjang<br>C06 - Pesanan | `src/client/models/keranjang.ts`<br>`src/server/models/pesanan.ts`<br>`src/client/views/pemesananView.ts` | UC02-TC01, UC02-TC03, UC02-TC04 | C05-UT07, C05-UT08, C06-UT04, C06-UT06<br>INT-TC06, INT-TC10 |
| KF07 | - | UC02<br>UC08 | C03 - Menu<br>C06 - Pesanan<br>C23 - PengaturanMenuPage<br>C24 - KelolaMenuController | `src/server/models/menu.ts`<br>`src/server/models/pesanan.ts`<br>`src/client/views/pengaturanMenuView.ts`<br>`src/server/controllers/kelolaMenuController.ts` | UC02-TC02, UC02-TC05, UC02-TC06<br>UC08-TC01 s.d. UC08-TC06 | C03-UT01 s.d. C03-UT14, C06-UT04, C06-UT05, C06-UT15, C24-UT01 s.d. C24-UT07, **C24-UT08 (Fail)**<br>INT-TC07, INT-TC09, INT-TC17, INT-TC23 |
| KF08 | KNF06 | UC02<br>UC07 | C04 - Antrean<br>C06 - Pesanan<br>C20 - Kuota | `src/server/models/antrean.ts`<br>`src/server/models/pesanan.ts`<br>`src/server/models/kuota.ts` | UC02-TC01, UC02-TC03<br>UC07-TC04, **UC07-TC05 (Fail)** | C06-UT06, C06-UT07, C20-UT01, C20-UT03<br>INT-TC10, INT-TC22<br>KNF06-TC01 |
| KF09 | - | UC02 | C06 - Pesanan | `src/server/models/pesanan.ts`<br>`src/client/views/pemesananView.ts` | UC02-TC04, UC02-TC09, UC02-TC10 | C06-UT01, C06-UT02, C06-UT03, C06-UT07<br>INT-TC08, INT-TC10 |
| KF10 | KNF03 | UC02 | C06 - Pesanan<br>C09 - TiketAntrean | `src/server/models/pesanan.ts`<br>`src/server/models/antrean.ts`<br>`src/client/views/pembayaranView.ts` | UC02-TC01, UC02-TC02, UC02-TC04 | C06-UT04, C09-UT01, C09-UT02, C09-UT05, C09-UT07<br>INT-TC12, INT-TC18, INT-TC30<br>KNF03-TC01 |
| KF11 | KNF07, KNF08 | UC02 | C07 - MetodePembayaranController | `src/server/controllers/metodePembayaranController.ts`<br>`src/server/models/pembayaran.ts`<br>`src/client/views/pembayaranView.ts` | UC02-TC01, UC02-TC03 | C07-UT01, C07-UT04, C07-UT06, C07-UT12, C07-UT14<br>INT-TC11, INT-TC30<br>**KNF07-TC01 (Fail)**, KNF08-TC01 |
| KF12 | KNF09, KNF10, KNF14 | UC02 | C07 - MetodePembayaranController<br>C08 - RiwayatTransaksi | `src/server/controllers/metodePembayaranController.ts`<br>`src/server/models/pembayaran.ts` | UC02-TC01, UC02-TC03, UC02-TC07, UC02-TC08 | C07-UT02, C07-UT03, C07-UT05, C07-UT07 s.d. C07-UT11, C07-UT13, C08-UT01 s.d. C08-UT03<br>INT-TC12 s.d. INT-TC17, INT-TC36<br>KNF09-TC01, KNF10-TC01, KNF10-TC02, KNF14-TC01 |
| KF13 | - | UC02<br>UC09 | C06 - Pesanan<br>C16 - KelolaAntreanController<br>C19 - DashboardAntreanPage | `src/server/models/pesanan.ts`<br>`src/server/controllers/kelolaAntreanController.ts`<br>`src/client/views/kelolaAntreanView.ts` | UC02-TC02<br>UC09-TC01, UC09-TC02, UC09-TC03 | C06-UT08, C06-UT13, C16-UT01, C16-UT08<br>INT-TC19, INT-TC30 |
| KF14 | KNF11 | UC04 | C02 - Restoran<br>C12 - PengajuanMitraController<br>C13 - DokumenVerifikasi<br>C37 - RegistrasiRestoPage | `src/server/models/restoran.ts`<br>`src/server/controllers/pengajuanMitraController.ts`<br>`src/server/models/mitra.ts`<br>`src/client/views/mitraView.ts` | UC04-TC01, UC04-TC02, UC04-TC03, **UC04-TC04 (Fail)**, UC04-TC05 | C02-UT06, C02-UT12, C12-UT03, C12-UT04, C12-UT07, C12-UT11, C13-UT01 s.d. C13-UT08<br>INT-TC37<br>KNF11-TC01 |
| KF15 | KNF12 | UC05 | C12 - PengajuanMitraController<br>C14 - Admin<br>C36 - VerifikasiRestoranPage | `src/server/controllers/pengajuanMitraController.ts`<br>`src/server/models/akun.ts`<br>`src/client/views/mitraView.ts` | UC05-TC01, UC05-TC02, UC05-TC03, UC05-TC04 | C12-UT01, C12-UT02, C12-UT05, C12-UT06, C12-UT08 s.d. C12-UT10<br>INT-TC24, INT-TC25<br>KNF12-TC01 |
| KF16 | - | UC05 | C12 - PengajuanMitraController<br>C15 - NotifikasiEmail | `src/server/controllers/pengajuanMitraController.ts`<br>`src/server/adapters/notifikasiEmail.ts` | UC05-TC02, UC05-TC04 | C12-UT06, C12-UT08, C15-UT01, C15-UT02, **C15-UT03 (Fail)**, C15-UT04, C15-UT05<br>INT-TC24, INT-TC25, INT-TC26 |
| KF17 | - | UC03<br>UC06<br>UC07 | C04 - Antrean<br>C10 - PemantauAntreanController<br>C16 - KelolaAntreanController | `src/server/models/antrean.ts`<br>`src/server/controllers/pemantauAntreanController.ts`<br>`src/server/controllers/kelolaAntreanController.ts`<br>`src/server/realtime/eventBus.ts` | UC03-TC02<br>UC06-TC01, UC06-TC03 | C04-UT04, C04-UT06, C10-UT01, C10-UT03, C16-UT02, C16-UT05<br>INT-TC19, INT-TC20, INT-TC21 |
| KF18 | - | UC07 | C20 - Kuota<br>C21 - PengaturanKuotaController<br>C22 - PengaturanKuotaPage | `src/server/models/kuota.ts`<br>`src/server/controllers/pengaturanKuotaController.ts`<br>`src/client/views/pengaturanKuotaView.ts` | UC07-TC01, UC07-TC02, UC07-TC03, UC07-TC04, **UC07-TC05 (Fail)**, UC07-TC06 | C20-UT01 s.d. C20-UT07, C21-UT01 s.d. C21-UT06<br>INT-TC22 |
| KF19 | - | UC13<br>UC14 | C14 - Admin<br>C30 - Keluhan<br>C40 - KeluhanFormPage<br>C41 - KeluhanController<br>C42 - KeluhanDashboardPage | `src/server/models/keluhan.ts`<br>`src/server/controllers/keluhanController.ts`<br>`src/client/views/keluhanView.ts` | UC13-TC01, UC13-TC02<br>UC14-TC01, UC14-TC02, UC14-TC03 | C30-UT01 s.d. C30-UT05, C41-UT01 s.d. C41-UT08<br>INT-TC28 |
| KF20 | - | UC15 | C02 - Restoran<br>C14 - Admin<br>C31 - DashboardKelolaRestoranPage<br>C32 - KonfirmasiHapusRestoranPage<br>C33 - KelolaDataRestoranController | `src/server/models/restoran.ts`<br>`src/client/views/kelolaRestoranView.ts`<br>`src/client/core/ui.ts`<br>`src/server/controllers/kelolaDataRestoranController.ts` | UC15-TC01, UC15-TC02, UC15-TC03 | C02-UT05, C02-UT09 s.d. C02-UT11, C02-UT13, C33-UT01 s.d. C33-UT03<br>INT-TC27 |
| KF21 | - | UC10<br>UC11<br>UC12 | C01 - Pelanggan<br>C14 - Admin<br>C25 - Pengguna<br>C26 - HalamanProfilPage<br>C27 - KonfirmasiLogoutPage<br>C28 - AutentikasiController<br>C29 - SesiPengguna<br>C38 - RegistrasiPage<br>C39 - LoginPage | `src/server/models/akun.ts`<br>`src/server/controllers/autentikasiController.ts`<br>`src/server/middleware/auth.ts`<br>`src/client/views/akunView.ts`<br>`src/client/core/ui.ts` | UC10-TC01 s.d. UC10-TC07<br>UC11-TC01 s.d. UC11-TC05<br>UC12-TC01 s.d. UC12-TC03 | C01-UT01 s.d. C01-UT03, C14-UT01, C14-UT02, C25-UT01 s.d. C25-UT07, C28-UT01 s.d. C28-UT11, C29-UT01 s.d. C29-UT06<br>INT-TC01, INT-TC02, INT-TC03, INT-TC29 |

Tabel 5.2. Matriks Kerunutan KNF terhadap Pengujian

| ID KNF | Parameter | KF/UC Terkait | Test Case |
| :--- | :--- | :--- | :--- |
| KNF01 | Availability | KF01, KF02 / UC01 | KNF01-TC01 |
| KNF02 | Response time | KF01, KF02 / UC01 | KNF02-TC01 |
| KNF03 | Reliability | KF03, KF10 / UC02, UC03 | KNF03-TC01 |
| KNF04 | Ergonomy | KF03 / UC02, UC03 | KNF04-TC01 |
| KNF05 | Availability | KF03 / UC03 | KNF05-TC01 |
| KNF06 | Reliability | KF08 / UC02 | KNF06-TC01 |
| KNF07 | Availability | KF11 / UC02 | KNF07-TC01 |
| KNF08 | Security | KF11 / UC02 | KNF08-TC01 |
| KNF09 | Response time | KF12 / UC02 | KNF09-TC01 |
| KNF10 | Reliability | KF12 / UC02 | KNF10-TC01 |
| KNF11 | Availability | KF14 / UC04 | KNF11-TC01 |
| KNF12 | Response time | KF15 / UC05 | KNF12-TC01 |
| KNF13 | Ergonomy | KF01, KF03 / UC01, UC02, UC03 | KNF13-TC01 |
| KNF14 | Reliability | KF12 / UC02 | KNF14-TC01 |
