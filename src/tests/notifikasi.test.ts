/**
 * Pengujian notifikasi dalam aplikasi (iterasi 2). Penanggung jawab: Fauzi.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, loginSebagai, menuPertama, pesanDanBayar, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('Notifikasi', () => {
  test('restoran menerima notifikasi pesanan baru dan dapat menandainya dibaca', async () => {
    const resto = await loginSebagai(app, 'miekocok@antri.in', 'restoran123');
    const awal = await app.controllers.notifikasi.jumlahBelumDibaca(resto);
    const idResto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, idResto);
    await pesanDanBayar(app, 'salsa@contoh.id', { restoranId: idResto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });

    const { items, belumDibaca } = await app.controllers.notifikasi.daftar(resto);
    assert.equal(belumDibaca, awal.belumDibaca + 1);
    assert.match(items[0].judul, /^Pesanan baru A-/);
    const satu = await app.controllers.notifikasi.tandaiDibaca(resto, items[0].id_notifikasi);
    assert.equal(satu.belumDibaca, belumDibaca - 1);
    const semua = await app.controllers.notifikasi.tandaiDibaca(resto);
    assert.equal(semua.belumDibaca, 0);
  });

  test('notifikasi hanya bisa ditandai oleh pemiliknya', async () => {
    const a = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const b = await loginSebagai(app, 'bima@contoh.id', 'pelanggan123');
    const { items } = await app.controllers.notifikasi.daftar(a);
    assert.ok(items.length > 0, 'seed menghasilkan notifikasi untuk pelanggan uji');
    await app.controllers.notifikasi.tandaiDibaca(b, items[0].id_notifikasi);
    const tetap = await app.controllers.notifikasi.daftar(a);
    assert.equal(tetap.items.find((n) => n.id_notifikasi === items[0].id_notifikasi)!.dibaca, false);
  });
});
