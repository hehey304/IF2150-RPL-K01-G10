/**
 * ModelPesanan (DPPL 2.3): Pesanan (C06). Pembayaran & RiwayatTransaksi (C07, C08) ada di pembayaran.ts.
 * Keranjang (C05) dikelola di sisi klien, lihat client/models/keranjang.ts.
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';
import type { PembayaranRow } from './pembayaran.js';

export type ModePemesanan = 'DINE_IN' | 'TAKEAWAY' | 'BOOKING';
export type StatusPesanan = 'MENUNGGU_PEMBAYARAN' | 'DIKONFIRMASI' | 'SELESAI' | 'DIBATALKAN';

export const SLOT_BOOKING = ['11:00', '12:00', '13:00', '17:00', '18:00', '19:00', '20:00'] as const;

export interface PesananRow {
  pesanan_id: string;
  pelanggan_id: string;
  restoran_id: string;
  mode_pemesanan: ModePemesanan;
  jumlah_rombongan: number;
  tanggal_booking: string | null;
  slot_waktu_booking: string | null;
  subtotal: number;
  biaya_layanan: number;
  total_harga: number;
  status_pemesanan: StatusPesanan;
  dibuat_pada: Date;
}

export interface ItemPesanan {
  menu_id: string;
  nama_menu: string;
  harga: number;
  jumlah: number;
  subtotal: number;
}

/** Tanggal lokal server dalam format YYYY-MM-DD. */
export function tanggalLokal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Aturan validasi jadwal booking (KF09, UC02 Skenario Alternatif 5):
 * tanggal antara hari ini s.d. hari ini + maxHari, slot terdaftar, dan slot hari ini belum lewat.
 * Mengembalikan pesan kesalahan atau null bila valid.
 */
export function validasiJadwalBooking(
  tanggal: string,
  slot: string,
  rombongan: number,
  sekarang: Date,
  maxHari: number,
): string | null {
  if (!Number.isInteger(rombongan) || rombongan <= 0) return 'Jumlah kursi/rombongan minimal 1 orang';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(Date.parse(tanggal))) return 'Tanggal booking tidak valid';
  if (!(SLOT_BOOKING as readonly string[]).includes(slot)) return 'Slot jam kedatangan tidak tersedia';
  const hariIni = tanggalLokal(sekarang);
  const batas = new Date(sekarang);
  batas.setDate(batas.getDate() + maxHari);
  if (tanggal < hariIni || tanggal > tanggalLokal(batas)) {
    return `Reservasi hanya dapat dilakukan maksimal ${maxHari} hari sebelum kedatangan`;
  }
  if (tanggal === hariIni) {
    const [jam, menit] = slot.split(':').map(Number);
    if (jam * 60 + menit <= sekarang.getHours() * 60 + sekarang.getMinutes()) return 'Slot jam tersebut sudah lewat';
  }
  return null;
}

