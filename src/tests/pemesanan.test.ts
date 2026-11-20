/**
 * Pengujian UC02 bagian pemesanan (stok, kuota, booking). Penanggung jawab: Bayu.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C06 Pesanan
 *   - C08 RiwayatTransaksi
 *   - C09 TiketAntrean
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { App } from '../server/app.js';
import { Pesanan, validasiJadwalBooking } from '../server/models/pesanan.js';
import { appUji, gagal, loginSebagai, menuPertama, pesanDanBayar, restoranId } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('UC02 pemesanan', () => {
  test('[C06-UT04, C09-UT05] pesanan lunas menerbitkan tiket dan mengurangi stok', async () => {
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
  test('[C06-UT05] stok habis ditolak dengan daftar menu habis (Alt 3)', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Bakso Mang Ujang');
    const habis = await menuPertama(app, resto, { stokNol: true });
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: habis.menu_id, jumlah: 1 }],
    }));
    assert.equal(e.status, 409);
    assert.equal(e.details.menuHabis[0].menuId, habis.menu_id);
  });
  test('[C06-UT06] antrean ditutup menolak dine-in/takeaway tetapi booking tetap bisa', async () => {
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
  test('[C06-UT07] slot booking penuh ditolak (Alt 5)', async () => {
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
  test('[C06-UT08] pelanggan lain tidak dapat melihat pesanan', async () => {
    const pemilik = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const daftar = await app.controllers.pemesanan.daftarPesananSaya(pemilik);
    const e = await gagal(app.controllers.pemesanan.getPesanan(lain, daftar[0].pesanan_id));
    assert.equal(e.status, 403);
  });
});

const sekarang = new Date(2026, 9, 31, 14, 30); // Sabtu 31 Okt 2026 14:30

test('[C06-UT01] booking: maksimal 7 hari ke depan (KF09)', () => {
  assert.equal(validasiJadwalBooking('2026-11-07', '12:00', 2, sekarang, 7), null);
  assert.match(validasiJadwalBooking('2026-11-08', '12:00', 2, sekarang, 7)!, /maksimal 7 hari/);
  assert.match(validasiJadwalBooking('2026-10-30', '12:00', 2, sekarang, 7)!, /maksimal 7 hari/);
});

test('[C06-UT02, C06-UT03] booking: slot hari ini yang sudah lewat, slot tidak terdaftar, dan rombongan tidak valid ditolak', () => {
  assert.match(validasiJadwalBooking('2026-10-31', '13:00', 2, sekarang, 7)!, /sudah lewat/);
  assert.equal(validasiJadwalBooking('2026-10-31', '17:00', 2, sekarang, 7), null);
  assert.match(validasiJadwalBooking('2026-11-01', '15:00', 2, sekarang, 7)!, /Slot/);
  assert.match(validasiJadwalBooking('2026-11-01', '12:00', 0, sekarang, 7)!, /rombongan/);
  assert.match(validasiJadwalBooking('besok', '12:00', 2, sekarang, 7)!, /tidak valid/);
});

describe('Pelengkap C06', () => {
  test('C06-UT11 batalkanPesanan: pesanan yang sudah dibayar tidak dapat dibatalkan (409)', async () => {
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const { user, pesanan } = await pesanDanBayar(app, 'dinda@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const e = await gagal(app.controllers.pemesanan.batalkanPesanan(user, pesanan.pesanan_id));
    assert.equal(e.status, 409);
    assert.match(e.message, /sudah dibayar/);
  });
  test('C06-UT12 batalkanPesanan: pesanan tidak ada atau milik orang lain ditolak', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    assert.ok([403, 404].includes((await gagal(app.controllers.pemesanan.batalkanPesanan(user, 'PSN-tidak-ada'))).status));
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const [milik] = await app.controllers.pemesanan.daftarPesananSaya(user);
    assert.equal((await gagal(app.controllers.pemesanan.batalkanPesanan(lain, milik.pesanan_id))).status, 403);
  });
});

describe('Pelengkap C06, C09 (normal, batas, negatif)', () => {
  test('C06-UT13 getDetailPesanan: pesanan lunas memuat item, restoran, pembayaran, dan tiket; ID tidak ada -> null', async () => {
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const { pesanan } = await pesanDanBayar(app, 'yoga@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const d = await Pesanan.getDetailPesanan(app.ctx.db, pesanan.pesanan_id);
    assert.equal(d?.items.length, 1);
    assert.equal(d?.nama_restoran, 'Batagor Riri Viral');
    assert.ok(d?.pembayaran);
    assert.ok(d?.tiket);
    assert.equal(await Pesanan.getDetailPesanan(app.ctx.db, 'PSN-tidak-ada'), null);
  });
  test('C06-UT14 updateStatus: DIKONFIRMASI -> SELESAI tersimpan; status di luar daftar ditolak (negatif)', async () => {
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const { pesanan } = await pesanDanBayar(app, 'seblak1@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    await Pesanan.updateStatus(app.ctx.db, pesanan.pesanan_id, 'SELESAI');
    assert.equal((await Pesanan.getById(app.ctx.db, pesanan.pesanan_id))?.status_pemesanan, 'SELESAI');
    await assert.rejects(Pesanan.updateStatus(app.ctx.db, pesanan.pesanan_id, 'NGAWUR' as never));
  });
  test('C06-UT15 buatPesanan: jumlah sama dengan stok diterima, stok + 1 ditolak 409 (batas)', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const resto = await restoranId(app, 'Cilok Gang Senggol');
    const menu = await menuPertama(app, resto);
    await app.ctx.db.query(`UPDATE menu SET stok = 3 WHERE menu_id = $1`, [menu.menu_id]);
    const ok = await app.controllers.pemesanan.buatPesanan(user, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 3 }] });
    assert.equal(ok!.mode_pemesanan, 'TAKEAWAY');
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 4 }] }));
    assert.equal(e.status, 409);
    await app.ctx.db.query(`UPDATE menu SET stok = 30 WHERE menu_id = $1`, [menu.menu_id]);
  });
  test('C09-UT08 cetakRincianTiket (getTiket): pemilik melihat tiket dan bukti; orang lain 403; tiket tidak ada 404', async () => {
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const { user, hasil } = await pesanDanBayar(app, 'bima@contoh.id', { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] });
    const idTiket = (hasil as { idTiket: string | null }).idTiket!;
    const r = await app.controllers.pemesanan.getTiket(user, idTiket);
    assert.equal(r.tiket.id_tiket, idTiket);
    assert.equal(r.pesanan.bukti?.status_pelunasan, 'LUNAS');
    const lain = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    assert.equal((await gagal(app.controllers.pemesanan.getTiket(lain, idTiket))).status, 403);
    assert.equal((await gagal(app.controllers.pemesanan.getTiket(user, 'TKT-tidak-ada'))).status, 404);
  });
});
