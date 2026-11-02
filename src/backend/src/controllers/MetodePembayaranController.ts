// C07 MetodePembayaranController: buatTagihan (Algo-045), verifikasiPembayaran (Algo-046), cekTimeout (Algo-047)
import { type Db, generateId } from '../db/tx.js';
import { PaymentGateway } from '../adapters/PaymentGateway.js';
import { Pesanan } from '../models/Pesanan.js';
import { Menu } from '../models/Menu.js';
import { RiwayatTransaksi } from '../models/RiwayatTransaksi.js';
import { TiketAntrean } from '../models/TiketAntrean.js';

const TIPE_VALID = ['QRIS', 'TRANSFER_BANK', 'E_WALLET'];

export class MetodePembayaranController {
  private idPembayaran = '';
  private tipePembayaran = '';
  private batasWaktuBayar: Date | null = null;
  private statusPembayaran = 'MENUNGGU';

  async buatTagihan(pesananId: string, total: number, tipePembayaran: string, db: Db) {
    if (!TIPE_VALID.includes(tipePembayaran)) throw new Error('Tipe pembayaran tidak valid');
    this.idPembayaran = generateId();
    this.tipePembayaran = tipePembayaran;
    this.statusPembayaran = 'MENUNGGU';
    const kodeBayar = await PaymentGateway.buatTagihan(this.idPembayaran, total, tipePembayaran);
    const r = await db.query( // Q-032
      `INSERT INTO pembayaran (id_pembayaran, pesanan_id, tipe_pembayaran, jumlah, kode_bayar, batas_waktu_bayar, status_pembayaran)
       VALUES ($1,$2,$3,$4,$5, NOW() + INTERVAL '15 minutes','MENUNGGU') RETURNING batas_waktu_bayar`,
      [this.idPembayaran, pesananId, tipePembayaran, total, kodeBayar]);
    this.batasWaktuBayar = r.rows[0].batas_waktu_bayar;
    return { idPembayaran: this.idPembayaran, kodeBayar, totalHarga: total, batasWaktuBayar: this.batasWaktuBayar };
  }

  // Dipanggil di dalam transaksi. sukses=false -> tidak ada yang berubah.
  async verifikasiPembayaran(idPembayaran: string, db: Db): Promise<{
    sukses: boolean; alasan?: 'BELUM_DIBAYAR' | 'KEDALUWARSA'; pesananId?: string; tiket: TiketAntrean | null; perluTiket?: boolean }> {
    if ((await PaymentGateway.cekStatus(idPembayaran)) !== 'LUNAS')
      return { sukses: false, alasan: 'BELUM_DIBAYAR', tiket: null };

    const upd = await db.query( // Q-033 (+ belum lewat batas waktu)
      `UPDATE pembayaran SET status_pembayaran = 'LUNAS'
       WHERE id_pembayaran = $1 AND status_pembayaran = 'MENUNGGU' AND batas_waktu_bayar >= NOW()
       RETURNING pesanan_id, jumlah`, [idPembayaran]);
    if (!upd.rows[0]) return { sukses: false, alasan: 'KEDALUWARSA', tiket: null };
    this.statusPembayaran = 'LUNAS';
    const { pesanan_id: pesananId, jumlah } = upd.rows[0];

    await RiwayatTransaksi.catatLogTransaksi(idPembayaran, Number(jumlah), db);
    const pesanan = (await Pesanan.getDetailPesanan(pesananId, db))!;
    await pesanan.updateStatus('DIBAYAR', db);

    for (const item of pesanan.daftarItem) {
      const menu = await Menu.getInfoMenu(item.menuId, db);
      if (!menu || !(await menu.kurangiStok(item.jumlah, db)))
        throw Object.assign(new Error('Stok tidak mencukupi'), { code: 'STOK_HABIS' }); // rollback
    }

    let tiket: TiketAntrean | null = null;
    const perluTiket = pesanan.modePemesanan !== 'BOOKING';
    if (perluTiket) {
      const antreanId = (await db.query('SELECT antrean_id FROM antrean WHERE restoran_id = $1', [pesanan.restoranId])).rows[0]?.antrean_id; // Q-005
      tiket = antreanId
        ? await TiketAntrean.generateNomorAntrean(antreanId, pesanan.pelangganId, pesanan.pesananId, pesanan.modePemesanan, db)
        : null;
    }
    return { sukses: true, pesananId, tiket, perluTiket };
  }

  async cekTimeout(db: Db): Promise<number> {
    const exp = await db.query( // Q-034
      `UPDATE pembayaran SET status_pembayaran = 'KEDALUWARSA'
       WHERE status_pembayaran = 'MENUNGGU' AND batas_waktu_bayar < NOW() RETURNING pesanan_id`);
    for (const row of exp.rows) {
      const p = await Pesanan.getDetailPesanan(row.pesanan_id, db);
      if (p) await p.batalkanPesanan(db);
    }
    return exp.rowCount ?? 0;
  }
}