export const Pesanan = {
  /** validasiBooking(): jumlah booking aktif pada slot yang sama (Q-026). */
  async hitungBookingSlot(q: Queryable, restoranId: string, tanggal: string, slot: string): Promise<number> {
    const rows = await q.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM pesanan WHERE restoran_id = $1 AND mode_pemesanan = 'BOOKING'
         AND tanggal_booking = $2 AND slot_waktu_booking = $3 AND status_pemesanan <> 'DIBATALKAN'`,
      [restoranId, tanggal, slot],
    );
    return rows[0].n;
  },

  /** buatTagihan() bagian penyimpanan pesanan + detail (Q-027, Q-028). */
  async simpan(
    q: Queryable,
    data: {
      pelangganId: string;
      restoranId: string;
      mode: ModePemesanan;
      rombongan: number;
      tanggal: string | null;
      slot: string | null;
      items: ItemPesanan[];
      biayaLayanan: number;
    },
  ): Promise<string> {
    const id = generateId('PSN');
    const subtotal = data.items.reduce((s, i) => s + i.subtotal, 0);
    await q.query(
      `INSERT INTO pesanan (pesanan_id, pelanggan_id, restoran_id, mode_pemesanan, jumlah_rombongan, tanggal_booking,
                            slot_waktu_booking, subtotal, biaya_layanan, total_harga, status_pemesanan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'MENUNGGU_PEMBAYARAN')`,
      [
        id,
        data.pelangganId,
        data.restoranId,
        data.mode,
        data.rombongan,
        data.tanggal,
        data.slot,
        subtotal,
        data.biayaLayanan,
        subtotal + data.biayaLayanan,
      ],
    );
    for (const item of data.items) {
      await q.query(`INSERT INTO detail_pesanan (pesanan_id, menu_id, jumlah, subtotal) VALUES ($1, $2, $3, $4)`, [
        id,
        item.menu_id,
        item.jumlah,
        item.subtotal,
      ]);
    }
    return id;
  },

  async getById(q: Queryable, pesananId: string): Promise<PesananRow | null> {
    const rows = await q.query<PesananRow>(
      `SELECT *, to_char(tanggal_booking, 'YYYY-MM-DD') AS tanggal_booking FROM pesanan WHERE pesanan_id = $1`,
      [pesananId],
    );
    return rows[0] ?? null;
  },

  async getItems(q: Queryable, pesananId: string): Promise<ItemPesanan[]> {
    return q.query<ItemPesanan>(
      `SELECT d.menu_id, m.nama_menu, m.harga, d.jumlah, d.subtotal
       FROM detail_pesanan d JOIN menu m ON m.menu_id = d.menu_id WHERE d.pesanan_id = $1 ORDER BY m.nama_menu`,
      [pesananId],
    );
  },

  /** getDetailPesanan() (Q-031) lengkap dengan restoran, tiket, dan pembayaran terakhir. */
  async getDetailPesanan(q: Queryable, pesananId: string) {
    const pesanan = await Pesanan.getById(q, pesananId);
    if (!pesanan) return null;
    const [items, restoran, pembayaran, tiket] = await Promise.all([
      Pesanan.getItems(q, pesananId),
      q.query<{ nama_restoran: string; lokasi: string }>(
        `SELECT nama_restoran, lokasi FROM restoran WHERE restoran_id = $1`,
        [pesanan.restoran_id],
      ),
      q.query<PembayaranRow>(
        `SELECT * FROM pembayaran WHERE pesanan_id = $1 ORDER BY dibuat_pada DESC LIMIT 1`,
        [pesananId],
      ),
      q.query<{ id_tiket: string; nomor_urut: number; status_antrean: string }>(
        `SELECT id_tiket, nomor_urut, status_antrean FROM tiket_antrean WHERE pesanan_id = $1`,
        [pesananId],
      ),
    ]);
    return {
      ...pesanan,
      nama_restoran: restoran[0]?.nama_restoran ?? '-',
      lokasi: restoran[0]?.lokasi ?? '-',
      items,
      pembayaran: pembayaran[0] ?? null,
      tiket: tiket[0] ?? null,
    };
  },

  /** batalkanPesanan() (Q-029). */
  async batalkanPesanan(q: Queryable, pesananId: string): Promise<boolean> {
    const rows = await q.query(
      `UPDATE pesanan SET status_pemesanan = 'DIBATALKAN' WHERE pesanan_id = $1
         AND status_pemesanan = 'MENUNGGU_PEMBAYARAN' RETURNING pesanan_id`,
      [pesananId],
    );
    return rows.length > 0;
  },

  /** updateStatus() (Q-030). */
  async updateStatus(q: Queryable, pesananId: string, status: StatusPesanan): Promise<void> {
    await q.query(`UPDATE pesanan SET status_pemesanan = $2 WHERE pesanan_id = $1`, [pesananId, status]);
  },

  /** Riwayat pesanan seorang pelanggan (untuk profil & formulir keluhan). */
  async daftarMilikPelanggan(q: Queryable, pelangganId: string) {
    return q.query<
      PesananRow & { nama_restoran: string; id_tiket: string | null; nomor_urut: number | null; status_tiket: string | null }
    >(
      `SELECT p.*, to_char(p.tanggal_booking, 'YYYY-MM-DD') AS tanggal_booking, r.nama_restoran,
              t.id_tiket, t.nomor_urut, t.status_antrean AS status_tiket
       FROM pesanan p JOIN restoran r ON r.restoran_id = p.restoran_id
       LEFT JOIN tiket_antrean t ON t.pesanan_id = p.pesanan_id
       WHERE p.pelanggan_id = $1 ORDER BY p.dibuat_pada DESC LIMIT 50`,
      [pelangganId],
    );
  },

  /** Booking mendatang suatu restoran (tiket TERJADWAL). */
  async daftarBookingRestoran(q: Queryable, restoranId: string) {
    return q.query<{
      pesanan_id: string;
      id_tiket: string;
      nomor_urut: number;
      tanggal_booking: string;
      slot_waktu_booking: string;
      jumlah_rombongan: number;
      nama_pelanggan: string;
      rincian: string;
    }>(
      `SELECT p.pesanan_id, t.id_tiket, t.nomor_urut, to_char(p.tanggal_booking, 'YYYY-MM-DD') AS tanggal_booking,
              p.slot_waktu_booking, p.jumlah_rombongan, pl.nama AS nama_pelanggan,
              COALESCE((SELECT string_agg(m.nama_menu || ' x' || d.jumlah, ', ' ORDER BY m.nama_menu)
                        FROM detail_pesanan d JOIN menu m ON m.menu_id = d.menu_id
                        WHERE d.pesanan_id = p.pesanan_id), '') AS rincian
       FROM pesanan p JOIN tiket_antrean t ON t.pesanan_id = p.pesanan_id
       JOIN pelanggan pl ON pl.pelanggan_id = p.pelanggan_id
       WHERE p.restoran_id = $1 AND t.status_antrean = 'TERJADWAL' AND p.tanggal_booking >= CURRENT_DATE
       ORDER BY p.tanggal_booking, p.slot_waktu_booking`,
      [restoranId],
    );
  },
};
