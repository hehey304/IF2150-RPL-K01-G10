/**
 * Pengujian UC02 bagian pemesanan (stok, kuota, booking). Penanggung jawab: Bayu.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { validasiJadwalBooking } from '../server/models/pesanan.js';
import { appUji, gagal, loginSebagai, menuPertama, pesanDanBayar, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC02 pemesanan', () => {
  test('pesanan lunas menerbitkan tiket dan mengurangi stok', async () => {
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const { hasil, pesanan } = await pesanDanBayar(app, 'seblak1@contoh.id', {
      restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 2 }],
    });
    assert.equal(hasil.status, 'LUNAS');
    assert.ok(hasil.idTiket);
    assert.equal(pesanan.total_harga, menu.harga * 2 + app.ctx.config.biayaLayanan);
    const stok = await app.ctx.db.query<{ stok: number }>(`SELECT stok FROM menu WHERE menu_id = $1`, [menu.menu_id]);
    assert.equal(stok[0].stok, menu.stok - 2);
    const p = await app.ctx.db.query<{ status_pemesanan: string }>(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [pesanan.pesanan_id]);
    assert.equal(p[0].status_pemesanan, 'DIKONFIRMASI');
  });
  test('stok habis ditolak dengan daftar menu habis (Alt 3)', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Bakso Mang Ujang');
    const habis = await menuPertama(app, resto, { stokNol: true });
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: habis.menu_id, jumlah: 1 }],
    }));
    assert.equal(e.status, 409);
    assert.equal(e.details.menuHabis[0].menuId, habis.menu_id);
  });
  test('antrean ditutup menolak dine-in/takeaway tetapi booking tetap bisa', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Kopi Senja Braga'); // kuota 0 = ditutup
    const menu = await menuPertama(app, resto);
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }],
    }));
    assert.match(e.message, /ditutup/);
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const tgl = `${besok.getFullYear()}-${String(besok.getMonth() + 1).padStart(2, '0')}-${String(besok.getDate()).padStart(2, '0')}`;
    const p = await app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'BOOKING', jumlahRombongan: 3, tanggalBooking: tgl, slotWaktuBooking: '12:00',
      items: [{ menuId: menu.menu_id, jumlah: 1 }],
    });
    assert.equal(p!.mode_pemesanan, 'BOOKING');
  });
  test('slot booking penuh ditolak (Alt 5)', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Cilok Gang Senggol'); // kapasitas meja 4
    const menu = await menuPertama(app, resto);
    const besok = new Date();
    besok.setDate(besok.getDate() + 2);
    const tgl = `${besok.getFullYear()}-${String(besok.getMonth() + 1).padStart(2, '0')}-${String(besok.getDate()).padStart(2, '0')}`;
    const input = { restoranId: resto, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tgl, slotWaktuBooking: '19:00',
      items: [{ menuId: menu.menu_id, jumlah: 1 }] };
    for (let i = 0; i < 4; i++) await app.controllers.pemesanan.buatPesanan(user, input);
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, input));
    assert.equal(e.status, 409);
    const slot = await app.controllers.pemesanan.getSlotBooking(resto, tgl);
    assert.equal(slot.slot.find((s) => s.jam === '19:00')!.tersedia, false);
  });
  test('pelanggan lain tidak dapat melihat pesanan', async () => {
    const pemilik = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const daftar = await app.controllers.pemesanan.daftarPesananSaya(pemilik);
    const e = await gagal(app.controllers.pemesanan.getPesanan(lain, daftar[0].pesanan_id));
    assert.equal(e.status, 403);
  });
});

const sekarang = new Date(2026, 9, 31, 14, 30); // Sabtu 31 Okt 2026 14:30

test('booking: maksimal 7 hari ke depan (KF09)', () => {
  assert.equal(validasiJadwalBooking('2026-11-07', '12:00', 2, sekarang, 7), null);
  assert.match(validasiJadwalBooking('2026-11-08', '12:00', 2, sekarang, 7)!, /maksimal 7 hari/);
  assert.match(validasiJadwalBooking('2026-10-30', '12:00', 2, sekarang, 7)!, /maksimal 7 hari/);
});

test('booking: slot hari ini yang sudah lewat, slot tidak terdaftar, dan rombongan tidak valid ditolak', () => {
  assert.match(validasiJadwalBooking('2026-10-31', '13:00', 2, sekarang, 7)!, /sudah lewat/);
  assert.equal(validasiJadwalBooking('2026-10-31', '17:00', 2, sekarang, 7), null);
  assert.match(validasiJadwalBooking('2026-11-01', '15:00', 2, sekarang, 7)!, /Slot/);
  assert.match(validasiJadwalBooking('2026-11-01', '12:00', 0, sekarang, 7)!, /rombongan/);
  assert.match(validasiJadwalBooking('besok', '12:00', 2, sekarang, 7)!, /tidak valid/);
});
