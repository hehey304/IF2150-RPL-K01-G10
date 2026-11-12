/**
 * Router AntriPay Sandbox: halaman checkout (/pg/checkout/:id) dan API-nya (/pg/api/...).
 * Dipisah dari /api antri.in karena berperan sebagai sistem milik penyedia payment gateway.
 */
import path from 'node:path';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import type { SandboxPaymentGateway } from './sandboxGateway.js';

type Handler = (req: Request) => Promise<unknown>;
const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req).then((d) => res.json(d)).catch(next);
};

export function buatRouterSandbox(gateway: SandboxPaymentGateway, publicDir: string): Router {
  const r = Router();
  r.use(express.json({ limit: '50kb' }));
  r.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  r.get('/checkout/:id', (_req, res) => res.sendFile(path.join(publicDir, 'pg', 'checkout.html')));
  r.get('/api/:id', h((req) => gateway.infoCheckout(String(req.params.id))));
  r.get('/api/:id/qr', async (req, res, next) => {
    try {
      res.type('image/svg+xml').send(await gateway.qrSvg(String(req.params.id)));
    } catch (err) {
      next(err);
    }
  });
  r.post('/api/:id/ewallet', h((req) => gateway.bayarEwallet(String(req.params.id), req.body?.setuju === true)));
  r.post('/api/:id/va', h((req) => gateway.transferVa(String(req.params.id), req.body?.nominal)));
  r.post('/api/:id/kartu', h((req) => gateway.bayarKartu(String(req.params.id), req.body ?? {})));
  r.post('/api/:id/otp', h((req) => gateway.konfirmasiOtp(String(req.params.id), req.body?.otp)));
  return r;
}
