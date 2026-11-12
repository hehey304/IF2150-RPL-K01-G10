/**
 * Bagian ModelPesanan (DPPL 2.3): tabel pembayaran (milik MetodePembayaranController C07)
 * dan RiwayatTransaksi (C08).
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export type TipePembayaran = 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'KARTU';
export type StatusPembayaran = 'MENUNGGU' | 'LUNAS' | 'GAGAL' | 'KEDALUWARSA';

export interface PembayaranRow {
  id_pembayaran: string;
  pesanan_id: string;
  tipe_pembayaran: TipePembayaran;
  jumlah: number;
  kode_bayar: string;
  batas_waktu_bayar: Date;
  status_pembayaran: StatusPembayaran;
}

export const Pembayaran = {
  /** Membuat tagihan (Q-032). */
  async buat(
    q: Queryable,
    data: { id?: string; pesananId: string; tipe: TipePembayaran; jumlah: number; kodeBayar: string; menit: number },
  ): Promise<PembayaranRow> {
    const rows = await q.query<PembayaranRow>(
      `INSERT INTO pembayaran (id_pembayaran, pesanan_id, tipe_pembayaran, jumlah, kode_bayar, batas_waktu_bayar,
                               status_pembayaran)
       VALUES ($1, $2, $3, $4, $5, NOW() + make_interval(mins => $6::int), 'MENUNGGU') RETURNING *`,
      [data.id ?? generateId('PAY'), data.pesananId, data.tipe, data.jumlah, data.kodeBayar, data.menit],
    );
    return rows[0];
  },

  async getById(q: Queryable, id: string): Promise<PembayaranRow | null> {
    const rows = await q.query<PembayaranRow>(`SELECT * FROM pembayaran WHERE id_pembayaran = $1`, [id]);
    return rows[0] ?? null;
  },

  /** Menandai lunas secara atomik; hanya berhasil bila masih MENUNGGU dan belum lewat batas waktu (Q-033). */
  async tandaiLunas(q: Queryable, id: string): Promise<PembayaranRow | null> {
    const rows = await q.query<PembayaranRow>(
      `UPDATE pembayaran SET status_pembayaran = 'LUNAS'
       WHERE id_pembayaran = $1 AND status_pembayaran = 'MENUNGGU' AND batas_waktu_bayar >= NOW() RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  async tandaiGagal(q: Queryable, id: string): Promise<PembayaranRow | null> {
    const rows = await q.query<PembayaranRow>(
      `UPDATE pembayaran SET status_pembayaran = 'GAGAL' WHERE id_pembayaran = $1 AND status_pembayaran = 'MENUNGGU'
       RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  /** Membatalkan tagihan lama yang masih menunggu untuk pesanan yang sama. */
  async gagalkanTagihanLama(q: Queryable, pesananId: string): Promise<void> {
    await q.query(
      `UPDATE pembayaran SET status_pembayaran = 'GAGAL' WHERE pesanan_id = $1 AND status_pembayaran = 'MENUNGGU'`,
      [pesananId],
    );
  },

  /** cekTimeout(): tagihan yang lewat batas waktu menjadi KEDALUWARSA (Q-034). */
  async kedaluwarsakan(q: Queryable): Promise<string[]> {
    const rows = await q.query<{ pesanan_id: string }>(
      `UPDATE pembayaran SET status_pembayaran = 'KEDALUWARSA'
       WHERE status_pembayaran = 'MENUNGGU' AND batas_waktu_bayar < NOW() RETURNING pesanan_id`,
    );
    return rows.map((r) => r.pesanan_id);
  },
};

export const RiwayatTransaksi = {
  /** catatLogTransaksi() (Q-035). */
  async catatLogTransaksi(q: Queryable, idPembayaran: string, jumlah: number): Promise<string> {
    const id = generateId('TRX');
    await q.query(
      `INSERT INTO riwayat_transaksi (id_transaksi, id_pembayaran, tanggal_transaksi, jumlah_dibayar, status_pelunasan)
       VALUES ($1, $2, NOW(), $3, 'LUNAS')`,
      [id, idPembayaran, jumlah],
    );
    return id;
  },

  /** getBuktiPembayaran() (Q-036). */
  async getBuktiPembayaran(q: Queryable, pesananId: string) {
    const rows = await q.query<{
      id_transaksi: string;
      tanggal_transaksi: Date;
      jumlah_dibayar: number;
      status_pelunasan: string;
      tipe_pembayaran: TipePembayaran;
    }>(
      `SELECT r.id_transaksi, r.tanggal_transaksi, r.jumlah_dibayar, r.status_pelunasan, p.tipe_pembayaran
       FROM riwayat_transaksi r JOIN pembayaran p ON p.id_pembayaran = r.id_pembayaran WHERE p.pesanan_id = $1`,
      [pesananId],
    );
    return rows[0] ?? null;
  },
};
