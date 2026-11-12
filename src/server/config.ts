import fs from 'node:fs';
import path from 'node:path';

/** Membaca file .env sederhana (tanpa dependensi tambahan) bila ada. */
function loadDotEnv(file: string): void {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadDotEnv(path.resolve(process.cwd(), '.env'));

const num = (v: string | undefined, d: number): number => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isFinite(n) ? n : d;
};

export const config = {
  port: num(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL || '',
  pgliteDir: process.env.PGLITE_DIR || './data/pglite',
  seedOnStart: (process.env.SEED_ON_START ?? 'true') !== 'false',
  paymentTimeoutMinutes: num(process.env.PAYMENT_TIMEOUT_MINUTES, 15),
  autoDequeueMinutes: num(process.env.AUTO_DEQUEUE_MINUTES, 30),
  menitPerAntrean: num(process.env.MENIT_PER_ANTREAN, 3),
  biayaLayanan: num(process.env.BIAYA_LAYANAN, 2000),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  /** Email tidak benar-benar dikirim; tautan reset kata sandi ditampilkan di layar (mode simulasi). */
  emailSimulasi: (process.env.EMAIL_SIMULASI ?? 'true') !== 'false',
  /** Simulator antrean dummy (pelanggan dummy memesan & restoran dummy melayani). */
  simulasiAntrean: (process.env.SIMULASI_ANTREAN ?? 'true') !== 'false',
  simulasiIntervalDetik: num(process.env.SIMULASI_INTERVAL_DETIK, 15),
  /** Kunci server untuk menandatangani notifikasi payment gateway (HMAC-SHA256). */
  gatewayServerKey: process.env.GATEWAY_SERVER_KEY || 'sandbox-server-key-antriin',
  sessionHours: 24,
  maxBookingDays: 7,
};

export type Config = typeof config;
