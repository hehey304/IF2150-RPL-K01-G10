/**
 * Bagian ModelRestoran (DPPL 2.3): Kuota (C20) - pengaturan kuota antrean dan kapasitas meja.
 */
import type { Queryable } from '../db/database.js';

export interface KuotaRow {
  restoran_id: string;
  kuota_maksimum: number;
  kapasitas_meja: number;
  antrean_ditutup: boolean;
}

export const Kuota = {
  /** getPengaturan() (Q-006 / Q-056). */
  async get(q: Queryable, restoranId: string): Promise<KuotaRow | null> {
    const rows = await q.query<KuotaRow>(`SELECT * FROM pengaturan_kuota WHERE restoran_id = $1`, [restoranId]);
    return rows[0] ?? null;
  },

  /** updateKapasitas() (Q-057). */
  async updateKapasitas(q: Queryable, restoranId: string, kuota: number, meja: number, ditutup = false): Promise<KuotaRow> {
    const rows = await q.query<KuotaRow>(
      `UPDATE pengaturan_kuota SET kuota_maksimum = $2, kapasitas_meja = $3, antrean_ditutup = $4
       WHERE restoran_id = $1 RETURNING *`,
      [restoranId, kuota, meja, ditutup],
    );
    return rows[0];
  },

  /**
   * isAntreanTutup(): antrean ditutup sementara (toggle) atau kuota 0.
   * Sejak iterasi 2, toggle disimpan terpisah sehingga nilai kuota tidak hilang saat antrean dibuka kembali.
   */
  isAntreanTutup(k: Pick<KuotaRow, 'kuota_maksimum' | 'antrean_ditutup'>): boolean {
    return k.antrean_ditutup || k.kuota_maksimum === 0;
  },
};
