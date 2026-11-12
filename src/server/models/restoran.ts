/**
 * ModelRestoran (DPPL 2.3): Restoran (C02). Menu (C03) ada di menu.ts, Kuota (C20) di kuota.ts.
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export interface RestoranRow {
  restoran_id: string;
  nama_restoran: string;
  kategori: string;
  lokasi: string;
  alamat: string | null;
  deskripsi: string | null;
  jam_buka: string | null;
  email_kontak: string;
  no_hp: string | null;
  rating_rerata: number;
  jumlah_ulasan: number;
  warna: string;
  status_aktif: boolean;
  id_akun: string | null;
  bergabung_pada: Date;
  dihapus_pada: Date | null;
  foto_path: string | null;
  mode_simulasi: 'MATI' | 'PELANGGAN' | 'PENUH';
}

export interface RestoranRingkas extends RestoranRow {
  status_antrean: 'BUKA' | 'PENUH' | 'TUTUP';
  total_antrean: number;
  estimasi_waktu_tunggu: number;
  kuota_maksimum: number;
  kapasitas_meja: number;
  antrean_ditutup: boolean;
  meja_terisi: number;
  meja_tersisa: number;
}

export interface FilterPencarian {
  kataKunci?: string;
  kategori?: string;
  lokasi?: string;
  minRating?: number;
  antreanPendek?: boolean;
  limit?: number;
}

/** Subquery jumlah meja dine-in yang sedang terpakai (tiket dine-in aktif). */
const MEJA_TERISI_SQL = `(SELECT COUNT(*)::int FROM tiket_antrean t
   WHERE t.antrean_id = a.antrean_id AND t.tipe_antrean = 'DINE_IN'
   AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL'))`;

const RINGKAS_SELECT = `
  SELECT r.*, r.rating_rerata::float AS rating_rerata,
         a.status_antrean, a.total_antrean, a.estimasi_waktu_tunggu,
         k.kuota_maksimum, k.kapasitas_meja, k.antrean_ditutup,
         ${MEJA_TERISI_SQL} AS meja_terisi,
         GREATEST(k.kapasitas_meja - ${MEJA_TERISI_SQL}, 0) AS meja_tersisa
  FROM restoran r
  JOIN antrean a ON a.restoran_id = r.restoran_id
  JOIN pengaturan_kuota k ON k.restoran_id = r.restoran_id`;

