/**
 * Pengujian UC02 bagian pembayaran & payment gateway sandbox (AntriPay). Penanggung jawab: partner UC02.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C07 MetodePembayaranController
 *   - C08 RiwayatTransaksi
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { tandaTanganNotifikasi, verifikasiTandaTangan } from '../server/adapters/paymentGatewayAdapter.js';
import { lolosLuhn, OTP_UJI, SandboxPaymentGateway } from '../server/sandbox-pg/sandboxGateway.js';
import { appUji, gagal, loginSebagai, menuPertama, restoranId } from './helpers.js';
import { config } from '../server/config.js';
import { RiwayatTransaksi } from '../server/models/pembayaran.js';

let app: App;
let gw: SandboxPaymentGateway;
before(async () => {
  app = await appUji();
  gw = app.ctx.gateway as SandboxPaymentGateway;
});
after(async () => {
  await app.close();
});

/** Membuat pesanan takeaway + tagihan dengan metode tertentu. */
async function tagihan(email: string, tipe: 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'KARTU', jumlahMenu = 1) {
  const user = await loginSebagai(app, email, 'pelanggan123');
  const resto = await restoranId(app, 'Mie Kocok Pak Haji');
  const menu = await menuPertama(app, resto);
  const p = await app.controllers.pemesanan.buatPesanan(user, {
    restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: jumlahMenu }],
  });
  const t = await app.controllers.pembayaran.buatTagihan(user, p!.pesanan_id, tipe);
  const idGw = t.urlPembayaran.split('/').pop()!;
  return { user, pesanan: p!, t, idGw, menu };
}

describe('Payment gateway sandbox (AntriPay)', () => {
  test('[C07-UT01, C07-UT02, C08-UT01] e-wallet: setujui di aplikasi -> notifikasi -> tiket terbit tanpa pelanggan menekan apa pun di antri.in', async () => {
    const { user, pesanan, t, idGw } = await tagihan('pelanggan@antri.in', 'EWALLET');
    assert.match(t.urlPembayaran, /^\/pg\/checkout\/[0-9a-f]{24}$/);
    const info = await gw.infoCheckout(idGw);
    assert.equal(info.status, 'MENUNGGU');
    assert.equal(info.jumlah, pesanan.total_harga);
    assert.match(await gw.qrSvg(idGw), /^<svg/);
    await gw.bayarEwallet(idGw, true);
    const detail = await app.controllers.pemesanan.getPesanan(user, pesanan.pesanan_id);
    assert.equal(detail.status_pemesanan, 'DIKONFIRMASI');
    assert.ok(detail.tiket);
    const v = await app.controllers.pembayaran.verifikasiPembayaran(user, t.id_pembayaran);
    assert.equal(v.status, 'LUNAS');
  });

  test('[C07-UT03] virtual account: nominal harus tepat', async () => {
    const { user, pesanan, idGw } = await tagihan('dinda@contoh.id', 'VIRTUAL_ACCOUNT');
    const salah = await gagal(gw.transferVa(idGw, pesanan.total_harga - 1));
    assert.equal(salah.status, 400);
    await gw.transferVa(idGw, pesanan.total_harga);
    assert.equal((await app.controllers.pemesanan.getPesanan(user, pesanan.pesanan_id)).status_pemesanan, 'DIKONFIRMASI');
  });

  test('[C07-UT04, C07-UT05] kartu: hanya kartu uji, OTP 3-D Secure, dan kartu ditolak', async () => {
    const a = await tagihan('fajar@contoh.id', 'KARTU');
    const asli = await gagal(gw.bayarKartu(a.idGw, { nomor: '4111 1111 1111 1111', kedaluwarsa: '12/30', cvv: '123', nama: 'Fajar' }));
    assert.match(asli.details.fields.nomor, /kartu uji/);
    const info = await gw.bayarKartu(a.idGw, { nomor: '4811 1111 1111 1114', kedaluwarsa: '12/30', cvv: '123', nama: 'Fajar' });
    assert.equal(info.status, 'OTP');
    assert.deepEqual(info.kartu, { merek: 'Visa', akhir: '1114' });
    const otpSalah = await gagal(gw.konfirmasiOtp(a.idGw, '000000'));
    assert.equal(otpSalah.status, 400);
    assert.equal((await gw.konfirmasiOtp(a.idGw, OTP_UJI)).status, 'LUNAS');
    assert.equal((await app.controllers.pemesanan.getPesanan(a.user, a.pesanan.pesanan_id)).status_pemesanan, 'DIKONFIRMASI');

    const b = await tagihan('nadia@contoh.id', 'KARTU');
    const ditolak = await gw.bayarKartu(b.idGw, { nomor: '4911111111111113', kedaluwarsa: '12/30', cvv: '123', nama: 'Nadia' });
    assert.equal(ditolak.status, 'GAGAL');
    assert.equal((await app.controllers.pemesanan.getPesanan(b.user, b.pesanan.pesanan_id)).status_pemesanan, 'DIBATALKAN');
  });

  test('[C07-UT06] ganti metode membatalkan transaksi lama di gateway tanpa membatalkan pesanan', async () => {
    const a = await tagihan('yoga@contoh.id', 'EWALLET');
    const baru = await app.controllers.pembayaran.buatTagihan(a.user, a.pesanan.pesanan_id, 'VIRTUAL_ACCOUNT');
    assert.equal((await gw.infoCheckout(a.idGw)).status, 'GAGAL');
    assert.equal((await app.controllers.pemesanan.getPesanan(a.user, a.pesanan.pesanan_id)).status_pemesanan, 'MENUNGGU_PEMBAYARAN');
    const aktif = await app.controllers.pembayaran.tagihanAktif(a.user, a.pesanan.pesanan_id);
    assert.equal(aktif.tagihan?.id_pembayaran, baru.id_pembayaran);
  });

  test('[C07-UT07] stok habis saat lunas -> dana dikembalikan dan pesanan dibatalkan', async () => {
    const a = await tagihan('salsa@contoh.id', 'EWALLET', 2);
    await app.ctx.db.query(`UPDATE menu SET stok = 1 WHERE menu_id = $1`, [a.menu.menu_id]);
    await gw.bayarEwallet(a.idGw, true);
    assert.equal((await gw.infoCheckout(a.idGw)).status, 'DIKEMBALIKAN');
    assert.equal((await app.controllers.pemesanan.getPesanan(a.user, a.pesanan.pesanan_id)).status_pemesanan, 'DIBATALKAN');
    const { items } = await app.controllers.notifikasi.daftar(a.user);
    assert.ok(items.some((n) => n.judul === 'Dana pembayaran dikembalikan'));
    await app.ctx.db.query(`UPDATE menu SET stok = 30 WHERE menu_id = $1`, [a.menu.menu_id]);
  });

  test('[C06-UT09] pembatalan pesanan oleh pelanggan ikut membatalkan transaksi di gateway', async () => {
    const a = await tagihan('bima@contoh.id', 'VIRTUAL_ACCOUNT');
    await app.controllers.pemesanan.batalkanPesanan(a.user, a.pesanan.pesanan_id);
    assert.equal((await gw.infoCheckout(a.idGw)).status, 'GAGAL');
    const e = await gagal(gw.transferVa(a.idGw, a.pesanan.total_harga));
    assert.equal(e.status, 409);
  });
});

