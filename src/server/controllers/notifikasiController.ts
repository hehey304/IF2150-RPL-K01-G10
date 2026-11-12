/**
 * NotifikasiController (iterasi 2): daftar notifikasi dalam aplikasi untuk semua peran.
 */
import type { AppContext, SessionUser } from '../context.js';
import { Notifikasi } from '../models/notifikasi.js';

export class NotifikasiController {
  constructor(private ctx: AppContext) {}

  async daftar(user: SessionUser) {
    const [items, belumDibaca] = await Promise.all([
      Notifikasi.daftar(this.ctx.db, user.idPengguna),
      Notifikasi.jumlahBelumDibaca(this.ctx.db, user.idPengguna),
    ]);
    return { items, belumDibaca };
  }

  async jumlahBelumDibaca(user: SessionUser) {
    return { belumDibaca: await Notifikasi.jumlahBelumDibaca(this.ctx.db, user.idPengguna) };
  }

  async tandaiDibaca(user: SessionUser, idNotifikasi?: string) {
    await Notifikasi.tandaiDibaca(this.ctx.db, user.idPengguna, idNotifikasi);
    return this.jumlahBelumDibaca(user);
  }
}
