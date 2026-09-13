<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 3
<br>
USE CASE & SCENARIO USE CASE
</h1>
<br>

## antri.in

### Untuk: Angel

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | 01 |
| Kelompok | 10 |

| NIM | Nama |
|---|---|
| 13525145 | Muhammad Nur Fikri Hariyawan |
| 13525085 | Bayu Palamarta Wirawan       |
| 13525133 | Chatima Anandakhorita        |
| 13525148 | Athallah Nanda Andita        |
| 13525091 | Muhammad Fauzi Muharam       |
---

## Daftar Perubahan

| Revisi | Deskripsi |
| :--- | :--- |
| *A* | *Deskripsikan perubahan yang dilakukan dari dokumen sebelumnya pada dokumen ini. Jika tidak terdapat perubahan, harap kosongkan tabel.* |
| *B* |  |
| *C* |  |
| ... |  |

<br>
<br>

# BAB 1: Deskripsi Perangkat Lunak
Bagian ini boleh disalin dari 1.1 Deskripsi Umum Sistem pada dokumen *Requirement Gathering*. Pastikan isinya memang membahas deskripsi perangkat lunak kalian, seperti fitur, fungsi utama, dan cakupan sistem.

Perangkat lunak yang akan kami kembangkan merupakan sistem pemesanan makanan viral dengan antrean digital berbasis web yang bertujuan agar pengguna tidak perlu mengantre secara langsung pada restoran. Sistem ini memungkinkan pengguna untuk mencari restoran makanan viral, melihat informasi makanan dan restoran, melakukan pemesanan baik **dine in** maupun **take away**, memantau antrean dan estimasi pesanan akan selesai, serta fitur **booking table** jika pengguna telah memutuskan untuk dine-in dari jauh-jauh hari. Cara kerja dari aplikasi berbasis web ini adalah pertama, pihak restoran viral memasukkan data restoran ke web agar dapat ditampilkan di web, lalu, pengguna memilih restoran yang tersedia, kemudian pengguna dapat membaca informasi mengenai makanan yang terdapat di restoran tersebut. Jika sudah, pengguna dapat memilih makanan yang akan dibeli dan lanjut ke proses pembayaran. Pembayaran dilakukan menggunakan qris, ketika pengguna sudah membayar, barulah akan mendapatkan nomor antrian dan estimasi pesanan selesai sehingga pengguna dapat memperkirakan waktu kedatangan.

Platform yang kami pilih adalah web-based application sehingga dapat diakses dengan mudah menggunakan segala jenis perangkat seperti smartphone, tablet, laptop, atau komputer. Platform web dipilih karena memberikan kemudahan akses pada pengguna tanpa harus melakukan download aplikasi tambahan, pengguna hanya perlu membuat akun dengan menggunakan email atau hanya menuliskan nama saja.

Nilai unik dari aplikasi antrean online milik kami di banding dengan aplikasi lain yang serupa adalah kami memiliki sistem live kuota meja yang tersedia ketika pengguna memutuskan untuk makan di tempat atau take away. Selain itu, agar terorganisir dengan baik, kami memisah antrean untuk pengguna takeaway dan pengguna dine-in. Jika kuota meja untuk dine-in sedang penuh, maka antrean untuk dine-in akan dibatasi agar pengguna tidak menunggu terlalu lama.

---

# BAB 2: Kebutuhan Fungsional (KF)
Salin ulang **seluruh Kebutuhan Fungsional (KF)** yang telah didefinisikan pada dokumen *Requirement Gathering*. Tabel ini menjadi acuan *traceability*, dimana setiap Use Case pada BAB 3 wajib ditelusuri ke satu atau lebih ID KF di tabel ini, dan sebaliknya setiap KF idealnya tercakup oleh minimal satu Use Case. Pastikan juga sudah menggunakan **format EARS** dalam penulisan KF.