describe('Webhook notifikasi', () => {
  test('[C07-UT10] tanda tangan HMAC diverifikasi', async () => {
    const n = { orderId: 'PAY-x', kodeBayar: 'APY-1', status: 'LUNAS' as const, jumlah: 1000, waktu: '2026-11-02T00:00:00Z' };
    const sig = tandaTanganNotifikasi(n, 'kunci');
    assert.ok(verifikasiTandaTangan(n, sig, 'kunci'));
    assert.ok(!verifikasiTandaTangan({ ...n, jumlah: 1 }, sig, 'kunci'));
    assert.ok(!verifikasiTandaTangan(n, 'abc', 'kunci'));
    const e = await gagal(app.controllers.pembayaran.terimaNotifikasi(n, 'deadbeef'));
    assert.equal(e.status, 401);
  });

  test('[C07-UT11] notifikasi palsu dengan tanda tangan sah tetapi nominal berbeda ditolak', async () => {
    const a = await tagihan('pelanggan@antri.in', 'VIRTUAL_ACCOUNT');
    const n = { orderId: a.t.id_pembayaran, kodeBayar: a.t.kode_bayar, status: 'LUNAS' as const, jumlah: 1, waktu: new Date().toISOString() };
    const e = await gagal(app.controllers.pembayaran.terimaNotifikasi(n, tandaTanganNotifikasi(n, app.ctx.config.gatewayServerKey)));
    assert.equal(e.status, 404);
  });
});

