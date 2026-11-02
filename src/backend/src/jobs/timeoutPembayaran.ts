import { withTx } from '../db/tx.js';
import { MetodePembayaranController } from '../controllers/MetodePembayaranController.js';

export function mulaiJobTimeout(intervalMs = 30_000) {
  setInterval(async () => {
    try {
      const n = await withTx(db => new MetodePembayaranController().cekTimeout(db));
      if (n > 0) console.log(`[timeout] ${n} tagihan kedaluwarsa dibatalkan`);
    } catch (e) { console.error('[timeout] gagal', e); }
  }, intervalMs);
}
