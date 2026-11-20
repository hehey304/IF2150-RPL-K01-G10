/**
 * Pengujian INTEGRASI antri.in (HIUPL Subbab 4.3). Test case: INT-TC01 s.d. INT-TC37.
 *
 * Yang diuji adalah interaksi yang MELEWATI BATAS komponen (bukan logika di dalam satu kelas):
 *   1. Controller -> Model            (mis. PemesananController -> Pesanan/Menu)
 *   2. Aplikasi   -> Basis data       (isi tabel dibaca LANGSUNG lewat SQL, bukan lewat controller)
 *   3. Aplikasi   -> Sistem eksternal (PaymentGatewayAdapter -> payment gateway sandbox, NotifikasiEmail)
 *   4. Klien REST -> Route -> Controller (middleware autentikasi dan pemetaan error)
 *
 * Aturan pengujian integrasi (asistensi T10): memakai KOMPONEN NYATA, tanpa mock.
 *   - Basis data   : PGlite (PostgreSQL embedded) secara bawaan; isi TEST_DATABASE_URL (npm run test:pg)
 *                    untuk PostgreSQL sungguhan.
 *   - Payment gw   : SandboxPaymentGateway (gateway dummy bawaan proyek, HMAC dan webhook sungguhan).
 *   - Email        : NotifikasiEmail sungguhan (dicatat ke tabel log_notifikasi).
 *
 * ID antarmuka (I-XX) mengikuti HIUPL Subbab 3.3 (Tabel 3.3); pemetaan ke test case ada pada Tabel 4.3.1:
 *   I-01 Registrasi Akun  I-02 Login  I-03 Profil Akun  I-04 Dialog Keluar            -> AutentikasiController
 *   I-05 Beranda & Pencarian  I-06 Detail Restoran & Menu                              -> PencarianController
 *   I-07 Keranjang & Mode Layanan  I-08 Pilih Jadwal Booking                           -> PemesananController
 *   I-09 Pembayaran  I-10 Tiket Antrean                                                -> MetodePembayaranController, PaymentGatewayAdapter
 *   I-11 Status Antrean  I-14 Dashboard & Kelola Antrean  I-15 Dialog Dequeue          -> KelolaAntreanController, PemantauAntreanController
 *   I-12 Formulir Keluhan  I-19 Daftar Keluhan                                         -> KeluhanController
 *   I-13 Pendaftaran Mitra  I-18 Verifikasi Pengajuan Mitra                            -> PengajuanMitraController, NotifikasiEmail
 *   I-16 Pengaturan Kuota & Meja  I-17 Pengaturan Menu & Stok                          -> PengaturanKuotaController, KelolaMenuController
 *   I-20 Kelola Restoran Mitra  I-21 Dialog Hapus Restoran                             -> KelolaDataRestoranController
 *   Lapisan data (INT-TC32 s.d. INT-TC35) mendukung seluruh antarmuka.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { App } from '../server/app.js';
import { migrate } from '../server/db/database.js';
import { NotifikasiEmail } from '../server/adapters/notifikasiEmail.js';
import { tandaTanganNotifikasi, type NotifikasiGateway } from '../server/adapters/paymentGatewayAdapter.js';
import { SandboxPaymentGateway } from '../server/sandbox-pg/sandboxGateway.js';
import { appUji, gagal, loginSebagai, menuPertama, restoranId } from './helpers.js';

let app: App;
let gw: SandboxPaymentGateway;
let server: Server;
let base = '';

before(async () => {
  app = await appUji();
  gw = app.ctx.gateway as SandboxPaymentGateway;
  server = app.app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(async () => {
  server.closeAllConnections();
  server.close();
  await app.close();
});

// ---------------------------------------------------------------- utilitas pengujian

/** Query langsung ke basis data (memeriksa isi tabel tanpa melewati controller). */
const q = <T = any>(sql: string, params: unknown[] = []) => app.ctx.db.query<T>(sql, params);
const hitung = async (sql: string, params: unknown[] = []) => Number((await q<{ n: number }>(sql, params))[0].n);
const stokMenu = async (menuId: string) => (await q<{ stok: number }>(`SELECT stok FROM menu WHERE menu_id = $1`, [menuId]))[0].stok;

const tanggalLokal = (tambahHari: number) => {
  const d = new Date();
  d.setDate(d.getDate() + tambahHari);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Pelanggan memesan satu menu (takeaway) pada restoran tertentu. */
async function pesanTakeaway(email: string, namaResto: string, jumlah = 1) {
  const user = await loginSebagai(app, email, 'pelanggan123');
  const resto = await restoranId(app, namaResto);
  const menu = await menuPertama(app, resto);
  const pesanan = (await app.controllers.pemesanan.buatPesanan(user, {
    restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah }],
  }))!;
  return { user, resto, menu, pesanan };
}

/** Pesan lalu buat tagihan; idGw = ID transaksi di sisi payment gateway. */
async function pesanDanTagih(email: string, namaResto: string, tipe: 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'KARTU' = 'EWALLET', jumlah = 1) {
  const p = await pesanTakeaway(email, namaResto, jumlah);
  const t = await app.controllers.pembayaran.buatTagihan(p.user, p.pesanan.pesanan_id, tipe);
  return { ...p, t, idGw: t.urlPembayaran.split('/').pop()! };
}

const berkas = (jenis: string) => ({ fieldname: jenis, originalname: `${jenis}.pdf`, mimetype: 'application/pdf', size: 1000, path: '/tmp/tidak-ada' });
const bodyMitra = (nama: string, email: string, noHp: string) => ({
  namaRestoran: nama, kategori: 'Minuman', lokasi: 'Dago', alamat: 'Jl. Dago No. 1, Bandung', emailKontak: email, noHp,
  daftarMenu: JSON.stringify([{ namaMenu: 'Menu Uji', harga: '15000' }]),
});

/** Klien REST sederhana ke server uji. */
async function http(method: string, path: string, opsi: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(opsi.token ? { Authorization: `Bearer ${opsi.token}` } : {}), ...opsi.headers },
    body: opsi.body === undefined ? undefined : JSON.stringify(opsi.body),
  });
  return { status: r.status, body: (await r.json().catch(() => null)) as any };
}

