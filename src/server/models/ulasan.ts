/**
 * Ulasan & rating restoran (iterasi 2). Melengkapi KF01 (filter rating): rating restoran dihitung ulang
 * dari ulasan pelanggan yang pesanannya sudah selesai.
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export interface UlasanRow {
  id_ulasan: string;
  pesanan_id: string;
  pelanggan_id: string;
  restoran_id: string;
  rating: number;
  komentar: string;
  waktu: Date;
}

/** Rata-rata baru setelah menambahkan satu rating, dibulatkan 1 desimal. */
export function hitungRatingBaru(rerata: number, jumlah: number, ratingBaru: number): number {
  const total = rerata * jumlah + ratingBaru;
  return Math.round((total / (jumlah + 1)) * 10) / 10;
}

export const Ulasan = {
  async getByPesanan(q: Queryable, pesananId: string): Promise<UlasanRow | null> {
    const rows = await q.query<UlasanRow>(`SELECT * FROM ulasan WHERE pesanan_id = $1`, [pesananId]);
    return rows[0] ?? null;
  },

  /** Menyimpan ulasan dan memperbarui rating rata-rata restoran. */
  async simpan(
    q: Queryable,
    d: { pesananId: string; pelangganId: string; restoranId: string; rating: number; komentar: string },
  ): Promise<UlasanRow> {
    const rows = await q.query<UlasanRow>(
      `INSERT INTO ulasan (id_ulasan, pesanan_id, pelanggan_id, restoran_id, rating, komentar)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [generateId('ULS'), d.pesananId, d.pelangganId, d.restoranId, d.rating, d.komentar],
    );
    const r = await q.query<{ rating_rerata: number; jumlah_ulasan: number }>(
      `SELECT rating_rerata::float AS rating_rerata, jumlah_ulasan FROM restoran WHERE restoran_id = $1`,
      [d.restoranId],
    );
    if (r[0]) {
      await q.query(`UPDATE restoran SET rating_rerata = $2, jumlah_ulasan = jumlah_ulasan + 1 WHERE restoran_id = $1`, [
        d.restoranId,
        hitungRatingBaru(r[0].rating_rerata, r[0].jumlah_ulasan, d.rating),
      ]);
    }
    return rows[0];
  },

  /** Ulasan terbaru suatu restoran (ditampilkan di I-06). */
  async terbaru(q: Queryable, restoranId: string, limit = 5) {
    return q.query<UlasanRow & { nama_pelanggan: string }>(
      `SELECT u.*, pl.nama AS nama_pelanggan FROM ulasan u JOIN pelanggan pl ON pl.pelanggan_id = u.pelanggan_id
       WHERE u.restoran_id = $1 ORDER BY u.waktu DESC LIMIT $2`,
      [restoranId, limit],
    );
  },
};
