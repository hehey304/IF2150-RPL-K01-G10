/**
 * Simulator antrean dummy (iterasi 2).
 *
 * Agar aplikasi terasa "hidup" saat demo, restoran dengan mode simulasi aktif menerima pesanan dari
 * pelanggan dummy secara berkala. Pesanan dummy melewati alur yang SAMA dengan pelanggan sungguhan
 * (PemesananController -> MetodePembayaranController -> gateway simulasi), sehingga aturan stok, kuota,
 * meja, nomor antrean, notifikasi, dan pembaruan real-time tetap berlaku.
 *
 * Mode per restoran (kolom restoran.mode_simulasi):
 *   MATI      - tidak ada aktivitas dummy.
 *   PELANGGAN - pelanggan dummy datang dan memesan; restoran melayani sendiri (cocok untuk demo dashboard).
 *   PENUH     - pelanggan dummy datang, dan restoran dummy otomatis menyiapkan, melayani, serta mengisi ulang stok.
 */
import type { AppContext, SessionUser } from '../context.js';
import type { Controllers } from '../routes/index.js';
import { Pengguna, Pelanggan } from '../models/akun.js';
import { Antrean } from '../models/antrean.js';
import { Menu } from '../models/menu.js';
import { Restoran } from '../models/restoran.js';
import { eventBus } from '../realtime/eventBus.js';
import { generateToken } from '../utils/ids.js';

export type ModeSimulasi = 'MATI' | 'PELANGGAN' | 'PENUH';
export const MODE_SIMULASI: ModeSimulasi[] = ['MATI', 'PELANGGAN', 'PENUH'];

/** Batas antrean aktif agar antrean dummy tidak menumpuk tanpa batas. */
export const MAKS_ANTREAN_DUMMY = 8;
const DOMAIN_DUMMY = 'dummy.antri.in';
const NAMA_DUMMY = [
  'Andi Saputra', 'Bunga Lestari', 'Cahya Nugraha', 'Dewi Anggraini', 'Eko Prasetyo', 'Fitri Handayani',
  'Galih Ramadhan', 'Hana Pertiwi', 'Indra Kusuma', 'Joko Santoso', 'Kirana Ayu', 'Lukman Hakim',
];

export interface HasilLangkah {
  restoranId: string;
  aksi: string[];
}

export class SimulatorAntrean {
  private timer: NodeJS.Timeout | null = null;
  private berjalan = false;
  private pelangganDummy: SessionUser[] = [];

  constructor(
    private ctx: AppContext,
    private c: Controllers,
    /** Sumber angka acak 0..1 (dapat diganti saat pengujian). */
    public acak: () => number = Math.random,
  ) {}

  /** Memastikan akun pelanggan dummy tersedia (dibuat sekali bila belum ada). */
  async pastikanPelangganDummy(): Promise<SessionUser[]> {
    if (this.pelangganDummy.length) return this.pelangganDummy;
    const rows = await this.ctx.db.query<{ id_pengguna: string; nama: string; email: string; pelanggan_id: string }>(
      `SELECT u.id_pengguna, u.nama, u.email, p.pelanggan_id FROM pengguna u JOIN pelanggan p ON p.id_akun = u.id_pengguna
       WHERE u.email LIKE '%@' || $1 ORDER BY u.email`,
      [DOMAIN_DUMMY],
    );
    if (rows.length < NAMA_DUMMY.length) {
      await this.ctx.db.tx(async (q) => {
        for (let i = rows.length; i < NAMA_DUMMY.length; i++) {
          const akun = await Pengguna.saveCredentials(q, {
            nama: NAMA_DUMMY[i], email: `dummy${String(i + 1).padStart(2, '0')}@${DOMAIN_DUMMY}`, noHp: null,
            password: generateToken(), role: 'PELANGGAN',
          });
          const p = await Pelanggan.accountRegister(q, akun);
          rows.push({ id_pengguna: akun.id_pengguna, nama: akun.nama, email: akun.email, pelanggan_id: p.pelanggan_id });
        }
      });
    }
    this.pelangganDummy = rows.map((r) => ({
      idPengguna: r.id_pengguna, nama: r.nama, email: r.email, noHp: null, role: 'PELANGGAN', token: '',
      pelangganId: r.pelanggan_id, restoranId: null,
    }));
    return this.pelangganDummy;
  }

  private pilih<T>(arr: T[]): T {
    return arr[Math.min(arr.length - 1, Math.floor(this.acak() * arr.length))];
  }

