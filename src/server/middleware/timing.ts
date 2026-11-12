import type { NextFunction, Request, Response } from 'express';

/**
 * Logging waktu respons (bahan profiling KNF02/KNF09). Menambahkan header Server-Timing
 * dan mencetak request API yang lebih lambat dari ambang batas.
 */
export function timing(ambangMs = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    const mulai = process.hrtime.bigint();
    const tulisKepala = res.writeHead.bind(res);
    res.writeHead = ((...args: Parameters<Response['writeHead']>) => {
      const ms = Number(process.hrtime.bigint() - mulai) / 1e6;
      if (!res.headersSent) res.setHeader('Server-Timing', `app;dur=${ms.toFixed(1)}`);
      if (ms > ambangMs && req.path.startsWith('/api/')) {
        console.warn(`[lambat] ${req.method} ${req.originalUrl} ${ms.toFixed(1)} ms`);
      }
      return tulisKepala(...args);
    }) as Response['writeHead'];
    next();
  };
}
