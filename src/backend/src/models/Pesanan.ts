// C06 Pesanan: validasiBooking (Algo-039), buatTagihan (Algo-040), batalkanPesanan (Algo-041),
// updateStatus (Algo-042), getDetailPesanan (Algo-043). showOrderDetails ada di klien (PembayaranPage).
import { type Db, generateId } from '../db/tx.js';
import { Keranjang } from './Keranjang.js';
import { MetodePembayaranController } from '../controllers/MetodePembayaranController.js';

export type ModePemesanan = 'DINE_IN' | 'TAKEAWAY' | 'PRE_ORDER' | 'BOOKING';
export type StatusPesanan = 'MENUNGGU_PEMBAYARAN' | 'DIBAYAR' | 'DIKONFIRMASI' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

export class Pesanan {
  pesananId = '';
  pelangganId = '';
  restoranId = '';
  totalHarga = 0;
  statusPemesanan: StatusPesanan = 'MENUNGGU_PEMBAYARAN';
  daftarItem: { menuId: string; namaMenu: string; jumlah: number; subtotal: number }[] = [];

  constructor(
    public modePemesanan: ModePemesanan,
    public jumlahRombongan: number | null = null,
    public tanggalBooking: string | null = null,   // 'YYYY-MM-DD'
    public slotWaktuBooking: string | null = null, // 'HH:MM'
  ) {}

  // Algo-039 (+ batas reservasi 7 hari, KF09). false = tanggal tidak valid ATAU slot penuh.
  async validasiBooking(restoranId: string, db: Db): Promise<boolean> {
    if (!this.jumlahRombongan || this.jumlahRombongan <= 0 || !this.tanggalBooking || !this.slotWaktuBooking) return false;
    const ok = (await db.query(
      'SELECT ($1::date >= CURRENT_DATE AND $1::date <= CURRENT_DATE + 7) AS ok', [this.tanggalBooking])).rows[0].ok;
    if (!ok) return false;
    // kunci per slot (harus dipanggil di dalam transaksi) agar dua booking bersamaan tidak sama-sama lolos
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${restoranId}|${this.tanggalBooking}|${this.slotWaktuBooking}`]);
    const kap = (await db.query('SELECT kapasitas_meja FROM pengaturan_kuota WHERE restoran_id = $1', [restoranId])).rows[0]?.kapasitas_meja ?? 0;
    const terpakai = (await db.query( // Q-026
      `SELECT COUNT(*)::int AS n FROM pesanan WHERE restoran_id = $1 AND tanggal_booking = $2
         AND slot_waktu_booking = $3 AND status_pemesanan <> 'DIBATALKAN'`,
      [restoranId, this.tanggalBooking, this.slotWaktuBooking])).rows[0].n;
    return terpakai < kap;
  }

  // Algo-040 (dipanggil di dalam transaksi milik pemanggil)
  async buatTagihan(pelangganId: string, restoranId: string, keranjang: Keranjang, tipePembayaran: string, db: Db) {
    this.pesananId = generateId();
    this.pelangganId = pelangganId;
    this.restoranId = restoranId;
    this.totalHarga = keranjang.hitungTotal();
    this.statusPemesanan = 'MENUNGGU_PEMBAYARAN';
    const booking = this.modePemesanan === 'BOOKING';
    await db.query( // Q-027
      `INSERT INTO pesanan (pesanan_id, pelanggan_id, restoran_id, mode_pemesanan, jumlah_rombongan,
         tanggal_booking, slot_waktu_booking, total_harga, status_pemesanan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'MENUNGGU_PEMBAYARAN')`,
      [this.pesananId, pelangganId, restoranId, this.modePemesanan, this.jumlahRombongan,
       booking ? this.tanggalBooking : null, booking ? this.slotWaktuBooking : null, this.totalHarga]);
    for (const it of keranjang.getDaftarMenu()) { // Q-028
      await db.query('INSERT INTO detail_pesanan (pesanan_id, menu_id, jumlah, subtotal) VALUES ($1,$2,$3,$4)',
        [this.pesananId, it.menu.getMenuId(), it.jumlah, it.menu.getHarga() * it.jumlah]);
    }
    const tagihan = await new MetodePembayaranController().buatTagihan(this.pesananId, this.totalHarga, tipePembayaran, db);
    return { pesananId: this.pesananId, ...tagihan };
  }

  async batalkanPesanan(db: Db): Promise<boolean> { // Q-029
    const r = await db.query(
      `UPDATE pesanan SET status_pemesanan = 'DIBATALKAN'
       WHERE pesanan_id = $1 AND status_pemesanan IN ('MENUNGGU_PEMBAYARAN','DIKONFIRMASI')`, [this.pesananId]);
    if (r.rowCount === 0) return false;
    this.statusPemesanan = 'DIBATALKAN';
    return true;
  }

  async updateStatus(status: StatusPesanan, db: Db): Promise<void> { // Algo-042
    if (this.statusPemesanan === 'DIBATALKAN') return;
    this.statusPemesanan = status;
    await db.query('UPDATE pesanan SET status_pemesanan = $2 WHERE pesanan_id = $1', [this.pesananId, status]);
  }

  static async getDetailPesanan(pesananId: string, db: Db): Promise<Pesanan | null> { // Q-031
    const r = await db.query(
      `SELECT p.*, d.menu_id, m.nama_menu, d.jumlah, d.subtotal FROM pesanan p
       LEFT JOIN detail_pesanan d ON d.pesanan_id = p.pesanan_id
       LEFT JOIN menu m ON m.menu_id = d.menu_id WHERE p.pesanan_id = $1`, [pesananId]);
    if (!r.rows.length) return null;
    const x = r.rows[0];
    const p = new Pesanan(x.mode_pemesanan, x.jumlah_rombongan, null, x.slot_waktu_booking);
    p.pesananId = x.pesanan_id; p.pelangganId = x.pelanggan_id; p.restoranId = x.restoran_id;
    p.totalHarga = Number(x.total_harga); p.statusPemesanan = x.status_pemesanan;
    p.tanggalBooking = x.tanggal_booking ? new Date(x.tanggal_booking).toISOString().slice(0, 10) : null;
    p.daftarItem = r.rows.filter((y: any) => y.menu_id).map((y: any) => ({
      menuId: y.menu_id, namaMenu: y.nama_menu, jumlah: y.jumlah, subtotal: Number(y.subtotal) }));
    return p;
  }

  // Ketersediaan slot booking per tanggal (I-08-04)
  static async slotTersedia(restoranId: string, tanggal: string, daftarSlot: string[], db: Db) {
    const kap = (await db.query('SELECT kapasitas_meja FROM pengaturan_kuota WHERE restoran_id = $1', [restoranId])).rows[0]?.kapasitas_meja ?? 0;
    const r = await db.query(
      `SELECT slot_waktu_booking AS slot, COUNT(*)::int AS n FROM pesanan
       WHERE restoran_id = $1 AND tanggal_booking = $2 AND status_pemesanan <> 'DIBATALKAN' GROUP BY 1`, [restoranId, tanggal]);
    const used = new Map<string, number>(r.rows.map((x: any) => [x.slot, x.n]));
    return daftarSlot.map(s => ({ slot: s, tersedia: (used.get(s) ?? 0) < kap }));
  }
}
