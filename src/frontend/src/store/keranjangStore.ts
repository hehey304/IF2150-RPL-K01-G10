// C05 Keranjang (klien). PERHATIAN: file ini menimpa keranjangStore.ts lama; gabungkan jika sudah ada isinya.
import { create } from 'zustand';
import type { ItemKeranjang, MenuItem, ModePemesanan } from '../api/pesanan';

interface KeranjangState {
  idKeranjang: string;
  restoranId: string | null;
  daftarMenu: ItemKeranjang[];
  totalEstimasiHarga: number;
  // pilihan layanan (I-07/I-08)
  modePemesanan: ModePemesanan;
  jumlahRombongan: number;
  tanggalBooking: string | null;
  slotWaktuBooking: string | null;

  tambahItem: (restoranId: string, menu: MenuItem, jumlah: number) => void; // Algo-035 (Pelanggan.pilihMenu memanggil ini)
  hapusItem: (menuId: string) => void;                                      // Algo-036
  ubahJumlah: (menuId: string, delta: number) => void;                      // stepper I-07-04
  hitungTotal: () => number;                                                // Algo-037
  kosongkanKeranjang: () => void;                                           // Algo-038
  setMode: (m: ModePemesanan) => void;
  setRombongan: (n: number) => void;
  setJadwal: (tanggal: string | null, slot: string | null) => void;
}

const total = (d: ItemKeranjang[]) => d.reduce((s, i) => s + i.menu.harga * i.jumlah, 0);

export const useKeranjangStore = create<KeranjangState>((set, get) => ({
  idKeranjang: crypto.randomUUID(),
  restoranId: null,
  daftarMenu: [],
  totalEstimasiHarga: 0,
  modePemesanan: 'DINE_IN',
  jumlahRombongan: 1,
  tanggalBooking: null,
  slotWaktuBooking: null,

  tambahItem: (restoranId, menu, jumlah) => set(s => {
    // keranjang hanya untuk satu restoran; ganti restoran = keranjang baru
    const base = s.restoranId && s.restoranId !== restoranId ? [] : s.daftarMenu;
    const ada = base.find(i => i.menu.menuId === menu.menuId);
    const daftar = ada
      ? base.map(i => i.menu.menuId === menu.menuId ? { ...i, jumlah: i.jumlah + jumlah } : i)
      : [...base, { menu, jumlah }];
    return { restoranId, daftarMenu: daftar, totalEstimasiHarga: total(daftar) };
  }),
  hapusItem: menuId => set(s => {
    const daftar = s.daftarMenu.filter(i => i.menu.menuId !== menuId);
    return { daftarMenu: daftar, totalEstimasiHarga: total(daftar) };
  }),
  ubahJumlah: (menuId, delta) => set(s => {
    const daftar = s.daftarMenu
      .map(i => i.menu.menuId === menuId ? { ...i, jumlah: i.jumlah + delta } : i)
      .filter(i => i.jumlah > 0);
    return { daftarMenu: daftar, totalEstimasiHarga: total(daftar) };
  }),
  hitungTotal: () => total(get().daftarMenu),
  kosongkanKeranjang: () => set({
    daftarMenu: [], totalEstimasiHarga: 0, restoranId: null, modePemesanan: 'DINE_IN',
    jumlahRombongan: 1, tanggalBooking: null, slotWaktuBooking: null,
  }),
  setMode: modePemesanan => set(modePemesanan === 'BOOKING' ? { modePemesanan } : { modePemesanan, tanggalBooking: null, slotWaktuBooking: null }),
  setRombongan: n => set({ jumlahRombongan: Math.max(1, n) }),
  setJadwal: (tanggalBooking, slotWaktuBooking) => set({ tanggalBooking, slotWaktuBooking }),
}));
