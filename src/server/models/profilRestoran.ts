/**
 * Profil restoran yang dapat diubah pengelola (iterasi 2, menu "Profil Restoran" pada I-14-01).
 */
import type { Queryable } from '../db/database.js';

export interface ProfilRestoranInput {
  deskripsi: string;
  alamat: string;
  jamBuka: string;
  noHp: string | null;
  kategori: string;
  lokasi: string;
}

export const ProfilRestoran = {
  async get(q: Queryable, restoranId: string) {
    const rows = await q.query<{
      restoran_id: string; nama_restoran: string; kategori: string; lokasi: string; alamat: string | null;
      deskripsi: string | null; jam_buka: string | null; email_kontak: string; no_hp: string | null;
      foto_path: string | null; rating_rerata: number; jumlah_ulasan: number; warna: string;
    }>(
      `SELECT restoran_id, nama_restoran, kategori, lokasi, alamat, deskripsi, jam_buka, email_kontak, no_hp, foto_path,
              rating_rerata::float AS rating_rerata, jumlah_ulasan, warna
       FROM restoran WHERE restoran_id = $1 AND status_aktif`,
      [restoranId],
    );
    return rows[0] ?? null;
  },

  async ubah(q: Queryable, restoranId: string, d: ProfilRestoranInput): Promise<void> {
    await q.query(
      `UPDATE restoran SET deskripsi = $2, alamat = $3, jam_buka = $4, no_hp = $5, kategori = $6, lokasi = $7
       WHERE restoran_id = $1 AND status_aktif`,
      [restoranId, d.deskripsi, d.alamat, d.jamBuka, d.noHp, d.kategori, d.lokasi],
    );
  },

  /** Mengganti foto restoran; mengembalikan path foto lama (untuk dihapus). */
  async aturFoto(q: Queryable, restoranId: string, path: string): Promise<string | null> {
    const lama = await q.query<{ foto_path: string | null }>(`SELECT foto_path FROM restoran WHERE restoran_id = $1`, [restoranId]);
    await q.query(`UPDATE restoran SET foto_path = $2 WHERE restoran_id = $1`, [restoranId, path]);
    return lama[0]?.foto_path ?? null;
  },

  async getFoto(q: Queryable, restoranId: string): Promise<string | null> {
    const rows = await q.query<{ foto_path: string | null }>(`SELECT foto_path FROM restoran WHERE restoran_id = $1`, [restoranId]);
    return rows[0]?.foto_path ?? null;
  },
};
