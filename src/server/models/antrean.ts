/**
 * ModelAntrean (DPPL 2.3): Antrean (C04) dan TiketAntrean (C09).
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export type StatusAntrean = 'BUKA' | 'PENUH' | 'TUTUP';
export type StatusTiket = 'TERJADWAL' | 'MENUNGGU' | 'DIPANGGIL' | 'SELESAI' | 'DILEWATI' | 'DIBATALKAN';
export type TipeAntrean = 'DINE_IN' | 'TAKEAWAY' | 'BOOKING';

export interface AntreanRow {
  antrean_id: string;
  restoran_id: string;
  nomor_dilayani: number;
  total_antrean: number;
  estimasi_waktu_tunggu: number;
  status_antrean: StatusAntrean;
}

export interface TiketRow {
  id_tiket: string;
  antrean_id: string;
  pelanggan_id: string;
  pesanan_id: string;
  nomor_urut: number;
  tipe_antrean: TipeAntrean;
  waktu_terbit: Date;
  waktu_dipanggil: Date | null;
  status_antrean: StatusTiket;
  estimasi_waktu_tunggu: number;
}

/** Urutan antrean: tiket yang terbit lebih dulu dilayani lebih dulu. */
const URUTAN = 'ORDER BY t.waktu_terbit ASC, t.nomor_urut ASC';

/**
 * Menentukan status antrean dari pengaturan kuota (aturan bisnis UC07).
 * kuota 0 -> TUTUP, tiket terbit hari ini >= kuota -> PENUH, selain itu BUKA.
 */
export function tentukanStatusAntrean(kuotaMaksimum: number, tiketHariIni: number): StatusAntrean {
  if (kuotaMaksimum <= 0) return 'TUTUP';
  if (tiketHariIni >= kuotaMaksimum) return 'PENUH';
  return 'BUKA';
}

/** getEstimasiWaktu(): estimasi menit tunggu berdasarkan jumlah antrean di depan. */
export function hitungEstimasi(jumlahDiDepan: number, menitPerAntrean: number): number {
  return Math.max(0, jumlahDiDepan) * menitPerAntrean;
}

