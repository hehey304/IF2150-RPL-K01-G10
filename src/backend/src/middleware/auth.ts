import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { JWT_SECRET } from "../services/authService.js";

export type Role = 'PELANGGAN' | 'RESTORAN' | 'ADMIN';

declare global {
  namespace Express {
    interface Request { auth?: { userId: string; role: Role; token: string } }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Belum login' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: Role };
    // also check the session is still active (so logout actually invalidates the token)
    const { rowCount } = await pool.query(
      `SELECT 1 FROM sesi_pengguna
       WHERE token = $1 AND status_aktif AND waktu_kedaluwarsa > NOW()`,
      [token]
    );
    if (!rowCount) return res.status(401).json({ message: 'Sesi berakhir' });

    req.auth = { userId: payload.sub, role: payload.role, token };
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid' });
  }
}

export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'Tidak punya akses' });
    }
    next();
  };