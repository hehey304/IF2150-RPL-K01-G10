/** Utilitas bersama untuk modul route. */
import type { NextFunction, Request, Response, Router } from 'express';
import type { AppContext } from '../context.js';
import type { Controllers } from './index.js';
import { requireRole } from '../middleware/auth.js';

type Handler = (req: Request, res: Response) => Promise<unknown>;

/** Membungkus handler async: hasil dikirim sebagai JSON, error diteruskan ke errorHandler. */
export const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res)
    .then((data) => {
      if (!res.headersSent) res.json(data ?? { ok: true });
    })
    .catch(next);
};

/** Mengambil parameter path sebagai string. */
export const p = (req: Request, nama: string): string => String(req.params[nama]);

/** Penjaga akses per peran. */
export const guard = {
  login: requireRole(),
  pelanggan: requireRole('PELANGGAN'),
  restoran: requireRole('RESTORAN'),
  admin: requireRole('ADMIN'),
};

/** Bentuk fungsi pendaftar route tiap modul. */
export type DaftarRoute = (r: Router, c: Controllers, ctx: AppContext) => void;