// ================================================================ I-01, I-02, I-03, I-04 Autentikasi -> ModelAkun -> DB

describe('I-01, I-02, I-03, I-04 AutentikasiController -> ModelAkun -> Basis data', () => {
  test('[INT-TC01] registrasi menyimpan akun + profil pelanggan (hash bcrypt), login membuat sesi aktif', async () => {
    const c = app.controllers.auth;
    await c.createAccount({ nama: 'Integrasi Satu', email: 'int1@contoh.id', noHp: '081277700001', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true });
    const [akun] = await q(`SELECT id_pengguna, role, password_hash FROM pengguna WHERE email = 'int1@contoh.id'`);
    assert.equal(akun.role, 'PELANGGAN');
    assert.match(akun.password_hash, /^\$2[aby]\$\d{2}\$/);
    assert.notEqual(akun.password_hash, 'rahasia123');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pelanggan WHERE id_akun = $1`, [akun.id_pengguna]), 1);

    const { token } = await c.validation({ email: 'int1@contoh.id', password: 'rahasia123' });
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM sesi_pengguna WHERE token = $1 AND id_pengguna = $2 AND status_aktif`, [token, akun.id_pengguna]), 1);
    assert.equal((await c.validateSession(token))?.email, 'int1@contoh.id');
  });

  test('[INT-TC02] registrasi dengan email terdaftar ditolak (409) dan tidak meninggalkan data setengah jadi', async () => {
    const [pengguna0, pelanggan0] = [await hitung(`SELECT COUNT(*)::int n FROM pengguna`), await hitung(`SELECT COUNT(*)::int n FROM pelanggan`)];
    const e = await gagal(app.controllers.auth.createAccount({ nama: 'Dobel', email: 'pelanggan@antri.in', noHp: '081277700002', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true }));
    assert.equal(e.status, 409);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pengguna`), pengguna0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pelanggan`), pelanggan0);
  });

  test('[INT-TC03] logout menonaktifkan sesi pada basis data dan token tidak berlaku lagi', async () => {
    const c = app.controllers.auth;
    const { token } = await c.validation({ email: 'int1@contoh.id', password: 'rahasia123' });
    const user = (await c.validateSession(token))!;
    await c.processLogout(user);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM sesi_pengguna WHERE token = $1 AND status_aktif`, [token]), 0);
    assert.equal(await c.validateSession(token), null);
  });
});

// ================================================================ I-05, I-06 Pencarian -> ModelRestoran/Antrean -> DB

describe('I-05, I-06 PencarianController -> ModelRestoran / ModelAntrean -> Basis data', () => {
  test('[INT-TC04] hasil pencarian dan detail restoran sesuai isi tabel restoran, menu, dan kuota', async () => {
    const hasil = await app.controllers.pencarian.cariRestoran({ q: 'bakso' });
    assert.ok(hasil.hasil.length >= 1);
    for (const r of hasil.hasil) {
      const [baris] = await q(`SELECT nama_restoran, kategori, status_aktif FROM restoran WHERE restoran_id = $1`, [r.restoran_id]);
      assert.equal(baris.nama_restoran, r.nama_restoran);
      assert.equal(baris.status_aktif, true);
    }
    const id = await restoranId(app, 'Bakso Mang Ujang');
    const d = await app.controllers.pencarian.getDetailRestoran(id);
    assert.equal(d.menu.length, await hitung(`SELECT COUNT(*)::int n FROM menu WHERE restoran_id = $1 AND aktif`, [id]));
    assert.equal(d.restoran.kuota_maksimum, (await q(`SELECT kuota_maksimum FROM pengaturan_kuota WHERE restoran_id = $1`, [id]))[0].kuota_maksimum);
  });

  test('[INT-TC05] restoran yang dinonaktifkan di basis data tidak muncul pada pencarian dan detail (404)', async () => {
    const id = await restoranId(app, 'Martabak Kubang 99');
    assert.ok((await app.controllers.pencarian.cariRestoran({ q: 'Martabak Kubang' })).hasil.some((r) => r.restoran_id === id));
    await q(`UPDATE restoran SET status_aktif = false WHERE restoran_id = $1`, [id]);
    assert.ok(!(await app.controllers.pencarian.cariRestoran({ q: 'Martabak Kubang' })).hasil.some((r) => r.restoran_id === id));
    assert.equal((await gagal(app.controllers.pencarian.getDetailRestoran(id))).status, 404);
  });
});

// ================================================================ I-07, I-08 Pemesanan -> ModelPesanan/Menu -> DB

describe('I-07, I-08 PemesananController -> ModelPesanan / Menu -> Basis data', () => {
  test('[INT-TC06] pesanan tersimpan lengkap (pesanan + detail), total benar, stok belum berkurang sebelum bayar', async () => {
    const resto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const menu = await menuPertama(app, resto);
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const stok0 = await stokMenu(menu.menu_id);
    const p = (await app.controllers.pemesanan.buatPesanan(user, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 2 }] }))!;

    const [baris] = await q(`SELECT status_pemesanan, mode_pemesanan, subtotal, biaya_layanan, total_harga, pelanggan_id FROM pesanan WHERE pesanan_id = $1`, [p.pesanan_id]);
    assert.equal(baris.status_pemesanan, 'MENUNGGU_PEMBAYARAN');
    assert.equal(baris.mode_pemesanan, 'TAKEAWAY');
    assert.equal(baris.pelanggan_id, user.pelangganId);
    assert.equal(baris.subtotal, menu.harga * 2);
    assert.equal(baris.total_harga, baris.subtotal + app.ctx.config.biayaLayanan);
    const [detail] = await q(`SELECT jumlah, subtotal FROM detail_pesanan WHERE pesanan_id = $1 AND menu_id = $2`, [p.pesanan_id, menu.menu_id]);
    assert.deepEqual({ jumlah: detail.jumlah, subtotal: detail.subtotal }, { jumlah: 2, subtotal: menu.harga * 2 });
    assert.equal(await stokMenu(menu.menu_id), stok0);
  });

  test('[INT-TC07] stok tidak cukup ditolak (409) dan tidak ada pesanan baru di basis data', async () => {
    const resto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const menu = await menuPertama(app, resto);
    const user = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const stok0 = await stokMenu(menu.menu_id);
    const sebelum = await hitung(`SELECT COUNT(*)::int n FROM pesanan`);
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: stok0 + 1 }] }));
    assert.equal(e.status, 409);
    assert.equal(e.details.menuHabis[0].menuId, menu.menu_id);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pesanan`), sebelum);
    assert.equal(await stokMenu(menu.menu_id), stok0);
  });

  test('[INT-TC08] booking lebih dari 7 hari ke depan ditolak (400) dan tidak tersimpan', async () => {
    const resto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const menu = await menuPertama(app, resto);
    const user = await loginSebagai(app, 'dinda@contoh.id', 'pelanggan123');
    const sebelum = await hitung(`SELECT COUNT(*)::int n FROM pesanan`);
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tanggalLokal(8), slotWaktuBooking: '12:00', items: [{ menuId: menu.menu_id, jumlah: 1 }],
    }));
    assert.equal(e.status, 400);
    assert.match(e.message, /maksimal 7 hari/);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pesanan`), sebelum);
  });

  test('[INT-TC09] pesanan atomik: satu menu tidak valid membatalkan seluruh pesanan (tidak ada baris pesanan/detail)', async () => {
    const resto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const menu = await menuPertama(app, resto);
    const user = await loginSebagai(app, 'fajar@contoh.id', 'pelanggan123');
    const [pesanan0, detail0] = [await hitung(`SELECT COUNT(*)::int n FROM pesanan`), await hitung(`SELECT COUNT(*)::int n FROM detail_pesanan`)];
    const e = await gagal(app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }, { menuId: 'MNU-tidak-ada', jumlah: 1 }],
    }));
    assert.equal(e.status, 409);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pesanan`), pesanan0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM detail_pesanan`), detail0);
  });

  test('[INT-TC10] booking tersimpan dengan tanggal dan slot, lalu terbaca oleh perhitungan slot (kuota meja)', async () => {
    const resto = await restoranId(app, 'Kopi Senja Braga'); // antrean ditutup, booking tetap boleh
    const menu = await menuPertama(app, resto);
    const user = await loginSebagai(app, 'nadia@contoh.id', 'pelanggan123');
    const tgl = tanggalLokal(1);
    const slot0 = (await app.controllers.pemesanan.getSlotBooking(resto, tgl)).slot.find((s) => s.jam === '12:00')!;
    const p = (await app.controllers.pemesanan.buatPesanan(user, {
      restoranId: resto, mode: 'BOOKING', jumlahRombongan: 3, tanggalBooking: tgl, slotWaktuBooking: '12:00', items: [{ menuId: menu.menu_id, jumlah: 1 }],
    }))!;
    const [baris] = await q(`SELECT mode_pemesanan, jumlah_rombongan, slot_waktu_booking, to_char(tanggal_booking, 'YYYY-MM-DD') AS tgl FROM pesanan WHERE pesanan_id = $1`, [p.pesanan_id]);
    assert.deepEqual({ ...baris }, { mode_pemesanan: 'BOOKING', jumlah_rombongan: 3, slot_waktu_booking: '12:00', tgl });
    const slot1 = (await app.controllers.pemesanan.getSlotBooking(resto, tgl)).slot.find((s) => s.jam === '12:00')!;
    assert.equal(slot1.terpakai, slot0.terpakai + 1);
  });
});

// ================================================================ I-09 MetodePembayaran -> PaymentGatewayAdapter -> gateway sandbox -> DB

describe('I-09 MetodePembayaranController -> PaymentGatewayAdapter -> Payment Gateway (sandbox) -> Basis data', () => {
  test('[INT-TC11] buatTagihan: baris pembayaran (antri.in) dan transaksi gateway konsisten (kode bayar, jumlah, status)', async () => {
    const a = await pesanDanTagih('bima@contoh.id', 'Batagor Riri Viral', 'EWALLET');
    const [bayar] = await q(`SELECT tipe_pembayaran, jumlah, kode_bayar, status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]);
    const [trx] = await q(`SELECT order_id, kode_bayar, jumlah, status, metode FROM gateway_transaksi WHERE id_transaksi = $1`, [a.idGw]);
    assert.equal(bayar.status_pembayaran, 'MENUNGGU');
    assert.equal(bayar.jumlah, a.pesanan.total_harga);
    assert.equal(trx.status, 'MENUNGGU');
    assert.equal(trx.order_id, a.t.id_pembayaran);
    assert.equal(trx.kode_bayar, bayar.kode_bayar);
    assert.equal(trx.jumlah, bayar.jumlah);
    assert.equal(trx.metode, 'EWALLET');
  });

  test('[INT-TC12] gateway melunasi -> webhook -> pembayaran lunas, stok berkurang, riwayat dicatat, pesanan dikonfirmasi, tiket + notifikasi restoran terbit', async () => {
    const a = await pesanDanTagih('yoga@contoh.id', 'Batagor Riri Viral', 'EWALLET', 2);
    const stok0 = await stokMenu(a.menu.menu_id);
    const notif0 = await hitung(`SELECT COUNT(*)::int n FROM notifikasi n JOIN restoran r ON r.id_akun = n.id_pengguna WHERE r.restoran_id = $1`, [a.resto]);
    await gw.bayarEwallet(a.idGw, true);

    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'LUNAS');
    assert.equal((await q(`SELECT status FROM gateway_transaksi WHERE id_transaksi = $1`, [a.idGw]))[0].status, 'LUNAS');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIKONFIRMASI');
    assert.equal(await stokMenu(a.menu.menu_id), stok0 - 2);
    const [riwayat] = await q(`SELECT jumlah_dibayar, status_pelunasan FROM riwayat_transaksi WHERE id_pembayaran = $1`, [a.t.id_pembayaran]);
    assert.equal(riwayat.jumlah_dibayar, a.pesanan.total_harga);
    const [tiket] = await q(`SELECT status_antrean, tipe_antrean, nomor_urut FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]);
    // Tiket aktif: pelanggan terdepan pada antrean kosong langsung berstatus DIPANGGIL, selainnya MENUNGGU.
    assert.equal(tiket.tipe_antrean, 'TAKEAWAY');
    assert.ok(['MENUNGGU', 'DIPANGGIL'].includes(tiket.status_antrean), `status tiket: ${tiket.status_antrean}`);
    assert.ok(tiket.nomor_urut >= 1);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM notifikasi n JOIN restoran r ON r.id_akun = n.id_pengguna WHERE r.restoran_id = $1`, [a.resto]), notif0 + 1);
  });

  test('[INT-TC13] gateway menolak kartu -> pembayaran gagal, pesanan dibatalkan, tanpa tiket/riwayat, stok tetap', async () => {
    const a = await pesanDanTagih('salsa@contoh.id', 'Mie Kocok Pak Haji', 'KARTU');
    const stok0 = await stokMenu(a.menu.menu_id);
    const info = await gw.bayarKartu(a.idGw, { nomor: '4911111111111113', kedaluwarsa: '12/30', cvv: '123', nama: 'Salsa' });
    assert.equal(info.status, 'GAGAL');
    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'GAGAL');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIBATALKAN');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM riwayat_transaksi WHERE id_pembayaran = $1`, [a.t.id_pembayaran]), 0);
    assert.equal(await stokMenu(a.menu.menu_id), stok0);
  });

  test('[INT-TC14] pembayaran terlambat (lewat batas waktu): 410, pesanan dibatalkan, dana dikembalikan di gateway, tanpa tiket', async () => {
    const a = await pesanDanTagih('seblak1@contoh.id', 'Mie Kocok Pak Haji', 'VIRTUAL_ACCOUNT');
    await q(`UPDATE pembayaran SET batas_waktu_bayar = NOW() - INTERVAL '1 minute' WHERE id_pembayaran = $1`, [a.t.id_pembayaran]);
    await gw.transferVa(a.idGw, a.pesanan.total_harga); // pelanggan membayar setelah batas waktu
    const e = await gagal(app.controllers.pembayaran.verifikasiPembayaran(a.user, a.t.id_pembayaran));
    assert.equal(e.status, 410);
    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'KEDALUWARSA');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIBATALKAN');
    assert.equal((await q(`SELECT status FROM gateway_transaksi WHERE id_transaksi = $1`, [a.idGw]))[0].status, 'DIKEMBALIKAN');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
  });

  test('[INT-TC15] webhook gateway dengan tanda tangan tidak valid ditolak (401) dan status pembayaran tidak berubah', async () => {
    const a = await pesanDanTagih('seblak2@contoh.id', 'Mie Kocok Pak Haji', 'EWALLET');
    const n: NotifikasiGateway = { orderId: a.t.id_pembayaran, kodeBayar: a.t.kode_bayar, status: 'GAGAL', jumlah: a.t.jumlah, waktu: new Date().toISOString() };
    const r = await http('POST', '/pembayaran/notifikasi', { body: n, headers: { 'X-Signature': 'deadbeef' } });
    assert.equal(r.status, 401);
    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'MENUNGGU');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'MENUNGGU_PEMBAYARAN');
  });

  test('[INT-TC16] webhook gateway "GAGAL" bertanda tangan HMAC sah diterima: pembayaran gagal dan pesanan dibatalkan', async () => {
    const a = await pesanDanTagih('seblak3@contoh.id', 'Mie Kocok Pak Haji', 'EWALLET');
    const n: NotifikasiGateway = { orderId: a.t.id_pembayaran, kodeBayar: a.t.kode_bayar, status: 'GAGAL', jumlah: a.t.jumlah, waktu: new Date().toISOString() };
    const r = await http('POST', '/pembayaran/notifikasi', { body: n, headers: { 'X-Signature': tandaTanganNotifikasi(n, app.ctx.config.gatewayServerKey) } });
    assert.equal(r.status, 200);
    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'GAGAL');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIBATALKAN');
  });

  test('[INT-TC17] stok habis saat pembayaran diproses: dana dikembalikan, transaksi di-rollback (tanpa riwayat/tiket, stok tidak negatif)', async () => {
    const a = await pesanDanTagih('pelanggan@antri.in', 'Cilok Gang Senggol', 'EWALLET', 2);
    const stokAsli = await stokMenu(a.menu.menu_id);
    await q(`UPDATE menu SET stok = 1 WHERE menu_id = $1`, [a.menu.menu_id]);
    await gw.bayarEwallet(a.idGw, true);
    assert.equal((await q(`SELECT status FROM gateway_transaksi WHERE id_transaksi = $1`, [a.idGw]))[0].status, 'DIKEMBALIKAN');
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIBATALKAN');
    assert.equal(await stokMenu(a.menu.menu_id), 1);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM riwayat_transaksi WHERE id_pembayaran = $1`, [a.t.id_pembayaran]), 0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
    await q(`UPDATE menu SET stok = $2 WHERE menu_id = $1`, [a.menu.menu_id, stokAsli]);
  });

  test('[INT-TC36] pelanggan membatalkan pesanan sebelum membayar: pembayaran GAGAL, transaksi gateway GAGAL, pembayaran susulan ditolak 409, tanpa tiket/riwayat, stok tetap', async () => {
    const a = await pesanDanTagih('bima@contoh.id', 'Batagor Riri Viral', 'VIRTUAL_ACCOUNT');
    const stok0 = await stokMenu(a.menu.menu_id);
    await app.controllers.pemesanan.batalkanPesanan(a.user, a.pesanan.pesanan_id);
    assert.equal((await q(`SELECT status_pemesanan FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].status_pemesanan, 'DIBATALKAN');
    assert.equal((await q(`SELECT status_pembayaran FROM pembayaran WHERE id_pembayaran = $1`, [a.t.id_pembayaran]))[0].status_pembayaran, 'GAGAL');
    assert.equal((await q(`SELECT status FROM gateway_transaksi WHERE id_transaksi = $1`, [a.idGw]))[0].status, 'GAGAL');
    const e = await gagal(gw.transferVa(a.idGw, a.pesanan.total_harga));
    assert.equal(e.status, 409);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM riwayat_transaksi WHERE id_pembayaran = $1`, [a.t.id_pembayaran]), 0);
    assert.equal(await stokMenu(a.menu.menu_id), stok0);
  });
});

// ================================================================ I-10, I-14 MetodePembayaran -> ModelAntrean (+ kanal real-time)

describe('I-10, I-14 MetodePembayaranController -> ModelAntrean dan kanal real-time', () => {
  test('[INT-TC18] dua pembayaran berturut-turut menghasilkan nomor urut tiket berurutan dan total antrean bertambah 2', async () => {
    const idResto = await restoranId(app, 'Ayam Geprek Bu Rini');
    const total0 = (await q(`SELECT total_antrean FROM antrean WHERE restoran_id = $1`, [idResto]))[0].total_antrean;
    const nomor: number[] = [];
    for (const email of ['dinda@contoh.id', 'fajar@contoh.id']) {
      const a = await pesanDanTagih(email, 'Ayam Geprek Bu Rini');
      await gw.bayarEwallet(a.idGw, true);
      nomor.push((await q(`SELECT nomor_urut FROM tiket_antrean WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]))[0].nomor_urut);
    }
    assert.equal(nomor[1], nomor[0] + 1);
    assert.equal((await q(`SELECT total_antrean FROM antrean WHERE restoran_id = $1`, [idResto]))[0].total_antrean, total0 + 2);
  });

  test('[INT-TC19] pembayaran lunas mendorong event "tiket-baru" ke kanal real-time (SSE) restoran terkait', async () => {
    const a = await pesanDanTagih('nadia@contoh.id', 'Cilok Gang Senggol');
    const tulis: string[] = [];
    const res = Object.assign(new EventEmitter(), { writeHead: () => res, write: (s: string) => (tulis.push(s), true) });
    app.controllers.pemantau.subscribe(a.resto, res as never);
    try {
      await gw.bayarEwallet(a.idGw, true);
      assert.ok(tulis.some((s) => s.includes('event: antrean') && s.includes('tiket-baru')), 'event tiket-baru diterima kanal SSE');
    } finally {
      res.emit('close'); // menutup kanal agar timer detak berhenti
    }
  });
});

