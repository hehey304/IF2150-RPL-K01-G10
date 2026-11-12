import { config } from '../config.js';
import { migrate, openDatabase } from './database.js';
import { seed } from './seed.js';

const db = await openDatabase({ databaseUrl: config.databaseUrl, pgliteDir: config.pgliteDir });
await migrate(db);
const ok = await seed(db, { uploadDir: config.uploadDir, menitPerAntrean: config.menitPerAntrean });
console.log(ok ? 'Data contoh berhasil dimasukkan.' : 'Basis data sudah berisi data; seed dilewati.');
await db.close();
