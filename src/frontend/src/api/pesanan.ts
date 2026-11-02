import { api } from './client';
 
export type ModePemesanan = 'DINE_IN' | 'TAKEAWAY' | 'PRE_ORDER' | 'BOOKING';
export interface MenuItem { menuId: string; namaMenu: string; harga: number; }
export interface ItemKeranjang { menu: MenuItem; jumlah: number; }
export interface Tagihan { pesananId: string; idPembayaran: string; kodeBayar: string; totalHarga: number; batasWaktuBayar: string; }
export interface Tiket { idTiket: string; nomorUrut: number; tipeAntrean: string; waktuTerbit: string; statusAntrean: string; estimasiWaktuTunggu: number; }
 
export const pilihMetodeBayar = (body: {
  restoranId: string; modePemesanan: ModePemesanan; jumlahRombongan?: number;
  tanggalBooking?: string; slotWaktuBooking?: string;
  items: { menuId: string; jumlah: number }[]; tipePembayaran: string;
}) => api<Tagihan>('/pesanan/tagihan', { method: 'POST', body: JSON.stringify(body) });
 
export const konfirmasiPembayaran = (idPembayaran: string) =>
  api<{ sukses: boolean; pesananId: string; tiket: Tiket | null }>(
    `/pembayaran/${idPembayaran}/konfirmasi`, { method: 'POST', body: '{}' });
 
export const getDetailPesanan = (pesananId: string) => api<any>(`/pesanan/${pesananId}`);
 
export const getSlotBooking = (restoranId: string, tanggal: string) =>
  api<{ slot: string; tersedia: boolean }[]>(
    `/booking/slot?restoranId=${encodeURIComponent(restoranId)}&tanggal=${encodeURIComponent(tanggal)}`);
 
export interface MenuRestoran { menuId: string; namaMenu: string; deskripsiMenu: string | null; harga: number; stok: number; }
export const getMenuRestoran = (restoranId: string) =>
  api<{ restoranId: string; namaRestoran: string; menu: MenuRestoran[] }>(`/restoran/${restoranId}/menu`);
 