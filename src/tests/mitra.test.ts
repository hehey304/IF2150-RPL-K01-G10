/**
 * Pengujian UC04, UC05 (pendaftaran & verifikasi mitra). Penanggung jawab: Chatima.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { DokumenVerifikasi } from '../server/models/mitra.js';
import { appUji, gagal, loginSebagai } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC04, UC05 kemitraan', () => {
  test('pengajuan tidak lengkap ditolak per kolom', async () => {
    const user = await loginSebagai(app, 'mitrabaru@antri.in', 'restoran123');
    const e = await gagal(app.controllers.mitra.simpanPengajuan(user, { namaRestoran: 'AB' }, []));
    assert.equal(e.status, 400);
    for (const k of ['namaRestoran', 'kategori', 'alamat', 'daftarMenu', 'nib', 'izinUsaha']) assert.ok(e.details.fields[k], k);
  });
  test('ajukan -> tolak -> ajukan ulang -> setujui menjadikan restoran aktif', async () => {
    const user = await loginSebagai(app, 'mitrabaru@antri.in', 'restoran123');
    const body = {
      namaRestoran: 'Es Teler Uji', kategori: 'Minuman', lokasi: 'Dago', alamat: 'Jl. Dago No. 1, Bandung',
      emailKontak: 'mitrabaru@antri.in', noHp: '081600000001',
      daftarMenu: JSON.stringify([{ namaMenu: 'Es Teler', harga: '18000' }]),
    };
    const berkas = (jenis: string) => ({ fieldname: jenis, originalname: `${jenis}.pdf`, mimetype: 'application/pdf', size: 1000, path: '/tmp/tidak-ada' });
    const p1 = await app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]);
    const ganda = await gagal(app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]));
    assert.equal(ganda.status, 409);
    const tanpaAlasan = await gagal(app.controllers.mitra.tolak(p1.idPengajuan, ''));
    assert.equal(tanpaAlasan.status, 400);
    await app.controllers.mitra.tolak(p1.idPengajuan, 'Dokumen NIB tidak terbaca');

    const p2 = await app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]);
    const setuju = await app.controllers.mitra.setujui(p2.idPengajuan);
    const sesi = await loginSebagai(app, 'mitrabaru@antri.in', 'restoran123');
    assert.equal(sesi.restoranId, setuju.restoranId);
    const cari = await app.controllers.pencarian.cariRestoran({ q: 'Es Teler Uji' });
    assert.equal(cari.hasil.length, 1);
    const email = await app.ctx.db.query<{ jenis: string }>(`SELECT jenis FROM log_notifikasi WHERE penerima = 'mitrabaru@antri.in' ORDER BY id_log`);
    assert.deepEqual(email.map((e) => e.jenis), ['MITRA_DITOLAK', 'MITRA_DITERIMA']);
  });
});

test('validasi format dokumen mitra (Algo-063)', () => {
  assert.equal(DokumenVerifikasi.validasiFormat('nib', 'application/pdf', 1000), null);
  assert.match(DokumenVerifikasi.validasiFormat('nib', 'application/zip', 1000)!, /format/);
  assert.match(DokumenVerifikasi.validasiFormat('foto', 'application/pdf', 1000)!, /format/);
  assert.match(DokumenVerifikasi.validasiFormat('izinUsaha', 'image/png', 6 * 1024 * 1024)!, /5 MB/);
});
