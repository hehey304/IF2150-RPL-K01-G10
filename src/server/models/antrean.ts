/**
 * ModelAntrean (DPPL 2.3): Antrean (C04) dan TiketAntrean (C09).
 */
import type { Queryable } from '../db/database.js';
import { formatNomorAntrean, generateId } from '../utils/ids.js';
import { Notifikasi } from './notifikasi.js';

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
  disiapkan_pada: Date | null;
  selesai_pada: Date | null;
}

/** Urutan antrean: tiket yang terbit lebih dulu dilayani lebih dulu. */
const URUTAN = 'ORDER BY t.waktu_terbit ASC, t.nomor_urut ASC';

/**
 * Menentukan status antrean dari pengaturan kuota (aturan bisnis UC07).
 * kuota 0 -> TUTUP, tiket terbit hari ini >= kuota -> PENUH, selain itu BUKA.
 */
export function tentukanStatusAntrean(kuotaMaksimum: number, tiketHariIni: number, ditutup = false): StatusAntrean {
  if (ditutup || kuotaMaksimum <= 0) return 'TUTUP';
  if (tiketHariIni >= kuotaMaksimum) return 'PENUH';
  return 'BUKA';
}

/**
 * Menit layanan per antrean dari data nyata: median jeda antar-penyelesaian tiket dalam 3 jam terakhir.
 * Dipakai bila ada minimal 3 jeda; hasil dibatasi 1-15 menit. Selain itu memakai nilai bawaan.
 */
