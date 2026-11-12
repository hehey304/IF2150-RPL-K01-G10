/** Route pencarian restoran (UC01) - publik. */
import { h, p, type DaftarRoute } from './util.js';

export const routePencarian: DaftarRoute = (r, c) => {
  r.get('/restoran', h((req) => c.pencarian.cariRestoran(req.query)));
  r.get('/restoran/:id', h((req) => c.pencarian.getDetailRestoran(p(req, 'id'))));
};
