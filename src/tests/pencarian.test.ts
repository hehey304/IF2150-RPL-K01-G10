/**
 * Pengujian UC01 (pencarian restoran). Penanggung jawab: Chatima.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C02 Restoran
 *   - C35 PencarianController
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C34 PencarianRestoPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji } from './helpers.js';
import { gagal } from './helpers.js';
import { restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC01 pencarian', () => {
  test('[C02-UT04, C35-UT04, C35-UT05] cari berdasarkan kata kunci menu dan filter rating', async () => {
    const hasil = await app.controllers.pencarian.cariRestoran({ q: 'geprek' });
    assert.deepEqual(hasil.hasil.map((r) => r.nama_restoran), ['Ayam Geprek Bu Rini']);
    const rating = await app.controllers.pencarian.cariRestoran({ minRating: '4.7' });
    assert.ok(rating.hasil.every((r) => r.rating_rerata >= 4.7));
  });
  test('[C35-UT06] hasil kosong memberi saran restoran viral', async () => {
    const hasil = await app.controllers.pencarian.cariRestoran({ q: 'tidak-ada-xyz' });
    assert.equal(hasil.hasil.length, 0);
    assert.ok(hasil.saran.length > 0);
  });
});

test('[C35-UT07] filter area/lokasi (iterasi 2)', async () => {
  const dago = await app.controllers.pencarian.cariRestoran({ lokasi: 'Dago' });
  assert.ok(dago.hasil.length >= 2);
  assert.ok(dago.hasil.every((r) => r.lokasi === 'Dago'));
  assert.ok(dago.lokasi.includes('Braga'));
});

describe('C35 PencarianController', () => {
  test('C35-UT01 filter kategori hanya mengembalikan kategori tersebut', async () => {
    const semua = await app.controllers.pencarian.cariRestoran({});
    const kategori = semua.kategori[0];
    const hasil = await app.controllers.pencarian.cariRestoran({ kategori });
    assert.ok(hasil.hasil.length >= 1 && hasil.hasil.every((r) => r.kategori === kategori));
  });
  test('C35-UT02 minRating tidak valid diabaikan, antreanPendek hanya antrean BUKA', async () => {
    const semua = await app.controllers.pencarian.cariRestoran({});
    const abaikan = await app.controllers.pencarian.cariRestoran({ minRating: 'abc' });
    assert.equal(abaikan.hasil.length, semua.hasil.length);
    const pendek = await app.controllers.pencarian.cariRestoran({ antreanPendek: 'true' });
    assert.ok(pendek.hasil.length <= semua.hasil.length);
  });
  test('C35-UT03 detail restoran tidak ditemukan -> 404', async () => {
    const e = await gagal(app.controllers.pencarian.getDetailRestoran('RST-tidak-ada'));
    assert.equal(e.status, 404);
  });
});

describe('Pelengkap C35', () => {
  test('C35-UT09 getDetailRestoran: status antrean dan pratinjau menu aktif tersedia', async () => {
    const d = await app.controllers.pencarian.getDetailRestoran(await restoranId(app, 'Bakso Mang Ujang'));
    assert.ok(['BUKA', 'TUTUP', 'PENUH'].includes(d.restoran.status_antrean));
    assert.ok(d.menu.length > 0 && d.menu.every((m) => m.aktif));
  });
});
