/**
 * Pengujian UC03, UC06, UC07, UC09 (antrean & kuota). Penanggung jawab: Fikri.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C04 Antrean
 *   - C09 TiketAntrean
 *   - C10 PemantauAntreanController
 *   - C16 KelolaAntreanController
 *   - C20 Kuota
 *   - C21 PengaturanKuotaController
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C11 HalamanStatusAntrean
 *   - C17 KonfirmasiDequeuePage
 *   - C18 KelolaAntreanPage
 *   - C19 DashboardAntreanPage
 *   - C22 PengaturanKuotaPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { hitungEstimasi, medianJedaMenit, tentukanStatusAntrean } from '../server/models/antrean.js';
import { bilanganCacah } from '../server/utils/validasi.js';
import { formatNomorAntrean } from '../server/utils/ids.js';
import { appUji, gagal, loginSebagai } from './helpers.js';
import { TiketAntrean } from '../server/models/antrean.js';
import { Kuota } from '../server/models/kuota.js';
import { EventEmitter } from 'node:events';
import { eventBus } from '../server/realtime/eventBus.js';
import { menuPertama, pesanDanBayar, restoranId } from './helpers.js';
import { Antrean } from '../server/models/antrean.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC03, UC06, UC09 antrean', () => {
  test('[C04-UT04, C04-UT05, C10-UT03, C16-UT01, C16-UT02] dequeue memanggil pelanggan berikutnya dan memperbarui sisa antrean', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const awal = await app.controllers.kelolaAntrean.getAntrean(resto);
    assert.equal(awal.daftar[0].status_antrean, 'DIPANGGIL');
    const pelanggan = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [tiketSaya] = await app.controllers.pemantau.getAntreanAktifSaya(pelanggan);
    const sisaAwal = tiketSaya.sisaAntrean;

    const hasil = await app.controllers.kelolaAntrean.processDequeue(resto, awal.daftar[0].id_tiket);
    assert.equal(hasil.nomor, 'A-001');
    const sesudah = await app.controllers.kelolaAntrean.getAntrean(resto);
    assert.equal(sesudah.ringkasan.antreanAktif, awal.ringkasan.antreanAktif - 1);
    assert.equal(sesudah.ringkasan.nomorDilayani, 1);
    assert.equal(sesudah.daftar[0].status_antrean, 'DIPANGGIL');
    const status = await app.controllers.pemantau.getStatusAntrean(pelanggan, tiketSaya.tiket.id_tiket);
    assert.equal(status.sisaAntrean, sisaAwal - 1);
    assert.equal(status.estimasiMenit, (sisaAwal - 1) * app.ctx.config.menitPerAntrean);
  });
  test('[C16-UT03] dequeue dengan data layar usang ditolak', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const e = await gagal(app.controllers.kelolaAntrean.processDequeue(resto, 'TKT-usang'));
    assert.equal(e.status, 409);
  });
  test('[C16-UT05] dequeue otomatis setelah 30 menit tidak hadir (Alt 2)', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const awal = await app.controllers.kelolaAntrean.getAntrean(resto);
    const front = awal.daftar[0];
    await app.ctx.db.query(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() - INTERVAL '31 minutes' WHERE id_tiket = $1`, [front.id_tiket]);
    const diproses = await app.controllers.kelolaAntrean.autoDequeue();
    assert.ok(diproses.includes(resto.restoranId!));
    const t = await app.ctx.db.query<{ status_antrean: string }>(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]);
    assert.equal(t[0].status_antrean, 'DILEWATI');
  });
  test('[C04-UT07, C16-UT04] restoran tanpa antrean tidak dapat dequeue', async () => {
    const resto = await loginSebagai(app, 'martabak@antri.in', 'restoran123');
    const e = await gagal(app.controllers.kelolaAntrean.processDequeue(resto));
    assert.match(e.message, /Belum ada antrean/);
  });
});

describe('UC07 kuota', () => {
  test('[C20-UT03, C21-UT01, C21-UT02] kuota negatif ditolak; kuota 0 menutup antrean', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const e = await gagal(app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '-5', kapasitasMeja: '3' }));
    assert.equal(e.status, 400);
    const tutup = await app.controllers.kuota.onSaveSettings(resto, { kapasitasMeja: '3', tutup: true });
    assert.equal(tutup.antreanTutup, true);
    assert.equal(tutup.pratinjau.status_antrean, 'TUTUP');
    const buka = await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '40', kapasitasMeja: '3' });
    assert.equal(buka.pratinjau.status_antrean, 'BUKA');
  });
});

test('[C04-UT01, C20-UT05] status antrean dari kuota (UC07)', () => {
  assert.equal(tentukanStatusAntrean(0, 0), 'TUTUP');
  assert.equal(tentukanStatusAntrean(30, 29), 'BUKA');
  assert.equal(tentukanStatusAntrean(30, 30), 'PENUH');
});

test('[C04-UT02] estimasi waktu tunggu', () => {
  assert.equal(hitungEstimasi(6, 3), 18);
  assert.equal(hitungEstimasi(-1, 3), 0);
});

test('[C21-UT03] input kuota: hanya bilangan bulat tidak negatif', () => {
  assert.equal(bilanganCacah('12'), 12);
  assert.equal(bilanganCacah(0), 0);
  assert.equal(bilanganCacah('-3'), null);
  assert.equal(bilanganCacah('abc'), null);
  assert.equal(bilanganCacah(2.5), null);
});

test('[C09-UT04] format nomor antrean', () => {
  assert.equal(formatNomorAntrean(7), 'A-007');
  assert.equal(formatNomorAntrean(1234), 'A-1234');
});

describe('Iterasi 2: antrean', () => {
  test('[C20-UT04, C21-UT04] tutup sementara tidak menghapus nilai kuota', async () => {
    const resto = await loginSebagai(app, 'cilok@antri.in', 'restoran123');
    await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '35', kapasitasMeja: '4' });
    const tutup = await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '35', kapasitasMeja: '4', tutup: true });
    assert.equal(tutup.antreanTutup, true);
    assert.equal(tutup.kuotaMaksimum, 35);
    assert.equal(tutup.pratinjau.status_antrean, 'TUTUP');
    const buka = await app.controllers.kuota.onSaveSettings(resto, { kapasitasMeja: '4', tutup: false });
    assert.equal(buka.kuotaMaksimum, 35);
    assert.equal(buka.pratinjau.status_antrean, 'BUKA');
  });

  test('[C10-UT04, C16-UT06] "Mulai siapkan" menandai tiket dan terlihat di status pelanggan', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const pelanggan = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [saya] = await app.controllers.pemantau.getAntreanAktifSaya(pelanggan);
    assert.equal(saya.disiapkan, false);
    await app.controllers.kelolaAntrean.tandaiDisiapkan(resto, saya.tiket.id_tiket);
    const sesudah = await app.controllers.pemantau.getStatusAntrean(pelanggan, saya.tiket.id_tiket);
    assert.equal(sesudah.disiapkan, true);
    const ulang = await gagal(app.controllers.kelolaAntrean.tandaiDisiapkan(resto, saya.tiket.id_tiket));
    assert.equal(ulang.status, 409);
  });

  test('[C04-UT06] pelanggan yang dipanggil mendapat notifikasi "Giliranmu"', async () => {
    const yoga = await loginSebagai(app, 'yoga@contoh.id', 'pelanggan123');
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    for (let i = 0; i < 6; i++) {
      const d = await app.controllers.kelolaAntrean.getAntrean(resto);
      if (d.daftar[0]?.nama_pelanggan === 'Yoga Aditya' && d.daftar[0].status_antrean === 'DIPANGGIL') break;
      await app.controllers.kelolaAntrean.processDequeue(resto);
    }
    const { items } = await app.controllers.notifikasi.daftar(yoga);
    assert.ok(items.some((n) => n.judul.startsWith('Giliranmu')));
  });
});

test('[C04-UT03] menit per antrean dari median jeda penyelesaian', () => {
  const t = (m: number) => new Date(Date.UTC(2026, 9, 31, 10, m));
  assert.equal(medianJedaMenit([t(0), t(4)], 3), 3); // data kurang -> bawaan
  assert.equal(medianJedaMenit([t(0), t(5), t(9), t(15)], 3), 5);
  assert.equal(medianJedaMenit([t(0), t(30), t(60), t(90)], 3), 15); // dibatasi maksimum 15
});

describe('C09 TiketAntrean', () => {
  test('C09-UT01 nomor urut tiket unik dan bertambah per antrean pada hari yang sama (KNF03)', async () => {
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);
    const nomor: number[] = [];
    for (const email of ['salsa@contoh.id', 'bima@contoh.id', 'yoga@contoh.id']) {
      const { hasil } = await pesanDanBayar(app, email, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
      const [t] = await app.ctx.db.query<{ nomor_urut: number }>(`SELECT nomor_urut FROM tiket_antrean WHERE id_tiket = $1`, [(hasil as { idTiket: string | null }).idTiket]);
      nomor.push(t.nomor_urut);
    }
    assert.equal(new Set(nomor).size, 3);
    assert.ok(nomor[0] < nomor[1] && nomor[1] < nomor[2]);
  });
  test('C09-UT02 generateNomorAntrean menghasilkan nomor berikutnya (maks + 1)', async () => {
    const [a] = await app.ctx.db.query<{ antrean_id: string }>(`SELECT antrean_id FROM antrean LIMIT 1`);
    const [{ m }] = await app.ctx.db.query<{ m: number }>(
      `SELECT COALESCE(MAX(nomor_urut), 0)::int AS m FROM tiket_antrean WHERE antrean_id = $1 AND waktu_terbit::date = CURRENT_DATE`, [a.antrean_id]);
    assert.equal(await TiketAntrean.generateNomorAntrean(app.ctx.db, a.antrean_id), m + 1);
  });
  test('C09-UT03 tiket berstatus final tidak boleh diubah (DPPL C09)', { todo: 'updateStatusTiket belum menjaga status final' }, async () => {
    const [t] = await app.ctx.db.query<{ id_tiket: string }>(`SELECT id_tiket FROM tiket_antrean WHERE status_antrean = 'SELESAI' LIMIT 1`);
    await TiketAntrean.updateStatusTiket(app.ctx.db, t.id_tiket, 'MENUNGGU');
    const [s] = await app.ctx.db.query<{ status_antrean: string }>(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [t.id_tiket]);
    assert.equal(s.status_antrean, 'SELESAI');
  });
});

describe('C20 Kuota', () => {
  test('C20-UT01 isAntreanTutup: toggle atau kuota 0', () => {
    assert.equal(Kuota.isAntreanTutup({ kuota_maksimum: 10, antrean_ditutup: false }), false);
    assert.equal(Kuota.isAntreanTutup({ kuota_maksimum: 10, antrean_ditutup: true }), true);
    assert.equal(Kuota.isAntreanTutup({ kuota_maksimum: 0, antrean_ditutup: false }), true);
  });
  test('C20-UT02 updateKapasitas menyimpan dan get membaca kembali', async () => {
    const id = await restoranId(app, 'Cilok Gang Senggol');
    await Kuota.updateKapasitas(app.ctx.db, id, 21, 5, false);
    const k = await Kuota.get(app.ctx.db, id);
    assert.equal(k?.kuota_maksimum, 21);
    assert.equal(k?.kapasitas_meja, 5);
    assert.equal(await Kuota.get(app.ctx.db, 'RST-tidak-ada'), null);
  });
});

describe('C10 PemantauAntreanController', () => {
  test('C10-UT01 subscribe membuka kanal SSE, meneruskan event, dan berhenti saat koneksi ditutup', () => {
    const tulis: string[] = [];
    const res = Object.assign(new EventEmitter(), {
      writeHead: () => res,
      write: (s: string) => { tulis.push(s); return true; },
    });
    app.controllers.pemantau.subscribe('R-sse', res as never);
    assert.match(tulis[0], /event: siap/);
    eventBus.antreanBerubah('R-sse', 'uji');
    assert.ok(tulis.some((s) => s.includes('event: antrean') && s.includes('"alasan":"uji"')));
    res.emit('close');
    const sebelum = tulis.length;
    eventBus.antreanBerubah('R-sse', 'setelah-tutup');
    assert.equal(tulis.length, sebelum);
  });
  test('C10-UT02 tiket tidak ada -> 404, tiket milik orang lain -> 403', async () => {
    const a = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    assert.equal((await gagal(app.controllers.pemantau.getStatusAntrean(a, 'TKT-tidak-ada'))).status, 404);
    const [tiket] = await app.controllers.pemantau.getAntreanAktifSaya(a);
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    assert.equal((await gagal(app.controllers.pemantau.getStatusAntrean(lain, tiket.tiket.id_tiket))).status, 403);
  });
});

describe('Pelengkap C02, C04, C09, C16, C21', () => {
  test('C16-UT07 autoDequeue: tiket dipanggil 29 menit 55 detik lalu belum dilewati (batas 30 menit)', async () => {
    const [t] = await app.ctx.db.query<{ id_tiket: string; restoran_id: string }>(
      `SELECT t.id_tiket, a.restoran_id FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id
       WHERE t.status_antrean = 'DIPANGGIL' LIMIT 1`);
    assert.ok(t, 'seed menyediakan tiket DIPANGGIL');
    await app.ctx.db.query(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() - INTERVAL '29 minutes 55 seconds' WHERE id_tiket = $1`, [t.id_tiket]);
    const diproses = await app.controllers.kelolaAntrean.autoDequeue();
    assert.ok(!diproses.includes(t.restoran_id));
    const [s] = await app.ctx.db.query<{ status_antrean: string }>(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [t.id_tiket]);
    assert.equal(s.status_antrean, 'DIPANGGIL');
  });
  test('C04-UT08 getDetailAntrean: hanya tiket MENUNGGU/DIPANGGIL beserta rincian; restoran tanpa antrean -> kosong', async () => {
    const daftar = await Antrean.getDetailAntrean(app.ctx.db, await restoranId(app, 'Bakso Mang Ujang'));
    assert.ok(daftar.length > 0);
    assert.ok(daftar.every((d) => ['MENUNGGU', 'DIPANGGIL'].includes(d.status_antrean) && typeof d.rincian === 'string'));
    assert.deepEqual(await Antrean.getDetailAntrean(app.ctx.db, 'RST-tidak-ada'), []);
  });
  test('C02-UT08 getAntrean: antrean restoran ada; ID tidak ada -> null', async () => {
    const a = await Antrean.getByRestoran(app.ctx.db, await restoranId(app, 'Bakso Mang Ujang'));
    assert.ok(a?.antrean_id);
    assert.equal(await Antrean.getByRestoran(app.ctx.db, 'RST-tidak-ada'), null);
  });
  test('C09-UT07 generateNomorAntrean: nomor kembali ke 1 pada hari berikutnya (reset harian)', async () => {
    const [a] = await app.ctx.db.query<{ antrean_id: string }>(`SELECT antrean_id FROM antrean WHERE restoran_id = $1`, [await restoranId(app, 'Cilok Gang Senggol')]);
    await app.ctx.db.query(`UPDATE tiket_antrean SET waktu_terbit = waktu_terbit - INTERVAL '1 day' WHERE antrean_id = $1`, [a.antrean_id]);
    assert.equal(await TiketAntrean.generateNomorAntrean(app.ctx.db, a.antrean_id), 1);
  });
  test('C21-UT05 onSaveSettings: meja negatif, kuota bukan angka, dan kuota 10001 ditolak; 10000 diterima (batas)', async () => {
    const resto = await loginSebagai(app, 'martabak@antri.in', 'restoran123');
    const meja = await gagal(app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '10', kapasitasMeja: '-1' }));
    assert.ok(meja.details.fields.kapasitasMeja);
    const abc = await gagal(app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: 'abc', kapasitasMeja: '2' }));
    assert.ok(abc.details.fields.kuotaMaksimum);
    assert.equal((await gagal(app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '10001', kapasitasMeja: '2' }))).status, 400);
    assert.equal((await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '10000', kapasitasMeja: '2' })).kuotaMaksimum, 10000);
  });
  test('C21-UT06 displaySettings: pengaturan restoran terbaca; pelanggan ditolak', async () => {
    const resto = await loginSebagai(app, 'cilok@antri.in', 'restoran123');
    const s = await app.controllers.kuota.displaySettings(resto);
    assert.equal(typeof s.kuotaMaksimum, 'number');
    assert.equal(typeof s.antreanTutup, 'boolean');
    const pel = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    assert.ok([401, 403].includes((await gagal(app.controllers.kuota.displaySettings(pel))).status));
  });
});

describe('Pelengkap C04, C09, C16, C20 (normal, batas, negatif)', () => {
  test('C04-UT09 updateStatus, getFrontCustomer, dequeueCustomer: restoran atau antrean tidak ada -> null', async () => {
    assert.equal(await Antrean.updateStatus(app.ctx.db, 'RST-tidak-ada', 3), null);
    assert.equal(await Antrean.getFrontCustomer(app.ctx.db, 'ANT-tidak-ada'), null);
    assert.equal(await Antrean.dequeueCustomer(app.ctx.db, 'RST-tidak-ada', 'SELESAI', 3), null);
  });
  test('C04-UT10 dequeueCustomer: tiket terakhir (batas) selesai, antrean menjadi kosong dan tidak ada pelanggan terdepan', async () => {
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);
    await pesanDanBayar(app, 'yoga@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const menit = app.ctx.config.menitPerAntrean;
    let a = await Antrean.updateStatus(app.ctx.db, resto, menit);
    while ((a?.total_antrean ?? 0) > 1) {
      await Antrean.dequeueCustomer(app.ctx.db, resto, 'SELESAI', menit);
      a = await Antrean.updateStatus(app.ctx.db, resto, menit);
    }
    assert.equal(a?.total_antrean, 1);
    const hasil = await Antrean.dequeueCustomer(app.ctx.db, resto, 'SELESAI', menit);
    assert.equal(hasil?.status_antrean, 'SELESAI');
    const sesudah = await Antrean.getByRestoran(app.ctx.db, resto);
    assert.equal(sesudah?.total_antrean, 0);
    assert.equal(await Antrean.getFrontCustomer(app.ctx.db, sesudah!.antrean_id), null);
  });
  test('C09-UT08 updateStatusTiket: MENUNGGU -> DIPANGGIL tersimpan; ID tiket tidak ada tidak menimbulkan galat', async () => {
    const [t] = await app.ctx.db.query<{ id_tiket: string }>(`SELECT id_tiket FROM tiket_antrean WHERE status_antrean = 'MENUNGGU' LIMIT 1`);
    assert.ok(t, 'ada tiket MENUNGGU');
    await TiketAntrean.updateStatusTiket(app.ctx.db, t.id_tiket, 'DIPANGGIL');
    const [s] = await app.ctx.db.query<{ status_antrean: string }>(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [t.id_tiket]);
    assert.equal(s.status_antrean, 'DIPANGGIL');
    await TiketAntrean.updateStatusTiket(app.ctx.db, 'TKT-tidak-ada', 'SELESAI');
  });
  test('C16-UT08 getAntrean: antrean kosong -> ringkasan 0 (batas), akun pelanggan ditolak (negatif); autoDequeue tanpa tiket kedaluwarsa -> daftar kosong', async () => {
    const kosong = await loginSebagai(app, 'martabak@antri.in', 'restoran123');
    const r = await app.controllers.kelolaAntrean.getAntrean(kosong);
    assert.equal(r.ringkasan.antreanAktif, 0);
    assert.deepEqual(r.daftar, []);
    const pel = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    assert.equal((await gagal(app.controllers.kelolaAntrean.getAntrean(pel))).status, 403);
    await app.ctx.db.query(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() WHERE status_antrean = 'DIPANGGIL'`);
    assert.deepEqual(await app.controllers.kelolaAntrean.autoDequeue(), []);
  });
  test('C20-UT06 updateKapasitas: kuota negatif ditolak basis data; kuota 0 menutup, kuota 10000 tersimpan (batas)', async () => {
    const id = await restoranId(app, 'Batagor Riri Viral');
    await assert.rejects(Kuota.updateKapasitas(app.ctx.db, id, -1, 5, false));
    const nol = await Kuota.updateKapasitas(app.ctx.db, id, 0, 5, false);
    assert.equal(Kuota.isAntreanTutup(nol), true);
    const maks = await Kuota.updateKapasitas(app.ctx.db, id, 10000, 5, false);
    assert.equal(maks.kuota_maksimum, 10000);
    assert.equal(Kuota.isAntreanTutup(maks), false);
  });
  test('C20-UT07 updateKapasitas: restoran tidak ada -> tidak ada baris yang berubah', async () => {
    assert.equal(await Kuota.updateKapasitas(app.ctx.db, 'RST-tidak-ada', 10, 5, false), undefined);
  });
});
