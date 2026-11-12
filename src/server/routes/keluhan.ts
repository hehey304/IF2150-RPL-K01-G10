/** Route keluhan (UC13, UC14) dan kelola restoran oleh admin (UC15). */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeKeluhan: DaftarRoute = (r, c) => {
  // UC13 - pelanggan
  r.post('/keluhan', guard.pelanggan, h((req) => c.keluhan.kirimKeluhan(userOf(req), req.body ?? {})));
  r.get('/keluhan/saya', guard.pelanggan, h((req) => c.keluhan.keluhanSaya(userOf(req))));
  // UC14 - admin
  r.get('/admin/keluhan', guard.admin, h((req) => c.keluhan.tampilkanKeluhan(req.query)));
  r.get('/admin/keluhan/:id', guard.admin, h((req) => c.keluhan.detailKeluhan(p(req, 'id'))));
  r.post('/admin/keluhan/:id/tanggapan', guard.admin,
    h((req) => c.keluhan.tanggapiKeluhan(p(req, 'id'), req.body?.tanggapan)));
  // UC15 - admin
  r.get('/admin/restoran', guard.admin, h((req) => c.kelolaRestoran.daftarRestoran(req.query)));
  r.delete('/admin/restoran/:id', guard.admin, h((req) => c.kelolaRestoran.hapusDataRestoran(p(req, 'id'))));
};
