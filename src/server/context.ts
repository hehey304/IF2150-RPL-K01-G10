import type { Database } from './db/database.js';
import type { Config } from './config.js';
import type { PaymentGatewayAdapter } from './adapters/paymentGatewayAdapter.js';
import type { NotifikasiEmail } from './adapters/notifikasiEmail.js';

/** Dependensi bersama yang diteruskan ke seluruh controller. */
export interface AppContext {
  db: Database;
  config: Config;
  gateway: PaymentGatewayAdapter;
  email: NotifikasiEmail;
}

/** Pengguna yang sedang login (hasil middleware autentikasi). */
export interface SessionUser {
  idPengguna: string;
  nama: string;
  email: string;
  noHp: string | null;
  role: 'PELANGGAN' | 'RESTORAN' | 'ADMIN';
  token: string;
  pelangganId: string | null;
  restoranId: string | null;
}
