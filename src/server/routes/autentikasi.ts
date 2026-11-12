/** Route autentikasi (UC10-UC12). */
import { userOf } from '../middleware/auth.js';
import { guard, h, type DaftarRoute } from './util.js';

export const routeAutentikasi: DaftarRoute = (r, c) => {
  r.post('/auth/register', h((req) => c.auth.createAccount(req.body ?? {})));
  r.post('/auth/login', h((req) => c.auth.validation(req.body ?? {})));
  r.post('/auth/logout', guard.login, h(async (req) => c.auth.processLogout(userOf(req))));
  r.get('/auth/me', guard.login, h(async (req) => c.auth.getProfil(userOf(req))));
  // Iterasi 2
  r.put('/auth/profil', guard.login, h((req) => c.auth.ubahProfil(userOf(req), req.body ?? {})));
  r.put('/auth/kata-sandi', guard.login, h((req) => c.auth.gantiKataSandi(userOf(req), req.body ?? {})));
  r.post('/auth/lupa-kata-sandi', h((req) => c.auth.lupaKataSandi(req.body ?? {})));
  r.post('/auth/reset-kata-sandi', h((req) => c.auth.resetKataSandi(req.body ?? {})));
};
