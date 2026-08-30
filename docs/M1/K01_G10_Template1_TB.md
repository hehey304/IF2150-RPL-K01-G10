<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 1
<br>
TOPIC BRAINSTORMING
</h1>
<br>

## *Nama Perangkat Lunak*

### Untuk: Angel

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | 01 |
| Kelompok | 10  |

| NIM | Nama |
|---|---|
| 13525145 | Muhammad Nur Fikri Hariyawan |
| 13525085 | Bayu Palamarta Wirawan |
| 13525133 | Chatima Anandakhorita |
| 13525148 | Athallah Nanda Andita |
| 13525091 | Muhammad Fauzi Muharam |
---

<br>
<br>

# BAB 1: Analisis Permasalahan

## 1.1 Latar Belakang Masalah
Tuliskan deskripsi permasalahan yang kalian pilih secara naratif dan spesifik. Tambahkan keterkaitan permasalahan tersebut dengan Tujuan Pembangunan Berkelanjutan (SDGs) yang telah disepakati. Dukung argumen kalian dengan data yang kredibel, serta jelaskan urgensi mengapa masalah ini perlu dan layak untuk segera diselesaikan.

## 1.2 Analisis Kondisi Saat Ini
Lakukan analisis terhadap proses yang berjalan saat ini di dunia nyata, baik itu sistem lama ataupun solusi yang sudah ada. Soroti kesenjangan atau celah dari kondisi tersebut yang nantinya akan diselesaikan oleh perangkat lunak kalian.

---

# BAB 2: Analisis Solusi

## 2.1 Deskripsi Perangkat Lunak
Perangkat lunak yang akan kami kembangkan merupakan sistem pemesanan makanan viral dengan antrean digital berbasis web yang bertujuan agar pengguna tidak perlu mengantri secara langsung pada restoran. Sistem ini memungkinkan pengguna untuk mencari restoran makanan viral, melihat informasi makanan dan restoran, melakukan pemesanan, memantau antrean dan estimasi pesanan akan selesai, serta fitur booking tempat jika pengguna memutuskan untuk dine-in. Cara kerja dari aplikasi berbasis web ini adalah pertama pengguna memilih restoran yang tersedia, kemudian pengguna dapat membaca informasi mengenai makanan yang terdapat di restoran tersebut. Jika sudah, pengguna dapat memilih makanan yang akan dibeli dan lanjut ke proses pembayaran. Pembayaran dilakukan menggunakan qris, ketika pengguna sudah membayar, barulah akan mendapatkan nomor antrian dan estimasi pesanan selesai sehingga pengguna dapat memperkirakan waktu kedatangan.

Platform yang kami pilih adalah web-based application sehingga dapat diakses dengan mudah menggunakan segala jenis perangkat seperti smartphone, tablet, laptop, atau komputer. Platform web dipilih karena memberikan kemudahan akses pada pengguna tanpa harus melakukan download aplikasi tambahan, pengguna hanya perlu membuat akun dengan menggunakan email atau hanya menuliskan nama saja.

Nilai unik dari aplikasi antrean online milik kami di banding dengan aplikasi lain yang serupa adalah kami memiliki sistem live kuota meja yang tersedia ketika pengguna memutuskan untuk makan di tempat. Selain itu, agar terorganisir dengan baik, kami memisah antrean untuk pengguna takeaway dan pengguna dine-in. Jika kuota meja untuk dine-in sedang penuh, maka antrean untuk dine-in akan dibatasi agar pengguna tidak menunggu terlalu lama.

## 2.2 Asumsi dan Batasan
asumsi pengguna:
    - Konsumen memiliki hp dengan kondisi storage yang berbeda beda dan memiliki web browser (Chrome, safari, dll) dan koneksi internet
    - menampilkan estimasi waktu kedatangan yang mereka booking melalui web.

asumsi teknis:
    - pengelola resto viral menyediakan minimal 1 gedget (hp, laptop, atau tablet) dan konesi internet yang stabil untuk menerima pesanan secara live.
    - menetapkan kapasitas yang mampu dibikin oleh restoran berdasarkan bahan masakan dan juga pekerja