export function medianJedaMenit(selesai: Date[], bawaan: number): number {
  const urut = [...selesai].map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const jeda: number[] = [];
  for (let i = 1; i < urut.length; i++) jeda.push((urut[i] - urut[i - 1]) / 60_000);
  if (jeda.length < 3) return bawaan;
  jeda.sort((a, b) => a - b);
  const tengah = jeda.length % 2 ? jeda[(jeda.length - 1) / 2] : (jeda[jeda.length / 2 - 1] + jeda[jeda.length / 2]) / 2;
  return Math.min(15, Math.max(1, Math.round(tengah)));
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
    const kuota = await q.query<{ kuota_maksimum: number; antrean_ditutup: boolean; aktif: boolean }>(
      `SELECT k.kuota_maksimum, k.antrean_ditutup, r.status_aktif AS aktif FROM pengaturan_kuota k
       JOIN restoran r ON r.restoran_id = k.restoran_id WHERE k.restoran_id = $1`,
      [restoranId],
    );
    const kuotaMaks = kuota[0]?.aktif ? kuota[0].kuota_maksimum : 0;
    const ditutup = kuota[0]?.antrean_ditutup ?? false;
    const menit = await Antrean.menitPerAntreanAktual(q, antrean.antrean_id, menitPerAntrean);

    // Pastikan pelanggan terdepan berstatus DIPANGGIL.
    const dipanggil = await q.query(
      `SELECT 1 FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean = 'DIPANGGIL' LIMIT 1`,
      [antrean.antrean_id],
    );
    if (dipanggil.length === 0) {
      const dipanggilBaru = await q.query<{ id_tiket: string; pelanggan_id: string; nomor_urut: number; tipe_antrean: string }>(
        `UPDATE tiket_antrean SET status_antrean = 'DIPANGGIL', waktu_dipanggil = NOW()
         WHERE id_tiket = (SELECT t.id_tiket FROM tiket_antrean t
                           WHERE t.antrean_id = $1 AND t.status_antrean = 'MENUNGGU' ${URUTAN} LIMIT 1)
         RETURNING id_tiket, pelanggan_id, nomor_urut, tipe_antrean`,
        [antrean.antrean_id],
      );
      for (const t of dipanggilBaru) {
        await Notifikasi.kePelanggan(q, t.pelanggan_id, {
          judul: `Giliranmu! Nomor ${formatNomorAntrean(t.nomor_urut)} dipanggil`,
          isi: t.tipe_antrean === 'DINE_IN' ? 'Meja sudah siap, silakan menuju restoran.' : 'Pesanan siap diambil di kasir.',
          tautan: `#/antrean/${t.id_tiket}`,
        });
      }
    }

    // Estimasi per tiket = posisi * menit per antrean.
    await q.query(
      `UPDATE tiket_antrean t SET estimasi_waktu_tunggu = s.posisi * $2
       FROM (SELECT id_tiket, (ROW_NUMBER() OVER (ORDER BY waktu_terbit, nomor_urut) - 1)::int AS posisi
             FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean IN ('MENUNGGU', 'DIPANGGIL')) s
       WHERE t.id_tiket = s.id_tiket`,
      [antrean.antrean_id, menit],
    );

    const aktif = await q.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean IN ('MENUNGGU', 'DIPANGGIL')`,
      [antrean.antrean_id],
    );
    const total = aktif[0].n;
    const status = tentukanStatusAntrean(kuotaMaks, await Antrean.tiketHariIni(q, antrean.antrean_id), ditutup);
    const rows = await q.query<AntreanRow>(
      `UPDATE antrean SET status_antrean = $2, total_antrean = $3, estimasi_waktu_tunggu = $4
       WHERE antrean_id = $1 RETURNING *`,
      [antrean.antrean_id, status, total, hitungEstimasi(total, menit)],
    );
    return rows[0];
  },

  /** Menit layanan per antrean berdasarkan riwayat penyelesaian tiket (lihat medianJedaMenit). */
  async menitPerAntreanAktual(q: Queryable, antreanId: string, bawaan: number): Promise<number> {
    const rows = await q.query<{ selesai_pada: Date }>(
      `SELECT selesai_pada FROM tiket_antrean WHERE antrean_id = $1 AND status_antrean = 'SELESAI'
         AND selesai_pada >= NOW() - INTERVAL '3 hours' ORDER BY selesai_pada DESC LIMIT 11`,
      [antreanId],
    );
    return medianJedaMenit(rows.map((r) => r.selesai_pada), bawaan);
  },

  /** Menandai pesanan pada tiket mulai disiapkan dapur (iterasi 2, UC09). */
  async tandaiDisiapkan(q: Queryable, restoranId: string, idTiket: string): Promise<TiketRow | null> {
    const rows = await q.query<TiketRow>(
      `UPDATE tiket_antrean t SET disiapkan_pada = NOW()
       FROM antrean a WHERE a.antrean_id = t.antrean_id AND a.restoran_id = $1 AND t.id_tiket = $2
         AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL') AND t.disiapkan_pada IS NULL
       RETURNING t.*`,
      [restoranId, idTiket],
    );
    return rows[0] ?? null;
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
    await q.query(`UPDATE tiket_antrean SET status_antrean = $2, selesai_pada = NOW() WHERE id_tiket = $1`, [
      front.id_tiket,
      statusAkhir,
    ]);
    await Notifikasi.kePelanggan(q, front.pelanggan_id, statusAkhir === 'SELESAI'
      ? { judul: 'Pesanan selesai. Terima kasih!', isi: 'Bagaimana pengalamanmu? Beri ulasan untuk restoran ini.',
          tautan: `#/pesanan/${front.pesanan_id}` }
      : { judul: `Nomor ${formatNomorAntrean(front.nomor_urut)} dilewati`,
          isi: 'Kamu tidak hadir saat dipanggil. Hubungi restoran bila ada kendala.', tautan: `#/antrean/${front.id_tiket}` });
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
      disiapkan_pada: Date | null;
      pesanan_id: string;
      jumlah_rombongan: number;
      total_harga: number;
      nama_pelanggan: string;
      no_hp: string | null;
      rincian: string;
    }>(
      `SELECT t.id_tiket, t.nomor_urut, t.tipe_antrean, t.status_antrean, t.waktu_terbit, t.waktu_dipanggil,
              t.estimasi_waktu_tunggu, t.disiapkan_pada, p.pesanan_id, p.jumlah_rombongan, p.total_harga,
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
