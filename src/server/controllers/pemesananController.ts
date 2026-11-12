/**
 * PemesananController: alur pemesanan UC02 (keranjang -> validasi stok/kuota/booking -> pesanan).
 * Pembayaran dan penerbitan tiket ditangani MetodePembayaranController.
 */
import type { AppContext, SessionUser } from '../context.js';
import { Restoran } from '../models/restoran.js';
import { Menu } from '../models/menu.js';
import {
  Pesanan,
  SLOT_BOOKING,
  validasiJadwalBooking,
  type ItemPesanan,
  type ModePemesanan,
} from '../models/pesanan.js';
import { RiwayatTransaksi } from '../models/pembayaran.js';
import { TiketAntrean } from '../models/antrean.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { teks } from '../utils/validasi.js';

const MODE: ModePemesanan[] = ['DINE_IN', 'TAKEAWAY', 'BOOKING'];

export interface PesananInput {
  restoranId?: unknown;
  mode?: unknown;
  jumlahRombongan?: unknown;
  tanggalBooking?: unknown;
  slotWaktuBooking?: unknown;
  items?: unknown;
}

export class PemesananController {
  constructor(private ctx: AppContext) {}

  /** Status ketersediaan slot booking pada suatu tanggal (I-08). */
  async getSlotBooking(restoranId: string, tanggal: string) {
    const restoran = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (!restoran) throw notFound('Restoran tidak ditemukan');
    const sekarang = new Date();
    const slot = [];
    for (const jam of SLOT_BOOKING) {
      const galat = validasiJadwalBooking(tanggal, jam, 1, sekarang, this.ctx.config.maxBookingDays);
      const terpakai = await Pesanan.hitungBookingSlot(this.ctx.db, restoranId, tanggal, jam);
      slot.push({
        jam,
        terpakai,
        kapasitas: restoran.kapasitas_meja,
        tersedia: !galat && terpakai < restoran.kapasitas_meja,
        alasan: galat ?? (terpakai >= restoran.kapasitas_meja ? 'Penuh' : null),
      });
    }
    return { tanggal, maxHari: this.ctx.config.maxBookingDays, slot };
  }

  /**
   * buatPesanan(): memvalidasi stok (KF07), kuota antrean & meja (KF08, KF18), jadwal booking (KF09),
   * lalu menyimpan pesanan berstatus MENUNGGU_PEMBAYARAN (Algo-040).
   */
  async buatPesanan(user: SessionUser, input: PesananInput) {
    if (!user.pelangganId) throw forbidden('Hanya pelanggan yang dapat memesan');
    const restoranId = teks(input.restoranId);
    const mode = MODE.find((m) => m === input.mode);
    if (!restoranId || !mode) throw badRequest('Restoran dan mode pemesanan wajib dipilih');

    const rawItems = Array.isArray(input.items) ? input.items : [];
    const jumlahPerMenu = new Map<string, number>();
    for (const it of rawItems as { menuId?: unknown; jumlah?: unknown }[]) {
      const menuId = teks(it?.menuId);
      const jumlah = Number(it?.jumlah);
      if (!menuId || !Number.isInteger(jumlah) || jumlah <= 0 || jumlah > 50) {
        throw badRequest('Jumlah menu tidak valid');
      }
      jumlahPerMenu.set(menuId, (jumlahPerMenu.get(menuId) ?? 0) + jumlah);
    }
    if (jumlahPerMenu.size === 0) throw badRequest('Keranjang masih kosong');

    let rombongan = mode === 'TAKEAWAY' ? 1 : Number(input.jumlahRombongan ?? 1);
    if (!Number.isInteger(rombongan) || rombongan < 1 || rombongan > 20) {
      throw badRequest('Jumlah rombongan harus antara 1 dan 20 orang');
    }

    return this.ctx.db.tx(async (q) => {
      const restoran = await Restoran.getDetailRestoran(q, restoranId);
      if (!restoran) throw notFound('Restoran tidak ditemukan atau sudah tidak aktif');

      if (mode !== 'BOOKING') {
        if (restoran.status_antrean === 'TUTUP') throw conflict('Antrean restoran sedang ditutup');
        if (restoran.status_antrean === 'PENUH') throw conflict('Kuota antrean restoran hari ini sudah penuh');
      }

      // Pemeriksaan stok (Algo-020).
      const items: ItemPesanan[] = [];
      const menuHabis: { menuId: string; namaMenu: string; stok: number }[] = [];
      for (const [menuId, jumlah] of jumlahPerMenu) {
        const menu = await Menu.getInfoMenu(q, menuId);
        if (!menu || menu.restoran_id !== restoranId) {
          menuHabis.push({ menuId, namaMenu: menu?.nama_menu ?? 'Menu tidak tersedia', stok: 0 });
          continue;
        }
        if (!Menu.isTersedia(menu, jumlah)) {
          menuHabis.push({ menuId, namaMenu: menu.nama_menu, stok: menu.stok });
          continue;
        }
        items.push({ menu_id: menuId, nama_menu: menu.nama_menu, harga: menu.harga, jumlah, subtotal: menu.harga * jumlah });
      }
      if (menuHabis.length) {
        throw conflict('Mohon maaf, terdapat menu pilihan yang telah habis', { menuHabis });
      }

      let tanggal: string | null = null;
      let slot: string | null = null;
      if (mode === 'DINE_IN' && restoran.meja_tersisa <= 0) {
        throw conflict('Meja dine-in sedang penuh. Silakan pilih takeaway atau booking tempat');
      }
      if (mode === 'BOOKING') {
        tanggal = teks(input.tanggalBooking);
        slot = teks(input.slotWaktuBooking);
        const galat = validasiJadwalBooking(tanggal, slot, rombongan, new Date(), this.ctx.config.maxBookingDays);
        if (galat) throw badRequest(galat);
        const terpakai = await Pesanan.hitungBookingSlot(q, restoranId, tanggal, slot);
        if (terpakai >= restoran.kapasitas_meja) {
          throw conflict(
            'Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan atau kuota meja pada jam tersebut telah penuh',
          );
        }
      }
      if (mode === 'TAKEAWAY') rombongan = 1;

      const pesananId = await Pesanan.simpan(q, {
        pelangganId: user.pelangganId!,
        restoranId,
        mode,
        rombongan,
        tanggal,
        slot,
        items,
        biayaLayanan: this.ctx.config.biayaLayanan,
      });
      return Pesanan.getDetailPesanan(q, pesananId);
    });
  }

