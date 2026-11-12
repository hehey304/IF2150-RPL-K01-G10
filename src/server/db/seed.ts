/**
 * Data contoh (fiktif) agar aplikasi langsung dapat dicoba. Hanya dijalankan bila tabel pengguna kosong.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Database, Queryable } from './database.js';
import { Admin, Pelanggan, Pengguna, type Role } from '../models/akun.js';
import { Restoran } from '../models/restoran.js';
import { Menu } from '../models/menu.js';
import { Antrean, TiketAntrean } from '../models/antrean.js';
import { Pesanan, type ModePemesanan } from '../models/pesanan.js';
import { Pembayaran, RiwayatTransaksi } from '../models/pembayaran.js';
import { Keluhan } from '../models/keluhan.js';
import { DokumenVerifikasi, PengajuanMitra } from '../models/mitra.js';
import { generateId } from '../utils/ids.js';

export const AKUN_UJI = {
  admin: { email: 'admin@antri.in', password: 'admin12345' },
  pelanggan: { email: 'pelanggan@antri.in', password: 'pelanggan123' },
  restoran: { email: 'bakso@antri.in', password: 'restoran123' },
  calonMitra: { email: 'mitrabaru@antri.in', password: 'restoran123' },
};

type MenuSeed = [nama: string, kategori: string, harga: number, stok: number, deskripsi: string];

const RESTORAN: {
  slug: string;
  nama: string;
  kategori: string;
  lokasi: string;
  alamat: string;
  rating: number;
  ulasan: number;
  warna: string;
  kuota: number;
  meja: number;
  menu: MenuSeed[];
}[] = [
  {
    slug: 'bakso', nama: 'Bakso Mang Ujang', kategori: 'Bakso', lokasi: 'Cihampelas',
    alamat: 'Jl. Cihampelas No. 120, Bandung', rating: 4.8, ulasan: 2140, warna: 'oranye', kuota: 30, meja: 12,
    menu: [
      ['Bakso Urat', 'Bakso', 25000, 40, 'Bakso urat besar dengan kuah kaldu sapi.'],
      ['Bakso Mercon', 'Bakso', 28000, 25, 'Bakso isi cabai rawit, pedas meledak.'],
      ['Mie Bakso Komplit', 'Mie', 32000, 30, 'Mie kuning, bakso halus, urat, dan tahu.'],
      ['Mie Bakso', 'Mie', 22000, 35, 'Mie kuning dengan dua bakso halus.'],
      ['Es Teh Manis', 'Minuman', 6000, 100, 'Teh melati dingin.'],
      ['Es Jeruk', 'Minuman', 9000, 0, 'Jeruk peras segar.'],
    ],
  },
  {
    slug: 'seblak', nama: 'Seblak Teh Nining', kategori: 'Seblak', lokasi: 'Dipatiukur',
    alamat: 'Jl. Dipatiukur No. 45, Bandung', rating: 4.7, ulasan: 1890, warna: 'merah', kuota: 40, meja: 8,
    menu: [
      ['Seblak Original', 'Seblak', 15000, 50, 'Kerupuk basah, telur, sayur, level 1-5.'],
      ['Seblak Ceker', 'Seblak', 20000, 30, 'Seblak dengan ceker ayam empuk.'],
      ['Seblak Seafood', 'Seblak', 27000, 20, 'Udang, cumi, dan bakso ikan.'],
      ['Es Kuwut', 'Minuman', 8000, 60, 'Kelapa muda, melon, dan jeruk nipis.'],
    ],
  },
  {
    slug: 'geprek', nama: 'Ayam Geprek Bu Rini', kategori: 'Ayam', lokasi: 'Dago',
    alamat: 'Jl. Ir. H. Juanda No. 210, Bandung', rating: 4.6, ulasan: 1520, warna: 'kuning', kuota: 50, meja: 10,
    menu: [
      ['Ayam Geprek Sambal Bawang', 'Ayam', 20000, 60, 'Ayam krispi digeprek dengan sambal bawang.'],
      ['Ayam Geprek Keju', 'Ayam', 26000, 40, 'Ditaburi keju mozarella leleh.'],
      ['Nasi Putih', 'Lainnya', 5000, 100, 'Nasi pulen hangat.'],
      ['Es Teh Manis', 'Minuman', 5000, 100, 'Teh manis dingin.'],
    ],
  },
  {
    slug: 'kopi', nama: 'Kopi Senja Braga', kategori: 'Kopi', lokasi: 'Braga',
    alamat: 'Jl. Braga No. 33, Bandung', rating: 4.5, ulasan: 980, warna: 'teal', kuota: 0, meja: 6,
    menu: [
      ['Kopi Susu Gula Aren', 'Kopi', 22000, 50, 'Espresso, susu segar, gula aren.'],
      ['Americano', 'Kopi', 20000, 50, 'Espresso dan air panas.'],
      ['Croissant Mentega', 'Roti', 25000, 15, 'Croissant renyah dipanggang setiap pagi.'],
    ],
  },
  {
    slug: 'martabak', nama: 'Martabak Kubang 99', kategori: 'Martabak', lokasi: 'Buah Batu',
    alamat: 'Jl. Buah Batu No. 99, Bandung', rating: 4.4, ulasan: 870, warna: 'hijau', kuota: 25, meja: 0,
    menu: [
      ['Martabak Telor Spesial', 'Martabak', 45000, 20, 'Tiga telur bebek dan daging sapi.'],
      ['Martabak Manis Cokelat Keju', 'Martabak', 40000, 20, 'Terang bulan tebal.'],
    ],
  },
  {
    slug: 'cilok', nama: 'Cilok Gang Senggol', kategori: 'Jajanan', lokasi: 'Dago',
    alamat: 'Gg. Senggol No. 7, Dago, Bandung', rating: 4.3, ulasan: 640, warna: 'ungu', kuota: 60, meja: 4,
    menu: [
      ['Cilok Bumbu Kacang', 'Jajanan', 12000, 80, 'Cilok kenyal dengan saus kacang.'],
      ['Cilok Kuah Pedas', 'Jajanan', 14000, 60, 'Cilok dalam kuah kaldu pedas.'],
    ],
  },
  {
    slug: 'miekocok', nama: 'Mie Kocok Pak Haji', kategori: 'Mie', lokasi: 'Sukajadi',
    alamat: 'Jl. Sukajadi No. 150, Bandung', rating: 4.6, ulasan: 1210, warna: 'kuning', kuota: 35, meja: 6,
    menu: [
      ['Mie Kocok Kikil', 'Mie', 30000, 30, 'Mie kocok khas Bandung dengan kikil sapi.'],
      ['Mie Kocok Spesial', 'Mie', 38000, 20, 'Kikil, sumsum, dan bakso.'],
      ['Es Teh Tawar', 'Minuman', 4000, 100, 'Teh tawar dingin.'],
    ],
  },
  {
    slug: 'batagor', nama: 'Batagor Riri Viral', kategori: 'Batagor', lokasi: 'Burangrang',
    alamat: 'Jl. Burangrang No. 41, Bandung', rating: 4.5, ulasan: 1050, warna: 'merah', kuota: 45, meja: 8,
    menu: [
      ['Batagor Kering', 'Batagor', 25000, 40, 'Batagor ikan tenggiri dengan saus kacang.'],
      ['Batagor Kuah', 'Batagor', 27000, 30, 'Batagor dengan kuah kaldu hangat.'],
      ['Siomay Campur', 'Batagor', 25000, 30, 'Siomay, kol, kentang, pare, dan telur.'],
    ],
  },
];

const PELANGGAN_ANTRE: [nama: string, mode: ModePemesanan, rombongan: number, item: [number, number][]][] = [
  ['Dinda Safitri', 'DINE_IN', 4, [[0, 2], [4, 4]]],
  ['Fajar Ramadhan', 'TAKEAWAY', 1, [[2, 1]]],
  ['Nadia Putri', 'DINE_IN', 2, [[1, 2]]],
  ['Yoga Aditya', 'TAKEAWAY', 1, [[0, 3]]],
  ['Salsa Maharani', 'DINE_IN', 3, [[3, 3], [4, 3]]],
  ['Bima Kurniawan', 'TAKEAWAY', 1, [[1, 1]]],
];

async function akun(q: Queryable, nama: string, email: string, noHp: string, password: string, role: Role) {
  const a = await Pengguna.saveCredentials(q, { nama, email, noHp, password, role });
  if (role === 'PELANGGAN') return { akun: a, pelanggan: await Pelanggan.accountRegister(q, a) };
  if (role === 'ADMIN') await Admin.accountRegister(q, a);
  return { akun: a, pelanggan: null };
}

/** Membuat pesanan lunas lengkap dengan tiket antrean (meniru alur UC02). */
async function pesananLunas(
  q: Queryable,
  pelangganId: string,
  restoranId: string,
  mode: ModePemesanan,
  rombongan: number,
  items: { menu_id: string; nama_menu: string; harga: number; jumlah: number }[],
  booking?: { tanggal: string; slot: string },
) {
  const pesananId = await Pesanan.simpan(q, {
    pelangganId,
    restoranId,
    mode,
    rombongan,
    tanggal: booking?.tanggal ?? null,
    slot: booking?.slot ?? null,
    items: items.map((i) => ({ ...i, subtotal: i.harga * i.jumlah })),
    biayaLayanan: 2000,
  });
  const pesanan = (await Pesanan.getById(q, pesananId))!;
  const bayar = await Pembayaran.buat(q, {
    pesananId, tipe: 'EWALLET', jumlah: pesanan.total_harga, kodeBayar: `SEED-${pesananId}`, menit: 15,
  });
  await Pembayaran.tandaiLunas(q, bayar.id_pembayaran);
  for (const i of items) await Menu.kurangiStok(q, i.menu_id, i.jumlah);
  await RiwayatTransaksi.catatLogTransaksi(q, bayar.id_pembayaran, bayar.jumlah);
  await Pesanan.updateStatus(q, pesananId, 'DIKONFIRMASI');
  const antrean = (await Antrean.getByRestoran(q, restoranId))!;
  await TiketAntrean.terbitkan(q, { antreanId: antrean.antrean_id, pelangganId, pesananId, tipe: mode });
  return pesananId;
}

