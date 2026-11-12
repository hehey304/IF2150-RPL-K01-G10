/**
 * Pengujian UC13-UC15 (keluhan, tanggapan, hapus restoran). Penanggung jawab: Athallah.
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

describe('UC13-UC15 keluhan & kelola restoran', () => {
  test('keluhan dikirim, dibaca, dan ditanggapi admin', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [pesanan] = await app.controllers.pemesanan.daftarPesananSaya(user);
    const k = await app.controllers.keluhan.kirimKeluhan(user, { pesananId: pesanan.pesanan_id, kategori: 'Pelayanan', isi: 'Pelayan kurang ramah saat saya datang.' });
    assert.equal(k.status, 'BARU');
    assert.equal(k.restoran_id, pesanan.restoran_id);
    const detail = await app.controllers.keluhan.detailKeluhan(k.id_keluhan);
    assert.equal(detail.status, 'DIBACA');
    const t = await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Terima kasih, sudah kami teruskan ke restoran.');
    assert.equal(t.status, 'DITANGGAPI');
    const panjang = await gagal(app.controllers.keluhan.kirimKeluhan(user, { kategori: 'Lainnya', isi: 'x'.repeat(501) }));
    assert.equal(panjang.status, 400);
  });
  test('hapus restoran menonaktifkan menu dan membatalkan antrean aktif', async () => {
    const resto = await restoranId(app, 'Seblak Teh Nining');
    await app.controllers.kelolaRestoran.hapusDataRestoran(resto);
    const aktif = await app.ctx.db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id
       WHERE a.restoran_id = $1 AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL')`, [resto]);
    assert.equal(aktif[0].n, 0);
    const menu = await app.ctx.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM menu WHERE restoran_id = $1 AND aktif`, [resto]);
    assert.equal(menu[0].n, 0);
    const e = await gagal(app.controllers.pencarian.getDetailRestoran(resto));
    assert.equal(e.status, 404);
    const restoUser = await gagal(loginSebagai(app, 'seblak@antri.in', 'restoran123').then((u) => {
      if (!u.restoranId) throw Object.assign(new Error('tanpa restoran'), { status: 0 });
    }));
    assert.equal(restoUser.message, 'tanpa restoran');
  });
});

describe('Iterasi 2: keluhan & kelola restoran', () => {
  test('filter keluhan Ditanggapi dan notifikasi tanggapan ke pelanggan', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const k = await app.controllers.keluhan.kirimKeluhan(user, { kategori: 'Pembayaran', isi: 'Saldo terpotong dua kali saat membayar.' });
    await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Dana sudah kami kembalikan, mohon cek saldo.');
    const ditanggapi = await app.controllers.keluhan.tampilkanKeluhan({ status: 'DITANGGAPI' });
    assert.ok(ditanggapi.every((x) => x.status === 'DITANGGAPI'));
    assert.ok(ditanggapi.some((x) => x.id_keluhan === k.id_keluhan));
    const { items } = await app.controllers.notifikasi.daftar(user);
    assert.ok(items.some((n) => n.judul.includes('ditanggapi')));
  });

  test('filter Aktif/Nonaktif pada kelola restoran', async () => {
    const semua = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'semua' });
    const nonaktif = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'nonaktif' });
    const aktif = await app.controllers.kelolaRestoran.daftarRestoran({ filter: 'aktif' });
    assert.ok(nonaktif.length >= 1, 'Seblak sudah dihapus pada test sebelumnya');
    assert.ok(nonaktif.every((r) => !r.status_aktif));
    assert.ok(aktif.every((r) => r.status_aktif));
    assert.equal(semua.length, aktif.length + nonaktif.length);
  });
});
