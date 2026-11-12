/** Route antrean (UC03, UC06, UC07, UC09): status real-time, dashboard, dequeue, dan kuota. */
import { userOf } from '../middleware/auth.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeAntrean: DaftarRoute = (r, c) => {
  // UC03 - pelanggan
  r.get('/restoran/:id/stream', (req, res) => c.pemantau.subscribe(p(req, 'id'), res));
  r.get('/antrean-saya', guard.pelanggan, h((req) => c.pemantau.getAntreanAktifSaya(userOf(req))));
  r.get('/tiket/:id/status', guard.pelanggan, h((req) => c.pemantau.getStatusAntrean(userOf(req), p(req, 'id'))));
  // UC06, UC09 - restoran
  r.get('/kelola/antrean', guard.restoran, h((req) => c.kelolaAntrean.getAntrean(userOf(req))));
  r.post('/kelola/antrean/dequeue', guard.restoran,
    h((req) => c.kelolaAntrean.processDequeue(userOf(req), req.body?.idTiket)));
  r.post('/kelola/booking/:idTiket/hadir', guard.restoran,
    h((req) => c.kelolaAntrean.tandaiHadirBooking(userOf(req), p(req, 'idTiket'))));
  r.post('/kelola/antrean/:idTiket/siapkan', guard.restoran,
    h((req) => c.kelolaAntrean.tandaiDisiapkan(userOf(req), p(req, 'idTiket'))));
  // UC07 - restoran
  r.get('/kelola/kuota', guard.restoran, h((req) => c.kuota.displaySettings(userOf(req))));
  r.put('/kelola/kuota', guard.restoran, h((req) => c.kuota.onSaveSettings(userOf(req), req.body ?? {})));
};