| ID KF | Kebutuhan | Penjelasan |
| :--- | :--- | :--- |
| *KF01* | *R02* | *Ketika pengguna melakukan pencarian atau memilih filter nama restoran, rating, atau jenis makanan, sistem harus menampilkan restoran viral yang sesuai* |
| *KF02* | *R03, R04* | *Selama data restoran disetujui oleh admin, sistem harus menampilkan restoran tersebut pada daftar restoran viral* |
| *KF03* | *R05, R06* | *Selama pelanggan berada dalam antrean, sistem harus menampilkan informasi antrean pada pelanggan.* |
| *KF04* | *R07* | *Sistem harus menyediakan fitur menghapus pelanggan yang terdepan dan memperbarui antrean* |
| *KF05* | *R08* | *Sistem harus menyediakan fitur untuk memilih daftar menu makanan dan mencatat jumlah yang dipesan ke dalam antrean* |
| *KF06* | *R09* | *Sistem harus menyediakan fitur dua mode pemesanan: booking tempat maupun pre-order* |
| *KF07* | *R10* | *Ketika pelanggan memesan barang, sistem harus memeriksa stok menu di restoran* |
| *KF08* | *R11* | *Sistem harus menyesuaikan enqueue dengan mode pemesanan* |
| *KF09* | *R12* | *Ketika pelanggan melakukan reservasi tempat, sistem harus memvalidasi reservasi dengan maksimal pemesanan seminggu sebelum tanggal kedatangan* |
| *KF10* | *R13, R19* | *Ketika pesanan berhasil dilakukan, sistem harus menyimpan data pesanan dan antrean dengan ID tiket antrean pengguna* |
| *KF11* | *R14* | *Jika tersedia berbagai metode pembayaran seperti QRIS dan virtual account, sistem harus bisa memproses sistem pembayaran menggunakan metode-metode tersebut* |
| *KF12* | *R15, R16* | *Ketika pelanggan melakukan pembayaran, sistem harus memverifikasi pembayaran* |
| *KF13* | *R18* | *Ketika pesanan sudah selesai dilakukan, sistem harus menampillkan data pesanan pada pelanggan* |
| *KF14* | *R21* | *Ketika restoran selesai mendaftar, sistem harus menyimpan data restoran dalam database* |
| *KF15* | *R22, R23* | *Sistem harus memungkinkan admin untuk menerima atau menolak restoran* |
| *KF16* | *R24* | *Jika tersedia notifikasi penerimaan atau penolakan, sistem harus mengirimkan pesan pada email restoran yang mendaftarkan diri* |
| *KF17* | *R25, R26* | *Ketika restoran melakukan dequeue pada antrean, antrean yang lama harus diperbarui pada pelanggan* |
| *KF18* | *R27, R28* | *Ketika restoran mengubah jumlah kuota antrean, kuota yang baru harus dimunculkan pada pelanggan* |
| *...* | *...* | *...* |

<sub> ***Catatan***: *Jika ada KF dari ML2 yang berubah/bertambah/dihapus setelah asistensi, pastikan tabel ini konsisten dengan versi KF terbaru sebelum dikumpulkan.*
<sub>

---

# BAB 3: Model Use Case

## 3.1 Identifikasi Aktor
Daftarkan seluruh aktor yang terlibat dalam use case yang akan dimodelkan. Aktor berupa pengguna manusia yang berinteraksi dengan solusi. Perlu diperhatikan bahwa Admin/Developer/ Pihak Eksternal lain yang bisa diotomisasi, tidak perlu dijadikan aktor.

| Aktor | Deskripsi |
| :--- | :--- |
| _Restoran_  | _Pengguna ini bertindak sebagai pihak yang mendaftarkan diri dalam daftar restoran viral, mengelola ketersediaan menu, kuota antean, dan ketersediaan meja, serta menerima informasi pelanggan yang akan datang dan urutan antrian atau kedatangan pelanggan. Karakteristik dari pengguna ini adalah mengutamakan keakuratan informasi dan pengendalian kedatangan pelanggan_ |
| _Pelanggan_ | _Pengguna ini bertindak sebagai pihak yang mencari salah satu restoran yang viral dan melakukan pemesanan baik dine in, take away, maupun booking table. Karakteristik dari pengguna ini adalah mengutamakan kecepatan booking dan kepastian waktu setelah booking._                                                              |
| *...* | *...* |



