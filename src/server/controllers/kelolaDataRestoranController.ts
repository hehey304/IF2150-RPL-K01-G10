/**
 * KelolaDataRestoranController (C33): daftar restoran mitra untuk admin dan
 * penghapusan (penonaktifan) restoran beserta relasi menunya (UC15).
 */
import type { AppContext } from '../context.js';
import { Restoran } from '../models/restoran.js';
import { Notifikasi } from '../models/notifikasi.js';
import { eventBus } from '../realtime/eventBus.js';
import { notFound } from '../utils/errors.js';
import { teks } from '../utils/validasi.js';

export class KelolaDataRestoranController {
  constructor(private ctx: AppContext) {}

  /** Filter: semua | aktif | nonaktif | banyak-keluhan (>= 3 keluhan dalam 7 hari). */
  async daftarRestoran(params: { q?: unknown; filter?: unknown }) {
    const f = String(params.filter ?? 'semua');
    const status = f === 'aktif' || f === 'nonaktif' ? f : f === 'banyak-keluhan' ? 'aktif' : 'semua';
    const daftar = await Restoran.daftarUntukAdmin(this.ctx.db, teks(params.q), status);
    return f === 'banyak-keluhan' ? daftar.filter((r) => r.keluhan_7_hari >= 3) : daftar;
  }

  /** hapusDataRestoran() + nonaktifkanRelasiMenu() (Algo-115, Algo-117). */
  async hapusDataRestoran(restoranId: string) {
    const restoran = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (!restoran) throw notFound('Restoran tidak ditemukan atau sudah dihapus');
    const terdampak = await this.ctx.db.query<{ pelanggan_id: string }>(
      `SELECT DISTINCT t.pelanggan_id FROM tiket_antrean t JOIN antrean a ON a.antrean_id = t.antrean_id
       WHERE a.restoran_id = $1 AND t.status_antrean IN ('TERJADWAL', 'MENUNGGU', 'DIPANGGIL')`,
      [restoranId],
    );
    const ok = await this.ctx.db.tx((q) => Restoran.setSoftDelete(q, restoranId));
    if (!ok) throw notFound('Restoran tidak ditemukan atau sudah dihapus');
    eventBus.antreanBerubah(restoranId, 'restoran-dihapus');
    for (const { pelanggan_id } of terdampak) {
      await Notifikasi.kePelanggan(this.ctx.db, pelanggan_id, {
        judul: `Antrean di ${restoran.nama_restoran} dibatalkan`,
        isi: 'Restoran dinonaktifkan dari antri.in. Hubungi admin melalui menu Keluhan untuk pengembalian dana.',
        tautan: '#/keluhan',
      });
    }
    await Notifikasi.kirim(this.ctx.db, restoran.id_akun, {
      judul: 'Restoran dinonaktifkan admin',
      isi: `${restoran.nama_restoran} tidak lagi tampil di antri.in. Hubungi tim antri.in untuk informasi lebih lanjut.`,
    });
    await this.ctx.email.kirimEmail({
      penerima: restoran.email_kontak,
      jenis: 'RESTORAN_DIHAPUS',
      subjek: 'Restoran Anda dinonaktifkan dari antri.in',
      isiPesan: `${restoran.nama_restoran} telah dinonaktifkan dari platform antri.in oleh admin. ` +
        'Hubungi tim antri.in untuk informasi lebih lanjut.',
    });
    return { restoranId, namaRestoran: restoran.nama_restoran, dihapus: true };
  }
}
