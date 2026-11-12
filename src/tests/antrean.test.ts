/**
 * Pengujian UC03, UC06, UC07, UC09 (antrean & kuota). Penanggung jawab: Fikri.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { hitungEstimasi, medianJedaMenit, tentukanStatusAntrean } from '../server/models/antrean.js';
import { bilanganCacah } from '../server/utils/validasi.js';
import { formatNomorAntrean } from '../server/utils/ids.js';
import { appUji, gagal, loginSebagai } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC03, UC06, UC09 antrean', () => {
  test('dequeue memanggil pelanggan berikutnya dan memperbarui sisa antrean', async () => {
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
  test('dequeue dengan data layar usang ditolak', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const e = await gagal(app.controllers.kelolaAntrean.processDequeue(resto, 'TKT-usang'));
    assert.equal(e.status, 409);
  });
  test('dequeue otomatis setelah 30 menit tidak hadir (Alt 2)', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const awal = await app.controllers.kelolaAntrean.getAntrean(resto);
    const front = awal.daftar[0];
    await app.ctx.db.query(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() - INTERVAL '31 minutes' WHERE id_tiket = $1`, [front.id_tiket]);
    const diproses = await app.controllers.kelolaAntrean.autoDequeue();
    assert.ok(diproses.includes(resto.restoranId!));
    const t = await app.ctx.db.query<{ status_antrean: string }>(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]);
    assert.equal(t[0].status_antrean, 'DILEWATI');
  });
  test('restoran tanpa antrean tidak dapat dequeue', async () => {
    const resto = await loginSebagai(app, 'martabak@antri.in', 'restoran123');
    const e = await gagal(app.controllers.kelolaAntrean.processDequeue(resto));
    assert.match(e.message, /Belum ada antrean/);
  });
});

describe('UC07 kuota', () => {
  test('kuota negatif ditolak; kuota 0 menutup antrean', async () => {
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

test('status antrean dari kuota (UC07)', () => {
  assert.equal(tentukanStatusAntrean(0, 0), 'TUTUP');
  assert.equal(tentukanStatusAntrean(30, 29), 'BUKA');
  assert.equal(tentukanStatusAntrean(30, 30), 'PENUH');
});

test('estimasi waktu tunggu', () => {
  assert.equal(hitungEstimasi(6, 3), 18);
  assert.equal(hitungEstimasi(-1, 3), 0);
});

test('input kuota: hanya bilangan bulat tidak negatif', () => {
  assert.equal(bilanganCacah('12'), 12);
  assert.equal(bilanganCacah(0), 0);
  assert.equal(bilanganCacah('-3'), null);
  assert.equal(bilanganCacah('abc'), null);
  assert.equal(bilanganCacah(2.5), null);
});

test('format nomor antrean', () => {
  assert.equal(formatNomorAntrean(7), 'A-007');
  assert.equal(formatNomorAntrean(1234), 'A-1234');
});

describe('Iterasi 2: antrean', () => {
  test('tutup sementara tidak menghapus nilai kuota', async () => {
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

  test('"Mulai siapkan" menandai tiket dan terlihat di status pelanggan', async () => {
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

  test('pelanggan yang dipanggil mendapat notifikasi "Giliranmu"', async () => {
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

test('menit per antrean dari median jeda penyelesaian', () => {
  const t = (m: number) => new Date(Date.UTC(2026, 9, 31, 10, m));
  assert.equal(medianJedaMenit([t(0), t(4)], 3), 3); // data kurang -> bawaan
  assert.equal(medianJedaMenit([t(0), t(5), t(9), t(15)], 3), 5);
  assert.equal(medianJedaMenit([t(0), t(30), t(60), t(90)], 3), 15); // dibatasi maksimum 15
});