## 3.2 Identifikasi Use Case
Identifikasi seluruh use case yang mencakup Kebutuhan Fungsional pada BAB 2. Satu use case boleh mencakup lebih dari satu KF, dan sebaliknya satu KF boleh muncul di lebih dari satu use case bila memang relevan.

| ID UC | Nama Use Case | Deskripsi Singkat | Aktor Terlibat | ID KF Terkait |
| :--- | :--- | :--- | :--- | :--- |
| *UC01* | *Mencari dan filter resto.* | *Pelanggan melakukan pencarian atau penyaringan restoran viral berdasarkan nama, jenis makanan, atau rating untuk melihat detail informasi restoran.* | *Pelanggan* | *KF01, KF02* |
| *UC02* | *Melakukan pemesanan dan pembayaran digital* | *Pelanggan memilih mode pemesanan (dine-in, takeaway, atau booking), memilih menu makanan, menyelesaikan pembayaran digital, dan menerima tiket antrean resmi beserta ringkasan pesanan.* | *Pelanggan* | *KF05, KF06, KF07, KF08, KF09, KF10, KF11, KF12, KF13* |
| *UC04* | *Pendaftaran Mitra Restoran Baru.* | *Pihak restoran mengajukan berkas pendaftaran sebagai mitra baru dengan mengisikan data restoran ke dalam sistem aplikasi agar dapat diverifikasi oleh admin.* | *Restoran* | *KF14* |
| *UC05* | *Memverifikasi Pendaftaran Restoran.* | *Admin meninjau berkas pendaftaran mitra restoran baru, lalu menyetujui atau menolak pengajuan serta memicu pengiriman notifikasi email ke pihak restoran.* | *Admin* | *KF15, KF16* |
| *UC07* | *Mengatur Kuota Antrean & Meja.* | *Pihak restoran memperbarui atau menyesuaikan batas/jumlah kuota antrean dan ketersediaan meja, pembaruan tersebut secara otomatis akan ditampilkan kepada pelanggan.* | *Restoran* | *KF17, KF18* |
| *...* | *...* | *...* | *...* | *...* |

