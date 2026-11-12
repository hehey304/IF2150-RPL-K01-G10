/**
 * PencarianController (C35): pencarian & filter restoran, preview menu, dan status antrean (UC01).
 */
import type { AppContext } from '../context.js';
import { Restoran } from '../models/restoran.js';
import { Menu } from '../models/menu.js';
import { notFound } from '../utils/errors.js';
import { teks } from '../utils/validasi.js';

export class PencarianController {
  constructor(private ctx: AppContext) {}

  /** cariRestoran() + terapkanFilter(). Bila hasil kosong, kembalikan restoran paling viral sebagai saran. */
  async cariRestoran(params: Record<string, unknown>) {
    const minRating = Number(params.minRating);
    const filter = {
      kataKunci: teks(params.q),
      kategori: teks(params.kategori) || undefined,
      lokasi: teks(params.lokasi) || undefined,
      minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : undefined,
      antreanPendek: params.antreanPendek === 'true' || params.antreanPendek === true,
    };
    const hasil = await Restoran.cari(this.ctx.db, filter);
    const saran = hasil.length === 0 ? await Restoran.cari(this.ctx.db, { limit: 4 }) : [];
    const [kategori, lokasi] = await Promise.all([
      Restoran.daftarKategori(this.ctx.db),
      Restoran.daftarLokasi(this.ctx.db),
    ]);
    return { hasil, saran, kategori, lokasi };
  }

  /** Detail restoran + menu + status antrean (I-06). */
  async getDetailRestoran(restoranId: string) {
    const restoran = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (!restoran) throw notFound('Restoran tidak ditemukan atau sudah tidak aktif');
    const menu = await Menu.getDaftarMenu(this.ctx.db, restoranId);
    return { restoran, menu };
  }
}
