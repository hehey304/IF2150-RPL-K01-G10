/**
 * Pengujian UC10-UC12 (registrasi, login, logout). Penanggung jawab: Bayu.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { appUji, gagal, loginSebagai } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC10-UC12 autentikasi', () => {
  test('registrasi, login, dan logout', async () => {
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
  test('email/nomor duplikat dan kata sandi lemah ditolak', async () => {
    const c = app.controllers.auth;
    const dup = await gagal(c.createAccount({ nama: 'Uji Duplikat', email: 'pelanggan@antri.in', noHp: '081299991111',
      password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true }));
    assert.equal(dup.status, 409);
    const lemah = await gagal(c.createAccount({ nama: 'Uji', email: 'baru@contoh.id', noHp: '081299992222',
      password: 'pendek', konfirmasiPassword: 'pendek', setuju: true }));
    assert.equal(lemah.status, 400);
    assert.ok(lemah.details.fields.password);
  });
  test('kredensial salah memberi pesan umum', async () => {
    const e = await gagal(app.controllers.auth.validation({ email: 'pelanggan@antri.in', password: 'salah' }));
    assert.equal(e.status, 401);
    assert.equal(e.message, 'Email atau kata sandi yang Anda masukkan salah');
  });
});

describe('Iterasi 2: profil & kata sandi', () => {
  test('ubah profil memvalidasi nomor telepon dan menyimpan nama baru', async () => {
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

  test('ganti kata sandi mengakhiri sesi lain tetapi mempertahankan sesi saat ini', async () => {
    const a = await loginSebagai(app, 'fajar@contoh.id', 'pelanggan123');
    const b = await loginSebagai(app, 'fajar@contoh.id', 'pelanggan123');
    const salah = await gagal(app.controllers.auth.gantiKataSandi(a, { lama: 'salah', baru: 'barubaru1', konfirmasi: 'barubaru1' }));
    assert.equal(salah.status, 400);
    await app.controllers.auth.gantiKataSandi(a, { lama: 'pelanggan123', baru: 'barubaru1', konfirmasi: 'barubaru1' });
    assert.ok(await app.controllers.auth.validateSession(a.token));
    assert.equal(await app.controllers.auth.validateSession(b.token), null);
    await loginSebagai(app, 'fajar@contoh.id', 'barubaru1');
  });

  test('lupa kata sandi: token sekali pakai untuk atur ulang', async () => {
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
