/** ModelKeluhan (DPPL 2.3): Keluhan (C30). */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export const KATEGORI_KELUHAN = ['Pesanan tidak sesuai', 'Waktu tunggu', 'Pelayanan', 'Pembayaran', 'Lainnya'] as const;
export type StatusKeluhan = 'BARU' | 'DIBACA' | 'DITANGGAPI';

export interface KeluhanRow {
  id_keluhan: string;
  pelanggan_id: string;
  pesanan_id: string | null;
  restoran_id: string | null;
  kategori: string;
  isi_keluhan: string;
  waktu_kirim: Date;
  status: StatusKeluhan;
  tanggapan: string | null;
}

export const Keluhan = {
  /** simpanKeluhan() (Q-072). */
  async simpanKeluhan(
    q: Queryable,
    data: { pelangganId: string; pesananId: string | null; restoranId: string | null; kategori: string; isi: string },
  ): Promise<KeluhanRow> {
    const rows = await q.query<KeluhanRow>(
      `INSERT INTO keluhan (id_keluhan, pelanggan_id, pesanan_id, restoran_id, kategori, isi_keluhan, waktu_kirim, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'BARU') RETURNING *`,
      [generateId('KLH'), data.pelangganId, data.pesananId, data.restoranId, data.kategori, data.isi],
    );
    return rows[0];
  },

  /** Daftar keluhan untuk admin (Q-079) dengan filter status & nama restoran. */
  async daftar(q: Queryable, status: StatusKeluhan | null, kataKunci: string) {
    return q.query<KeluhanRow & { nama_pelanggan: string; nama_restoran: string | null; keluhan_restoran_7_hari: number }>(
      `SELECT k.*, pl.nama AS nama_pelanggan, r.nama_restoran,
              (SELECT COUNT(*)::int FROM keluhan k2 WHERE k2.restoran_id = k.restoran_id
                 AND k2.waktu_kirim >= NOW() - INTERVAL '7 days') AS keluhan_restoran_7_hari
       FROM keluhan k JOIN pelanggan pl ON pl.pelanggan_id = k.pelanggan_id
       LEFT JOIN restoran r ON r.restoran_id = k.restoran_id
       WHERE ($1::text IS NULL OR k.status = $1)
         AND ($2::text = '' OR COALESCE(r.nama_restoran, '') ILIKE '%' || $2 || '%')
       ORDER BY k.waktu_kirim DESC`,
      [status, kataKunci],
    );
  },

  async daftarMilikPelanggan(q: Queryable, pelangganId: string) {
    return q.query<KeluhanRow & { nama_restoran: string | null }>(
      `SELECT k.*, r.nama_restoran FROM keluhan k LEFT JOIN restoran r ON r.restoran_id = k.restoran_id
       WHERE k.pelanggan_id = $1 ORDER BY k.waktu_kirim DESC`,
      [pelangganId],
    );
  },

  async getById(q: Queryable, id: string) {
    const rows = await q.query<KeluhanRow & { nama_pelanggan: string; nama_restoran: string | null }>(
      `SELECT k.*, pl.nama AS nama_pelanggan, r.nama_restoran FROM keluhan k
       JOIN pelanggan pl ON pl.pelanggan_id = k.pelanggan_id LEFT JOIN restoran r ON r.restoran_id = k.restoran_id
       WHERE k.id_keluhan = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  /** updateStatusKeluhan() (Q-073). Keluhan yang sudah ditanggapi tidak turun status. */
  async updateStatusKeluhan(q: Queryable, id: string, status: StatusKeluhan): Promise<void> {
    await q.query(`UPDATE keluhan SET status = $2 WHERE id_keluhan = $1 AND status <> 'DITANGGAPI'`, [id, status]);
  },

  /** Menyimpan tanggapan admin (Q-080). */
  async tanggapi(q: Queryable, id: string, tanggapan: string): Promise<KeluhanRow | null> {
    const rows = await q.query<KeluhanRow>(
      `UPDATE keluhan SET tanggapan = $2, status = 'DITANGGAPI' WHERE id_keluhan = $1 RETURNING *`,
      [id, tanggapan],
    );
    return rows[0] ?? null;
  },
};
