/**
 * Pengujian ulasan & rating (iterasi 2). Penanggung jawab: Athallah.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { hitungRatingBaru } from '../server/models/ulasan.js';
import { appUji, gagal, loginSebagai, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('Ulasan pesanan', () => {
  test('pesanan selesai dapat diulas sekali dan memperbarui rating restoran', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const daftar = await app.controllers.pemesanan.daftarPesananSaya(user);
    const selesai = daftar.find((p) => p.status_pemesanan === 'SELESAI')!;
    const aktif = daftar.find((p) => p.status_pemesanan === 'DIKONFIRMASI')!;
    assert.ok(selesai, 'seed menyediakan pesanan selesai');

    const belum = await gagal(app.controllers.ulasan.kirimUlasan(user, aktif.pesanan_id, { rating: 5 }));
    assert.equal(belum.status, 409);
    const rentang = await gagal(app.controllers.ulasan.kirimUlasan(user, selesai.pesanan_id, { rating: 6 }));
    assert.equal(rentang.status, 400);

    const resto = await restoranId(app, 'Batagor Riri Viral');
    const [sebelum] = await app.ctx.db.query<{ r: number; n: number }>(
      `SELECT rating_rerata::float AS r, jumlah_ulasan AS n FROM restoran WHERE restoran_id = $1`, [resto]);
    await app.controllers.ulasan.kirimUlasan(user, selesai.pesanan_id, { rating: 1, komentar: 'Batagornya dingin.' });
    const [sesudah] = await app.ctx.db.query<{ r: number; n: number }>(
      `SELECT rating_rerata::float AS r, jumlah_ulasan AS n FROM restoran WHERE restoran_id = $1`, [resto]);
    assert.equal(sesudah.n, sebelum.n + 1);
    assert.equal(sesudah.r, hitungRatingBaru(sebelum.r, sebelum.n, 1));

    const dua = await gagal(app.controllers.ulasan.kirimUlasan(user, selesai.pesanan_id, { rating: 5 }));
    assert.equal(dua.status, 409);
    const daftarUlasan = await app.controllers.ulasan.ulasanRestoran(resto);
    assert.equal(daftarUlasan[0].komentar, 'Batagornya dingin.');
    const status = await app.controllers.ulasan.getUlasanPesanan(user, selesai.pesanan_id);
    assert.equal(status.bisaDiulas, false);
  });

  test('pelanggan lain tidak dapat mengulas pesanan orang lain', async () => {
    const pemilik = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const [p] = await app.controllers.pemesanan.daftarPesananSaya(pemilik);
    const e = await gagal(app.controllers.ulasan.kirimUlasan(lain, p.pesanan_id, { rating: 4 }));
    assert.equal(e.status, 403);
  });
});

test('perhitungan rating rata-rata baru', () => {
  assert.equal(hitungRatingBaru(4.5, 1, 5), 4.8); // (4.5 + 5) / 2 = 4.75 -> 4.8
  assert.equal(hitungRatingBaru(0, 0, 3), 3);
  assert.equal(hitungRatingBaru(4.8, 2140, 1), 4.8);
});
