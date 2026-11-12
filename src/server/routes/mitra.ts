/** Route pendaftaran mitra (UC04) dan verifikasi oleh admin (UC05). */
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import type { BerkasUnggahan } from '../controllers/pengajuanMitraController.js';
import { userOf } from '../middleware/auth.js';
import { MAKS_UKURAN_DOKUMEN } from '../models/mitra.js';
import { generateId } from '../utils/ids.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeMitra: DaftarRoute = (r, c, ctx) => {
  fs.mkdirSync(ctx.config.uploadDir, { recursive: true });
  const upload = multer({
    storage: multer.diskStorage({
      destination: ctx.config.uploadDir,
      filename: (_req, file, cb) => cb(null, `${generateId('F')}${path.extname(file.originalname).toLowerCase().slice(0, 6)}`),
    }),
    limits: { fileSize: MAKS_UKURAN_DOKUMEN + 1, files: 4 },
  }).fields([
    { name: 'foto', maxCount: 1 },
    { name: 'nib', maxCount: 1 },
    { name: 'izinUsaha', maxCount: 1 },
    { name: 'sertifikatHalal', maxCount: 1 },
  ]);

  // UC04 - restoran
  r.get('/mitra/pengajuan-saya', guard.restoran, h((req) => c.mitra.statusSaya(userOf(req))));
  r.post('/mitra/pengajuan', guard.restoran, upload, h((req) => {
    const files = Object.values((req.files ?? {}) as Record<string, BerkasUnggahan[]>).flat();
    return c.mitra.simpanPengajuan(userOf(req), req.body ?? {}, files);
  }));

  // UC05 - admin
  r.get('/admin/pengajuan', guard.admin, h(() => c.mitra.daftarPengajuan()));
  r.get('/admin/pengajuan/:id', guard.admin, h((req) => c.mitra.detailPengajuan(p(req, 'id'))));
  r.post('/admin/pengajuan/:id/setujui', guard.admin, h((req) => c.mitra.setujui(p(req, 'id'))));
  r.post('/admin/pengajuan/:id/tolak', guard.admin, h((req) => c.mitra.tolak(p(req, 'id'), req.body?.alasan)));
  r.get('/admin/dokumen/:id', guard.admin, async (req, res, next) => {
    try {
      const berkas = await c.mitra.getBerkasDokumen(p(req, 'id'));
      res.setHeader('Content-Type', berkas.mime);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(berkas.namaFile)}"`);
      res.sendFile(berkas.path);
    } catch (err) {
      next(err);
    }
  });
};
