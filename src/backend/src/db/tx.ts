import { type PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { pool } from './pool.js'; // ASUMSI: default export Pool. Jika named export: import { pool } from './pool'

// Pool maupun PoolClient memenuhi tipe ini, jadi semua kelas model bisa dipanggil di dalam/ luar transaksi.
export type Db = { query: (text: string, params?: any[]) => Promise<any> };
export const generateId = (): string => randomUUID();

export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
export { pool };