export const Restoran = {
  /** cariRestoran / terapkanFilter (Q-075, Q-076), diurutkan dari yang paling viral. */
  async cari(q: Queryable, f: FilterPencarian): Promise<RestoranRingkas[]> {
    const kata = (f.kataKunci ?? '').trim();
    return q.query<RestoranRingkas>(
      `${RINGKAS_SELECT}
       WHERE r.status_aktif = true
         AND ($1::text = '' OR r.nama_restoran ILIKE '%' || $1 || '%' OR r.kategori ILIKE '%' || $1 || '%'
              OR EXISTS (SELECT 1 FROM menu m WHERE m.restoran_id = r.restoran_id AND m.aktif = true
                         AND m.nama_menu ILIKE '%' || $1 || '%'))
         AND ($2::text IS NULL OR r.kategori = $2)
         AND ($3::text IS NULL OR r.lokasi = $3)
         AND ($4::numeric IS NULL OR r.rating_rerata >= $4)
         AND ($5::boolean IS NOT TRUE OR (a.status_antrean = 'BUKA' AND a.total_antrean <= 5))
       ORDER BY (r.jumlah_ulasan * r.rating_rerata) DESC, r.nama_restoran ASC
       LIMIT $6`,
      [kata, f.kategori || null, f.lokasi || null, f.minRating ?? null, f.antreanPendek ?? false, f.limit ?? 100],
    );
  },

  /** getDetailRestoran() (Q-003) beserta status antrean & kuota. */
  async getDetailRestoran(q: Queryable, restoranId: string, termasukNonaktif = false): Promise<RestoranRingkas | null> {
    const rows = await q.query<RestoranRingkas>(
      `${RINGKAS_SELECT} WHERE r.restoran_id = $1 AND ($2::boolean OR r.status_aktif = true)`,
      [restoranId, termasukNonaktif],
    );
    return rows[0] ?? null;
  },

  async getByAkun(q: Queryable, idAkun: string): Promise<RestoranRow | null> {
    const rows = await q.query<RestoranRow>(
      `SELECT *, rating_rerata::float AS rating_rerata FROM restoran WHERE id_akun = $1 AND status_aktif = true`,
      [idAkun],
    );
    return rows[0] ?? null;
  },

  async daftarKategori(q: Queryable): Promise<string[]> {
    const rows = await q.query<{ kategori: string }>(
      `SELECT kategori FROM restoran WHERE status_aktif = true GROUP BY kategori ORDER BY COUNT(*) DESC, kategori`,
    );
    return rows.map((r) => r.kategori);
  },

  async daftarLokasi(q: Queryable): Promise<string[]> {
    const rows = await q.query<{ lokasi: string }>(
      `SELECT DISTINCT lokasi FROM restoran WHERE status_aktif = true ORDER BY lokasi`,
    );
    return rows.map((r) => r.lokasi);
  },

  /** Membuat restoran baru beserta pengaturan kuota dan antreannya (Q-044, Q-008). */
  async buat(
    q: Queryable,
    data: {
      nama: string;
      kategori: string;
      lokasi: string;
      alamat: string;
      email: string;
      noHp: string | null;
      idAkun: string | null;
      deskripsi?: string;
      rating?: number;
      ulasan?: number;
      warna?: string;
      kuota?: number;
      meja?: number;
    },
  ): Promise<string> {
    const id = generateId('RST');
    await q.query(
      `INSERT INTO restoran (restoran_id, nama_restoran, kategori, lokasi, alamat, deskripsi, email_kontak, no_hp,
                             rating_rerata, jumlah_ulasan, warna, status_aktif, id_akun)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12)`,
      [
        id,
        data.nama,
        data.kategori,
        data.lokasi,
        data.alamat,
        data.deskripsi ?? `Restoran ${data.kategori.toLowerCase()} di ${data.lokasi}.`,
        data.email,
        data.noHp,
        data.rating ?? 0,
        data.ulasan ?? 0,
        data.warna ?? 'oranye',
        data.idAkun,
      ],
    );
    await q.query(`INSERT INTO pengaturan_kuota (restoran_id, kuota_maksimum, kapasitas_meja) VALUES ($1, $2, $3)`, [
      id,
      data.kuota ?? 50,
      data.meja ?? 10,
    ]);
    await q.query(`INSERT INTO antrean (antrean_id, restoran_id, status_antrean) VALUES ($1, $2, $3)`, [
      generateId('ANT'),
      id,
      (data.kuota ?? 50) === 0 ? 'TUTUP' : 'BUKA',
    ]);
    return id;
  },

  /** setSoftDelete() + purgeData(): menonaktifkan restoran dan seluruh relasinya (Q-009, Q-074, Q-010, Q-011). */
  async setSoftDelete(q: Queryable, restoranId: string): Promise<boolean> {
    const rows = await q.query(
      `UPDATE restoran SET status_aktif = false, dihapus_pada = NOW(), mode_simulasi = 'MATI'
       WHERE restoran_id = $1 AND status_aktif = true
       RETURNING restoran_id`,
      [restoranId],
    );
    if (rows.length === 0) return false;
    await q.query(`UPDATE menu SET aktif = false, stok = 0 WHERE restoran_id = $1`, [restoranId]);
    await q.query(`UPDATE pengaturan_kuota SET kuota_maksimum = 0 WHERE restoran_id = $1`, [restoranId]);
    await q.query(`UPDATE antrean SET status_antrean = 'TUTUP', total_antrean = 0, estimasi_waktu_tunggu = 0
                   WHERE restoran_id = $1`, [restoranId]);
    await q.query(
      `UPDATE tiket_antrean SET status_antrean = 'DIBATALKAN'
       WHERE antrean_id = (SELECT antrean_id FROM antrean WHERE restoran_id = $1)
         AND status_antrean IN ('TERJADWAL', 'MENUNGGU', 'DIPANGGIL')`,
      [restoranId],
    );
    await q.query(
      `UPDATE pesanan SET status_pemesanan = 'DIBATALKAN'
       WHERE restoran_id = $1 AND status_pemesanan IN ('MENUNGGU_PEMBAYARAN', 'DIKONFIRMASI')`,
      [restoranId],
    );
    await q.query(
      `UPDATE pembayaran SET status_pembayaran = 'GAGAL'
       WHERE status_pembayaran = 'MENUNGGU' AND pesanan_id IN (SELECT pesanan_id FROM pesanan WHERE restoran_id = $1)`,
      [restoranId],
    );
    return true;
  },

  /**
   * Daftar restoran untuk admin beserta jumlah keluhan 7 hari terakhir (DashboardKelolaRestoranPage).
   * Sejak iterasi 2 restoran nonaktif ikut ditampilkan agar filter "Aktif"/"Nonaktif" bermakna.
   */
  async daftarUntukAdmin(
    q: Queryable,
    kataKunci: string,
    status: 'semua' | 'aktif' | 'nonaktif' = 'semua',
  ): Promise<(RestoranRow & { keluhan_7_hari: number })[]> {
    return q.query(
      `SELECT r.*, r.rating_rerata::float AS rating_rerata,
              (SELECT COUNT(*)::int FROM keluhan k WHERE k.restoran_id = r.restoran_id
                 AND k.waktu_kirim >= NOW() - INTERVAL '7 days') AS keluhan_7_hari
       FROM restoran r
       WHERE r.nama_restoran ILIKE '%' || $1 || '%'
         AND ($2 = 'semua' OR ($2 = 'aktif' AND r.status_aktif) OR ($2 = 'nonaktif' AND NOT r.status_aktif))
       ORDER BY r.status_aktif DESC, keluhan_7_hari DESC, r.nama_restoran`,
      [kataKunci, status],
    );
  },
};
