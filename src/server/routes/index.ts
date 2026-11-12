/**
 * Perakitan REST API: membuat controller dan mendaftarkan route tiap modul.
 * Setiap modul route hanya menerjemahkan HTTP <-> pemanggilan controller.
 */
import express, { Router } from 'express';
import type { AppContext } from '../context.js';
import { AutentikasiController } from '../controllers/autentikasiController.js';
import { PencarianController } from '../controllers/pencarianController.js';
import { PemesananController } from '../controllers/pemesananController.js';
import { MetodePembayaranController } from '../controllers/metodePembayaranController.js';
import { PemantauAntreanController } from '../controllers/pemantauAntreanController.js';
import { KelolaAntreanController } from '../controllers/kelolaAntreanController.js';
import { PengaturanKuotaController } from '../controllers/pengaturanKuotaController.js';
import { KelolaMenuController } from '../controllers/kelolaMenuController.js';
import { PengajuanMitraController } from '../controllers/pengajuanMitraController.js';
import { KeluhanController } from '../controllers/keluhanController.js';
import { KelolaDataRestoranController } from '../controllers/kelolaDataRestoranController.js';
import { NotifikasiController } from '../controllers/notifikasiController.js';
import { ProfilRestoranController } from '../controllers/profilRestoranController.js';
import { UlasanController } from '../controllers/ulasanController.js';
import { SimulasiController } from '../controllers/simulasiController.js';
import { SimulatorAntrean } from '../services/simulatorAntrean.js';
import { authMiddleware } from '../middleware/auth.js';
import { notFound } from '../utils/errors.js';
import { h } from './util.js';
import { routeAutentikasi } from './autentikasi.js';
import { routePencarian } from './pencarian.js';
import { routePemesanan } from './pemesanan.js';
import { routePembayaran } from './pembayaran.js';
import { routeAntrean } from './antrean.js';
import { routeMenu } from './menu.js';
import { routeMitra } from './mitra.js';
import { routeKeluhan } from './keluhan.js';
import { routeNotifikasi } from './notifikasi.js';
import { routeProfilRestoran } from './profilRestoran.js';
import { routeUlasan } from './ulasan.js';
import { routeSimulasi } from './simulasi.js';

export interface Controllers {
  auth: AutentikasiController;
  pencarian: PencarianController;
  pemesanan: PemesananController;
  pembayaran: MetodePembayaranController;
  pemantau: PemantauAntreanController;
  kelolaAntrean: KelolaAntreanController;
  kuota: PengaturanKuotaController;
  menu: KelolaMenuController;
  mitra: PengajuanMitraController;
  keluhan: KeluhanController;
  kelolaRestoran: KelolaDataRestoranController;
  notifikasi: NotifikasiController;
  profilRestoran: ProfilRestoranController;
  ulasan: UlasanController;
  simulasi: SimulasiController;
  simulator: SimulatorAntrean;
}

export function buatControllers(ctx: AppContext): Controllers {
  let simulator: SimulatorAntrean | null = null;
  const c: Controllers = {
    auth: new AutentikasiController(ctx),
    pencarian: new PencarianController(ctx),
    pemesanan: new PemesananController(ctx),
    pembayaran: new MetodePembayaranController(ctx),
    pemantau: new PemantauAntreanController(ctx),
    kelolaAntrean: new KelolaAntreanController(ctx),
    kuota: new PengaturanKuotaController(ctx),
    menu: new KelolaMenuController(ctx),
    mitra: new PengajuanMitraController(ctx),
    keluhan: new KeluhanController(ctx),
    kelolaRestoran: new KelolaDataRestoranController(ctx),
    notifikasi: new NotifikasiController(ctx),
    profilRestoran: new ProfilRestoranController(ctx),
    ulasan: new UlasanController(ctx),
    simulasi: new SimulasiController(ctx, () => simulator!),
    get simulator() {
      return simulator!;
    },
  };
  simulator = new SimulatorAntrean(ctx, c);
  return c;
}

export function buatRouter(ctx: AppContext, c: Controllers): Router {
  const r = Router();
  r.use(express.json({ limit: '1mb' }));
  r.use(authMiddleware(c.auth));

  r.get('/config', h(async () => ({
    biayaLayanan: ctx.config.biayaLayanan,
    maxBookingDays: ctx.config.maxBookingDays,
    paymentTimeoutMinutes: ctx.config.paymentTimeoutMinutes,
    autoDequeueMinutes: ctx.config.autoDequeueMinutes,
    sandboxPembayaran: c.pembayaran.isSandbox(),
    emailSimulasi: ctx.config.emailSimulasi,
    simulasiAntrean: ctx.config.simulasiAntrean,
  })));

  for (const daftar of [routeAutentikasi, routePencarian, routePemesanan, routePembayaran, routeAntrean, routeMenu,
    routeMitra, routeKeluhan, routeNotifikasi, routeProfilRestoran, routeUlasan, routeSimulasi]) {
    daftar(r, c, ctx);
  }

  r.use((_req, _res, next) => next(notFound('Endpoint tidak ditemukan')));
  return r;
}
