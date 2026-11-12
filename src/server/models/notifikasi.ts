/**
 * Notifikasi dalam aplikasi (iterasi 2). Melengkapi NotifikasiEmail (C15): pemberitahuan giliran antrean,
 * pesanan baru, hasil verifikasi mitra, tanggapan keluhan, dan ajakan memberi ulasan.
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export interface NotifikasiRow {
  id_notifikasi: string;
  id_pengguna: string;
  judul: string;
  isi: string;
  tautan: string | null;
  dibaca: boolean;
  waktu: Date;
}

export interface IsiNotifikasi {
  judul: string;
  isi?: string;
  tautan?: string | null;
}

export const Notifikasi = {
  /** Mengirim notifikasi ke satu akun. */
  async kirim(q: Queryable, idPengguna: string | null | undefined, n: IsiNotifikasi): Promise<void> {
    if (!idPengguna) return;
    await q.query(
      `INSERT INTO notifikasi (id_notifikasi, id_pengguna, judul, isi, tautan) VALUES ($1, $2, $3, $4, $5)`,
      [generateId('NTF'), idPengguna, n.judul, n.isi ?? '', n.tautan ?? null],
    );
  },

  /** Mengirim notifikasi ke akun pemilik pelanggan. */
  async kePelanggan(q: Queryable, pelangganId: string, n: IsiNotifikasi): Promise<void> {
    const rows = await q.query<{ id_akun: string }>(`SELECT id_akun FROM pelanggan WHERE pelanggan_id = $1`, [pelangganId]);
    await Notifikasi.kirim(q, rows[0]?.id_akun, n);
  },

  /** Mengirim notifikasi ke akun pengelola restoran. */
  async keRestoran(q: Queryable, restoranId: string, n: IsiNotifikasi): Promise<void> {
    const rows = await q.query<{ id_akun: string | null }>(`SELECT id_akun FROM restoran WHERE restoran_id = $1`, [restoranId]);
    await Notifikasi.kirim(q, rows[0]?.id_akun, n);
  },

  async daftar(q: Queryable, idPengguna: string, limit = 30): Promise<NotifikasiRow[]> {
    return q.query<NotifikasiRow>(
      `SELECT * FROM notifikasi WHERE id_pengguna = $1 ORDER BY waktu DESC LIMIT $2`,
      [idPengguna, limit],
    );
  },

  async jumlahBelumDibaca(q: Queryable, idPengguna: string): Promise<number> {
    const rows = await q.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM notifikasi WHERE id_pengguna = $1 AND NOT dibaca`,
      [idPengguna],
    );
    return rows[0].n;
  },

  /** Menandai satu (atau semua bila id kosong) notifikasi sebagai dibaca. */
  async tandaiDibaca(q: Queryable, idPengguna: string, idNotifikasi?: string): Promise<void> {
    await q.query(
      `UPDATE notifikasi SET dibaca = true WHERE id_pengguna = $1 AND ($2::text IS NULL OR id_notifikasi = $2)`,
      [idPengguna, idNotifikasi ?? null],
    );
  },
};
