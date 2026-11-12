/** Route kelola menu & stok (UC08). */
import { userOf } from '../middleware/auth.js';
import { kirimGambar, unggahGambar } from '../utils/unggah.js';
import { guard, h, p, type DaftarRoute } from './util.js';

export const routeMenu: DaftarRoute = (r, c, ctx) => {
  r.get('/kelola/menu', guard.restoran, h((req) => c.menu.handleFetchMenu(userOf(req))));
  r.post('/kelola/menu', guard.restoran, h((req) => c.menu.handleAddMenu(userOf(req), req.body ?? {})));
  r.put('/kelola/menu/:id', guard.restoran, h((req) => c.menu.handleUpdateMenu(userOf(req), p(req, 'id'), req.body ?? {})));
  r.patch('/kelola/menu/:id/stok', guard.restoran,
    h((req) => c.menu.handleUpdateStok(userOf(req), p(req, 'id'), req.body?.stok)));
  r.delete('/kelola/menu/:id', guard.restoran, h((req) => c.menu.handleDeleteMenu(userOf(req), p(req, 'id'))));
  // Iterasi 2: foto menu
  r.post('/kelola/menu/:id/foto', guard.restoran, unggahGambar(ctx.config.uploadDir),
    h((req) => c.menu.handleUploadFoto(userOf(req), p(req, 'id'), req.file)));
  r.get('/menu/:id/foto', async (req, res, next) => {
    try {
      kirimGambar(res, ctx.config.uploadDir, await c.menu.getFoto(p(req, 'id')));
    } catch (err) {
      next(err);
    }
  });
};
