/**
 * ProfilRestoranController (iterasi 2): halaman "Profil Restoran" pada panel restoran (I-14-01)
 * untuk mengubah deskripsi, alamat, jam buka, kontak, dan foto restoran.
 */
import type { AppContext, SessionUser } from '../context.js';
import { ProfilRestoran } from '../models/profilRestoran.js';
import { eventBus } from '../realtime/eventBus.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { hapusBerkas } from '../utils/unggah.js';
import { NO_HP_RE, normalisasiNoHp, teks } from '../utils/validasi.js';

export const JAM_BUKA_RE = /^([01]\d|2[0-3])[.:][0-5]\d\s*-\s*([01]\d|2[0-3])[.:][0-5]\d$/;

export class ProfilRestoranController {
  constructor(private ctx: AppContext) {}

  private restoranId(user: SessionUser): string {
    if (!user.restoranId) throw forbidden('Akun restoran belum terverifikasi sebagai mitra');
    return user.restoranId;
  }

  async getProfil(user: SessionUser) {
    const profil = await ProfilRestoran.get(this.ctx.db, this.restoranId(user));
    if (!profil) throw notFound('Restoran tidak ditemukan');
    return profil;
  }

  async ubahProfil(user: SessionUser, input: Record<string, unknown>) {
    const restoranId = this.restoranId(user);
    const d = {
      deskripsi: teks(input.deskripsi).slice(0, 500),
      alamat: teks(input.alamat),
      jamBuka: teks(input.jamBuka).replace(/\s*-\s*/, ' - '),
      noHp: normalisasiNoHp(teks(input.noHp)) || null,
      kategori: teks(input.kategori),
      lokasi: teks(input.lokasi),
    };
    const galat: Record<string, string> = {};
    if (d.alamat.length < 10) galat.alamat = 'Alamat lengkap minimal 10 karakter';
    if (!JAM_BUKA_RE.test(d.jamBuka)) galat.jamBuka = 'Format jam buka: 10.00 - 22.00';
    if (d.noHp && !NO_HP_RE.test(d.noHp)) galat.noHp = 'Nomor telepon tidak valid';
    if (d.kategori.length < 3) galat.kategori = 'Kategori wajib diisi';
    if (d.lokasi.length < 3) galat.lokasi = 'Area wajib diisi';
    if (Object.keys(galat).length) throw badRequest('Data profil restoran belum valid', { fields: galat });
    await ProfilRestoran.ubah(this.ctx.db, restoranId, d);
    eventBus.antreanBerubah(restoranId, 'profil');
    return this.getProfil(user);
  }

  async gantiFoto(user: SessionUser, berkas: { filename: string } | undefined) {
    const restoranId = this.restoranId(user);
    if (!berkas) throw badRequest('Pilih foto terlebih dahulu');
    const lama = await ProfilRestoran.aturFoto(this.ctx.db, restoranId, berkas.filename);
    hapusBerkas(this.ctx.config.uploadDir, lama);
    eventBus.antreanBerubah(restoranId, 'profil');
    return this.getProfil(user);
  }

  async getFoto(restoranId: string) {
    return ProfilRestoran.getFoto(this.ctx.db, restoranId);
  }
}