## 3.3 Use Case Diagram
Buatlah **satu** use case diagram yang mencakup seluruh aktor dan use case. Sertakan relasi *include*/*extend* apabila ada use case yang saling bergantung.
<br>
<p align="center">
<img alt="Contoh Activity Diagram" src="./assets/diagram/Use Case.drawio.png" width="70%">
</p>
<p align="center">
<i>Gambar 1. Contoh Use Case Diagram</i>
</p>
<br>

Hal-hal yang perlu diperhatikan dalam pembuatan use case diagram:
- Pastikan notasi UML use case (aktor, oval use case, garis asosiasi, *include/extend*) digambar dengan benar.
- Seluruh aktor dan use case yang telah didefinisikan harus muncul di diagram, tidak ada yang terlewat maupun berlebih.
- Hindari garis yang saling bersilangan tanpa alasan jelas, susun diagram agar mudah dibaca.
- Hindari istilah solusi teknis (misalnya nama tabel database, nama endpoint API) muncul di dalam diagram use case karena use case menjelaskan *interaksi fungsional*, bukan detail implementasi.

## 3.4 Skenario Use Case
Buat skenario untuk **setiap** use case yang telah diidentifikasi pada 3.2. Setiap skenario dapat terdiri dari dua jenis alur:
- **Skenario Normal**: alur utama (*happy path*) di mana interaksi aktor-sistem berjalan lancar tanpa kendala hingga tujuan use case tercapai.
- **Skenario Alternatif**: alur percabangan dari skenario normal, misalnya kondisi gagal, input tidak valid, atau pilihan lain yang tersedia bagi aktor. Boleh ada lebih dari satu skenario alternatif per use case jika ada beberapa titik percabangan berbeda.

Format tabel skenario: kolom **Aksi Aktor** berisi apa yang dilakukan/diinput aktor, kolom **Reaksi Perangkat Lunak** berisi respons sistem terhadap aksi tersebut secara **berurutan** (nomor langkah harus berpasangan/selaras antar dua kolom).


### 3.4.1 Skenario UC01

**Nama Use Case:** *Mencari dan filter resto*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memasukkan kata kunci nama restoran atau memilih filter pencarian* | *Sistem memproses kriteria pencarian dan menampilkan daftar restoran viral yang sesuai dengan kata kunci atau filter yang dipilih* |
| 2 | *Pelanggan memilih salah satu restoran dari daftar hasil pencarian* | *Sistem menampilkan halaman detail restoran lengkap dengan informasi menu, rating, ulasan, serta status antrean saat ini* |



<br>

**Skenario Alternatif 1: Hasil Pencarian Tidak Ditemukan**


| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memasukkan kata kunci nama restoran atau memilih filter pencarian yang tidak tersedia di sistem* | *Sistem memproses kriteria pencarian tetapi tidak menemukan data yang cocok, lalu menampilkan pesan "Restoran tidak ditemukan" dan menampilkan restoran lain secara default (diurutkan berdasarkan yang paling viral)* |
| 2 | *Pelanggan mengubah kata kunci atau mereset filter pencarian* | *Sistem kembali ke langkah 1 skenario normal* |

### 3.4.2 Skenario UC02

**Nama Use Case:** *Melakukan pemesanan dan pembayaran digital*

**Skenario Normal**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih menu makanan/minuman dan menentukan jumlah pesanan.* | *Sistem mencatat pilihan menu ke dalam draf keranjang pesanan.* |
| 2 | *Pelanggan memilih opsi layanan Dine-In dan memasukkan jumlah rombongan.* | *Sistem memverifikasi stok menu dan memeriksa ketersediaan kuota meja makan restoran terkini.* |
| 3 | *Pelanggan mengonfirmasi pesanan dan melanjutkan ke pembayaran.* | *Sistem menghitung total biaya dan menampilkan pilihan metode pembayaran digital (QRIS, Virtual Account).* |
| 4 | *Pelanggan memilih metode pembayaran dan menekan tombol bayar.* | *Sistem memicu pembuatan transaksi ke Payment Gateway serta menampilkan tagihan dan batas waktu pembayaran.* |
| 5 | *Pelanggan menyelesaikan transfer/pembayaran melalui aplikasi perbankan/e-wallet.* | *Sistem menerima verifikasi pelunasan secara otomatis dari Payment Gateway.* |
| 6 | *-* | *Sistem memotong kuota meja, menetapkan ID pesanan dan nomor urut antrean dine-in, lalu menyimpannya ke basis data.* |
| 7 | *-* | *Sistem menampilkan halaman konfirmasi berisi ID tiket antrean meja, status pembayaran, dan rincian pesanan makanan.* |
<br>

**Skenario Alternatif 1: Pre-Order Takeaway**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih menu makanan/minuman dan menentukan jumlah pesanan.* | *Sistem mencatat pilihan menu ke dalam draf pesanan.* |
| 2 | *Pelanggan memilih opsi layanan Takeaway.* | *Sistem memverifikasi stok menu dan mengabaikan pengecekan kuota meja makan.* |
| 3 | *Pelanggan melanjutkan transaksi dan menyelesaikan pembayaran via Payment Gateway.* | *Sistem memverifikasi pelunasan tagihan dari Payment Gateway.* |
| 4 | *-* | *Sistem mencatat transaksi ke basis data dan menerbitkan ID pesanan antrean.* |
| 5 | *-* | *Sistem menampilkan bukti pembayaran dan nomor panggilan pengambilan pesanan kepada pelanggan.* |
<br>

**Skenario Alternatif 2: Booking tempat**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih opsi Booking Tempat.* | *Sistem menampilkan kalender pemilihan tanggal dan slot jam kedatangan.* |
| 2 | *Pelanggan memilih tanggal kedatangan (maksimal 7 hari ke depan) dan kapasitas kursi/rombongan* | *Sistem memvalidasi rentang tanggal (<= hari ke depan) dan ketersediaan kuota reservasi meja pada jadwal tersebut.* |
| 3 | *Pelanggan memilih menu makanan yang ingin dipesan.* | *Sistem memverifikasi ketersediaan dan mencatat draf reservasi beserta rincian pesanan.* |
| 4 | *Pelanggan menyelesaikan pembayaran tagihan/deposit melalui metode digital* | *pembayaran tagihan/deposit melalui metode digital.	Sistem menerima konfirmasi pembayaran lunas dari Payment Gateway.* |
| 5 | *-* | *Sistem mengunci kuota meja pada jadwal tersebut, menerbitkan ID booking resmi, dan menyimpannya ke basis data.* |
| 6 | *-* | *Sistem menampilkan tanda bukti reservasi jadwal beserta rincian pesanan kepada pelanggan.* |
<br>

**Skenario Alternatif 3: Stok Menu Habis**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih menu makanan/minuman dan menentukan jumlah pesanan.* | *Sistem mendeteksi stok menu tertentu di dapur restoran sudah tidak mencukupi.* |
| 2 | *-* | *Sistem menolak proses checkout, memberi tanda pada menu yang habis, dan menampilkan notifikasi: "Mohon maaf, terdapat menu pilihan yang telah habis".* |
| 3 | *Pelanggan menghapus atau mengganti menu yang habis.* | *Sistem memperbarui total tagihan dan kembali ke Langkah 2 Skenario Normal atau Langkah 3 alternatif 2 jika dilakukan booking.* |
<br>

**Skenario Alternatif 4: Batas Waktu Pembayaran Habis (Timeout) / Pembayaran Gagal**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan tidak menyelesaikan pembayaran hingga durasi pembayaran kedaluwarsa.* | *Payment Gateway mendeteksi masa berlaku transaksi habis dan mengirimkan notifikasi failed/expired ke sistem.* |
| 2 | *-* | *Sistem tidak melakukan penahanan slot kuota meja/antrean, membatalkan pesanan, dan menampilkan pesan: "Batas waktu pembayaran habis. Transaksi dibatalkan".* |
| 3 | *Pelanggan menutup notifikasi.* | *Alur berakhir tanpa pembuatan tiket antrean maupun ID pesanan.* |
<br>

**Skenario Alternatif 5: Tanggal Booking Tidak Valid atau Kuota Jadwal Penuh**
| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih opsi Booking Tempat.* | *Sistem menampilkan kalender pemilihan tanggal dan slot jam kedatangan.* |
| 2 | *Pelanggan memilih tanggal kedatangan lebih dari 7 hari ke depan atau memilih slot meja yang sudah penuh.* | *Sistem menolak pemilihan jadwal dan menampilkan pesan: "Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan atau kuota meja pada jam tersebut telah penuh".* |
| 3 | *Pelanggan memilih kembali tanggal/jam lain yang tersedia.* | *Sistem kembali ke Langkah 2 Skenario Alternatif 2.* |
<br>



### 3.4.3 Skenario UC03

**Nama Use Case:** *Memantau Status Antrean (Virtual Queue)*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan memilih fitur antrean* | *Sistem memvalidasi ID antrean pelanggan dan menampilkan informasi antrean saat itu*|
| 2 | *Pelanggan tetap membuka tampilan antrean* | *Sistem akan memperbarui antrean setiap ada perubahan* |
<br>

**Skenario Alternatif 1: GIlirannya Tiba**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pelanggan membuka fitur antrean saat gilirannya* | *Sistem memperbarui tampilan dengan memberikan notifikasi untuk mengambil pesanan*|
<br>

### 3.4.4 Skenario UC04

**Nama Use Case:** *Pendaftaran Mitra Restoran Baru*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pihak restoran memilih fitur pendaftaran mitra baru pada aplikasi* | *Sistem menampilkan formulir registrasi mitra baru yang mencakup data serta profil restoran, dokumen perizinan, dan daftar menu yang akan diajukan* |
| 2 | *Admin memilih menu peninjauan pendaftaran restoran dan membuka detail berkas pengajuan mitra baru* | *Sistem memvalidasi kelengkapan data, menyimpan formulir registrasi dengan status "Menunggu Verifikasi" ke dalam database, serta menampilkan pesan konfirmasi bawha pendaftaran berhasil* |
<br>

**Skenario Alternatif 1: Data Form Tidak Lengkap atau Format Tidak Sesuai**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pihak restoran mengisikan formulir pendaftaran secara tidak lengkap atau mengunggah format dokumen yang tidak valid, lalu menekan tombol "Daftar"* | *Sistem menolak menyimpan formulir ke database, memberi tanda pada bagian yang bermasalah serta apa masalahnya, dan menampilkan pesan peringatan untuk segera memperbaiki/melengkapi data* |
| 2 | *Pihak restoran memperbaiki atau melengkapi data yang bermasalah* | *Sistem kembali ke langkah 2 skenario normal* |

### 3.4.5 Skenario UC05

**Nama Use Case:** *Memverifikasi Status Pembayaran*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Admin memilih menu peninjauan pendaftaran restoran dan membuka detail berkas pengajuan mitra baru* | *Sistem menampilkan rincian data profil restoran, dokumen verifikasi, dan daftar menu yang diajuka* |
|2|*Admin menyetujui pengajuan pendaftaran restoran*|*Sistem mengubah status restoran menjadi "Disetujui", menyimpan data ke database publik, dan mengirimkan notifikasi konfirmasi penerimaan ke email restoran*|


<br>

**Skenario Alternatif 1: Pengajuan Pendaftaran Ditolak**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Admin memilih menu peninjauan pendaftaran restoran dan membuka detail berkas pengajuan mitra baru* | *Sistem menampilkan rincian data profil restoran, dokumen verifikasi, dan daftar menu yang diajukan* |
|2|*Admin menolak pengajuan pendaftaran dan memasukkan alasan penolakan*|*Sistem mengubah status pengajuan menjadi "Ditolak" dan mengirimkan email notifikasi penolakan beserta alasan penolakan ke email restoran*|

### 3.4.6 Skenario UC06

**Nama Use Case:** *Memverifikasi Pendaftaran Restoran*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih fitur untuk mengelola antrian* | *Sistem menampilkan dashboard antrian* |
| 2 | *Restoran memilih fitur dequeue* | *Sistem menampilkan pesan konfirmasi untuk melakukan dequeue pada restorannya* |
| 3 | *Restoran mengonfirmasi dequeue* | *Sistem menghapus pelanggan terdepan pada antrian dan memperbarui antrian* |
<br>

  **Skenario Alternatif 1: Restoran membatalkan dequeue**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih pilihan "batal" pada konfirmasi dequeue* | *Sistem menutup pesan konfirmasi* |

  **Skenario Alternatif 2: Pelanggan tidak hadir**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih untuk dequeue lebih awal* | *Sistem menghapus pelanggan terdepan pada antrian dan memperbarui antrian* |
| 2 | *Restoran memilih untuk menunggu* | *Sistem menunggu 30 menit sebelum melakukan dequeue secara otomatis* |

### 3.4.7 Skenario UC07

**Nama Use Case:** *Mengatur Kuota Antrean & Meja*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pihak restoran memilih menu pengaturan kuota antrean dan kapasitas meja* | *Sistem menampilkan kuota antrean dan kapasitas meja yang tersedia saat ini* |
| 2 | *Pihak restoran mengubah batas maksimum kuota antrean atau jumlah ketersediaan meja, lalu menekan tombol "Simpan Pengaturan"* | *Sistem langsung menyimpan informasi ke dalam database dan memperbarui tampilan kuota antrean dan kapasitas meja yang tersedia* |
<br>

**Skenario Alternatif 1: Input Tidak Valid**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pihak restoran menginput nilai kuota berupa angka negatif atau format bukan angka, lalu menekan tombol "Simpan Pengaturan"* | *Sistem menolak pembaruan dan menampilkan pesan peringatan agar pihak restoran memperbaiki jumlah kuota yang dimasukkan dengan format yang valid* |
| 2 | *Pihak restoran memperbaiki nilai kuota dengan format yang benar* | *Sistem kembali ke langkah 2 skenario normal* |

  **Skenario Alternatif 2: Restoran Menutup Antrean Sementara**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Pihak restoran memasukkan 0 (nol) sebagai kuota antrean yang baru jika ingin menutup antrean sementara* | *Sistem memperbaru dan mengubah tampilan kuota antrean yang tersedia menjadi pesan "Antrean penuh/Ditutup". Tidak ada antrean atau pesanan baru yang bisa masuk ketika kuota ditutup* |

### 3.4.8 Skenario UC08

**Nama Use Case:** *Mengelola Stok dan Menu Makanan*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih fitur untuk mengelola stok dan menu makanan* | *Sistem menampilkan daftar menu, stok, dan harga* |
| 2 | *Restoran memilih salah satu menu* | *Sistem menampilkan detail dari menu dan ketersedian menu* |
| 3 | *Restoran mengubah informasi stok atau menu* | *Sistem memperbarui informasi pada database dan website pelanggan* |
<br>

  **Skenario Alternatif 1: Restoran menambahkan menu baru**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih fitur tambah menu* | *Sistem menampilkan formulir menu* |
| 2 | *Restoran mengisi formulir dan klik Simpan* | *Sistem menyimpan data-data dalam database* |

  **Skenario Alternatif 2: Restoran menghapus salah satu menu**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran memilih fitur hapus menu* | *Sistem menampilkan data seluruh menu* |
| 2 | *Restoran menghapus salah satu menu* | *Sistem menghapus data menu tersebut dari database* |

  **Skenario Alternatif 3: Stok makanan tidak cukup**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Restoran mengubah jumlah stok menjadi 0* | *Sistem segera menyimpan data pada database dan memperbarui informasi pada website pelanggan* |

### 3.4.9 Skenario UC09

**Nama Use Case:** *Memantau Dashboard Antrean Restoran*

**Skenario Normal**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Staff restoran membuka fitur antrean* | *Sistem menampilkan daftar antrean beserta rincian seperti yang dipesam, no antrean, kapasitas meja yang tersisa dan yang sudah di-booking*|
| 2 | *Staff terus memantau daftar antrean* | *Sistem akan meng-update antrean setiap ada perubahan tanpa perlu me-reload halaman* |
<br>

**Skenario Alternatif 1: Antrean Kosong saat Resto Baru Didaftarkan maupun Baru Buka**

| No | Aksi Aktor | Reaksi Perangkat Lunak |
| :--- | :--- | :--- |
| 1 | *Staff resto membuka fitur antrean* | *Sistem tidak menemukan data antrean dari data base, menampilkan pesan "Belum ada antrean saat ini"*|
<br>

<sub>*Lanjutkanlah pola 3.4.x ini untuk setiap ID UC yang telah diidentifikasi pada 3.2, sampai seluruh use case memiliki skenario normal dan skenario alternatif (tidak usah dibuat jika use case tersebut memang tidak memiliki skenario alternatif).*<sub>