// ================================================================ I-11, I-14, I-15 Kelola/Pemantau antrean -> ModelAntrean -> DB

describe('I-11, I-14, I-15 KelolaAntreanController / PemantauAntreanController -> ModelAntrean -> Basis data', () => {
  test('[INT-TC20] dequeue: tiket terdepan selesai, nomor dilayani naik, sisa antrean turun, tiket berikutnya dipanggil, pelanggan melihat sisa terbaru', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const pelanggan = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    // Tiket pelanggan ini pada restoran yang sama (tidak bergantung pada urutan test lain).
    const saya = (await app.controllers.pemantau.getAntreanAktifSaya(pelanggan)).find((s) => s.pesanan?.restoran_id === resto.restoranId)!;
    assert.ok(saya, 'pelanggan uji punya tiket aktif di restoran ini');
    const awal = await app.controllers.kelolaAntrean.getAntrean(resto);
    const front = awal.daftar[0];
    const a0 = (await q(`SELECT nomor_dilayani, total_antrean FROM antrean WHERE restoran_id = $1`, [resto.restoranId]))[0];

    await app.controllers.kelolaAntrean.processDequeue(resto, front.id_tiket);

    assert.equal((await q(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]))[0].status_antrean, 'SELESAI');
    const a1 = (await q(`SELECT nomor_dilayani, total_antrean FROM antrean WHERE restoran_id = $1`, [resto.restoranId]))[0];
    assert.equal(a1.nomor_dilayani, a0.nomor_dilayani + 1);
    assert.equal(a1.total_antrean, a0.total_antrean - 1);
    const berikut = (await app.controllers.kelolaAntrean.getAntrean(resto)).daftar[0];
    assert.equal((await q(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [berikut.id_tiket]))[0].status_antrean, 'DIPANGGIL');
    const status = await app.controllers.pemantau.getStatusAntrean(pelanggan, saya.tiket.id_tiket);
    assert.equal(status.sisaAntrean, saya.sisaAntrean - 1);
  });

  test('[INT-TC21] dequeue otomatis: tiket yang dipanggil >30 menit ditandai "dilewati" pada basis data', async () => {
    const resto = await loginSebagai(app, 'bakso@antri.in', 'restoran123');
    const front = (await app.controllers.kelolaAntrean.getAntrean(resto)).daftar[0];
    await q(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() - INTERVAL '31 minutes' WHERE id_tiket = $1`, [front.id_tiket]);
    const diproses = await app.controllers.kelolaAntrean.autoDequeue();
    assert.ok(diproses.includes(resto.restoranId!));
    assert.equal((await q(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]))[0].status_antrean, 'DILEWATI');
  });
});

// ================================================================ I-16, I-17 Kuota / Menu -> ModelRestoran -> (Pencarian, Pemesanan)

describe('I-16, I-17 PengaturanKuotaController / KelolaMenuController -> ModelRestoran -> Basis data', () => {
  test('[INT-TC22] kuota 0 tersimpan, antrean berstatus TUTUP, terbaca pencarian, dan pemesanan takeaway ditolak; dibuka lagi pulih', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const pelanggan = await loginSebagai(app, 'salsa@contoh.id', 'pelanggan123');
    const menu = await menuPertama(app, resto.restoranId!);

    await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '0', kapasitasMeja: '10' });
    assert.equal((await q(`SELECT kuota_maksimum FROM pengaturan_kuota WHERE restoran_id = $1`, [resto.restoranId]))[0].kuota_maksimum, 0);
    assert.equal((await q(`SELECT status_antrean FROM antrean WHERE restoran_id = $1`, [resto.restoranId]))[0].status_antrean, 'TUTUP');
    assert.equal((await app.controllers.pencarian.getDetailRestoran(resto.restoranId!)).restoran.status_antrean, 'TUTUP');
    const e = await gagal(app.controllers.pemesanan.buatPesanan(pelanggan, { restoranId: resto.restoranId, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] }));
    assert.equal(e.status, 409);
    assert.match(e.message, /ditutup/);

    await app.controllers.kuota.onSaveSettings(resto, { kuotaMaksimum: '50', kapasitasMeja: '10' });
    assert.equal((await q(`SELECT status_antrean FROM antrean WHERE restoran_id = $1`, [resto.restoranId]))[0].status_antrean, 'BUKA');
  });

  test('[INT-TC23] menu baru tersimpan dan terbaca pencarian; stok 0 menolak pemesanan; menu dihapus hilang dari pencarian; input salah tidak menyimpan', async () => {
    const resto = await loginSebagai(app, 'geprek@antri.in', 'restoran123');
    const pelanggan = await loginSebagai(app, 'salsa@contoh.id', 'pelanggan123');
    const baru = await app.controllers.menu.handleAddMenu(resto, { namaMenu: 'Geprek Integrasi', harga: '27000', stok: '5' });
    const [baris] = await q(`SELECT harga, stok, aktif FROM menu WHERE menu_id = $1`, [baru.menu_id]);
    assert.deepEqual({ ...baris }, { harga: 27000, stok: 5, aktif: true });
    assert.ok((await app.controllers.pencarian.getDetailRestoran(resto.restoranId!)).menu.some((m) => m.menu_id === baru.menu_id));

    await app.controllers.menu.handleUpdateStok(resto, baru.menu_id, '0');
    assert.equal(await stokMenu(baru.menu_id), 0);
    const e = await gagal(app.controllers.pemesanan.buatPesanan(pelanggan, { restoranId: resto.restoranId, mode: 'TAKEAWAY', items: [{ menuId: baru.menu_id, jumlah: 1 }] }));
    assert.equal(e.status, 409);

    await app.controllers.menu.handleDeleteMenu(resto, baru.menu_id);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM menu WHERE menu_id = $1 AND aktif`, [baru.menu_id]), 0);
    assert.ok(!(await app.controllers.pencarian.getDetailRestoran(resto.restoranId!)).menu.some((m) => m.menu_id === baru.menu_id));

    const jumlahMenu = await hitung(`SELECT COUNT(*)::int n FROM menu`);
    assert.equal((await gagal(app.controllers.menu.handleAddMenu(resto, { namaMenu: 'X', harga: '-1', stok: 'a' }))).status, 400);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM menu`), jumlahMenu);
  });
});

// ================================================================ I-13, I-18 PengajuanMitra -> ModelRestoran -> DB + NotifikasiEmail

describe('I-13, I-18 PengajuanMitraController -> ModelRestoran -> Basis data, NotifikasiEmail -> Layanan Email', () => {
  test('[INT-TC24] pengajuan disetujui: restoran aktif + kuota + antrean dibuat, akun tertaut, email "diterima" tercatat TERKIRIM', async () => {
    const pengajuan = (await app.controllers.mitra.daftarPengajuan()).find((p) => p.nama_restoran === 'Surabi Enhaii' && p.status === 'MENUNGGU')!;
    assert.ok(pengajuan);
    const hasil = await app.controllers.mitra.setujui(pengajuan.id_pengajuan);

    const [p] = await q(`SELECT status, restoran_id FROM pengajuan_mitra WHERE id_pengajuan = $1`, [pengajuan.id_pengajuan]);
    assert.deepEqual({ ...p }, { status: 'DISETUJUI', restoran_id: hasil.restoranId });
    const [r] = await q(`SELECT status_aktif, nama_restoran, id_akun FROM restoran WHERE restoran_id = $1`, [hasil.restoranId]);
    assert.equal(r.status_aktif, true);
    assert.equal(r.nama_restoran, 'Surabi Enhaii');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pengaturan_kuota WHERE restoran_id = $1`, [hasil.restoranId]), 1);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM antrean WHERE restoran_id = $1`, [hasil.restoranId]), 1);
    assert.equal((await loginSebagai(app, 'surabi@antri.in', 'restoran123')).restoranId, hasil.restoranId);
    assert.equal((await q(`SELECT status FROM log_notifikasi WHERE penerima = 'surabi@antri.in' AND jenis = 'MITRA_DITERIMA'`))[0].status, 'TERKIRIM');
  });

  test('[INT-TC25] pengajuan ditolak: alasan tersimpan, notifikasi dalam aplikasi dibuat, email "ditolak" memuat alasan', async () => {
    const user = await loginSebagai(app, 'mitrabaru@antri.in', 'restoran123');
    const p = await app.controllers.mitra.simpanPengajuan(user, bodyMitra('Warung Tolak Uji', 'mitrabaru@antri.in', '081600000011'), [berkas('nib'), berkas('izinUsaha')]);
    const alasan = 'Foto menu kurang jelas dan NIB buram';
    await app.controllers.mitra.tolak(p.idPengajuan, alasan);

    const [baris] = await q(`SELECT status, alasan_penolakan FROM pengajuan_mitra WHERE id_pengajuan = $1`, [p.idPengajuan]);
    assert.deepEqual({ ...baris }, { status: 'DITOLAK', alasan_penolakan: alasan });
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM notifikasi WHERE id_pengguna = $1 AND judul = 'Pendaftaran mitra ditolak'`, [user.idPengguna]), 1);
    const [email] = await q(`SELECT status, isi_pesan FROM log_notifikasi WHERE penerima = 'mitrabaru@antri.in' AND jenis = 'MITRA_DITOLAK'`);
    assert.equal(email.status, 'TERKIRIM');
    assert.ok(email.isi_pesan.includes(alasan));
  });

  test('[INT-TC26] layanan email gagal: kegagalan dicatat (GAGAL) dan penolakan pengajuan tetap tersimpan', async () => {
    await app.controllers.auth.createAccount({ nama: 'Mitra Email Gagal', email: 'mitragagal@contoh.id', noHp: '081277700026', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true, role: 'RESTORAN' });
    const user = await loginSebagai(app, 'mitragagal@contoh.id', 'rahasia123');
    const p = await app.controllers.mitra.simpanPengajuan(user, bodyMitra('Warung Email Gagal', 'mitragagal@contoh.id', '081600000026'), [berkas('nib'), berkas('izinUsaha')]);

    const emailAsli = app.ctx.email;
    const logAsli = console.log;
    app.ctx.email = new NotifikasiEmail(app.ctx.db, true); // email nyata; keluaran dipaksa gagal untuk menyimulasikan layanan email down
    console.log = () => { throw new Error('layanan email tidak dapat dihubungi'); };
    try {
      assert.equal((await app.controllers.mitra.tolak(p.idPengajuan, 'Dokumen tidak lengkap')).status, 'DITOLAK');
    } finally {
      console.log = logAsli;
      app.ctx.email = emailAsli;
    }
    assert.equal((await q(`SELECT status FROM pengajuan_mitra WHERE id_pengajuan = $1`, [p.idPengajuan]))[0].status, 'DITOLAK');
    assert.equal((await q(`SELECT status FROM log_notifikasi WHERE penerima = 'mitragagal@contoh.id' AND jenis = 'MITRA_DITOLAK'`))[0].status, 'GAGAL');
  });

  test('[INT-TC37] pendaftaran mitra: pengajuan MENUNGGU dan dokumen verifikasi tersimpan; pengajuan ganda dan dokumen berformat salah ditolak tanpa menyimpan', async () => {
    await app.controllers.auth.createAccount({ nama: 'Mitra Daftar Uji', email: 'mitradaftar@contoh.id', noHp: '081277700037', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true, role: 'RESTORAN' });
    const user = await loginSebagai(app, 'mitradaftar@contoh.id', 'rahasia123');
    const body = bodyMitra('Warung Daftar Uji', 'mitradaftar@contoh.id', '081600000037');

    const salah = { ...berkas('nib'), originalname: 'nib.exe', mimetype: 'application/x-msdownload' };
    const eFormat = await gagal(app.controllers.mitra.simpanPengajuan(user, body, [salah, berkas('izinUsaha')]));
    assert.equal(eFormat.status, 400);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pengajuan_mitra WHERE id_pengguna = $1`, [user.idPengguna]), 0);

    const p = await app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]);
    const [baris] = await q(`SELECT status, nama_restoran, email_kontak, daftar_menu FROM pengajuan_mitra WHERE id_pengajuan = $1`, [p.idPengajuan]);
    assert.equal(baris.status, 'MENUNGGU');
    assert.equal(baris.nama_restoran, 'Warung Daftar Uji');
    assert.equal(baris.daftar_menu.length, 1);
    const dok = await q(`SELECT jenis_dokumen, mime_type FROM dokumen_verifikasi WHERE id_pengajuan = $1 ORDER BY jenis_dokumen`, [p.idPengajuan]);
    assert.deepEqual(dok.map((d) => d.jenis_dokumen), ['izinUsaha', 'nib']);
    assert.ok(dok.every((d) => d.mime_type === 'application/pdf'));

    const eGanda = await gagal(app.controllers.mitra.simpanPengajuan(user, body, [berkas('nib'), berkas('izinUsaha')]));
    assert.equal(eGanda.status, 409);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pengajuan_mitra WHERE id_pengguna = $1`, [user.idPengguna]), 1);
  });
});

