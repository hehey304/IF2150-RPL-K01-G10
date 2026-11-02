// C01 Pelanggan (bagian UC02): getDetails, pilihMetodeBayar (Algo-004), konfirmasiPembayaran (Algo-005).
// pilihMenu (menambah ke keranjang) berjalan di klien: store/keranjangStore.ts.
import { type Db, withTx, pool } from '../db/tx.js';
import { AppError } from '../errors.js';
import { Keranjang } from './Keranjang.js';
import { Pesanan, type ModePemesanan } from './Pesanan.js';
import { MetodePembayaranController } from '../controllers/MetodePembayaranController.js';

export interface PermintaanTagihan {
  restoranId: string;
  modePemesanan: ModePemesanan;
  jumlahRombongan?: number;
  tanggalBooking?: string;
  slotWaktuBooking?: string;
  items: { menuId: string; jumlah: number }[];
  tipePembayaran: string;
}
const MODE: string[] = ['DINE_IN', 'TAKEAWAY', 'PRE_ORDER', 'BOOKING'];
const TIPE: string[] = ['QRIS', 'TRANSFER_BANK', 'E_WALLET'];

export class Pelanggan {
  static async getDetails(pelangganId: string, db: Db = pool) {
    const r = await db.query('SELECT pelanggan_id, id_akun, nama, no_hp, email FROM pelanggan WHERE pelanggan_id = $1', [pelangganId]);
    return r.rows[0] ?? null;
  }
  static async getByAkun(idAkun: string, db: Db = pool): Promise<string> {
    const r = await db.query('SELECT pelanggan_id FROM pelanggan WHERE id_akun = $1', [idAkun]);
    if (!r.rows[0]) throw new AppError(403, 'BUKAN_PELANGGAN', 'Akun bukan pelanggan');
    return r.rows[0].pelanggan_id;
  }

  // Algo-004 + pemeriksaan stok & kuota (Algo-020, I-07-07)
  static pilihMetodeBayar(idAkun: string, inp: PermintaanTagihan) {
    return withTx(async db => {
      if (!MODE.includes(inp.modePemesanan)) throw new AppError(400, 'MODE_TIDAK_VALID', 'Mode pemesanan tidak valid');
      if (!TIPE.includes(inp.tipePembayaran)) throw new AppError(400, 'TIPE_BAYAR_TIDAK_VALID', 'Metode pembayaran tidak valid');
      const pelangganId = await Pelanggan.getByAkun(idAkun, db);

      const keranjang = await Keranjang.dariPermintaan(inp.items, inp.restoranId, db);
      if (keranjang.getDaftarMenu().length === 0) throw new AppError(400, 'KERANJANG_KOSONG', 'Keranjang masih kosong');

      // Alt 3: stok habis
      const habis: { menuId: string; namaMenu: string }[] = [];
      for (const it of keranjang.getDaftarMenu())
        if (!(await it.menu.isTersedia(it.jumlah, db))) habis.push({ menuId: it.menu.getMenuId(), namaMenu: it.menu.getNamaMenu() });
      if (habis.length) throw new AppError(409, 'STOK_HABIS', 'Mohon maaf, terdapat menu pilihan yang telah habis', habis);

      const pesanan = new Pesanan(inp.modePemesanan, inp.jumlahRombongan ?? null, inp.tanggalBooking ?? null, inp.slotWaktuBooking ?? null);

      if (inp.modePemesanan === 'BOOKING') { // Alt 2 / Alt 5
        if (!(await pesanan.validasiBooking(inp.restoranId, db)))
          throw new AppError(409, 'BOOKING_TIDAK_VALID', 'Tanggal booking tidak valid atau slot sudah penuh');
      } else if (inp.modePemesanan === 'DINE_IN') {
        if (!inp.jumlahRombongan || inp.jumlahRombongan <= 0) throw new AppError(400, 'ROMBONGAN_TIDAK_VALID', 'Jumlah rombongan tidak valid');
        // Takeaway/Pre-order mengabaikan kuota meja. kuota_maksimum = 0 dianggap tak dibatasi. (Kuota = C20/UC07)
        const k = (await db.query(
          `SELECT q.kuota_maksimum,
             (SELECT COUNT(*)::int FROM tiket_antrean t JOIN antrean a USING (antrean_id)
               WHERE a.restoran_id = $1 AND t.tanggal_antre = CURRENT_DATE
                 AND t.status_antrean IN ('MENUNGGU','DIPANGGIL','HADIR')) AS aktif
           FROM pengaturan_kuota q WHERE q.restoran_id = $1`, [inp.restoranId])).rows[0];
        if (k && k.kuota_maksimum > 0 && k.aktif >= k.kuota_maksimum)
          throw new AppError(409, 'KUOTA_PENUH', 'Kuota antrean restoran sudah penuh');
      }
      return pesanan.buatTagihan(pelangganId, inp.restoranId, keranjang, inp.tipePembayaran, db);
    });
  }

  // Algo-005 (sisi server)
  static konfirmasiPembayaran(idAkun: string, idPembayaran: string) {
    return withTx(async db => {
      const pelangganId = await Pelanggan.getByAkun(idAkun, db);
      const own = (await db.query(
        'SELECT ps.pelanggan_id FROM pembayaran pb JOIN pesanan ps USING (pesanan_id) WHERE pb.id_pembayaran = $1 FOR UPDATE OF pb', [idPembayaran])).rows[0];
      if (!own) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pembayaran tidak ditemukan');
      if (own.pelanggan_id !== pelangganId) throw new AppError(403, 'DILARANG', 'Bukan pembayaran Anda');

      let hasil;
      try {
        hasil = await new MetodePembayaranController().verifikasiPembayaran(idPembayaran, db);
      } catch (e: any) {
        if (e?.code === 'STOK_HABIS') throw new AppError(409, 'STOK_HABIS', 'Mohon maaf, terdapat menu pilihan yang telah habis');
        throw e;
      }
      if (!hasil.sukses) {
        if (hasil.alasan === 'KEDALUWARSA') throw new AppError(410, 'KEDALUWARSA', 'Batas waktu pembayaran habis. Transaksi dibatalkan');
        throw new AppError(402, 'BELUM_DIBAYAR', 'Pembayaran belum diterima');
      }
      if (hasil.perluTiket && !hasil.tiket) throw new AppError(409, 'ANTREAN_TUTUP', 'Antrean restoran sedang ditutup'); // rollback
      return { sukses: true, pesananId: hasil.pesananId, tiket: hasil.tiket ? hasil.tiket.toJSON() : null };
    });
  }

  // Detail pesanan milik pelanggan (+ status bayar & tiket) untuk I-09/I-10
  static async lihatPesanan(idAkun: string, pesananId: string) {
    const pelangganId = await Pelanggan.getByAkun(idAkun);
    const p = await Pesanan.getDetailPesanan(pesananId, pool);
    if (!p || p.pelangganId !== pelangganId) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan');
    const pb = (await pool.query(
      'SELECT id_pembayaran, tipe_pembayaran, kode_bayar, batas_waktu_bayar, status_pembayaran FROM pembayaran WHERE pesanan_id = $1 ORDER BY batas_waktu_bayar DESC LIMIT 1', [pesananId])).rows[0] ?? null;
    const t = (await pool.query(
      'SELECT id_tiket, nomor_urut, tipe_antrean, waktu_terbit, status_antrean, estimasi_waktu_tunggu FROM tiket_antrean WHERE pesanan_id = $1', [pesananId])).rows[0] ?? null;
    return { ...p, pembayaran: pb, tiket: t };
  }
}
