/**
 * PemantauAntreanController (C10): membaca status antrean pelanggan dan mendorong
 * pembaruan secara real-time (Server-Sent Events) ke HalamanStatusAntrean & dashboard restoran (UC03, UC09).
 */
import type { Response } from 'express';
import type { AppContext, SessionUser } from '../context.js';
import { TiketAntrean } from '../models/antrean.js';
import { Pesanan } from '../models/pesanan.js';
import { eventBus } from '../realtime/eventBus.js';
import { forbidden, notFound } from '../utils/errors.js';

export class PemantauAntreanController {
  constructor(private ctx: AppContext) {}

  /** getStatusAntrean(): status tiket pelanggan beserta sisa antrean & estimasi. */
  async getStatusAntrean(user: SessionUser, idTiket: string) {
    const tiket = await TiketAntrean.getDetailTiket(this.ctx.db, idTiket);
    if (!tiket) throw notFound('Tiket antrean tidak ditemukan');
    if (tiket.pelanggan_id !== user.pelangganId && user.role !== 'ADMIN') throw forbidden();
    const pesanan = await Pesanan.getDetailPesanan(this.ctx.db, tiket.pesanan_id);
    const aktif = tiket.status_antrean === 'MENUNGGU' || tiket.status_antrean === 'DIPANGGIL';
    return {
      tiket,
      pesanan,
      sisaAntrean: aktif ? tiket.posisi : 0,
      // Iterasi 2: estimasi memakai waktu layanan nyata restoran (lihat Antrean.menitPerAntreanAktual).
      estimasiMenit: aktif ? tiket.estimasi_waktu_tunggu : 0,
      disiapkan: !!tiket.disiapkan_pada,
      giliranmu: tiket.status_antrean === 'DIPANGGIL',
      batasHadirMenit: this.ctx.config.autoDequeueMinutes,
    };
  }

  /** Tiket aktif terbaru milik pelanggan (kartu "Antreanmu" di beranda). */
  async getAntreanAktifSaya(user: SessionUser) {
    if (!user.pelangganId) return [];
    const rows = await this.ctx.db.query<{ id_tiket: string }>(
      `SELECT id_tiket FROM tiket_antrean WHERE pelanggan_id = $1 AND status_antrean IN ('MENUNGGU', 'DIPANGGIL', 'TERJADWAL')
       ORDER BY waktu_terbit DESC LIMIT 5`,
      [user.pelangganId],
    );
    return Promise.all(rows.map((r) => this.getStatusAntrean(user, r.id_tiket)));
  }

  /** updateTampilanAntrean(): membuka kanal SSE untuk satu restoran. */
  subscribe(restoranId: string, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write(`event: siap\ndata: {}\n\n`);
    const kanal = `antrean:${restoranId}`;
    const kirim = (data: unknown) => res.write(`event: antrean\ndata: ${JSON.stringify(data)}\n\n`);
    const detak = setInterval(() => res.write(`: ping\n\n`), 25_000);
    eventBus.on(kanal, kirim);
    res.on('close', () => {
      clearInterval(detak);
      eventBus.off(kanal, kirim);
    });
  }
}