// ================================================================ I-20, I-21 KelolaDataRestoran -> ModelRestoran/Antrean -> DB + NotifikasiEmail

describe('I-20, I-21 KelolaDataRestoranController -> ModelRestoran / ModelAntrean -> Basis data, NotifikasiEmail', () => {
  test('[INT-TC27] hapus restoran: restoran + menu nonaktif, antrean ditutup, tiket aktif dibatalkan, pelanggan terdampak dan pemilik diberi tahu, email tercatat', async () => {
    const id = await restoranId(app, 'Seblak Teh Nining');
    const tiketAktif = await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id WHERE a.restoran_id = $1 AND t.status_antrean IN ('TERJADWAL','MENUNGGU','DIPANGGIL')`, [id]);
    const pelangganTerdampak = await hitung(`SELECT COUNT(DISTINCT t.pelanggan_id)::int n FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id WHERE a.restoran_id = $1 AND t.status_antrean IN ('TERJADWAL','MENUNGGU','DIPANGGIL')`, [id]);
    assert.ok(tiketAktif > 0, 'seed menyediakan antrean aktif pada restoran ini');

    await app.controllers.kelolaRestoran.hapusDataRestoran(id);

    assert.equal((await q(`SELECT status_aktif FROM restoran WHERE restoran_id = $1`, [id]))[0].status_aktif, false);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM menu WHERE restoran_id = $1 AND aktif`, [id]), 0);
    assert.equal((await q(`SELECT status_antrean FROM antrean WHERE restoran_id = $1`, [id]))[0].status_antrean, 'TUTUP');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id WHERE a.restoran_id = $1 AND t.status_antrean = 'DIBATALKAN'`, [id]), tiketAktif);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM notifikasi WHERE judul = 'Antrean di Seblak Teh Nining dibatalkan'`), pelangganTerdampak);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM log_notifikasi WHERE jenis = 'RESTORAN_DIHAPUS' AND penerima = (SELECT email_kontak FROM restoran WHERE restoran_id = $1)`, [id]), 1);
    assert.equal((await gagal(app.controllers.pencarian.getDetailRestoran(id))).status, 404);
  });
});

// ================================================================ I-12, I-19 Keluhan -> ModelKeluhan -> DB

describe('I-12, I-19 KeluhanController -> ModelKeluhan -> Basis data', () => {
  test('[INT-TC28] keluhan tersimpan terkait pesanan dan restoran; tanggapan admin tersimpan dan pelanggan diberi notifikasi', async () => {
    const user = await loginSebagai(app, 'pelanggan@antri.in', 'pelanggan123');
    const [pesanan] = await app.controllers.pemesanan.daftarPesananSaya(user);
    const k = await app.controllers.keluhan.kirimKeluhan(user, { pesananId: pesanan.pesanan_id, kategori: 'Pelayanan', isi: 'Pelayanan kurang ramah saat saya datang.' });
    const [baris] = await q(`SELECT status, pelanggan_id, pesanan_id, restoran_id FROM keluhan WHERE id_keluhan = $1`, [k.id_keluhan]);
    assert.deepEqual({ ...baris }, { status: 'BARU', pelanggan_id: user.pelangganId, pesanan_id: pesanan.pesanan_id, restoran_id: pesanan.restoran_id });

    await app.controllers.keluhan.tanggapiKeluhan(k.id_keluhan, 'Terima kasih, sudah kami teruskan ke restoran.');
    const [sesudah] = await q(`SELECT status, tanggapan FROM keluhan WHERE id_keluhan = $1`, [k.id_keluhan]);
    assert.deepEqual({ ...sesudah }, { status: 'DITANGGAPI', tanggapan: 'Terima kasih, sudah kami teruskan ke restoran.' });
    assert.ok(await hitung(`SELECT COUNT(*)::int n FROM notifikasi WHERE id_pengguna = $1 AND judul = 'Keluhanmu sudah ditanggapi admin'`, [user.idPengguna]) >= 1);
    assert.ok((await app.controllers.keluhan.tampilkanKeluhan({ status: 'DITANGGAPI' })).some((x) => x.id_keluhan === k.id_keluhan));
  });
});

// ================================================================ I-07, I-09, I-10 (REST) Klien REST -> Route -> Controller

describe('I-07, I-09, I-10 (REST) Klien REST -> Route -> middleware autentikasi -> Controller', () => {
  test('[INT-TC29] endpoint pesanan: tanpa token 401, token restoran 403, dan tidak ada pesanan yang tersimpan', async () => {
    const sebelum = await hitung(`SELECT COUNT(*)::int n FROM pesanan`);
    const resto = await restoranId(app, 'Batagor Riri Viral');
    const menu = await menuPertama(app, resto);
    const body = { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] };
    assert.equal((await http('POST', '/pesanan', { body })).status, 401);
    const login = await http('POST', '/auth/login', { body: { email: 'batagor@antri.in', password: 'restoran123' } });
    assert.equal(login.status, 200);
    assert.equal((await http('POST', '/pesanan', { body, token: login.body.token })).status, 403);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pesanan`), sebelum);
  });

  test('[INT-TC30] alur REST lengkap: login -> pesan -> tagihan -> bayar di gateway -> verifikasi -> tiket tersimpan', async () => {
    const login = await http('POST', '/auth/login', { body: { email: 'bima@contoh.id', password: 'pelanggan123' } });
    const token = login.body.token as string;
    const resto = await restoranId(app, 'Mie Kocok Pak Haji');
    const menu = await menuPertama(app, resto);

    const pesan = await http('POST', '/pesanan', { token, body: { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: menu.menu_id, jumlah: 1 }] } });
    assert.ok(pesan.status >= 200 && pesan.status < 300, `status ${pesan.status}`);
    const pesananId = pesan.body.pesanan_id as string;
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pesanan WHERE pesanan_id = $1 AND status_pemesanan = 'MENUNGGU_PEMBAYARAN'`, [pesananId]), 1);

    const tagihan = await http('POST', `/pesanan/${pesananId}/pembayaran`, { token, body: { tipePembayaran: 'EWALLET' } });
    assert.ok(tagihan.status >= 200 && tagihan.status < 300, `status ${tagihan.status}`);
    await gw.bayarEwallet((tagihan.body.urlPembayaran as string).split('/').pop()!, true);

    const verif = await http('POST', `/pembayaran/${tagihan.body.id_pembayaran}/verifikasi`, { token });
    assert.equal(verif.body.status, 'LUNAS');
    assert.ok(verif.body.idTiket);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM tiket_antrean WHERE id_tiket = $1 AND pesanan_id = $2`, [verif.body.idTiket, pesananId]), 1);
    assert.equal((await http('GET', `/tiket/${verif.body.idTiket}`, { token })).status, 200);
  });

  test('[INT-TC31] kesalahan bisnis dari controller dipetakan ke status HTTP dan pesan yang benar (409 stok habis, 400 validasi)', async () => {
    const login = await http('POST', '/auth/login', { body: { email: 'dinda@contoh.id', password: 'pelanggan123' } });
    const resto = await restoranId(app, 'Bakso Mang Ujang');
    const habis = await menuPertama(app, resto, { stokNol: true });
    const stokHabis = await http('POST', '/pesanan', { token: login.body.token, body: { restoranId: resto, mode: 'TAKEAWAY', items: [{ menuId: habis.menu_id, jumlah: 1 }] } });
    assert.equal(stokHabis.status, 409);
    assert.match(stokHabis.body.error, /habis/);
    assert.equal(stokHabis.body.menuHabis[0].menuId, habis.menu_id);
    const kosong = await http('POST', '/pesanan', { token: login.body.token, body: { restoranId: resto, mode: 'TAKEAWAY', items: [] } });
    assert.equal(kosong.status, 400);
  });
});

