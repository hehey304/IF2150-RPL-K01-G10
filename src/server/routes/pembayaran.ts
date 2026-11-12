/** Route pembayaran (UC02): tagihan, verifikasi, dan simulasi payment gateway. */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routePembayaran: DaftarRoute = (r, c) => {
  r.post('/pesanan/:id/pembayaran', guard.pelanggan,
    h((req) => c.pembayaran.buatTagihan(userOf(req), p(req, 'id'), req.body?.tipePembayaran)));
  r.post('/pembayaran/:id/verifikasi', guard.pelanggan,
    h((req) => c.pembayaran.verifikasiPembayaran(userOf(req), p(req, 'id'))));
  r.post('/pembayaran/:id/simulasi', guard.pelanggan,
    h((req) => c.pembayaran.simulasikan(userOf(req), p(req, 'id'), req.body?.hasil)));
  r.get('/pesanan/:id/tagihan', guard.pelanggan, h((req) => c.pembayaran.tagihanAktif(userOf(req), p(req, 'id'))));
  // Webhook notifikasi status dari payment gateway (diverifikasi dengan tanda tangan HMAC pada header X-Signature).
  r.post('/pembayaran/notifikasi', h((req) => c.pembayaran.terimaNotifikasi(req.body ?? {}, String(req.headers['x-signature'] ?? ''))));
};
