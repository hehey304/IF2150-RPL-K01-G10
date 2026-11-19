/**
 * Pengujian UC10-UC12 (registrasi, login, logout). Penanggung jawab: Bayu.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C01 Pelanggan
 *   - C25 Pengguna
 *   - C28 AutentikasiController
 *   - C29 SesiPengguna
 * Kelas boundary (UI) yang teruji lewat use case ini; belum ada test otomatis, bukti berupa tangkapan layar:
 *   - C26 HalamanProfilPage
 *   - C27 KonfirmasiLogoutPage
 *   - C38 RegistrasiPage
 *   - C39 LoginPage
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai } from './helpers.js';
import { Admin, Pelanggan, Pengguna } from '../server/models/akun.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC10-UC12 autentikasi', () => {
  test('[C01-UT01, C25-UT02, C28-UT01, C28-UT05, C29-UT03, C29-UT04] registrasi, login, dan logout', async () => {
    const c = app.controllers.auth;
    await c.createAccount({ nama: 'Uji Coba', email: 'uji@contoh.id', noHp: '081299990000', password: 'rahasia123',
      konfirmasiPassword: 'rahasia123', setuju: true });
    const login = await c.validation({ email: 'UJI@contoh.id', password: 'rahasia123' });
    assert.equal(login.user?.role, 'PELANGGAN');
    const user = await c.validateSession(login.token);
    assert.ok(user?.pelangganId);
    await c.processLogout(user!);
    assert.equal(await c.validateSession(login.token), null);
  });
  test('[C01-UT02, C25-UT04, C28-UT02, C28-UT03] email/nomor duplikat dan kata sandi lemah ditolak', async () => {
    const c = app.controllers.auth;
    const dup = await gagal(c.createAccount({ nama: 'Uji Duplikat', email: 'pelanggan@antri.in', noHp: '081299991111',
      password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true }));
    assert.equal(dup.status, 409);
    const lemah = await gagal(c.createAccount({ nama: 'Uji', email: 'baru@contoh.id', noHp: '081299992222',
      password: 'pendek', konfirmasiPassword: 'pendek', setuju: true }));
    assert.equal(lemah.status, 400);
    assert.ok(lemah.details.fields.password);
  });
  test('[C25-UT03, C28-UT04] kredensial salah memberi pesan umum', async () => {
    const e = await gagal(app.controllers.auth.validation({ email: 'pelanggan@antri.in', password: 'salah' }));
    assert.equal(e.status, 401);
    assert.equal(e.message, 'Email atau kata sandi yang Anda masukkan salah');
  });
});

describe('Iterasi 2: profil & kata sandi', () => {
  test('[C25-UT05] ubah profil memvalidasi nomor telepon dan menyimpan nama baru', async () => {
    const user = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const e = await gagal(app.controllers.auth.ubahProfil(user, { nama: 'Dinda S', noHp: '12' }));
    assert.equal(e.status, 400);
    const dup = await gagal(app.controllers.auth.ubahProfil(user, { nama: 'Dinda S', noHp: '081200000001' }));
    assert.equal(dup.status, 409);
    const profil = await app.controllers.auth.ubahProfil(user, { nama: 'Dinda Safitri S.', noHp: '081277778888' });
    assert.equal(profil?.nama, 'Dinda Safitri S.');
    const pl = await app.ctx.db.query<{ nama: string }>(`SELECT nama FROM pelanggan WHERE pelanggan_id = $1`, [user.pelangganId]);
    assert.equal(pl[0].nama, 'Dinda Safitri S.');
  });

  test('[C25-UT06, C28-UT06, C29-UT05] ganti kata sandi mengakhiri sesi lain tetapi mempertahankan sesi saat ini', async () => {
    const a = await loginSebagai(app, 'fajar@contoh.id', 'pelanggan123');
    const b = await loginSebagai(app, 'fajar@contoh.id', 'pelanggan123');
    const salah = await gagal(app.controllers.auth.gantiKataSandi(a, { lama: 'salah', baru: 'barubaru1', konfirmasi: 'barubaru1' }));
    assert.equal(salah.status, 400);
    await app.controllers.auth.gantiKataSandi(a, { lama: 'pelanggan123', baru: 'barubaru1', konfirmasi: 'barubaru1' });
    assert.ok(await app.controllers.auth.validateSession(a.token));
    assert.equal(await app.controllers.auth.validateSession(b.token), null);
    await loginSebagai(app, 'fajar@contoh.id', 'barubaru1');
  });

  test('[C28-UT07] lupa kata sandi: token sekali pakai untuk atur ulang', async () => {
    const tidakAda = await app.controllers.auth.lupaKataSandi({ email: 'tidak-ada@contoh.id' });
    assert.equal(tidakAda.tautanSimulasi, null);
    const hasil = await app.controllers.auth.lupaKataSandi({ email: 'nadia@contoh.id' });
    const token = new URLSearchParams(hasil.tautanSimulasi!.split('?')[1]).get('token')!;
    await app.controllers.auth.resetKataSandi({ token, baru: 'sandibaru9', konfirmasi: 'sandibaru9' });
    await loginSebagai(app, 'nadia@contoh.id', 'sandibaru9');
    const ulang = await gagal(app.controllers.auth.resetKataSandi({ token, baru: 'sandibaru9', konfirmasi: 'sandibaru9' }));
    assert.equal(ulang.status, 404);
    const email = await app.ctx.db.query(`SELECT 1 FROM log_notifikasi WHERE penerima = 'nadia@contoh.id' AND jenis = 'RESET_KATA_SANDI'`);
    assert.equal(email.length, 1);
  });
});

describe('C29 SesiPengguna & C25 Pengguna', () => {
  test('C29-UT01 sesi kedaluwarsa tidak valid lagi', async () => {
    const u = await loginSebagai(app, 'bima@contoh.id', 'pelanggan123');
    assert.ok(await app.controllers.auth.validateSession(u.token));
    await app.ctx.db.query(`UPDATE sesi_pengguna SET waktu_kedaluwarsa = NOW() - INTERVAL '1 minute' WHERE token = $1`, [u.token]);
    assert.equal(await app.controllers.auth.validateSession(u.token), null);
  });
  test('C29-UT02 token acak tidak valid', async () => {
    assert.equal(await app.controllers.auth.validateSession('token-ngawur'), null);
  });
  test('C25-UT01 kata sandi tersimpan sebagai hash bcrypt, bukan plain-text (KNF08)', async () => {
    const rows = await app.ctx.db.query<{ password_hash: string }>(`SELECT password_hash FROM pengguna`);
    assert.ok(rows.length > 0);
    for (const r of rows) {
      assert.match(r.password_hash, /^\$2[aby]\$\d{2}\$/);
      assert.ok(!['pelanggan123', 'restoran123'].includes(r.password_hash));
    }
  });
});

describe('Pelengkap C01, C14, C28', () => {
  const dasar = { nama: 'Uji Batas', noHp: '081288880007', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true };
  test('C28-UT08 createAccount: email, nomor, konfirmasi sandi, dan persetujuan tidak valid ditolak per kolom', async () => {
    const e = await gagal(app.controllers.auth.createAccount({ nama: 'A', email: 'bukan-email', noHp: '123',
      password: 'rahasia123', konfirmasiPassword: 'beda12345', setuju: false }));
    assert.equal(e.status, 400);
    assert.deepEqual(Object.keys(e.details.fields).sort(), ['email', 'nama', 'noHp', 'password', 'setuju']);
  });
  test('C28-UT09 createAccount: sandi 7 karakter ditolak, tepat 8 karakter diterima (batas)', async () => {
    const e = await gagal(app.controllers.auth.createAccount({ ...dasar, email: 'batas7@contoh.id', password: 'abcdefg', konfirmasiPassword: 'abcdefg' }));
    assert.equal(e.status, 400);
    assert.ok(e.details.fields.password);
    const ok = await app.controllers.auth.createAccount({ ...dasar, email: 'batas8@contoh.id', noHp: '081288880008', password: 'abcdefgh', konfirmasiPassword: 'abcdefgh' });
    assert.equal(ok.role, 'PELANGGAN');
  });
  test('C01-UT03 getDetails/accountRegister: profil pelanggan tersimpan dan dapat dibaca; akun tidak ada -> null', async () => {
    const baru = await app.controllers.auth.createAccount({ ...dasar, nama: 'Profil Pelanggan', email: 'profil@contoh.id', noHp: '081288880009' });
    const p = await Pelanggan.getByAkun(app.ctx.db, baru.idPengguna);
    assert.equal(p?.nama, 'Profil Pelanggan');
    assert.equal(p?.email, 'profil@contoh.id');
    assert.equal(await Pelanggan.getByAkun(app.ctx.db, 'USR-tidak-ada'), null);
  });
  test('C14-UT01 accountRegister: profil admin tersimpan; pendaftaran ganda untuk akun yang sama ditolak', async () => {
    const akun = await Pengguna.saveCredentials(app.ctx.db, { nama: 'Admin Dua', email: 'admin2@antri.in', noHp: null, password: 'admin12345', role: 'ADMIN' });
    await Admin.accountRegister(app.ctx.db, akun);
    const r = await app.ctx.db.query<{ nama: string }>(`SELECT nama FROM admin WHERE id_akun = $1`, [akun.id_pengguna]);
    assert.equal(r[0].nama, 'Admin Dua');
    await assert.rejects(Admin.accountRegister(app.ctx.db, akun));
  });
  test('C14-UT02 admin dapat login dengan peran ADMIN dan tidak terkait restoran', async () => {
    const admin = await loginSebagai(app, 'admin@antri.in', 'admin12345');
    assert.equal(admin.role, 'ADMIN');
    assert.ok(!admin.restoranId);
  });
});
