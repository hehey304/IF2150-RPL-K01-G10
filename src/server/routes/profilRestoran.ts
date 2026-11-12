/** Route profil restoran & foto restoran (iterasi 2). */
import { userOf } from '../middleware/auth.js';
import { kirimGambar, unggahGambar } from '../utils/unggah.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeProfilRestoran: DaftarRoute = (r, c, ctx) => {
  r.get('/kelola/profil', guard.restoran, h((req) => c.profilRestoran.getProfil(userOf(req))));
  r.put('/kelola/profil', guard.restoran, h((req) => c.profilRestoran.ubahProfil(userOf(req), req.body ?? {})));
  r.post('/kelola/profil/foto', guard.restoran, unggahGambar(ctx.config.uploadDir),
    h((req) => c.profilRestoran.gantiFoto(userOf(req), req.file)));
  r.get('/restoran/:id/foto', async (req, res, next) => {
    try {
      kirimGambar(res, ctx.config.uploadDir, await c.profilRestoran.getFoto(p(req, 'id')));
    } catch (err) {
      next(err);
    }
  });
};
