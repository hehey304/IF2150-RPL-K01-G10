import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, ...(err.details ?? {}) });
    return;
  }
  const e = err as { code?: string; type?: string };
  if (e?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Ukuran berkas melebihi batas (dokumen maks. 5 MB, foto maks. 2 MB)' });
    return;
  }
  if (e?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Format data tidak valid' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
}
