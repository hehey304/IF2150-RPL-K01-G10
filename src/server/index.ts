import { createApp } from './app.js';
import { config } from './config.js';

const { app, ctx, controllers } = await createApp();

// Pekerja berkala: dequeue otomatis 30 menit (UC06) dan pembatalan tagihan kedaluwarsa (UC02 Alt 4).
controllers.kelolaAntrean.mulaiTimer(30_000, () => controllers.pembayaran.cekTimeout());

// Iterasi 2: simulator antrean dummy untuk restoran dengan mode simulasi aktif.
if (config.simulasiAntrean) controllers.simulator.mulai(config.simulasiIntervalDetik * 1000);

app.listen(config.port, () => {
  const db = ctx.db.kind === 'postgres' ? 'PostgreSQL (DATABASE_URL)' : `PGlite (${config.pgliteDir})`;
  console.log(`antri.in berjalan di http://localhost:${config.port}  |  basis data: ${db}`);
  if (config.simulasiAntrean) console.log(`Simulator antrean dummy aktif (setiap ${config.simulasiIntervalDetik} detik).`);
});
