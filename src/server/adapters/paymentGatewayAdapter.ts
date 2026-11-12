/**
 * PaymentGatewayAdapter (DPPL 2.3, Integrasi Eksternal).
 *
 * Kontrak antara antri.in dan penyedia payment gateway. MetodePembayaranController hanya bergantung pada
 * antarmuka ini, sehingga penyedia (sandbox bawaan atau penyedia sungguhan) dapat diganti tanpa mengubah
 * controller. Alur mengikuti pola umum payment gateway:
 *   1. buatTransaksi()  -> penyedia mengembalikan kode bayar + URL halaman checkout.
 *   2. Pelanggan membayar di halaman checkout penyedia.
 *   3. Penyedia mengirim notifikasi status bertanda tangan HMAC (webhook) -> antri.in memverifikasi.
 *   4. antri.in juga dapat menanyakan status (cekStatus) sebagai cadangan bila notifikasi terlambat.
 */
import crypto from 'node:crypto';
import type { TipePembayaran } from '../models/pembayaran.js';

export type StatusGateway = 'MENUNGGU' | 'LUNAS' | 'GAGAL' | 'KEDALUWARSA' | 'DIKEMBALIKAN';

export interface TransaksiGateway {
  kodeBayar: string;
  instruksi: string;
  /** URL halaman checkout milik penyedia. */
  urlPembayaran: string;
}

export interface NotifikasiGateway {
  /** ID pembayaran di antri.in (order id). */
  orderId: string;
  kodeBayar: string;
  status: StatusGateway;
  jumlah: number;
  waktu: string;
}

export type PenerimaNotifikasi = (n: NotifikasiGateway, tandaTangan: string) => Promise<unknown>;

export interface PaymentGatewayAdapter {
  readonly nama: string;
  /** true bila penyedia adalah sandbox (tidak ada uang sungguhan). */
  readonly sandbox: boolean;
  buatTransaksi(data: { orderId: string; jumlah: number; tipe: TipePembayaran; kedaluwarsa: Date }): Promise<TransaksiGateway>;
  cekStatus(kodeBayar: string): Promise<StatusGateway>;
  /** Membatalkan transaksi yang belum dibayar (pelanggan membatalkan / mengganti metode). */
  batalkan(kodeBayar: string): Promise<void>;
  /** Mengembalikan dana transaksi yang sudah lunas (mis. stok habis saat pembayaran diproses). */
  kembalikanDana(kodeBayar: string): Promise<void>;
  /** Mendaftarkan penerima notifikasi status (webhook). */
  onNotifikasi(penerima: PenerimaNotifikasi): void;
}

const isiTandaTangan = (n: NotifikasiGateway) => `${n.orderId}|${n.kodeBayar}|${n.status}|${n.jumlah}|${n.waktu}`;

/** Tanda tangan HMAC-SHA256 untuk notifikasi gateway. */
export function tandaTanganNotifikasi(n: NotifikasiGateway, kunci: string): string {
  return crypto.createHmac('sha256', kunci).update(isiTandaTangan(n)).digest('hex');
}

/** Memverifikasi tanda tangan notifikasi (perbandingan waktu-konstan). */
export function verifikasiTandaTangan(n: NotifikasiGateway, tandaTangan: string, kunci: string): boolean {
  const harus = Buffer.from(tandaTanganNotifikasi(n, kunci), 'hex');
  const diberi = Buffer.from(String(tandaTangan ?? ''), 'hex');
  return harus.length === diberi.length && crypto.timingSafeEqual(harus, diberi);
}
