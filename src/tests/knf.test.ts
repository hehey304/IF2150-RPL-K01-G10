/**
 * Pengujian Kebutuhan Non-Fungsional (KNF03, KNF06, & KNF14) untuk HIUPL Bab 4.5.
 *
 * Kelas & modul terkait:
 *   - C04 Antrean & C09 TiketAntrean (server/models/antrean.ts)
 *   - C06 Pesanan (server/models/pesanan.ts)
 *   - C07 MetodePembayaranController & C08 RiwayatTransaksi (server/controllers/metodePembayaranController.ts)
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { SandboxPaymentGateway } from '../server/sandbox-pg/sandboxGateway.js';
import { SLOT_BOOKING, tanggalLokal } from '../server/models/pesanan.js';
import { appUji, gagal, loginSebagai, menuPertama, restoranId } from './helpers.js';

let app: App;

before(async () => {
  app = await appUji();
});

after(async () => {
  await app.close();
});

describe('Pengujian Kebutuhan Non-Fungsional (Reliability)', () => {
  test('[KNF03-TC01] Reliability: sistem memberikan nomor antrean berbeda kepada setiap pelanggan saat pembayaran bersamaan', async () => {
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);

    await app.ctx.db.query(
      `UPDATE pengaturan_kuota SET kuota_maksimum = 100, antrean_ditutup = FALSE WHERE restoran_id = $1`,
      [resto],
    );
    await app.ctx.db.query(`UPDATE menu SET stok = 100 WHERE menu_id = $1`, [menu.menu_id]);

    const daftarEmail = [
      'pelanggan@antri.in',
      'dinda@contoh.id',
      'fajar@contoh.id',
      'nadia@contoh.id',
      'yoga@contoh.id',
      'salsa@contoh.id',
      'bima@contoh.id',
    ];

    const daftarTagihan = [];
    for (const email of daftarEmail) {
      const user = await loginSebagai(app, email, 'pelanggan123');
      const pesanan = await app.controllers.pemesanan.buatPesanan(user, {
        restoranId: resto,
        mode: 'TAKEAWAY',
        items: [{ menuId: menu.menu_id, jumlah: 1 }],
      });
      const tagihan = await app.controllers.pembayaran.buatTagihan(user, pesanan!.pesanan_id, 'EWALLET');
      daftarTagihan.push({ user, pesananId: pesanan!.pesanan_id, idPembayaran: tagihan.id_pembayaran });
    }

    await Promise.all(
      daftarTagihan.map(({ user, idPembayaran }) =>
        app.controllers.pembayaran.simulasikan(user, idPembayaran, 'LUNAS'),
      ),
    );

    const pesananIds = daftarTagihan.map((d) => d.pesananId);
    const placeholders = pesananIds.map((_, idx) => `$${idx + 1}`).join(', ');
    const tiketRows = await app.ctx.db.query<{ nomor_urut: number }>(
      `SELECT nomor_urut FROM tiket_antrean WHERE pesanan_id IN (${placeholders}) ORDER BY nomor_urut ASC`,
      pesananIds,
    );

    const nomorUnik = new Set(tiketRows.map((r) => r.nomor_urut));
    assert.equal(tiketRows.length, daftarEmail.length);
    assert.equal(nomorUnik.size, daftarEmail.length);
  });

  test('[KNF06-TC01] Reliability: sistem mencegah meja dipesan oleh 2 orang berbeda pada tanggal & slot waktu yang sama', async () => {
    const resto = await restoranId(app, 'Bakso Mang Ujang');
    const menu = await menuPertama(app, resto);

    await app.ctx.db.query(
      `UPDATE pengaturan_kuota SET kuota_maksimum = 50, kapasitas_meja = 1, antrean_ditutup = FALSE WHERE restoran_id = $1`,
      [resto],
    );
    await app.ctx.db.query(`UPDATE menu SET stok = 50 WHERE menu_id = $1`, [menu.menu_id]);

    const user1 = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const user2 = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');

    const besokDate = new Date();
    besokDate.setDate(besokDate.getDate() + 1);
    const tanggalBesok = tanggalLokal(besokDate);
    const slotUji = SLOT_BOOKING[0];

    const payloadBooking: Record<string, unknown> = {
      restoranId: resto,
      mode: 'BOOKING',
      jumlahRombongan: 2,
      rombongan: 2,
      tanggalBooking: tanggalBesok,
      tanggal: tanggalBesok,
      slotWaktuBooking: slotUji,
      slot: slotUji,
      items: [{ menuId: menu.menu_id, jumlah: 1 }],
    };

    const hasil = await Promise.allSettled([
      app.controllers.pemesanan.buatPesanan(user1, payloadBooking),
      app.controllers.pemesanan.buatPesanan(user2, payloadBooking),
    ]);

    assert.equal(hasil.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(hasil.filter((r) => r.status === 'rejected').length, 1);

    const cekDb = await app.ctx.db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM pesanan
       WHERE restoran_id = $1 AND mode_pemesanan = 'BOOKING'
         AND tanggal_booking = $2 AND slot_waktu_booking = $3 AND status_pemesanan <> 'DIBATALKAN'`,
      [resto, tanggalBesok, slotUji],
    );
    assert.equal(cekDb[0].total, 1);
  });

  test('[KNF14-TC01] Reliability: sistem mencegah pesanan terkena double-charged saat notifikasi pembayaran ganda atau penagihan ulang', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);

    const pesanan = await app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto,
      mode: 'TAKEAWAY',
      items: [{ menuId: menu.menu_id, jumlah: 1 }],
    });
    const tagihan = await app.controllers.pembayaran.buatTagihan(user, pesanan!.pesanan_id, 'EWALLET');

    const gw = app.ctx.gateway as SandboxPaymentGateway;
    const idGw = tagihan.urlPembayaran.split('/').pop()!;

    // 1. Simulasikan klik bayar / callback lunas ganda secara bersamaan
    await Promise.allSettled([
      gw.bayarEwallet(idGw, true),
      gw.bayarEwallet(idGw, true),
    ]);

    const logTransaksi = await app.ctx.db.query<{ jumlah_dibayar: number }>(
      `SELECT jumlah_dibayar FROM riwayat_transaksi WHERE id_pembayaran = $1`,
      [tagihan.id_pembayaran],
    );
    assert.equal(logTransaksi.length, 1, 'Transaksi lunas hanya boleh tercatat 1 kali (tidak double-charged)');
    assert.equal(Number(logTransaksi[0].jumlah_dibayar), pesanan!.total_harga);

    const tiketRows = await app.ctx.db.query(
      `SELECT id_tiket FROM tiket_antrean WHERE pesanan_id = $1`,
      [pesanan!.pesanan_id],
    );
    assert.equal(tiketRows.length, 1, 'Tiket antrean hanya boleh terbit 1 kali per pesanan');

    // 2. Pastikan pesanan yang sudah lunas tidak dapat dibuatkan tagihan baru lagi
    const tagihUlang = await gagal(
      app.controllers.pembayaran.buatTagihan(user, pesanan!.pesanan_id, 'VIRTUAL_ACCOUNT'),
    );
    assert.equal(tagihUlang.status, 409);
  });
});