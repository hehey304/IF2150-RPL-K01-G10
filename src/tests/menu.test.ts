/**
 * Pengujian UC08 (menu & stok). Penanggung jawab: Fauzi.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C03 Menu
 *   - C24 KelolaMenuController
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C23 PengaturanMenuPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai, menuPertama, restoranId } from './helpers.js';
import { Menu } from '../server/models/menu.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC08 menu & stok', () => {
  test('[C03-UT05, C03-UT06, C03-UT07, C24-UT01, C24-UT02, C24-UT03, C24-UT04] tambah, ubah stok, dan hapus menu', async () => {
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
  test('[C03-UT08, C24-UT05] restoran lain tidak bisa mengubah menu milik restoran lain', async () => {
    const geprek = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const menuBakso = await menuPertama(app, await restoranId(app, 'Bakso Mang Ujang'));
    const e = await gagal(app.controllers.menu.handleUpdateStok(geprek, menuBakso.menu_id, '1'));
    assert.equal(e.status, 404);
  });
});

describe('C03 Menu', () => {
  test('C03-UT01 kurangiStok berhasil bila stok cukup, tepat habis (batas) menjadi 0', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Batagor Riri Viral'));
    assert.equal(await Menu.kurangiStok(app.ctx.db, menu.menu_id, 1), true);
    assert.equal(await Menu.kurangiStok(app.ctx.db, menu.menu_id, menu.stok - 1), true);
    const [s] = await app.ctx.db.query<{ stok: number }>(`SELECT stok FROM menu WHERE menu_id = $1`, [menu.menu_id]);
    assert.equal(s.stok, 0);
  });
  test('C03-UT02 kurangiStok gagal dan stok tidak negatif bila stok tidak cukup', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Bakso Mang Ujang'));
    assert.equal(await Menu.kurangiStok(app.ctx.db, menu.menu_id, menu.stok + 1), false);
    const [s] = await app.ctx.db.query<{ stok: number }>(`SELECT stok FROM menu WHERE menu_id = $1`, [menu.menu_id]);
    assert.equal(s.stok, menu.stok);
  });
  test('C03-UT03 isTersedia: batas jumlah, nonaktif, dan jumlah tidak valid', () => {
    assert.equal(Menu.isTersedia({ stok: 5, aktif: true }, 5), true);
    assert.equal(Menu.isTersedia({ stok: 5, aktif: true }, 6), false);
    assert.equal(Menu.isTersedia({ stok: 5, aktif: true }, 0), false);
    assert.equal(Menu.isTersedia({ stok: 5, aktif: false }, 1), false);
  });
  test('C03-UT04 daftar menu restoran hanya memuat menu aktif', async () => {
    const id = await restoranId(app, 'Ayam Geprek Bu Rini');
    const daftar = await Menu.getDaftarMenu(app.ctx.db, id);
    assert.ok(daftar.length > 0 && daftar.every((m) => m.aktif));
  });
});

describe('Pelengkap C03, C24', () => {
  test('C03-UT09 getInfoMenu: menu ada dikembalikan, ID tidak ada -> null', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Ayam Geprek Bu Rini'));
    assert.equal((await Menu.getInfoMenu(app.ctx.db, menu.menu_id))?.nama_menu, menu.nama_menu);
    assert.equal(await Menu.getInfoMenu(app.ctx.db, 'MNU-tidak-ada'), null);
  });
  test('C03-UT10 updateInfoMenu: menyimpan perubahan; restoran lain mendapat null', async () => {
    const idResto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const menu = await menuPertama(app, idResto);
    const baru = await Menu.updateInfoMenu(app.ctx.db, idResto, menu.menu_id,
      { namaMenu: 'Menu Diubah', deskripsiMenu: 'deskripsi', kategoriMenu: 'Uji', harga: 600, stok: 3 });
    assert.equal(baru?.nama_menu, 'Menu Diubah');
    assert.equal(baru?.stok, 3);
    const lain = await Menu.updateInfoMenu(app.ctx.db, await restoranId(app, 'Bakso Mang Ujang'), menu.menu_id,
      { namaMenu: 'Retas', deskripsiMenu: '', kategoriMenu: 'Uji', harga: 600, stok: 3 });
    assert.equal(lain, null);
  });
  test('C24-UT06 handleUpdateMenu: harga batas bawah Rp500 diterima dan tersimpan', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const menu = await menuPertama(app, resto.restoranId!);
    const m = await app.controllers.menu.handleUpdateMenu(resto, menu.menu_id, { namaMenu: 'Geprek Ubah', harga: '500', stok: '7' });
    assert.equal(m.harga, 500);
    assert.equal(m.stok, 7);
  });
  test('C24-UT07 handleUpdateMenu: harga Rp499 ditolak (400), menu tidak ada -> 404', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const menu = await menuPertama(app, resto.restoranId!, { stokNol: false }).catch(() => undefined);
    const idMenu = menu?.menu_id ?? 'MNU-x';
    const e = await gagal(app.controllers.menu.handleUpdateMenu(resto, idMenu, { namaMenu: 'Geprek', harga: '499', stok: '1' }));
    assert.equal(e.status, 400);
    assert.ok(e.details.fields.harga);
    assert.equal((await gagal(app.controllers.menu.handleUpdateMenu(resto, 'MNU-tidak-ada', { namaMenu: 'Geprek', harga: '1000', stok: '1' }))).status, 404);
  });
  test('C24-UT08 handleFetchMenuDetail ada pada kelas (DPPL C24)', { todo: 'handleFetchMenuDetail belum diimplementasikan pada KelolaMenuController' }, () => {
    assert.equal(typeof (app.controllers.menu as unknown as Record<string, unknown>).handleFetchMenuDetail, 'function');
  });
  test('C03-UT11 cekStok (digabung dalam isTersedia): data menu nyata, jumlah sama dengan stok diterima, stok + 1 ditolak', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Ayam Geprek Bu Rini'));
    const baris = (await Menu.getInfoMenu(app.ctx.db, menu.menu_id))!;
    assert.equal(Menu.isTersedia(baris, baris.stok), true);
    assert.equal(Menu.isTersedia(baris, baris.stok + 1), false);
  });
});

describe('Pelengkap C03 (negatif dan batas)', () => {
  test('C03-UT12 hapusMenu: restoran lain atau ID tidak ada -> false; pemilik -> true; hapus ulang -> false', async () => {
    const pemilik = await restoranId(app, 'Ayam Geprek Bu Rini');
    const lain = await restoranId(app, 'Bakso Mang Ujang');
    const m = await Menu.tambahMenu(app.ctx.db, pemilik, { namaMenu: 'Menu Hapus Uji', deskripsiMenu: '', kategoriMenu: 'Uji', harga: 5000, stok: 5 });
    assert.equal(await Menu.hapusMenu(app.ctx.db, lain, m.menu_id), false);
    assert.equal((await Menu.getInfoMenu(app.ctx.db, m.menu_id))?.aktif, true);
    assert.equal(await Menu.hapusMenu(app.ctx.db, pemilik, 'MNU-tidak-ada'), false);
    assert.equal(await Menu.hapusMenu(app.ctx.db, pemilik, m.menu_id), true);
    assert.equal(await Menu.hapusMenu(app.ctx.db, pemilik, m.menu_id), false);
  });
  test('C03-UT13 tambahMenu: harga Rp499 ditolak, Rp500 dengan stok 0 diterima (batas)', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const e = await gagal(app.controllers.menu.handleAddMenu(resto, { namaMenu: 'Batas Harga', harga: '499', stok: '1' }));
    assert.equal(e.status, 400);
    assert.ok(e.details.fields.harga);
    const ok = await app.controllers.menu.handleAddMenu(resto, { namaMenu: 'Batas Harga Sah', harga: '500', stok: '0' });
    assert.equal(ok.harga, 500);
    assert.equal(ok.stok, 0);
  });
  test('C03-UT14 updateInfoMenu: stok 0 (batas) tersimpan; menu yang sudah dihapus -> null (negatif)', async () => {
    const id = await restoranId(app, 'Ayam Geprek Bu Rini');
    const m = await Menu.tambahMenu(app.ctx.db, id, { namaMenu: 'Menu Batas Uji', deskripsiMenu: '', kategoriMenu: 'Uji', harga: 500, stok: 9 });
    const ubah = await Menu.updateInfoMenu(app.ctx.db, id, m.menu_id, { namaMenu: 'Menu Batas Uji', deskripsiMenu: '', kategoriMenu: 'Uji', harga: 500, stok: 0 });
    assert.equal(ubah?.stok, 0);
    await Menu.hapusMenu(app.ctx.db, id, m.menu_id);
    assert.equal(await Menu.updateInfoMenu(app.ctx.db, id, m.menu_id, { namaMenu: 'X', deskripsiMenu: '', kategoriMenu: 'Uji', harga: 500, stok: 1 }), null);
  });
});
