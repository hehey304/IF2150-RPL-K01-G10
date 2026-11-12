/**
 * KeluhanController (C41): menerima keluhan pelanggan (UC13) serta menampilkan dan
 * menanggapi keluhan oleh admin (UC14).
 */
import type { AppContext, SessionUser } from '../context.js';
import { KATEGORI_KELUHAN, Keluhan, type StatusKeluhan } from '../models/keluhan.js';
import { Pesanan } from '../models/pesanan.js';
import { Notifikasi } from '../models/notifikasi.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { teks } from '../utils/validasi.js';

export class KeluhanController {
  constructor(private ctx: AppContext) {}

  /** kirimKeluhan() (Algo-138). */
  async kirimKeluhan(user: SessionUser, input: { pesananId?: unknown; kategori?: unknown; isi?: unknown }) {
    if (!user.pelangganId) throw forbidden('Hanya pelanggan yang dapat mengirim keluhan');
    const isi = teks(input.isi);
    const kategori = (KATEGORI_KELUHAN as readonly string[]).includes(teks(input.kategori)) ? teks(input.kategori) : '';
    const galat: Record<string, string> = {};
    if (!kategori) galat.kategori = 'Pilih kategori keluhan';
    if (isi.length < 10) galat.isi = 'Isi keluhan minimal 10 karakter';
    if (isi.length > 500) galat.isi = 'Isi keluhan maksimal 500 karakter';
    if (Object.keys(galat).length) throw badRequest('Keluhan belum lengkap', { fields: galat });

    let pesananId: string | null = teks(input.pesananId) || null;
    let restoranId: string | null = null;
    if (pesananId) {
      const pesanan = await Pesanan.getById(this.ctx.db, pesananId);
      if (!pesanan || pesanan.pelanggan_id !== user.pelangganId) throw badRequest('Pesanan terkait tidak valid');
      restoranId = pesanan.restoran_id;
    } else {
      pesananId = null;
    }
    return Keluhan.simpanKeluhan(this.ctx.db, { pelangganId: user.pelangganId, pesananId, restoranId, kategori, isi });
  }

  async keluhanSaya(user: SessionUser) {
    if (!user.pelangganId) throw forbidden();
    return Keluhan.daftarMilikPelanggan(this.ctx.db, user.pelangganId);
  }

  /** tampilkanKeluhan() (Algo-140). */
  async tampilkanKeluhan(params: { status?: unknown; q?: unknown }) {
    const status = ['BARU', 'DIBACA', 'DITANGGAPI'].includes(String(params.status)) ? (params.status as StatusKeluhan) : null;
    return Keluhan.daftar(this.ctx.db, status, teks(params.q));
  }

  /** showDetailKeluhan(): membuka keluhan sekaligus menandainya "Dibaca" (Algo-112). */
  async detailKeluhan(idKeluhan: string) {
    const k = await Keluhan.getById(this.ctx.db, idKeluhan);
    if (!k) throw notFound('Keluhan tidak ditemukan');
    if (k.status === 'BARU') await Keluhan.updateStatusKeluhan(this.ctx.db, idKeluhan, 'DIBACA');
    const pesanan = k.pesanan_id ? await Pesanan.getDetailPesanan(this.ctx.db, k.pesanan_id) : null;
    return { ...k, status: k.status === 'BARU' ? 'DIBACA' : k.status, pesanan };
  }

  /** tanggapiKeluhan(). */
  async tanggapiKeluhan(idKeluhan: string, tanggapanInput: unknown) {
    const tanggapan = teks(tanggapanInput);
    if (tanggapan.length < 5 || tanggapan.length > 1000) throw badRequest('Tanggapan harus 5 - 1000 karakter');
    const k = await Keluhan.tanggapi(this.ctx.db, idKeluhan, tanggapan);
    if (!k) throw notFound('Keluhan tidak ditemukan');
    await Notifikasi.kePelanggan(this.ctx.db, k.pelanggan_id, {
      judul: 'Keluhanmu sudah ditanggapi admin',
      isi: tanggapan.slice(0, 140),
      tautan: '#/keluhan',
    });
    return k;
  }
}