export const Antrean = {
  async getByRestoran(q: Queryable, restoranId: string): Promise<AntreanRow | null> {
    const rows = await q.query<AntreanRow>(`SELECT * FROM antrean WHERE restoran_id = $1`, [restoranId]);
    return rows[0] ?? null;
  },

  async getById(q: Queryable, antreanId: string): Promise<AntreanRow | null> {
    const rows = await q.query<AntreanRow>(`SELECT * FROM antrean WHERE antrean_id = $1`, [antreanId]);
    return rows[0] ?? null;
  },

  /** Jumlah tiket non-booking yang terbit hari ini (pemakaian kuota harian). */
  async tiketHariIni(q: Queryable, antreanId: string): Promise<number> {
    const rows = await q.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM tiket_antrean
       WHERE antrean_id = $1 AND tipe_antrean <> 'BOOKING' AND status_antrean <> 'DIBATALKAN'
         AND waktu_terbit::date = CURRENT_DATE`,
      [antreanId],
    );
    return rows[0].n;
  },

  /**
   * updateStatus(): menyinkronkan status antrean, memanggil pelanggan terdepan
   * bila belum ada yang dipanggil, dan memperbarui estimasi tiap tiket (Q-021).
   */
  async updateStatus(q: Queryable, restoranId: string, menitPerAntrean: number): Promise<AntreanRow | null> {
    const antrean = await Antrean.getByRestoran(q, restoranId);
    if (!antrean) return null;
    const kuota = await q.query<{ kuota_maksimum: number; aktif: boolean }>(
      `SELECT k.kuota_maksimum, r.status_aktif AS aktif FROM pengaturan_kuota k
       JOIN restoran r ON r.restoran_id = k.restoran_id WHERE k.restoran_id = $1`,
      [restoranId],
    );
    const kuotaMaks = kuota[0]?.aktif ? kuota[0].kuota_maksimum : 0;

    // Pastikan pelanggan terdepan berstatus DIPANGGIL.
    const dipanggil = await q.query(
      `SELECT 1 FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean = 'DIPANGGIL' LIMIT 1`,
      [antrean.antrean_id],
    );
    if (dipanggil.length === 0) {
      await q.query(
        `UPDATE tiket_antrean SET status_antrean = 'DIPANGGIL', waktu_dipanggil = NOW()
         WHERE id_tiket = (SELECT t.id_tiket FROM tiket_antrean t
                           WHERE t.antrean_id = $1 AND t.status_antrean = 'MENUNGGU' ${URUTAN} LIMIT 1)`,
        [antrean.antrean_id],
      );
    }

    // Estimasi per tiket = posisi * menit per antrean.
    await q.query(
      `UPDATE tiket_antrean t SET estimasi_waktu_tunggu = s.posisi * $2
       FROM (SELECT id_tiket, (ROW_NUMBER() OVER (ORDER BY waktu_terbit, nomor_urut) - 1)::int AS posisi
             FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean IN ('MENUNGGU', 'DIPANGGIL')) s
       WHERE t.id_tiket = s.id_tiket`,
      [antrean.antrean_id, menitPerAntrean],
    );

    const aktif = await q.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean IN ('MENUNGGU', 'DIPANGGIL')`,
      [antrean.antrean_id],
    );
    const total = aktif[0].n;
    const status = tentukanStatusAntrean(kuotaMaks, await Antrean.tiketHariIni(q, antrean.antrean_id));
    const rows = await q.query<AntreanRow>(
      `UPDATE antrean SET status_antrean = $2, total_antrean = $3, estimasi_waktu_tunggu = $4
       WHERE antrean_id = $1 RETURNING *`,
      [antrean.antrean_id, status, total, hitungEstimasi(total, menitPerAntrean)],
    );
    return rows[0];
  },

  /** getFrontCustomer() (Q-019): tiket terdepan yang sedang dipanggil/menunggu. */
  async getFrontCustomer(q: Queryable, antreanId: string): Promise<TiketRow | null> {
    const rows = await q.query<TiketRow>(
      `SELECT t.* FROM tiket_antrean t WHERE t.antrean_id = $1 AND t.status_antrean IN ('DIPANGGIL', 'MENUNGGU')
       ORDER BY (t.status_antrean = 'DIPANGGIL') DESC, t.waktu_terbit ASC, t.nomor_urut ASC LIMIT 1`,
      [antreanId],
    );
    return rows[0] ?? null;
  },

  /**
   * dequeueCustomer(): mengeluarkan pelanggan terdepan dari antrean (Q-051, Q-053).
   * status SELESAI bila dilayani, DILEWATI bila tidak hadir.
   */
  async dequeueCustomer(
    q: Queryable,
    restoranId: string,
    statusAkhir: 'SELESAI' | 'DILEWATI',
    menitPerAntrean: number,
  ): Promise<TiketRow | null> {
    const antrean = await Antrean.getByRestoran(q, restoranId);
    if (!antrean) return null;
    const front = await Antrean.getFrontCustomer(q, antrean.antrean_id);
    if (!front) return null;
    await q.query(`UPDATE tiket_antrean SET status_antrean = $2 WHERE id_tiket = $1`, [front.id_tiket, statusAkhir]);
    await q.query(
      `UPDATE pesanan SET status_pemesanan = 'SELESAI' WHERE pesanan_id = $1 AND status_pemesanan = 'DIKONFIRMASI'`,
      [front.pesanan_id],
    );
    await q.query(`UPDATE antrean SET nomor_dilayani = $2 WHERE antrean_id = $1`, [antrean.antrean_id, front.nomor_urut]);
    await Antrean.updateStatus(q, restoranId, menitPerAntrean);
    return { ...front, status_antrean: statusAkhir };
  },

  /** Daftar restoran yang pelanggan terdepannya sudah dipanggil lebih dari `menit` menit. */
  async cariTiketKedaluwarsa(q: Queryable, menit: number): Promise<{ restoran_id: string }[]> {
    return q.query(
      `SELECT DISTINCT a.restoran_id FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id
       WHERE t.status_antrean = 'DIPANGGIL' AND t.waktu_dipanggil < NOW() - make_interval(mins => $1::int)`,
      [menit],
    );
  },

  /**
   * Data dashboard antrean restoran (Q-050) beserta rincian pesanan tiap tiket.
   * Rincian item diambil dalam SATU query agregasi (hasil profiling, lihat scripts/profile-dashboard.ts).
   */
  async getDetailAntrean(q: Queryable, restoranId: string) {
    return q.query<{
      id_tiket: string;
      nomor_urut: number;
      tipe_antrean: TipeAntrean;
      status_antrean: StatusTiket;
      waktu_terbit: Date;
      waktu_dipanggil: Date | null;
      estimasi_waktu_tunggu: number;
      pesanan_id: string;
      jumlah_rombongan: number;
      total_harga: number;
      nama_pelanggan: string;
      no_hp: string | null;
      rincian: string;
    }>(
      `SELECT t.id_tiket, t.nomor_urut, t.tipe_antrean, t.status_antrean, t.waktu_terbit, t.waktu_dipanggil,
              t.estimasi_waktu_tunggu, p.pesanan_id, p.jumlah_rombongan, p.total_harga,
              pl.nama AS nama_pelanggan, pl.no_hp,
              COALESCE((SELECT string_agg(m.nama_menu || ' x' || d.jumlah, ', ' ORDER BY m.nama_menu)
                        FROM detail_pesanan d JOIN menu m ON m.menu_id = d.menu_id
                        WHERE d.pesanan_id = p.pesanan_id), '') AS rincian
       FROM tiket_antrean t
       JOIN antrean a ON a.antrean_id = t.antrean_id
       JOIN pesanan p ON p.pesanan_id = t.pesanan_id
       JOIN pelanggan pl ON pl.pelanggan_id = t.pelanggan_id
       WHERE a.restoran_id = $1 AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL')
       ${URUTAN}`,
      [restoranId],
    );
  },
};

