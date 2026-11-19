/**
 * Pengujian unit Keranjang.
 *
 * Kelas yang berhubungan (ID kelas sesuai DPPL):
 *   - C05 Keranjang
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keranjang, type Penyimpanan } from '../client/models/keranjang.js';

function memori(): Penyimpanan & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}
const resto = { restoranId: 'R1', namaRestoran: 'Bakso' };

test('[C05-UT01, C05-UT02] tambahItem dan hitungTotal', () => {
  const k = new Keranjang(memori());
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 });
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 });
  k.tambahItem(resto, { menuId: 'M2', namaMenu: 'Es Teh', harga: 6000 }, 3);
  assert.equal(k.jumlahItem('M1'), 2);
  assert.equal(k.totalItem, 5);
  assert.equal(k.hitungTotal(), 2 * 25000 + 3 * 6000);
});

test('[C05-UT05] menambah dari restoran lain mengosongkan keranjang', () => {
  const k = new Keranjang(memori());
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 });
  assert.equal(k.bedaRestoran('R2'), true);
  k.tambahItem({ restoranId: 'R2', namaRestoran: 'Seblak' }, { menuId: 'S1', namaMenu: 'Seblak', harga: 15000 });
  assert.deepEqual(k.data.items.map((i) => i.menuId), ['S1']);
  assert.equal(k.data.restoranId, 'R2');
});

test('[C05-UT06] ubahJumlah ke 0 menghapus item; keranjang kosong melepas restoran', () => {
  const k = new Keranjang(memori());
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 });
  k.ubahJumlah('M1', 0);
  assert.equal(k.data.items.length, 0);
  assert.equal(k.data.restoranId, null);
});

test('[C05-UT03, C05-UT04] jumlah per item dibatasi 50 dan jumlah tidak valid ditolak', () => {
  const k = new Keranjang(memori());
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 1000 }, 70);
  assert.equal(k.jumlahItem('M1'), 50);
  assert.throws(() => k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 1000 }, 0));
});

test('[C05-UT07] keranjang tersimpan dan dimuat ulang dari penyimpanan', () => {
  const store = memori();
  const a = new Keranjang(store);
  a.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 }, 2);
  a.aturJadwal('2026-11-02', '12:00', 4);
  const b = new Keranjang(store);
  assert.equal(b.jumlahItem('M1'), 2);
  assert.equal(b.data.mode, 'BOOKING');
  assert.equal(b.keRequest().jumlahRombongan, 4);
});

test('[C05-UT08] aturMode non-booking menghapus jadwal; data rusak di penyimpanan diabaikan', () => {
  const k = new Keranjang(memori());
  k.aturJadwal('2026-11-02', '12:00', 2);
  k.aturMode('TAKEAWAY');
  assert.equal(k.data.tanggalBooking, null);
  const store = memori();
  store.setItem('antriin.keranjang', '{rusak');
  assert.equal(new Keranjang(store).data.items.length, 0);
});

test('C05-UT09 kosongkanKeranjang menghapus item dan restoran, juga pada penyimpanan', () => {
  const store = memori();
  const k = new Keranjang(store);
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 }, 2);
  k.kosongkanKeranjang();
  assert.equal(k.data.items.length, 0);
  assert.equal(k.data.restoranId, null);
  assert.equal(new Keranjang(store).data.items.length, 0);
});

test('C05-UT10 hitungTotal pada keranjang kosong = 0', () => {
  assert.equal(new Keranjang(memori()).hitungTotal(), 0);
});

test('C05-UT11 hapusItem menghapus satu item dan menyisakan lainnya; ID tidak ada diabaikan', () => {
  const k = new Keranjang(memori());
  k.tambahItem(resto, { menuId: 'M1', namaMenu: 'Bakso', harga: 25000 });
  k.tambahItem(resto, { menuId: 'M2', namaMenu: 'Es Teh', harga: 6000 }, 2);
  k.hapusItem('M1');
  k.hapusItem('M-tidak-ada');
  assert.deepEqual(k.data.items.map((i) => i.menuId), ['M2']);
  assert.equal(k.hitungTotal(), 12000);
});
