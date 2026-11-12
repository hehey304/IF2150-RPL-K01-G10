/**
 * KelolaAntreanController (C16): dashboard antrean restoran, dequeue manual,
 * dequeue otomatis setelah 30 menit (timer), dan check-in booking (UC06, UC09).
 */
import type { AppContext, SessionUser } from '../context.js';
import { Antrean, TiketAntrean } from '../models/antrean.js';
import { Restoran } from '../models/restoran.js';
import { Kuota } from '../models/kuota.js';
import { Pesanan } from '../models/pesanan.js';
import { eventBus } from '../realtime/eventBus.js';
import { conflict, forbidden, notFound } from '../utils/errors.js';
import { formatNomorAntrean } from '../utils/ids.js';

export class KelolaAntreanController {
  private timer: NodeJS.Timeout | null = null;

  constructor(private ctx: AppContext) {}

  private restoranId(user: SessionUser): string {
    if (!user.restoranId) throw forbidden('Akun restoran belum terverifikasi sebagai mitra');
    return user.restoranId;
  }

  /** getAntrean(): data DashboardAntreanPage (I-14). */
  async getAntrean(user: SessionUser) {
    const restoranId = this.restoranId(user);
    const antrean = await Antrean.updateStatus(this.ctx.db, restoranId, this.ctx.config.menitPerAntrean);
    const [restoran, kuota, daftar, booking] = await Promise.all([
      Restoran.getDetailRestoran(this.ctx.db, restoranId),
      Kuota.get(this.ctx.db, restoranId),
      Antrean.getDetailAntrean(this.ctx.db, restoranId),
      Pesanan.daftarBookingRestoran(this.ctx.db, restoranId),
    ]);
    if (!restoran || !antrean || !kuota) throw notFound('Data restoran tidak ditemukan');
    const tiketHariIni = await Antrean.tiketHariIni(this.ctx.db, antrean.antrean_id);
    return {
      restoran: { restoranId, namaRestoran: restoran.nama_restoran },
      ringkasan: {
        antreanAktif: antrean.total_antrean,
        nomorDilayani: antrean.nomor_dilayani,
        mejaTerisi: restoran.meja_terisi,
        kapasitasMeja: kuota.kapasitas_meja,
        dineIn: daftar.filter((d) => d.tipe_antrean === 'DINE_IN').length,
        takeaway: daftar.filter((d) => d.tipe_antrean === 'TAKEAWAY').length,
        statusAntrean: antrean.status_antrean,
        kuotaMaksimum: kuota.kuota_maksimum,
        antreanDitutup: kuota.antrean_ditutup,
        menitPerAntrean: antrean.total_antrean
          ? Math.round(antrean.estimasi_waktu_tunggu / antrean.total_antrean)
          : this.ctx.config.menitPerAntrean,
        modeSimulasi: restoran.mode_simulasi,
        tiketHariIni,
      },
      daftar,
      booking,
      autoDequeueMenit: this.ctx.config.autoDequeueMinutes,
    };
  }

  /**
   * processDequeue(): mengeluarkan pelanggan terdepan (Algo-070). idTiket yang dikirim dari layar
   * harus tetap pelanggan terdepan, untuk mencegah dequeue ganda saat data layar sudah usang.
   */
  async processDequeue(user: SessionUser, idTiket?: string) {
    const restoranId = this.restoranId(user);
    const hasil = await this.ctx.db.tx(async (q) => {
      const antrean = await Antrean.getByRestoran(q, restoranId);
      const front = antrean ? await Antrean.getFrontCustomer(q, antrean.antrean_id) : null;
      if (!front) throw conflict('Belum ada antrean saat ini');
      if (idTiket && front.id_tiket !== idTiket) {
        throw conflict('Antrean sudah berubah. Muat ulang dashboard lalu coba lagi');
      }
      return Antrean.dequeueCustomer(q, restoranId, 'SELESAI', this.ctx.config.menitPerAntrean);
    });
    eventBus.antreanBerubah(restoranId, 'dequeue');
    return { tiket: hasil, nomor: hasil ? formatNomorAntrean(hasil.nomor_urut) : null };
  }

  /** Menandai pesanan mulai disiapkan dapur (iterasi 2, I-14 tombol "Mulai siapkan"). */
  async tandaiDisiapkan(user: SessionUser, idTiket: string) {
    const restoranId = this.restoranId(user);
    const t = await Antrean.tandaiDisiapkan(this.ctx.db, restoranId, idTiket);
    if (!t) throw conflict('Tiket tidak ditemukan atau sudah disiapkan');
    eventBus.antreanBerubah(restoranId, 'disiapkan');
    return { idTiket, disiapkanPada: t.disiapkan_pada };
  }

  /** Menandai booking sudah hadir (reservasi terpenuhi). */
  async tandaiHadirBooking(user: SessionUser, idTiket: string) {
    const restoranId = this.restoranId(user);
    const tiket = await TiketAntrean.getDetailTiket(this.ctx.db, idTiket);
    if (!tiket || tiket.restoran_id !== restoranId) throw notFound('Booking tidak ditemukan');
    if (tiket.status_antrean !== 'TERJADWAL') throw conflict('Booking ini sudah diproses');
    await this.ctx.db.tx(async (q) => {
      await TiketAntrean.updateStatusTiket(q, idTiket, 'SELESAI');
      await Pesanan.updateStatus(q, tiket.pesanan_id, 'SELESAI');
    });
    eventBus.antreanBerubah(restoranId, 'booking-hadir');
    return { idTiket, status: 'SELESAI' };
  }

  /**
   * Dequeue otomatis (UC06 Skenario Alternatif 2): pelanggan yang sudah dipanggil namun tidak hadir
   * dalam AUTO_DEQUEUE_MINUTES menit ditandai DILEWATI.
   */
  async autoDequeue(): Promise<string[]> {
    const { autoDequeueMinutes, menitPerAntrean } = this.ctx.config;
    const daftar = await Antrean.cariTiketKedaluwarsa(this.ctx.db, autoDequeueMinutes);
    const diproses: string[] = [];
    for (const { restoran_id } of daftar) {
      await this.ctx.db.tx(async (q) => {
        const antrean = await Antrean.getByRestoran(q, restoran_id);
        const front = antrean ? await Antrean.getFrontCustomer(q, antrean.antrean_id) : null;
        if (front?.status_antrean !== 'DIPANGGIL') return;
        await Antrean.dequeueCustomer(q, restoran_id, 'DILEWATI', menitPerAntrean);
      });
      diproses.push(restoran_id);
      eventBus.antreanBerubah(restoran_id, 'auto-dequeue');
    }
    return diproses;
  }

  /** mulaiTimer(): menjalankan pemeriksaan dequeue otomatis secara berkala. */
  mulaiTimer(intervalMs = 60_000, setelahCek?: () => Promise<unknown>): void {
    this.hentikanTimer();
    this.timer = setInterval(() => {
      this.autoDequeue()
        .then(() => setelahCek?.())
        .catch((err) => console.error('[timer antrean]', err));
    }, intervalMs);
    this.timer.unref();
  }

  hentikanTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
