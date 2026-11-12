import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

/**
 * BasisDataPostgreSQL (komponen pendukung pada DPPL 2.3).
 * Menyediakan antarmuka query yang sama untuk PostgreSQL asli (via DATABASE_URL)
 * maupun PGlite (PostgreSQL embedded) agar aplikasi bisa dijalankan tanpa instalasi DBMS.
 */
export interface Queryable {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Database extends Queryable {
  /** Menjalankan fn di dalam satu transaksi (BEGIN ... COMMIT / ROLLBACK). */
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
  readonly kind: 'postgres' | 'pglite';
}

class PgDatabase implements Database {
  readonly kind = 'postgres' as const;
  constructor(private pool: pg.Pool) {}
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.pool.query(sql, params)).rows as T[];
  }
  async tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        query: async <R>(sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows as R[],
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  async close() {
    await this.pool.end();
  }
}

class PgliteDatabase implements Database {
  readonly kind = 'pglite' as const;
  constructor(private db: PGlite) {}
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.db.query<T>(sql, params)).rows;
  }
  async tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
    return this.db.transaction(async (t) =>
      fn({ query: async <R>(sql: string, params: unknown[] = []) => (await t.query<R>(sql, params)).rows }),
    );
  }
  async close() {
    await this.db.close();
  }
}

// COUNT(*) dan BIGINT dikembalikan sebagai string oleh driver pg; ubah ke number.
pg.types.setTypeParser(20, (v) => Number(v));

export async function openDatabase(opts: { databaseUrl?: string; pgliteDir?: string }): Promise<Database> {
  if (opts.databaseUrl) {
    return new PgDatabase(new pg.Pool({ connectionString: opts.databaseUrl }));
  }
  const dir = opts.pgliteDir ?? 'memory';
  if (dir === 'memory') return new PgliteDatabase(new PGlite());
  fs.mkdirSync(path.dirname(path.resolve(dir)), { recursive: true });
  return new PgliteDatabase(new PGlite(path.resolve(dir)));
}

const here = path.dirname(fileURLToPath(import.meta.url));

/** Membuat seluruh tabel bila belum ada (idempoten). */
export async function migrate(db: Database): Promise<void> {
  const sql = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
  for (const stmt of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
    await db.query(stmt);
  }
}