describe('UC02 pembayaran', () => {
  test('[C06-UT10] pembayaran gagal membatalkan pesanan', async () => {
    const { user, pesanan, t } = await tagihan('seblak2@contoh.id', 'KARTU');
    const hasil = await app.controllers.pembayaran.simulasikan(user, t.id_pembayaran, 'GAGAL');
    assert.equal(hasil.status, 'GAGAL');
    const detail = await app.controllers.pemesanan.getPesanan(user, pesanan.pesanan_id);
    assert.equal(detail.status_pemesanan, 'DIBATALKAN');
    assert.equal(detail.tiket, null);
  });

  test('[C07-UT08] tagihan kedaluwarsa dibatalkan, dan pembayaran yang terlambat dikembalikan (Alt 4)', async () => {
    const { user, pesanan, t, idGw } = await tagihan('seblak3@contoh.id', 'VIRTUAL_ACCOUNT');
    await app.ctx.db.query(`UPDATE pembayaran SET batas_waktu_bayar = NOW() - INTERVAL '1 minute' WHERE id_pembayaran = $1`, [t.id_pembayaran]);
    await gw.transferVa(idGw, pesanan.total_harga); // pelanggan terlambat membayar
    const e = await gagal(app.controllers.pembayaran.verifikasiPembayaran(user, t.id_pembayaran));
    assert.equal(e.status, 410);
    assert.equal((await app.controllers.pemesanan.getPesanan(user, pesanan.pesanan_id)).status_pemesanan, 'DIBATALKAN');
    assert.equal((await gw.infoCheckout(idGw)).status, 'DIKEMBALIKAN');
  });

  test('[C07-UT09] transaksi gateway yang lewat batas waktu menjadi kedaluwarsa', async () => {
    const { idGw } = await tagihan('dinda@contoh.id', 'EWALLET');
    await app.ctx.db.query(`UPDATE gateway_transaksi SET kedaluwarsa = NOW() - INTERVAL '1 second' WHERE id_transaksi = $1`, [idGw]);
    assert.equal((await gw.infoCheckout(idGw)).status, 'KEDALUWARSA');
    const e = await gagal(gw.bayarEwallet(idGw, true));
    assert.equal(e.status, 410);
  });
});

test('[C07-UT12] algoritma Luhn', () => {
  assert.ok(lolosLuhn('4811111111111114'));
  assert.ok(!lolosLuhn('4811111111111115'));
});

describe('KNF07 batas waktu pembayaran', () => {
  test('KNF07-TC01 batas waktu pembayaran 5 menit (SKPL KNF07)', { todo: 'config.paymentTimeoutMinutes bawaan 15, SKPL meminta 5' }, () => {
    assert.equal(config.paymentTimeoutMinutes, 5);
  });
});

describe('Pelengkap C07, C08', () => {
  test('C08-UT02 getBuktiPembayaran: belum dibayar -> null, setelah lunas memuat jumlah, status, dan metode', async () => {
    const a = await tagihan('pelanggan@antri.in', 'EWALLET');
    assert.equal(await RiwayatTransaksi.getBuktiPembayaran(app.ctx.db, a.pesanan.pesanan_id), null);
    await gw.bayarEwallet(a.idGw, true);
    const bukti = await RiwayatTransaksi.getBuktiPembayaran(app.ctx.db, a.pesanan.pesanan_id);
    assert.equal(bukti?.status_pelunasan, 'LUNAS');
    assert.equal(bukti?.tipe_pembayaran, 'EWALLET');
    assert.equal(Number(bukti?.jumlah_dibayar), a.pesanan.total_harga);
  });
  test('C08-UT03 catatLogTransaksi: pembayaran gagal tidak dicatat sebagai transaksi lunas', async () => {
    const a = await tagihan('dinda@contoh.id', 'KARTU');
    await app.controllers.pembayaran.simulasikan(a.user, a.t.id_pembayaran, 'GAGAL');
    assert.equal(await RiwayatTransaksi.getBuktiPembayaran(app.ctx.db, a.pesanan.pesanan_id), null);
  });
  test('C07-UT13 cekTimeout: tagihan lewat batas dibatalkan dan hasil kedua kalinya 0 (idempoten)', async () => {
    const a = await tagihan('yoga@contoh.id', 'VIRTUAL_ACCOUNT');
    await app.ctx.db.query(`UPDATE pembayaran SET batas_waktu_bayar = NOW() - INTERVAL '1 minute' WHERE id_pembayaran = $1`, [a.t.id_pembayaran]);
    assert.ok((await app.controllers.pembayaran.cekTimeout()) >= 1);
    assert.equal((await app.controllers.pemesanan.getPesanan(a.user, a.pesanan.pesanan_id)).status_pemesanan, 'DIBATALKAN');
    assert.equal(await app.controllers.pembayaran.cekTimeout(), 0);
  });
});
