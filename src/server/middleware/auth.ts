import type { NextFunction, Request, Response } from 'express';
import type { SessionUser } from '../context.js';
import type { AutentikasiController } from '../controllers/autentikasiController.js';
import { forbidden, unauthorized } from '../utils/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

/** Membaca token Bearer dan memvalidasi sesi (SesiPengguna.validateToken). */
export function authMiddleware(auth: AutentikasiController) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization ?? '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      if (token) req.user = (await auth.validateSession(token)) ?? undefined;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Mewajibkan login dan (opsional) peran tertentu. */
export function requireRole(...roles: SessionUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (roles.length && !roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

/** Mengambil user dari request yang sudah melewati requireRole. */
export function userOf(req: Request): SessionUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
