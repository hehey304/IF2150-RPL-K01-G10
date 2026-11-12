/**
 * Pengujian profil restoran & foto (iterasi 2). Penanggung jawab: Fauzi.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai, menuPertama } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('Profil restoran', () => {
  test('ubah profil memvalidasi jam buka dan alamat', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const e = await gagal(app.controllers.profilRestoran.ubahProfil(resto, {
      alamat: 'pendek', jamBuka: 'pagi', kategori: 'Bakso', lokasi: 'Cihampelas',
    }));
    assert.deepEqual(Object.keys(e.details.fields).sort(), ['alamat', 'jamBuka']);
    const p = await app.controllers.profilRestoran.ubahProfil(resto, {
      alamat: 'Jl. Cihampelas No. 121, Bandung', jamBuka: '09.00-21.30', kategori: 'Bakso', lokasi: 'Cihampelas',
      deskripsi: 'Bakso urat legendaris sejak 1998.', noHp: '081300000010',
    });
    assert.equal(p.jam_buka, '09.00 - 21.30');
    const detail = await app.controllers.pencarian.getDetailRestoran(resto.restoranId!);
    assert.equal(detail.restoran.deskripsi, 'Bakso urat legendaris sejak 1998.');
  });

  test('foto restoran dan foto menu tersimpan', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    await app.controllers.profilRestoran.gantiFoto(resto, { filename: 'IMG-uji.jpg' });
    assert.equal(await app.controllers.profilRestoran.getFoto(resto.restoranId!), 'IMG-uji.jpg');
    const menu = await menuPertama(app, resto.restoranId!);
    const m = await app.controllers.menu.handleUploadFoto(resto, menu.menu_id, { filename: 'IMG-menu.jpg' });
    assert.equal(m?.foto_path, 'IMG-menu.jpg');
    const lain = await loginSebagai(app, 'seblak@antri.in', 'restoran123');
    const e = await gagal(app.controllers.menu.handleUploadFoto(lain, menu.menu_id, { filename: 'IMG-x.jpg' }));
    assert.equal(e.status, 404);
  });
});