  /** Pelanggan dummy memesan dan membayar lewat alur normal. Mengembalikan nomor tiket atau null. */
  async buatPesananDummy(restoranId: string): Promise<string | null> {
    if (!this.ctx.gateway.sandbox) return null;
    const detail = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (!detail || detail.status_antrean !== 'BUKA') return null;
    const tersedia = (await Menu.getDaftarMenu(this.ctx.db, restoranId)).filter((m) => m.stok > 0);
    if (!tersedia.length) return null;

    const items: { menuId: string; jumlah: number }[] = [];
    const jumlahJenis = 1 + Math.floor(this.acak() * Math.min(3, tersedia.length));
    const sisa = [...tersedia];
    for (let i = 0; i < jumlahJenis && sisa.length; i++) {
      const m = sisa.splice(Math.floor(this.acak() * sisa.length), 1)[0];
      items.push({ menuId: m.menu_id, jumlah: Math.min(m.stok, 1 + Math.floor(this.acak() * 2)) });
    }
    const dineIn = detail.meja_tersisa > 0 && this.acak() < 0.6;
    const pelanggan = this.pilih(await this.pastikanPelangganDummy());
    try {
      const pesanan = await this.c.pemesanan.buatPesanan(pelanggan, {
        restoranId, mode: dineIn ? 'DINE_IN' : 'TAKEAWAY', jumlahRombongan: dineIn ? 1 + Math.floor(this.acak() * 4) : 1, items,
      });
      if (!pesanan) return null;
      const tagihan = await this.c.pembayaran.buatTagihan(pelanggan, pesanan.pesanan_id, this.pilih(['EWALLET', 'VIRTUAL_ACCOUNT', 'KARTU']));
      const hasil = await this.c.pembayaran.simulasikan(pelanggan, tagihan.id_pembayaran, 'LUNAS');
      return hasil.status === 'LUNAS' ? hasil.idTiket : null;
    } catch {
      return null; // stok/kuota berubah di tengah jalan: lewati putaran ini
    }
  }

  /** Satu langkah simulasi untuk satu restoran. */
  async langkah(restoranId: string, mode: ModeSimulasi): Promise<HasilLangkah> {
    const aksi: string[] = [];
    const { menitPerAntrean } = this.ctx.config;
    if (mode === 'PENUH') {
      const isiUlang = await this.ctx.db.query(
        `UPDATE menu SET stok = 30 WHERE restoran_id = $1 AND aktif AND stok < 3 RETURNING menu_id`,
        [restoranId],
      );
      if (isiUlang.length) aksi.push(`isi-ulang-stok:${isiUlang.length}`);

      const antrean = await Antrean.getByRestoran(this.ctx.db, restoranId);
      const front = antrean ? await Antrean.getFrontCustomer(this.ctx.db, antrean.antrean_id) : null;
      if (front?.status_antrean === 'DIPANGGIL' && this.acak() < 0.5) {
        await this.ctx.db.tx((q) => Antrean.dequeueCustomer(q, restoranId, 'SELESAI', menitPerAntrean));
        aksi.push('layani');
      }
      const belumDisiapkan = (await Antrean.getDetailAntrean(this.ctx.db, restoranId)).slice(0, 3).find((t) => !t.disiapkan_pada);
      if (belumDisiapkan && this.acak() < 0.6) {
        await Antrean.tandaiDisiapkan(this.ctx.db, restoranId, belumDisiapkan.id_tiket);
        aksi.push('siapkan');
      }
    }
    const detail = await Restoran.getDetailRestoran(this.ctx.db, restoranId);
    if (detail && detail.total_antrean < MAKS_ANTREAN_DUMMY && this.acak() < 0.6) {
      const tiket = await this.buatPesananDummy(restoranId);
      if (tiket) aksi.push('pesanan-baru');
    }
    if (aksi.some((a) => a !== 'pesanan-baru')) eventBus.antreanBerubah(restoranId, 'simulasi');
    return { restoranId, aksi };
  }

  /** Satu putaran untuk semua restoran dengan mode simulasi aktif. */
  async tick(): Promise<HasilLangkah[]> {
    if (this.berjalan) return [];
    this.berjalan = true;
    try {
      const daftar = await this.ctx.db.query<{ restoran_id: string; mode_simulasi: ModeSimulasi }>(
        `SELECT restoran_id, mode_simulasi FROM restoran WHERE status_aktif AND mode_simulasi <> 'MATI'`,
      );
      const hasil: HasilLangkah[] = [];
      for (const r of daftar) {
        try {
          hasil.push(await this.langkah(r.restoran_id, r.mode_simulasi));
        } catch (err) {
          console.error('[simulasi]', r.restoran_id, err);
        }
      }
      return hasil;
    } finally {
      this.berjalan = false;
    }
  }

  mulai(intervalMs: number): void {
    this.berhenti();
    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.timer.unref();
  }

  berhenti(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
