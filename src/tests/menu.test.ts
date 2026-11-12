/**
 * Pengujian UC08 (menu & stok). Penanggung jawab: Fauzi.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai, menuPertama, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC08 menu & stok', () => {
  test('tambah, ubah stok, dan hapus menu', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const baru = await app.controllers.menu.handleAddMenu(resto, { namaMenu: 'Ayam Geprek Mozarella', harga: '30000', stok: '10' });
    const stok = await app.controllers.menu.handleUpdateStok(resto, baru.menu_id, '0');
    assert.equal(stok.stok, 0);
    await app.controllers.menu.handleDeleteMenu(resto, baru.menu_id);
    const daftar = await app.controllers.menu.handleFetchMenu(resto);
    assert.ok(!daftar.some((m) => m.menu_id === baru.menu_id));
    const e = await gagal(app.controllers.menu.handleAddMenu(resto, { namaMenu: 'X', harga: '-1', stok: 'a' }));
    assert.deepEqual(Object.keys(e.details.fields).sort(), ['harga', 'namaMenu', 'stok']);
  });
  test('restoran lain tidak bisa mengubah menu milik restoran lain', async () => {
    const geprek = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const menuBakso = await menuPertama(app, await restoranId(app, 'Bakso Mang Ujang'));
    const e = await gagal(app.controllers.menu.handleUpdateStok(geprek, menuBakso.menu_id, '1'));
    assert.equal(e.status, 404);
  });
});
