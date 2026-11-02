// C09 TiketAntrean: generateNomorAntrean (Algo-050), getDetailTiket, updateStatusTiket
// (cetakRincianTiket ada di sisi klien: pages/pelanggan/TiketAntreanPage.tsx)
import { type Db, generateId } from '../db/tx.js';

export class TiketAntrean {
  constructor(
    private idTiket: string,
    private nomorUrut: number,
    private tipeAntrean: string,
    private waktuTerbit: Date,
    private statusAntrean: string,
    private estimasiWaktuTunggu: number,
  ) {}

  toJSON() {
    return { idTiket: this.idTiket, nomorUrut: this.nomorUrut, tipeAntrean: this.tipeAntrean,
             waktuTerbit: this.waktuTerbit, statusAntrean: this.statusAntrean,
             estimasiWaktuTunggu: this.estimasiWaktuTunggu };
  }

  // Mengembalikan null jika antrean tidak ada / TUTUP. Baris antrean dikunci agar nomor urut tidak bentrok.
  static async generateNomorAntrean(antreanId: string, pelangganId: string, pesananId: string,
                                    tipe: string, db: Db): Promise<TiketAntrean | null> {
    const a = (await db.query(
      'SELECT antrean_id, status_antrean, estimasi_waktu_tunggu FROM antrean WHERE antrean_id = $1 FOR UPDATE', [antreanId])).rows[0];
    if (!a || a.status_antrean === 'TUTUP') return null;
    const nomor = (await db.query( // Q-037
      `SELECT COALESCE(MAX(nomor_urut),0)+1 AS n FROM tiket_antrean
       WHERE antrean_id = $1 AND tanggal_antre = CURRENT_DATE`, [antreanId])).rows[0].n;
    const idTiket = generateId();
    const t = (await db.query( // Q-038
      `INSERT INTO tiket_antrean (id_tiket, antrean_id, pelanggan_id, pesanan_id, nomor_urut, tipe_antrean,
         waktu_terbit, status_antrean, estimasi_waktu_tunggu)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),'MENUNGGU',$7) RETURNING waktu_terbit`,
      [idTiket, antreanId, pelangganId, pesananId, nomor, tipe, a.estimasi_waktu_tunggu])).rows[0];
    // pengganti Kuota.updateKapasitas (C20, UC07): naikkan total antrean
    await db.query('UPDATE antrean SET total_antrean = total_antrean + 1 WHERE antrean_id = $1', [antreanId]);
    return new TiketAntrean(idTiket, nomor, tipe, t.waktu_terbit, 'MENUNGGU', a.estimasi_waktu_tunggu);
  }

  static async getDetailTiket(idTiket: string, db: Db): Promise<TiketAntrean | null> {
    const x = (await db.query('SELECT * FROM tiket_antrean WHERE id_tiket = $1', [idTiket])).rows[0];
    return x ? new TiketAntrean(x.id_tiket, x.nomor_urut, x.tipe_antrean, x.waktu_terbit, x.status_antrean, x.estimasi_waktu_tunggu) : null;
  }

  async updateStatusTiket(status: string, db: Db): Promise<void> {
    await db.query('UPDATE tiket_antrean SET status_antrean = $2 WHERE id_tiket = $1', [this.idTiket, status]);
    this.statusAntrean = status;
  }
}
