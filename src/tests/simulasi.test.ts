/**
 * Pengujian simulator antrean dummy (iterasi 2). Penanggung jawab: partner UC02.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('Simulator antrean dummy', () => {
  test('pelanggan dummy memesan lewat alur normal dan mendapat tiket', async () => {
    const id = await restoranId(app, 'Ayam Geprek Bu Rini');
    const idTiket = await app.controllers.simulator.buatPesananDummy(id);
    assert.ok(idTiket);
    const [t] = await app.ctx.db.query<{ status_pemesanan: string; email: string }>(
      `SELECT p.status_pemesanan, u.email FROM tiket_antrean t JOIN pesanan p ON p.pesanan_id = t.pesanan_id
       JOIN pelanggan pl ON pl.pelanggan_id = t.pelanggan_id JOIN pengguna u ON u.id_pengguna = pl.id_akun WHERE t.id_tiket = $1`,
      [idTiket],
    );
    assert.equal(t.status_pemesanan, 'DIKONFIRMASI');
    assert.match(t.email, /@dummy\.antri\.in$/);
  });

  test('mode PENUH melayani antrean dan mengisi ulang stok; antrean ditutup tidak menerima dummy', async () => {
    const sim = app.controllers.simulator;
    sim.acak = () => 0; // selalu terjadi
    const id = await restoranId(app, 'Seblak Teh Nining');
    await app.ctx.db.query(`UPDATE menu SET stok = 0 WHERE restoran_id = $1`, [id]);
    const hasil = await sim.langkah(id, 'PENUH');
    assert.ok(hasil.aksi.includes('layani'));
    assert.ok(hasil.aksi.some((a) => a.startsWith('isi-ulang-stok')));
    assert.ok(hasil.aksi.includes('pesanan-baru'));

    const kopi = await restoranId(app, 'Kopi Senja Braga'); // antrean ditutup
    const k = await sim.langkah(kopi, 'PELANGGAN');
    assert.deepEqual(k.aksi, []);
    sim.acak = Math.random;
  });

  test('restoran mengatur mode simulasinya sendiri', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    assert.equal((await app.controllers.simulasi.getMode(resto)).mode, 'MATI');
    assert.equal((await app.controllers.simulasi.setMode(resto, 'PELANGGAN')).mode, 'PELANGGAN');
    const e = await gagal(app.controllers.simulasi.setMode(resto, 'NGAWUR'));
    assert.equal(e.status, 400);
    const tick = await app.controllers.simulator.tick();
    assert.ok(tick.some((h) => h.restoranId === resto.restoranId));
  });
});
