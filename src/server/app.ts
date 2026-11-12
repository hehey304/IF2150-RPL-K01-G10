import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config as defaultConfig, type Config } from './config.js';
import { migrate, openDatabase, type Database } from './db/database.js';
import { seed } from './db/seed.js';
import type { PaymentGatewayAdapter } from './adapters/paymentGatewayAdapter.js';
import { SandboxPaymentGateway } from './sandbox-pg/sandboxGateway.js';
import { buatRouterSandbox } from './sandbox-pg/routes.js';
import { NotifikasiEmail } from './adapters/notifikasiEmail.js';
import type { AppContext } from './context.js';
import { buatControllers, buatRouter, type Controllers } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { timing } from './middleware/timing.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

export interface App {
  app: express.Express;
  ctx: AppContext;
  controllers: Controllers;
  close(): Promise<void>;
}

/** Merakit aplikasi: basis data, adapter eksternal, controller, dan route. */
export async function createApp(
  overrides: Partial<Config> = {},
  opts: { db?: Database; gateway?: PaymentGatewayAdapter; seed?: boolean; logEmail?: boolean } = {},
): Promise<App> {
  const config = { ...defaultConfig, ...overrides };
  const db =
    opts.db ?? (await openDatabase({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir }));
  await migrate(db);
  if (opts.seed ?? config.seedOnStart) {
    await seed(db, { uploadDir: config.uploadDir, menitPerAntrean: config.menitPerAntrean });
  }

  const ctx: AppContext = {
    db,
    config,
    gateway: opts.gateway ?? new SandboxPaymentGateway(db, config.gatewayServerKey),
    email: new NotifikasiEmail(db, opts.logEmail ?? true),
  };
  const controllers = buatControllers(ctx);
  // Notifikasi status dari payment gateway diteruskan ke MetodePembayaranController (diverifikasi HMAC di sana).
  ctx.gateway.onNotifikasi((n, tandaTangan) => controllers.pembayaran.terimaNotifikasi(n, tandaTangan));

  const app = express();
  app.disable('x-powered-by');
  app.use(timing());
  app.use('/api', buatRouter(ctx, controllers));
  if (ctx.gateway instanceof SandboxPaymentGateway) app.use('/pg', buatRouterSandbox(ctx.gateway, publicDir));
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.use(errorHandler);

  return {
    app,
    ctx,
    controllers,
    close: async () => {
      controllers.kelolaAntrean.hentikanTimer();
      controllers.simulator.berhenti();
      await db.close();
    },
  };
}
