import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp, type App } from '../server/app.js';
import { openDatabase } from '../server/db/database.js';
import type { SessionUser } from '../server/context.js';

/**
 * Membuat aplikasi uji dengan data contoh. Default memakai PGlite in-memory; isi TEST_DATABASE_URL
 * untuk menguji terhadap PostgreSQL sungguhan (SELURUH ISI SKEMA public DATABASE TERSEBUT DIHAPUS).
 */
export async function appUji(): Promise<App> {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'antriin-uji-'));
  const url = process.env.TEST_DATABASE_URL;
  if (url) {
    const db = await openDatabase({ databaseUrl: url });
    await db.query('DROP SCHEMA public CASCADE');
    await db.query('CREATE SCHEMA public');
    return createApp({ uploadDir }, { db, seed: true, logEmail: false });
  }
  return createApp({ pgliteDir: 'memory', databaseUrl: '', uploadDir }, { seed: true, logEmail: false });
}

export async function loginSebagai(app: App, email: string, password: string): Promise<SessionUser> {
  const { token } = await app.controllers.auth.validation({ email, password });
  const user = await app.controllers.auth.validateSession(token);
  if (!user) throw new Error('login gagal');
  return user;
}

export async function restoranId(app: App, nama: string): Promise<string> {
  const rows = await app.ctx.db.query<{ restoran_id: string }>(`SELECT restoran_id FROM restoran WHERE nama_restoran = $1`, [nama]);
  return rows[0].restoran_id;
}

export async function menuPertama(app: App, idRestoran: string, opsi: { stokNol?: boolean } = {}) {
  const rows = await app.ctx.db.query<{ menu_id: string; stok: number; harga: number; nama_menu: string }>(
    `SELECT menu_id, stok, harga, nama_menu FROM menu WHERE restoran_id = $1 AND aktif AND ${opsi.stokNol ? 'stok = 0' : 'stok > 5'}
     ORDER BY nama_menu LIMIT 1`,
    [idRestoran],
  );
  return rows[0];
}

/** Menjalankan promise yang diharapkan gagal, mengembalikan error-nya. */
export async function gagal(p: Promise<unknown>): Promise<{ status: number; message: string; details?: any }> {
  try {
    await p;
  } catch (e) {
    return e as { status: number; message: string; details?: any };
  }
  throw new Error('Diharapkan gagal, ternyata berhasil');
}

/** Memesan lalu membayar lunas lewat gateway simulasi. */
export async function pesanDanBayar(app: App, email: string, input: Record<string, unknown>) {
  const user = await loginSebagai(app, email, 'pelanggan123');
  const pesanan = await app.controllers.pemesanan.buatPesanan(user, input);
  const tagihan = await app.controllers.pembayaran.buatTagihan(user, pesanan!.pesanan_id, 'EWALLET');
  const hasil = await app.controllers.pembayaran.simulasikan(user, tagihan.id_pembayaran, 'LUNAS');
  return { user, pesanan: pesanan!, tagihan, hasil };
}
