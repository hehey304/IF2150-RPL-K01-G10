/** Route simulasi antrean dummy (iterasi 2). */
import { userOf } from '../middleware/auth.js';
import { guard, h, type DaftarRoute } from './util.js';

export const routeSimulasi: DaftarRoute = (r, c) => {
  r.get('/kelola/simulasi', guard.restoran, h((req) => c.simulasi.getMode(userOf(req))));
  r.put('/kelola/simulasi', guard.restoran, h((req) => c.simulasi.setMode(userOf(req), req.body?.mode)));
  r.post('/kelola/simulasi/pelanggan', guard.restoran, h((req) => c.simulasi.tambahPelangganDummy(userOf(req))));
};
