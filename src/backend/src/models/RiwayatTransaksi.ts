// C08 RiwayatTransaksi: catatLogTransaksi (Algo-048), getBuktiPembayaran
import { type Db, generateId } from '../db/tx.js';

export class RiwayatTransaksi {
  static async catatLogTransaksi(idPembayaran: string, jumlah: number, db: Db): Promise<string> {
    const idTransaksi = generateId();
    await db.query(
      `INSERT INTO riwayat_transaksi (id_transaksi, id_pembayaran, tanggal_transaksi, jumlah_dibayar, status_pelunasan)
       VALUES ($1,$2,NOW(),$3,'LUNAS')`, [idTransaksi, idPembayaran, jumlah]);
    return idTransaksi;
  }

  static async getBuktiPembayaran(idTransaksi: string, db: Db): Promise<object | null> {
    const r = await db.query(
      `SELECT rt.id_transaksi, rt.tanggal_transaksi, rt.jumlah_dibayar, rt.status_pelunasan,
              pb.tipe_pembayaran, pb.kode_bayar, pb.pesanan_id
       FROM riwayat_transaksi rt JOIN pembayaran pb USING (id_pembayaran) WHERE rt.id_transaksi = $1`, [idTransaksi]);
    return r.rows[0] ?? null;
  }
}