  /** getDetailPesanan() dengan pemeriksaan kepemilikan. */
  async getPesanan(user: SessionUser, pesananId: string) {
    const detail = await Pesanan.getDetailPesanan(this.ctx.db, pesananId);
    if (!detail) throw notFound('Pesanan tidak ditemukan');
    const milikPelanggan = user.pelangganId && detail.pelanggan_id === user.pelangganId;
    const milikRestoran = user.restoranId && detail.restoran_id === user.restoranId;
    if (!milikPelanggan && !milikRestoran && user.role !== 'ADMIN') throw forbidden();
    const bukti = await RiwayatTransaksi.getBuktiPembayaran(this.ctx.db, pesananId);
    return { ...detail, bukti, batasWaktuBayarMenit: this.ctx.config.paymentTimeoutMinutes };
  }

  /** batalkanPesanan() oleh pelanggan sebelum membayar. */
  async batalkanPesanan(user: SessionUser, pesananId: string) {
    const detail = await this.getPesanan(user, pesananId);
    if (detail.pelanggan_id !== user.pelangganId) throw forbidden();
    const menunggu = await this.ctx.db.query<{ kode_bayar: string }>(
      `SELECT kode_bayar FROM pembayaran WHERE pesanan_id = $1 AND status_pembayaran = 'MENUNGGU'`,
      [pesananId],
    );
    const ok = await this.ctx.db.tx(async (q) => {
      const batal = await Pesanan.batalkanPesanan(q, pesananId);
      if (batal) {
        await q.query(
          `UPDATE pembayaran SET status_pembayaran = 'GAGAL' WHERE pesanan_id = $1 AND status_pembayaran = 'MENUNGGU'`,
          [pesananId],
        );
      }
      return batal;
    });
    if (!ok) throw conflict('Pesanan yang sudah dibayar tidak dapat dibatalkan');
    for (const m of menunggu) await this.ctx.gateway.batalkan(m.kode_bayar);
    return { pesananId, status: 'DIBATALKAN' };
  }

  async daftarPesananSaya(user: SessionUser) {
    if (!user.pelangganId) throw forbidden();
    return Pesanan.daftarMilikPelanggan(this.ctx.db, user.pelangganId);
  }

  /** Tiket antrean + bukti pembayaran (I-10). */
  async getTiket(user: SessionUser, idTiket: string) {
    const tiket = await TiketAntrean.getDetailTiket(this.ctx.db, idTiket);
    if (!tiket) throw notFound('Tiket tidak ditemukan');
    const pesanan = await this.getPesanan(user, tiket.pesanan_id);
    return { tiket, pesanan };
  }
}
