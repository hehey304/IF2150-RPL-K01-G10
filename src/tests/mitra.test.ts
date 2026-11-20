/**
 * Pengujian UC04, UC05 (pendaftaran & verifikasi mitra). Penanggung jawab: Chatima.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C02 Restoran
 *   - C12 PengajuanMitraController
 *   - C13 DokumenVerifikasi
 *   - C14 Admin
 *   - C15 NotifikasiEmail
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C36 VerifikasiRestoranPage
 *   - C37 RegistrasiRestoPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { DokumenVerifikasi } from '../server/models/mitra.js';
import { appUji, gagal, loginSebagai } from './helpers.js';
import { NotifikasiEmail } from '../server/adapters/notifikasiEmail.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC04, UC05 kemitraan', () => {
  test('[C12-UT03] pengajuan tidak lengkap ditolak per kolom', async () => {
    const user = await loginSebagai(app, 'mitrabaru@antri.in', 'restoran123');
    const e = await gagal(app.controllers.mitra.simpanPengajuan(user, { namaRestoran: 'AB' }, []));
    assert.equal(e.status, 400);
    for (const k of ['namaRestoran', 'kategori', 'alamat', 'daftarMenu', 'nib', 'izinUsaha']) assert.ok(e.details.fields[k], k);
  });
  test('[C02-UT06, C12-UT04, C12-UT05, C12-UT06, C12-UT07, C12-UT08, C13-UT05, C15-UT04] ajukan -> tolak -> ajukan ulang -> setujui menjadikan restoran aktif', async () => {
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

test('[C13-UT01, C13-UT02, C13-UT03, C13-UT04] validasi format dokumen mitra (Algo-063)', () => {
  assert.equal(DokumenVerifikasi.validasiFormat('nib', 'application/pdf', 1000), null);
  assert.match(DokumenVerifikasi.validasiFormat('nib', 'application/zip', 1000)!, /format/);
  assert.match(DokumenVerifikasi.validasiFormat('foto', 'application/pdf', 1000)!, /format/);
  assert.match(DokumenVerifikasi.validasiFormat('izinUsaha', 'image/png', 6 * 1024 * 1024)!, /5 MB/);
});

test('[C12-UT09] akun pengaju mendapat notifikasi saat pengajuan disetujui (iterasi 2)', async () => {
  const pengajuan = await app.controllers.mitra.daftarPengajuan();
  const surabi = pengajuan.find((p) => p.nama_restoran === 'Surabi Enhaii' && p.status === 'MENUNGGU')!;
  await app.controllers.mitra.setujui(surabi.id_pengajuan);
  const user = await loginSebagai(app, 'surabi@antri.in', 'restoran123');
  const { items } = await app.controllers.notifikasi.daftar(user);
  assert.match(items[0].judul, /disetujui/);
});

describe('C12 PengajuanMitraController', () => {
  test('C12-UT01 setujui/tolak pada pengajuan yang sudah diproses ditolak 409', async () => {
    const daftar = await app.controllers.mitra.daftarPengajuan();
    const p = daftar.find((x) => x.status !== 'MENUNGGU')!; // pengajuan yang sudah diproses test sebelumnya
    assert.ok(p);
    assert.equal((await gagal(app.controllers.mitra.setujui(p.id_pengajuan))).status, 409);
    assert.equal((await gagal(app.controllers.mitra.tolak(p.id_pengajuan, 'Alasan yang sah'))).status, 409);
  });
  test('C12-UT02 detail pengajuan tidak ada -> 404', async () => {
    assert.equal((await gagal(app.controllers.mitra.detailPengajuan('PGJ-tidak-ada'))).status, 404);
  });
});

describe('C15 NotifikasiEmail', () => {
  const email = { penerima: 'uji-email@contoh.id', jenis: 'MITRA_DITERIMA' as const, subjek: 'Uji', isiPesan: 'Isi' };
  test('C15-UT01 email dicatat ke log_notifikasi berstatus TERKIRIM', async () => {
    await new NotifikasiEmail(app.ctx.db, false).kirimEmail(email);
    const [r] = await app.ctx.db.query<{ status: string }>(`SELECT status FROM log_notifikasi WHERE penerima = $1`, [email.penerima]);
    assert.equal(r.status, 'TERKIRIM');
  });
  test('C15-UT02 kegagalan pengiriman dicatat berstatus GAGAL', async () => {
    const asli = console.log;
    console.log = () => { throw new Error('gagal kirim'); };
    try {
      await new NotifikasiEmail(app.ctx.db, true).kirimEmail({ ...email, penerima: 'gagal@contoh.id' });
    } finally {
      console.log = asli;
    }
    const [r] = await app.ctx.db.query<{ status: string }>(`SELECT status FROM log_notifikasi WHERE penerima = 'gagal@contoh.id'`);
    assert.equal(r.status, 'GAGAL');
  });
  test('C15-UT03 format email tidak valid ditolak (HIUPL C15)', { todo: 'kirimEmail belum memvalidasi format penerima' }, async () => {
    await assert.rejects(new NotifikasiEmail(app.ctx.db, false).kirimEmail({ ...email, penerima: 'bukan-email' }));
  });
});

describe('Pelengkap C12, C13', () => {
  test('C13-UT06 validasiFormat: ukuran tepat 5 MB diterima, 5 MB + 1 byte ditolak (batas)', () => {
    const MB5 = 5 * 1024 * 1024;
    assert.equal(DokumenVerifikasi.validasiFormat('izinUsaha', 'image/png', MB5), null);
    assert.match(DokumenVerifikasi.validasiFormat('izinUsaha', 'image/png', MB5 + 1)!, /5 MB/);
  });
  test('C13-UT07 validasiFormat: foto JPG dan PNG diterima, PDF ditolak', () => {
    assert.equal(DokumenVerifikasi.validasiFormat('foto', 'image/jpeg', 1000), null);
    assert.equal(DokumenVerifikasi.validasiFormat('foto', 'image/png', 1000), null);
    assert.match(DokumenVerifikasi.validasiFormat('foto', 'application/pdf', 1000)!, /format/);
  });
  test('C12-UT10 tolak: alasan 4 karakter ditolak, tepat 5 karakter diterima (batas)', async () => {
    await app.controllers.auth.createAccount({ nama: 'Mitra Batas', email: 'mitrabatas@contoh.id', noHp: '081288881111',
      password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true, role: 'RESTORAN' });
    const user = await loginSebagai(app, 'mitrabatas@contoh.id', 'rahasia123');
    const berkas = (jenis: string) => ({ fieldname: jenis, originalname: `${jenis}.pdf`, mimetype: 'application/pdf', size: 1000, path: '/tmp/tidak-ada' });
    const body = { namaRestoran: 'Warung Batas', kategori: 'Minuman', lokasi: 'Dago', alamat: 'Jl. Dago No. 9, Bandung',
      emailKontak: 'mitrabatas@contoh.id', noHp: '081600000099', daftarMenu: JSON.stringify([{ namaMenu: 'Es Batas', harga: '9000' }]) };
    const p = await app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]);
    assert.equal((await gagal(app.controllers.mitra.tolak(p.idPengajuan, 'abcd'))).status, 400);
    assert.equal((await app.controllers.mitra.tolak(p.idPengajuan, 'abcde')).status, 'DITOLAK');
  });
});

describe('Pelengkap C12, C13, C15 (normal, batas, negatif)', () => {
  const berkas = (jenis: string) => ({ fieldname: jenis, originalname: `${jenis}.pdf`, mimetype: 'application/pdf', size: 1000, path: '/tmp/tidak-ada' });
  const lengkap = { namaRestoran: 'ABC', kategori: 'Kue', lokasi: 'Dago', alamat: 'Jl. Dago 1', emailKontak: 'ok@contoh.id', noHp: '081600000123',
    daftarMenu: JSON.stringify([{ namaMenu: 'Kue', harga: '500' }]) };
  test('C12-UT11 validasiKelengkapan: data lengkap dengan nama 3 karakter, alamat 10 karakter, harga Rp500 -> tanpa galat; batas bawah dilanggar -> galat', () => {
    const ok = app.controllers.mitra.validasiKelengkapan(lengkap, [berkas('nib'), berkas('izinUsaha')]);
    assert.deepEqual(ok.galat, {});
    const salah = app.controllers.mitra.validasiKelengkapan(
      { ...lengkap, namaRestoran: 'AB', alamat: 'Jl. Dago', daftarMenu: JSON.stringify([{ namaMenu: 'Kue', harga: '499' }]) },
      [berkas('nib'), berkas('izinUsaha')]);
    assert.deepEqual(Object.keys(salah.galat).sort(), ['alamat', 'daftarMenu', 'namaRestoran']);
  });
  test('C13-UT08 unggahDokumen langsung: dokumen tersimpan untuk pengajuan yang ada; pengajuan tidak ada ditolak', async () => {
    const [p] = await app.controllers.mitra.daftarPengajuan();
    const hitung = async () => (await app.ctx.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM dokumen_verifikasi WHERE id_pengajuan = $1`, [p.id_pengajuan]))[0].n;
    const sebelum = await hitung();
    await DokumenVerifikasi.unggahDokumen(app.ctx.db, { idPengajuan: p.id_pengajuan, jenis: 'foto', namaFile: 'foto.png', path: '/tmp/foto.png', mime: 'image/png' });
    assert.equal(await hitung(), sebelum + 1);
    await assert.rejects(DokumenVerifikasi.unggahDokumen(app.ctx.db, { idPengajuan: 'PGJ-tidak-ada', jenis: 'foto', namaFile: 'foto.png', path: '/tmp/foto.png', mime: 'image/png' }));
  });
  test('C15-UT05 kirimEmail: isi pesan sangat panjang (5000 karakter) tercatat utuh berstatus TERKIRIM (batas)', async () => {
    const penerima = 'panjang@contoh.id';
    await new NotifikasiEmail(app.ctx.db, false).kirimEmail({ penerima, jenis: 'MITRA_DITOLAK', subjek: 'Uji panjang', isiPesan: 'x'.repeat(5000) });
    const [r] = await app.ctx.db.query<{ status: string; panjang: number }>(`SELECT status, LENGTH(isi_pesan)::int AS panjang FROM log_notifikasi WHERE penerima = $1`, [penerima]);
    assert.equal(r.status, 'TERKIRIM');
    assert.equal(r.panjang, 5000);
  });
});
