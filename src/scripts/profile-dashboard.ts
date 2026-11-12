/**
 * Profiling dashboard antrean restoran (KelolaAntreanController.getAntrean / Antrean.getDetailAntrean).
 *
 * Membandingkan dua cara mengambil rincian pesanan tiap tiket:
 *   1. Naif (N+1): satu query daftar tiket, lalu satu query detail_pesanan per tiket.
 *   2. Teroptimasi: satu query dengan agregasi string_agg (dipakai di aplikasi).
 *
 * Jalankan: npm run profile  (opsional: JUMLAH_TIKET=1000 npm run profile)
 */
import { performance } from 'node:perf_hooks';
import { migrate, openDatabase } from '../server/db/database.js';
import { seed } from '../server/db/seed.js';
import { Antrean } from '../server/models/antrean.js';
import { generateId } from '../server/utils/ids.js';

const JUMLAH = Number(process.env.JUMLAH_TIKET ?? 500);
const ULANG = 20;

const db = await openDatabase({ pgliteDir: 'memory' });
await migrate(db);
await seed(db);
const [{ restoran_id: restoranId, antrean_id: antreanId }] = await db.query<{ restoran_id: string; antrean_id: string }>(
  `SELECT r.restoran_id, a.antrean_id FROM restoran r JOIN antrean a USING (restoran_id) WHERE nama_restoran = 'Bakso Mang Ujang'`,
);
const menu = await db.query<{ menu_id: string; harga: number }>(`SELECT menu_id, harga FROM menu WHERE restoran_id = $1`, [restoranId]);
const [{ pelanggan_id: pelangganId }] = await db.query<{ pelanggan_id: string }>(`SELECT pelanggan_id FROM pelanggan LIMIT 1`);

console.log(`Menyiapkan ${JUMLAH} tiket antrean aktif...`);
await db.tx(async (q) => {
  for (let i = 0; i < JUMLAH; i++) {
    const pesananId = generateId('PSN');
    await q.query(
      `INSERT INTO pesanan (pesanan_id, pelanggan_id, restoran_id, mode_pemesanan, jumlah_rombongan, subtotal, total_harga, status_pemesanan)
       VALUES ($1, $2, $3, 'TAKEAWAY', 1, 0, 0, 'DIKONFIRMASI')`,
      [pesananId, pelangganId, restoranId],
    );
    for (const m of menu.slice(0, 1 + (i % 3))) {
      await q.query(`INSERT INTO detail_pesanan (pesanan_id, menu_id, jumlah, subtotal) VALUES ($1, $2, 1, $3)`, [pesananId, m.menu_id, m.harga]);
    }
    await q.query(
      `INSERT INTO tiket_antrean (id_tiket, antrean_id, pelanggan_id, pesanan_id, nomor_urut, tipe_antrean, waktu_terbit, status_antrean)
       VALUES ($1, $2, $3, $4, $5, 'TAKEAWAY', clock_timestamp(), 'MENUNGGU')`,
      [generateId('TKT'), antreanId, pelangganId, pesananId, 1000 + i],
    );
  }
});
await db.query('ANALYZE');

async function naif() {
  const tiket = await db.query<{ pesanan_id: string }>(
    `SELECT t.*, p.jumlah_rombongan FROM tiket_antrean t JOIN pesanan p ON p.pesanan_id = t.pesanan_id
     WHERE t.antrean_id = $1 AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL') ORDER BY t.waktu_terbit, t.nomor_urut`,
    [antreanId],
  );
  for (const t of tiket) {
    await db.query(
      `SELECT m.nama_menu, d.jumlah FROM detail_pesanan d JOIN menu m ON m.menu_id = d.menu_id WHERE d.pesanan_id = $1`,
      [t.pesanan_id],
    );
  }
  return tiket.length;
}

async function teroptimasi() {
  return (await Antrean.getDetailAntrean(db, restoranId)).length;
}

async function ukur(nama: string, fn: () => Promise<number>) {
  await fn(); // pemanasan
  const waktu: number[] = [];
  let baris = 0;
  for (let i = 0; i < ULANG; i++) {
    const t0 = performance.now();
    baris = await fn();
    waktu.push(performance.now() - t0);
  }
  waktu.sort((a, b) => a - b);
  const rata = waktu.reduce((s, x) => s + x, 0) / waktu.length;
  console.log(`${nama.padEnd(28)} baris=${baris}  rata-rata=${rata.toFixed(1)} ms  median=${waktu[ULANG / 2].toFixed(1)} ms  p95=${waktu[Math.floor(ULANG * 0.95) - 1].toFixed(1)} ms`);
  return rata;
}

const a = await ukur('Naif (N+1 query)', naif);
const b = await ukur('Teroptimasi (1 query)', teroptimasi);
console.log(`\nPercepatan: ${(a / b).toFixed(1)}x`);

const plan = await db.query<{ 'QUERY PLAN': string }>(
  `EXPLAIN ANALYZE SELECT t.id_tiket FROM tiket_antrean t WHERE t.antrean_id = $1
   AND t.status_antrean IN ('MENUNGGU', 'DIPANGGIL') ORDER BY t.waktu_terbit, t.nomor_urut`,
  [antreanId],
);
console.log('\nEXPLAIN ANALYZE daftar tiket aktif:');
for (const r of plan) console.log('  ' + r['QUERY PLAN']);
await db.close();
