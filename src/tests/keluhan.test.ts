/**
 * Pengujian UC13-UC15 (keluhan, tanggapan, hapus restoran). Penanggung jawab: Athallah.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C02 Restoran
 *   - C14 Admin
 *   - C30 Keluhan
 *   - C33 KelolaDataRestoranController
 *   - C41 KeluhanController
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C31 DashboardKelolaRestoranPage
 *   - C32 KonfirmasiHapusRestoranPage
 *   - C40 KeluhanFormPage
 *   - C42 KeluhanDashboardPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai, menuPertama, pesanDanBayar, restoranId } from './helpers.js';
import { Restoran } from '../server/models/restoran.js';
import { Menu } from '../server/models/menu.js';
import { Kuota } from '../server/models/kuota.js';
import { Antrean } from '../server/models/antrean.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC13-UC15 keluhan & kelola restoran', () => {
  test('[C30-UT02, C30-UT03, C30-UT04, C41-UT04, C41-UT05, C41-UT06] keluhan dikirim, dibaca, dan ditanggapi admin', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [pesanan] = await app.controllers.pemesanan.daftarPesananSaya(user);
    const k = await app.controllers.keluhan.kirimKeluhan(user, { pesananId: pesanan.pesanan_id, kategori: 'Pelayanan', isi: 'Pelayan kurang ramah saat saya datang.' });
    assert.equal(k.status, 'BARU');
    assert.equal(k.restoran_id, pesanan.restoran_id);
    const detail = await app.controllers.keluhan.detailKeluhan(k.id_keluhan);
    assert.equal(detail.status, 'DIBACA');
    const t = await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Terima kasih, sudah kami teruskan ke restoran.');
    assert.equal(t.status, 'DITANGGAPI');
    const panjang = await gagal(app.controllers.keluhan.kirimKeluhan(user, { kategori: 'Lainnya', isi: 'x'.repeat(501) }));
    assert.equal(panjang.status, 400);
  });
  test('[C02-UT02, C02-UT05, C33-UT01] hapus restoran menonaktifkan menu dan membatalkan antrean aktif', async () => {
    const resto = await restoranId(app, 'Seblak Teh Nining');
    await app.controllers.kelolaRestoran.hapusDataRestoran(resto);
    const aktif = await app.ctx.db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id
       WHERE a.restoran_id = $1 AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL')`, [resto]);
    assert.equal(aktif[0].n, 0);
    const menu = await app.ctx.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM menu WHERE restoran_id = $1 AND aktif`, [resto]);
    assert.equal(menu[0].n, 0);
    const e = await gagal(app.controllers.pencarian.getDetailRestoran(resto));
    assert.equal(e.status, 404);
    const restoUser = await gagal(loginSebagai(app, 'seblak@antri.in', 'restoran123').then((u) => {
      if (!u.restoranId) throw Object.assign(new Error('tanpa restoran'), { status: 0 });
    }));
    assert.equal(restoUser.message, 'tanpa restoran');
  });
});

describe('Iterasi 2: keluhan & kelola restoran', () => {
  test('[C41-UT07, C41-UT08] filter keluhan Ditanggapi dan notifikasi tanggapan ke pelanggan', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const k = await app.controllers.keluhan.kirimKeluhan(user, { kategori: 'Pembayaran', isi: 'Saldo terpotong dua kali saat membayar.' });
    await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Dana sudah kami kembalikan, mohon cek saldo.');
    const ditanggapi = await app.controllers.keluhan.tampilkanKeluhan({ status: 'DITANGGAPI' });
    assert.ok(ditanggapi.every((x) => x.status === 'DITANGGAPI'));
    assert.ok(ditanggapi.some((x) => x.id_keluhan === k.id_keluhan));
    const { items } = await app.controllers.notifikasi.daftar(user);
    assert.ok(items.some((n) => n.judul.includes('ditanggapi')));
  });

  test('[C33-UT02] filter Aktif/Nonaktif pada kelola restoran', async () => {
    const semua = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'semua' });
    const nonaktif = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'nonaktif' });
    const aktif = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'aktif' });
    assert.ok(nonaktif.length >= 1, 'Seblak sudah dihapus pada test sebelumnya');
    assert.ok(nonaktif.every((r) => !r.status_aktif));
    assert.ok(aktif.every((r) => r.status_aktif));
    assert.equal(semua.length, aktif.length + nonaktif.length);
  });
});

describe('C30/C41 Keluhan', () => {
  test('C41-UT01 kategori tidak valid dan isi terlalu pendek ditolak per kolom', async () => {
    const u = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const e = await gagal(app.controllers.keluhan.kirimKeluhan(u, { kategori: 'Ngawur', isi: 'pendek' }));
    assert.equal(e.status, 400);
    assert.deepEqual(Object.keys(e.details.fields).sort(), ['isi', 'kategori']);
  });
  test('C41-UT02 batas isi tepat 500 karakter diterima, tanggapan kosong atau id tidak ada ditolak', async () => {
    const u = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const k = await app.controllers.keluhan.kirimKeluhan(u, { kategori: 'Lainnya', isi: 'x'.repeat(500) });
    assert.equal(k.status, 'BARU');
    assert.equal((await gagal(app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, ''))).status, 400);
    assert.equal((await gagal(app.controllers.keluhan.tanggapiKeluhan('KLH-tidak-ada', 'Tanggapan sah'))).status, 404);
  });
  test('C30-UT01 keluhan yang sudah ditanggapi tidak turun status saat dibaca ulang', async () => {
    const u = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const k = await app.controllers.keluhan.kirimKeluhan(u, { kategori: 'Waktu tunggu', isi: 'Menunggu terlalu lama sekali.' });
    await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Mohon maaf atas ketidaknyamanannya.');
    assert.equal((await app.controllers.keluhan.detailKeluhan(k.id_keluhan)).status, 'DITANGGAPI');
  });
  test('C41-UT03 admin tidak boleh mengirim keluhan (hanya pelanggan)', async () => {
    const admin = await loginSebagai(app, 'admin@antri.in', 'admin12345');
    assert.equal((await gagal(app.controllers.keluhan.kirimKeluhan(admin, { kategori: 'Lainnya', isi: 'x'.repeat(20) }))).status, 403);
  });
});

describe('Pelengkap C30, C33', () => {
  test('C33-UT03 hapusDataRestoran: restoran tidak ada/sudah dihapus -> 404; pelanggan terdampak dan email dicatat', async () => {
    assert.equal((await gagal(app.controllers.kelolaRestoran.hapusDataRestoran('RST-tidak-ada'))).status, 404);
    const bakso = await restoranId(app, 'Bakso Mang Ujang');
    await app.controllers.kelolaRestoran.hapusDataRestoran(bakso);
    assert.equal((await gagal(app.controllers.kelolaRestoran.hapusDataRestoran(bakso))).status, 404);
    const pel = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const { items } = await app.controllers.notifikasi.daftar(pel);
    assert.ok(items.some((n) => n.judul.includes('dibatalkan')));
    const log = await app.ctx.db.query(`SELECT 1 FROM log_notifikasi WHERE jenis = 'RESTORAN_DIHAPUS'`);
    assert.ok(log.length >= 1);
  });
  test('C30-UT05 daftar keluhan: pencarian kata kunci nama restoran', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [pesanan] = await app.controllers.pemesanan.daftarPesananSaya(user);
    const k = await app.controllers.keluhan.kirimKeluhan(user, { pesananId: pesanan.pesanan_id, kategori: 'Lainnya', isi: 'Keluhan untuk uji pencarian kata kunci.' });
    const [r] = await app.ctx.db.query<{ nama_restoran: string }>(`SELECT nama_restoran FROM restoran WHERE restoran_id = $1`, [pesanan.restoran_id]);
    const cocok = await app.controllers.keluhan.tampilkanKeluhan({ q: r.nama_restoran.slice(0, 5) });
    assert.ok(cocok.some((x) => x.id_keluhan === k.id_keluhan));
    assert.deepEqual(await app.controllers.keluhan.tampilkanKeluhan({ q: 'zzz-tidak-ada-zzz' }), []);
  });
});

describe('Pelengkap C02 (purgeData) dan C33', () => {
  test('C02-UT09 setSoftDelete/purgeData: menu, kuota, antrean, pesanan aktif, dan pembayaran menunggu ikut dinonaktifkan', async () => {
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);
    const dibayar = await pesanDanBayar(app, 'salsa@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const bima = await loginSebagai(app, 'bima@contoh.id', 'pelanggan123');
    const belum = await app.controllers.pemesanan.buatPesanan(bima, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const tagihan = await app.controllers.pembayaran.buatTagihan(bima, belum!.pesanan_id, 'EWALLET');

    await app.controllers.kelolaRestoran.hapusDataRestoran(resto);

    const status = async (id: string) =>
      (await app.ctx.db.query<{ s: string }>(`SELECT status_pemesanan AS s FROM pesanan WHERE pesanan_id = $1`, [id]))[0].s;
    assert.equal(await status(dibayar.pesanan.pesanan_id), 'DIBATALKAN');
    assert.equal(await status(belum!.pesanan_id), 'DIBATALKAN');
    const [bayar] = await app.ctx.db.query<{ s: string }>(`SELECT status_pembayaran AS s FROM pembayaran WHERE id_pembayaran = $1`, [tagihan.id_pembayaran]);
    assert.equal(bayar.s, 'GAGAL');
    const [m] = await app.ctx.db.query<{ n: number; stok: number }>(`SELECT COUNT(*) FILTER (WHERE aktif)::int AS n, COALESCE(MAX(stok), 0)::int AS stok FROM menu WHERE restoran_id = $1`, [resto]);
    assert.equal(m.n, 0);
    assert.equal(m.stok, 0);
    const [k] = await app.ctx.db.query<{ kuota_maksimum: number }>(`SELECT kuota_maksimum FROM pengaturan_kuota WHERE restoran_id = $1`, [resto]);
    assert.equal(k.kuota_maksimum, 0);
    const [a] = await app.ctx.db.query<{ status_antrean: string; total_antrean: number }>(`SELECT status_antrean, total_antrean FROM antrean WHERE restoran_id = $1`, [resto]);
    assert.deepEqual(a, { status_antrean: 'TUTUP', total_antrean: 0 });
    const [r] = await app.ctx.db.query<{ dihapus_pada: Date | null }>(`SELECT dihapus_pada FROM restoran WHERE restoran_id = $1`, [resto]);
    assert.ok(r.dihapus_pada);
  });
});

describe('Pelengkap C02 (setSoftDelete langsung)', () => {
  test('C02-UT10 Restoran.setSoftDelete: restoran aktif -> true dan tidak tampil; panggilan kedua dan ID tidak ada -> false', async () => {
    const id = await restoranId(app, 'Kopi Senja Braga');
    assert.ok(await Restoran.getDetailRestoran(app.ctx.db, id));
    assert.equal(await Restoran.setSoftDelete(app.ctx.db, id), true);
    assert.equal(await Restoran.getDetailRestoran(app.ctx.db, id), null);
    assert.ok(await Restoran.getDetailRestoran(app.ctx.db, id, true), 'tetap ada bila nonaktif disertakan');
    assert.equal(await Restoran.setSoftDelete(app.ctx.db, id), false);
    assert.equal(await Restoran.setSoftDelete(app.ctx.db, 'RST-tidak-ada'), false);
  });
});

describe('Pelengkap C02 (negatif dan batas)', () => {
  test('C02-UT11 getDaftarMenu: restoran tidak ada -> daftar kosong; restoran yang dihapus tidak memuat menu lagi (batas)', async () => {
    assert.deepEqual(await Menu.getDaftarMenu(app.ctx.db, 'RST-tidak-ada'), []);
    const id = await restoranId(app, 'Cilok Gang Senggol');
    assert.ok((await Menu.getDaftarMenu(app.ctx.db, id)).length > 0);
    await app.controllers.kelolaRestoran.hapusDataRestoran(id);
    assert.deepEqual(await Menu.getDaftarMenu(app.ctx.db, id), []);
  });
  test('C02-UT12 ajukanPendaftaran/accountRegister (Restoran.buat): restoran baru lengkap dengan kuota dan antrean; akun tidak ada ditolak', async () => {
    const data = { nama: 'Warung Uji C02', kategori: 'Makanan', lokasi: 'Dago', alamat: 'Jl. Uji No. 1, Bandung', email: 'uji-c02@contoh.id', noHp: null, idAkun: null };
    const id = await Restoran.buat(app.ctx.db, data);
    assert.equal((await Restoran.getDetailRestoran(app.ctx.db, id))?.nama_restoran, 'Warung Uji C02');
    assert.equal((await Kuota.get(app.ctx.db, id))?.kuota_maksimum, 50);
    assert.equal((await Antrean.getByRestoran(app.ctx.db, id))?.status_antrean, 'BUKA');
    await assert.rejects(Restoran.buat(app.ctx.db, { ...data, idAkun: 'USR-tidak-ada' }));
    assert.equal(await Restoran.getByAkun(app.ctx.db, 'USR-tidak-ada'), null);
  });
  test('C02-UT13 purgeData (setSoftDelete) pada ID tidak ada tidak mengubah restoran lain', async () => {
    const hitung = async () => (await app.ctx.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM menu WHERE aktif`))[0].n;
    const sebelum = await hitung();
    assert.equal(await Restoran.setSoftDelete(app.ctx.db, 'RST-tidak-ada'), false);
    assert.equal(await hitung(), sebelum);
  });
});
