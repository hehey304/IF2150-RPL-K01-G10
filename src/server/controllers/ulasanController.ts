/**
 * UlasanController (iterasi 2): pelanggan memberi rating & ulasan setelah pesanan selesai.
 */
import type { AppContext, SessionUser } from '../context.js';
import { Notifikasi } from '../models/notifikasi.js';
import { Pesanan } from '../models/pesanan.js';
import { Ulasan } from '../models/ulasan.js';
import { eventBus } from '../realtime/eventBus.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { teks } from '../utils/validasi.js';

export class UlasanController {
  constructor(private ctx: AppContext) {}

  /** Ulasan pada sebuah pesanan (null bila belum diulas) beserta apakah pesanan bisa diulas. */
  async getUlasanPesanan(user: SessionUser, pesananId: string) {
    const pesanan = await Pesanan.getById(this.ctx.db, pesananId);
    if (!pesanan) throw notFound('Pesanan tidak ditemukan');
    if (pesanan.pelanggan_id !== user.pelangganId) throw forbidden();
    const ulasan = await Ulasan.getByPesanan(this.ctx.db, pesananId);
    return { ulasan, bisaDiulas: !ulasan && pesanan.status_pemesanan === 'SELESAI' };
  }

  async kirimUlasan(user: SessionUser, pesananId: string, input: { rating?: unknown; komentar?: unknown }) {
    const rating = Number(input.rating);
    const komentar = teks(input.komentar);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw badRequest('Pilih rating 1 sampai 5 bintang', { fields: { rating: 'Pilih rating 1-5' } });
    }
    if (komentar.length > 300) throw badRequest('Ulasan maksimal 300 karakter', { fields: { komentar: 'Maksimal 300 karakter' } });
    const hasil = await this.ctx.db.tx(async (q) => {
      const pesanan = await Pesanan.getById(q, pesananId);
      if (!pesanan) throw notFound('Pesanan tidak ditemukan');
      if (pesanan.pelanggan_id !== user.pelangganId) throw forbidden();
      if (pesanan.status_pemesanan !== 'SELESAI') throw conflict('Ulasan hanya bisa diberikan setelah pesanan selesai');
      if (await Ulasan.getByPesanan(q, pesananId)) throw conflict('Pesanan ini sudah diulas');
      const u = await Ulasan.simpan(q, { pesananId, pelangganId: pesanan.pelanggan_id, restoranId: pesanan.restoran_id, rating, komentar });
      await Notifikasi.keRestoran(q, pesanan.restoran_id, {
        judul: `Ulasan baru ${'★'.repeat(rating)}`,
        isi: komentar || 'Tanpa komentar',
        tautan: '#/resto/profil',
      });
      return u;
    });
    eventBus.antreanBerubah(hasil.restoran_id, 'ulasan');
    return hasil;
  }

  async ulasanRestoran(restoranId: string) {
    return Ulasan.terbaru(this.ctx.db, restoranId, 10);
  }
}
