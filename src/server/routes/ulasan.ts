/** Route ulasan & rating (iterasi 2). */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeUlasan: DaftarRoute = (r, c) => {
  r.get('/restoran/:id/ulasan', h((req) => c.ulasan.ulasanRestoran(p(req, 'id'))));
  r.get('/pesanan/:id/ulasan', guard.pelanggan, h((req) => c.ulasan.getUlasanPesanan(userOf(req), p(req, 'id'))));
  r.post('/pesanan/:id/ulasan', guard.pelanggan, h((req) => c.ulasan.kirimUlasan(userOf(req), p(req, 'id'), req.body ?? {})));
};
