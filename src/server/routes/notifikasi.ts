/** Route notifikasi dalam aplikasi (iterasi 2). */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeNotifikasi: DaftarRoute = (r, c) => {
  r.get('/notifikasi', guard.login, h((req) => c.notifikasi.daftar(userOf(req))));
  r.get('/notifikasi/jumlah', guard.login, h((req) => c.notifikasi.jumlahBelumDibaca(userOf(req))));
  r.post('/notifikasi/dibaca', guard.login, h((req) => c.notifikasi.tandaiDibaca(userOf(req))));
  r.post('/notifikasi/:id/dibaca', guard.login, h((req) => c.notifikasi.tandaiDibaca(userOf(req), p(req, 'id'))));
};