export const TiketAntrean = {
  /** generateNomorAntrean(): nomor urut harian per antrean (Q-037). */
  async generateNomorAntrean(q: Queryable, antreanId: string): Promise<number> {
    const rows = await q.query<{ n: number }>(
      `SELECT (COALESCE(MAX(nomor_urut), 0) + 1)::int AS n FROM tiket_antrean
       WHERE antrean_id = $1 AND waktu_terbit::date = CURRENT_DATE`,
      [antreanId],
    );
    return rows[0].n;
  },

  /** Menerbitkan tiket (Q-038). Booking berstatus TERJADWAL sampai pelanggan hadir. */
  async terbitkan(
    q: Queryable,
    data: { antreanId: string; pelangganId: string; pesananId: string; tipe: TipeAntrean },
  ): Promise<TiketRow> {
    const nomor = await TiketAntrean.generateNomorAntrean(q, data.antreanId);
    const rows = await q.query<TiketRow>(
      `INSERT INTO tiket_antrean (id_tiket, antrean_id, pelanggan_id, pesanan_id, nomor_urut, tipe_antrean,
                                  waktu_terbit, status_antrean, estimasi_waktu_tunggu)
       VALUES ($1, $2, $3, $4, $5, $6, clock_timestamp(), $7, 0) RETURNING *`,
      [
        generateId('TKT'),
        data.antreanId,
        data.pelangganId,
        data.pesananId,
        nomor,
        data.tipe,
        data.tipe === 'BOOKING' ? 'TERJADWAL' : 'MENUNGGU',
      ],
    );
    return rows[0];
  },

  /** getDetailTiket() (Q-039) + posisi dalam antrean. */
  async getDetailTiket(q: Queryable, idTiket: string) {
    const rows = await q.query<
      TiketRow & {
        restoran_id: string;
        nama_restoran: string;
        nomor_dilayani: number;
        status_antrean_restoran: StatusAntrean;
        posisi: number;
      }
    >(
      `SELECT t.*, a.restoran_id, r.nama_restoran, a.nomor_dilayani, a.status_antrean AS status_antrean_restoran,
              (SELECT COUNT(*)::int FROM tiket_antrean t2
               WHERE t2.antrean_id = t.antrean_id AND t2.status_antrean IN ('MENUNGGU', 'DIPANGGIL')
                 AND (t2.waktu_terbit, t2.nomor_urut) < (t.waktu_terbit, t.nomor_urut)) AS posisi
       FROM tiket_antrean t
       JOIN antrean a ON a.antrean_id = t.antrean_id
       JOIN restoran r ON r.restoran_id = a.restoran_id
       WHERE t.id_tiket = $1`,
      [idTiket],
    );
    return rows[0] ?? null;
  },

  async getByPesanan(q: Queryable, pesananId: string): Promise<TiketRow | null> {
    const rows = await q.query<TiketRow>(`SELECT * FROM tiket_antrean WHERE pesanan_id = $1`, [pesananId]);
    return rows[0] ?? null;
  },

  /** updateStatusTiket() (Q-040). */
  async updateStatusTiket(q: Queryable, idTiket: string, status: StatusTiket): Promise<void> {
    await q.query(`UPDATE tiket_antrean SET status_antrean = $2 WHERE id_tiket = $1`, [idTiket, status]);
  },
};
