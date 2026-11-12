/**
 * PengaturanKuotaController (C21): menampilkan & menyimpan kuota antrean dan kapasitas meja,
 * termasuk menutup antrean sementara (UC07).
 */
import type { AppContext, SessionUser } from '../context.js';
import { Antrean } from '../models/antrean.js';
import { Restoran } from '../models/restoran.js';
import { Kuota } from '../models/kuota.js';
import { eventBus } from '../realtime/eventBus.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { bilanganCacah } from '../utils/validasi.js';

export class PengaturanKuotaController {
  constructor(private ctx: AppContext) {}

  private restoranId(user: SessionUser): string {
    if (!user.restoranId) throw forbidden('Akun restoran belum terverifikasi sebagai mitra');
    return user.restoranId;
  }

  /** displaySettings(). */
  async displaySettings(user: SessionUser) {
    const restoranId = this.restoranId(user);
    const restoran = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (!restoran) throw notFound();
    return {
      kuotaMaksimum: restoran.kuota_maksimum,
      kapasitasMeja: restoran.kapasitas_meja,
      antreanTutup: Kuota.isAntreanTutup(restoran),
      pratinjau: restoran,
    };
  }

  /** onSaveSettings(): validasi (Algo-087) lalu simpan (Algo-086). */
  async onSaveSettings(user: SessionUser, input: { kuotaMaksimum?: unknown; kapasitasMeja?: unknown; tutup?: unknown }) {
    const restoranId = this.restoranId(user);
    // Iterasi 2: "tutup sementara" disimpan terpisah, sehingga nilai kuota tetap tersimpan saat antrean dibuka lagi.
    const tutup = input.tutup === true;
    const lama = await Kuota.get(this.ctx.db, restoranId);
    const kuota = input.kuotaMaksimum === undefined || input.kuotaMaksimum === '' ? lama?.kuota_maksimum ?? null
      : bilanganCacah(input.kuotaMaksimum);
    const meja = bilanganCacah(input.kapasitasMeja);
    const galat: Record<string, string> = {};
    if (kuota === null || kuota > 10_000) galat.kuotaMaksimum = 'Kuota antrean harus berupa angka bulat 0 - 10000';
    if (meja === null || meja > 1_000) galat.kapasitasMeja = 'Kapasitas meja harus berupa angka bulat 0 - 1000';
    if (Object.keys(galat).length) {
      throw badRequest('Input tidak valid. Masukkan angka bulat yang tidak negatif', { fields: galat });
    }
    await this.ctx.db.tx(async (q) => {
      await Kuota.updateKapasitas(q, restoranId, kuota!, meja!, tutup);
      await Antrean.updateStatus(q, restoranId, this.ctx.config.menitPerAntrean);
    });
    eventBus.antreanBerubah(restoranId, 'kuota');
    return this.displaySettings(user);
  }
}