const PDF_CONTOH = Buffer.from(
  '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    '4 0 obj<</Length 58>>stream\nBT /F1 14 Tf 20 60 Td (Dokumen contoh - data fiktif) Tj ET\nendstream endobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

export async function seed(db: Database, opts: { uploadDir?: string; menitPerAntrean?: number } = {}): Promise<boolean> {
  const ada = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM pengguna`);
  if (ada[0].n > 0) return false;

  await db.tx(async (q) => {
    await akun(q, 'Admin antri.in', AKUN_UJI.admin.email, '081100000001', AKUN_UJI.admin.password, 'ADMIN');
    const utama = await akun(q, 'Rizky Pratama', AKUN_UJI.pelanggan.email, '081200000001', AKUN_UJI.pelanggan.password, 'PELANGGAN');

    const restoranIds: Record<string, string> = {};
    const menuIds: Record<string, { menu_id: string; nama_menu: string; harga: number }[]> = {};
    let no = 10;
    for (const r of RESTORAN) {
      const { akun: a } = await akun(q, r.nama, `${r.slug}@antri.in`, `08130000${no++}`, 'restoran123', 'RESTORAN');
      const id = await Restoran.buat(q, {
        nama: r.nama, kategori: r.kategori, lokasi: r.lokasi, alamat: r.alamat, email: `${r.slug}@antri.in`,
        noHp: a.no_hp, idAkun: a.id_pengguna, rating: r.rating, ulasan: r.ulasan, warna: r.warna,
        kuota: r.kuota, meja: r.meja,
      });
      restoranIds[r.slug] = id;
      menuIds[r.slug] = [];
      for (const [nama, kategori, harga, stok, deskripsi] of r.menu) {
        const m = await Menu.tambahMenu(q, id, { namaMenu: nama, kategoriMenu: kategori, harga, stok, deskripsiMenu: deskripsi });
        menuIds[r.slug].push(m);
      }
    }

    // Antrean contoh di Bakso Mang Ujang dan Seblak Teh Nining.
    let i = 0;
    for (const [nama, mode, rombongan, item] of PELANGGAN_ANTRE) {
      const p = await akun(q, nama, `${nama.split(' ')[0].toLowerCase()}@contoh.id`, `08140000${10 + i++}`, 'pelanggan123', 'PELANGGAN');
      await pesananLunas(q, p.pelanggan!.pelanggan_id, restoranIds.bakso, mode, rombongan,
        item.map(([idx, jumlah]) => ({ ...menuIds.bakso[idx], jumlah })));
    }
    const pesananUtama = await pesananLunas(q, utama.pelanggan!.pelanggan_id, restoranIds.bakso, 'DINE_IN', 2,
      [{ ...menuIds.bakso[0], jumlah: 1 }, { ...menuIds.bakso[3], jumlah: 1 }]);
    for (let k = 0; k < 3; k++) {
      const p = await akun(q, `Pelanggan Seblak ${k + 1}`, `seblak${k + 1}@contoh.id`, `08150000${10 + k}`, 'pelanggan123', 'PELANGGAN');
      await pesananLunas(q, p.pelanggan!.pelanggan_id, restoranIds.seblak, 'TAKEAWAY', 1, [{ ...menuIds.seblak[0], jumlah: 2 }]);
    }
    for (const slug of Object.keys(restoranIds)) await Antrean.updateStatus(q, restoranIds[slug], opts.menitPerAntrean ?? 3);

    // Iterasi 2: pesanan lama yang sudah selesai (agar pelanggan uji bisa langsung mencoba fitur ulasan).
    await pesananLunas(q, utama.pelanggan!.pelanggan_id, restoranIds.batagor, 'TAKEAWAY', 1,
      [{ ...menuIds.batagor[0], jumlah: 2 }]);
    await Antrean.dequeueCustomer(q, restoranIds.batagor, 'SELESAI', opts.menitPerAntrean ?? 3);

    // Iterasi 2: restoran selain Bakso Mang Ujang dijalankan simulator antrean dummy secara penuh,
    // sedangkan Bakso Mang Ujang dikelola manual oleh akun uji restoran (mode simulasi dapat diubah di dashboard).
    await q.query(`UPDATE restoran SET mode_simulasi = 'PENUH' WHERE restoran_id <> $1`, [restoranIds.bakso]);

    await Keluhan.simpanKeluhan(q, {
      pelangganId: utama.pelanggan!.pelanggan_id, pesananId: pesananUtama, restoranId: restoranIds.bakso,
      kategori: 'Waktu tunggu', isi: 'Estimasi di aplikasi 15 menit, tapi kemarin saya menunggu hampir 40 menit.',
    });

    // Akun restoran yang belum bermitra + satu pengajuan menunggu verifikasi.
    await akun(q, 'Calon Mitra', AKUN_UJI.calonMitra.email, '081600000001', AKUN_UJI.calonMitra.password, 'RESTORAN');
    const pemohon = await akun(q, 'Surabi Enhaii', 'surabi@antri.in', '081600000002', 'restoran123', 'RESTORAN');
    const idPengajuan = await PengajuanMitra.simpan(q, {
      id_pengguna: pemohon.akun.id_pengguna, nama_restoran: 'Surabi Enhaii', kategori: 'Surabi', lokasi: 'Setiabudi',
      alamat: 'Jl. Setiabudi No. 186, Bandung', email_kontak: 'surabi@antri.in', no_hp: '081600000002',
      daftar_menu: [{ namaMenu: 'Surabi Oncom', harga: 12000 }, { namaMenu: 'Surabi Cokelat Keju', harga: 15000 }],
    });
    if (opts.uploadDir) {
      fs.mkdirSync(opts.uploadDir, { recursive: true });
      for (const jenis of ['nib', 'izinUsaha']) {
        const file = `${generateId('F')}.pdf`;
        fs.writeFileSync(path.join(opts.uploadDir, file), PDF_CONTOH);
        await DokumenVerifikasi.unggahDokumen(q, {
          idPengajuan, jenis, namaFile: `${jenis}-surabi-enhaii.pdf`, path: file, mime: 'application/pdf',
        });
      }
    }
  });
  return true;
}
