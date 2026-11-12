/**
 * SimulasiController (iterasi 2): restoran mengatur mode simulasi antrean dummy untuk restorannya.
 */
import type { AppContext, SessionUser } from '../context.js';
import { MODE_SIMULASI, type ModeSimulasi, type SimulatorAntrean } from '../services/simulatorAntrean.js';
import { badRequest, forbidden } from '../utils/errors.js';

export class SimulasiController {
  constructor(
    private ctx: AppContext,
    private simulator: () => SimulatorAntrean,
  ) {}

  private restoranId(user: SessionUser): string {
    if (!user.restoranId) throw forbidden('Akun restoran belum terverifikasi sebagai mitra');
    return user.restoranId;
  }

  async getMode(user: SessionUser) {
    const rows = await this.ctx.db.query<{ mode_simulasi: ModeSimulasi }>(
      `SELECT mode_simulasi FROM restoran WHERE restoran_id = $1`,
      [this.restoranId(user)],
    );
    return {
      mode: rows[0]?.mode_simulasi ?? 'MATI',
      simulatorAktif: this.ctx.config.simulasiAntrean,
      intervalDetik: this.ctx.config.simulasiIntervalDetik,
    };
  }

  async setMode(user: SessionUser, mode: unknown) {
    if (!MODE_SIMULASI.includes(mode as ModeSimulasi)) throw badRequest('Mode simulasi tidak dikenal');
    await this.ctx.db.query(`UPDATE restoran SET mode_simulasi = $2 WHERE restoran_id = $1`, [this.restoranId(user), mode]);
    return this.getMode(user);
  }

  /** Menambahkan satu pelanggan dummy sekarang juga (tombol demo). */
  async tambahPelangganDummy(user: SessionUser) {
    const idTiket = await this.simulator().buatPesananDummy(this.restoranId(user));
    if (!idTiket) throw badRequest('Pelanggan dummy tidak dapat memesan (antrean ditutup/penuh atau stok habis)');
    return { idTiket };
  }
}