// ================================================================ Lapisan data (seluruh antarmuka) Model -> BasisDataPostgreSQL

describe('Lapisan data (seluruh antarmuka) Model -> BasisDataPostgreSQL (skema, constraint, transaksi)', () => {
  test('[INT-TC32] constraint CHECK basis data menolak stok negatif dan nilai tidak berubah', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Batagor Riri Viral'));
    const stok0 = await stokMenu(menu.menu_id);
    await assert.rejects(q(`UPDATE menu SET stok = -1 WHERE menu_id = $1`, [menu.menu_id]));
    assert.equal(await stokMenu(menu.menu_id), stok0);
  });

  test('[INT-TC33] transaksi db.tx di-rollback penuh bila terjadi kesalahan di tengah proses', async () => {
    const menu = await menuPertama(app, await restoranId(app, 'Batagor Riri Viral'));
    const stok0 = await stokMenu(menu.menu_id);
    await assert.rejects(app.ctx.db.tx(async (tx) => {
      await tx.query(`UPDATE menu SET stok = stok - 1 WHERE menu_id = $1`, [menu.menu_id]);
      throw new Error('gagal di tengah transaksi');
    }), /gagal di tengah transaksi/);
    assert.equal(await stokMenu(menu.menu_id), stok0);
  });

  test('[INT-TC34] relasi ON DELETE CASCADE: menghapus pesanan ikut menghapus detail pesanan dan pembayaran', async () => {
    const a = await pesanDanTagih('yoga@contoh.id', 'Mie Kocok Pak Haji');
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM detail_pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 1);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pembayaran WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 1);
    await q(`DELETE FROM pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM detail_pesanan WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
    assert.equal(await hitung(`SELECT COUNT(*)::int n FROM pembayaran WHERE pesanan_id = $1`, [a.pesanan.pesanan_id]), 0);
  });

  test('[INT-TC35] migrasi skema idempoten: dijalankan ulang tanpa error dan tanpa mengubah data', async () => {
    const tabel = ['pengguna', 'restoran', 'menu', 'pesanan', 'tiket_antrean'];
    const sebelum = await Promise.all(tabel.map((t) => hitung(`SELECT COUNT(*)::int n FROM ${t}`)));
    await migrate(app.ctx.db);
    const sesudah = await Promise.all(tabel.map((t) => hitung(`SELECT COUNT(*)::int n FROM ${t}`)));
    assert.deepEqual(sesudah, sebelum);
  });
});
