/**
 * Pengujian UC01 (pencarian restoran). Penanggung jawab: Chatima.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC01 pencarian', () => {
  test('cari berdasarkan kata kunci menu dan filter rating', async () => {
    const hasil = await app.controllers.pencarian.cariRestoran({ q: 'geprek' });
    assert.deepEqual(hasil.hasil.map((r) => r.nama_restoran), ['Ayam Geprek Bu Rini']);
    const rating = await app.controllers.pencarian.cariRestoran({ minRating: '4.7' });
    assert.ok(rating.hasil.every((r) => r.rating_rerata >= 4.7));
  });
  test('hasil kosong memberi saran restoran viral', async () => {
    const hasil = await app.controllers.pencarian.cariRestoran({ q: 'tidak-ada-xyz' });
    assert.equal(hasil.hasil.length, 0);
    assert.ok(hasil.saran.length > 0);
  });
});
