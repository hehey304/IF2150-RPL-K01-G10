/** Route pemesanan (UC02): slot booking, pesanan, dan tiket. */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routePemesanan: DaftarRoute = (r, c) => {
  r.get('/restoran/:id/slot-booking', h((req) => c.pemesanan.getSlotBooking(p(req, 'id'), String(req.query.tanggal ?? ''))));
  r.post('/pesanan', guard.pelanggan, h((req) => c.pemesanan.buatPesanan(userOf(req), req.body ?? {})));
  r.get('/pesanan', guard.pelanggan, h((req) => c.pemesanan.daftarPesananSaya(userOf(req))));
  r.get('/pesanan/:id', guard.login, h((req) => c.pemesanan.getPesanan(userOf(req), p(req, 'id'))));
  r.post('/pesanan/:id/batal', guard.pelanggan, h((req) => c.pemesanan.batalkanPesanan(userOf(req), p(req, 'id'))));
  r.get('/tiket/:id', guard.pelanggan, h((req) => c.pemesanan.getTiket(userOf(req), p(req, 'id'))));
};