batasan hukum:
    - Sistem wajib memenuhi UU No 27 tahun 2022 tentang Pelindungan Data Pribadi
    - pemrosesan pembayaran penuh tunduk pada regulasi Bank Indonesia terkait standar keamanan transaksi QRIS

batasan sumber daya:
    - hanya sebatas menerima pesanan
    - kapasitas server yang terbatas

---

# BAB 3: Spesifikasi Kebutuhan dan Proses Bisnis

## 3.1 Identifikasi Aktor
Buatlah daftar seluruh aktor (pengguna) yang akan berinteraksi langsung dengan sistem solusi yang kalian kembangkan. Berikan penjelasan singkat mengenai peran dan karakteristik dari masing-masing aktor tersebut.

| Aktor | Deskripsi |
| :--- | :--- |
| *Restoran* | *Pengguna ini bertindak sebagai pihak yang mendaftarkan diri dalam daftar restoran viral serta menerima informasi pelanggan-pelanggan yang melakukan booking pada restoran dan nomor antrian saat ini. Karakteristik dari pengguna ini adalah mengutamakan keakuratan saat bertransaksi.* |
| *Pelanggan* | *Pengguna ini bertindak sebagai pihak yang mencari salah satu restoran yang viral dan melakukan booking di restoran tersebut. Karakteristik dari pengguna ini adalah mengutamakan keakuratan saat booking.* |
| *Admin* | *Pengguna ini bertindak sebagai pihak yang bertanggung jawab dalam memasukan restoran dalam daftar restoran dan mengatasi permasalahan yang terjadi. Karakteristik dari pengguna ini adalah mengutamakan keakuratan dan ketelitian dalam memperhatikan galat atau restoran-restoran yang mendaftar dalam website.* |

## 3.2 Kebutuhan Pengguna Awal
Definisikan apa yang ingin dicapai oleh pengguna saat menggunakan sistem ini dalam format *User Story* (Sebagai [Aktor], saya ingin [Aktivitas/Kebutuhan], sehingga [Tujuan/Nilai]). Pastikan kalian berfokus pada "apa yang ingin dilakukan pengguna".

| ID | Aktor | Kebutuhan / Aktivitas | Tujuan / Nilai |
| :--- | :--- | :--- | :--- |
| US-01 | *Restoran* |  *Mendaftarkan restoran dalam daftar restoran viral* | *Bisa ditemukan oleh pelanggan* |
| US-01 | *Restoran* | *Mendapatkan nomor antrian saat ini dan daftar pelanggan* | *Bisa mengetahui urutan antrian dan mengatur penempatan pelanggan lebih cepat* |
| US-02 | *Pelanggan* | *Mencari daftar restoran viral* | *Bisa menemukan restoran dan masuk dalam antrian* |
| US-02 | *Pelanggan* | *Melakukan booking dalam restoran* | *Masuk dalam antrian dan mendapatkan nomor antrian* |
| US-02 | *Pelanggan* | *Melihat status antrian* | *Mengetahui kapan waktu untuk ke restoran viral untuk makan sesuai antrian* |
| US-03 | *Admin* | *Memeriksa data restoran yang mendaftar* | *Tidak ada restoran palsu yang memasuki website* |
| US-03 | *Admin* | *Menambahkan restoran dalam daftar restoran viral* | *Restoran bisa dicari oleh pelanggan* |

## 3.3 Model Proses Bisnis
Buatlah *Activity Diagram* atau *Swimlane Diagram* yang menunjukkan alur kerja proses bisnis dari sistem solusi. Diagram ini harus memvisualisasikan bagaimana alur operasional di dunia nyata berjalan lebih efisien dengan adanya interaksi antara aktor (yang didefinisikan pada poin 3.1) dan sistem perangkat lunak. Perhatikan notasi yang digunakan dalam pembuatannya.
<br>

<p align="center">
<img alt="Contoh Activity Diagram" src="./assets/diagram/diagram-act-1.avif" width="70%">
</p>
<p align="center">
<i>Gambar 1. Contoh Activity Diagram</i>
</p>

<br>

# Referensi
- Diagram UML: https://www.drawio.com/, https://staruml.io/
