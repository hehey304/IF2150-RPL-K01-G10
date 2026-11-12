/**
 * Titik masuk aplikasi klien: router berbasis hash, tata letak per peran, dan penjaga akses.
 */
import { api } from './core/api.js';
import { html, mount, type SafeHtml } from './core/html.js';
import { session, type Role, type User } from './core/session.js';
import { tampilkanGalat, memuat } from './core/ui.js';
import { layoutAuth, layoutPelanggan, layoutPanel } from './views/layout.js';
import * as akun from './views/akunView.js';
import * as pencarian from './views/pencarianView.js';
import * as pemesanan from './views/pemesananView.js';
import * as pembayaran from './views/pembayaranView.js';
import * as statusAntrean from './views/statusAntreanView.js';
import * as keluhan from './views/keluhanView.js';
import * as mitra from './views/mitraView.js';
import * as kelolaAntrean from './views/kelolaAntreanView.js';
import * as pengaturanKuota from './views/pengaturanKuotaView.js';
import * as pengaturanMenu from './views/pengaturanMenuView.js';
import * as kelolaRestoran from './views/kelolaRestoranView.js';
import * as riwayatPesanan from './views/riwayatPesananView.js';
import * as profilRestoran from './views/profilRestoranView.js';
import { pasangNotifikasi } from './views/notifikasiView.js';

export interface RouteCtx {
  root: HTMLElement;
  params: Record<string, string>;
  query: URLSearchParams;
  user: User | null;
  /** Mendaftarkan fungsi pembersih yang dipanggil saat pindah halaman (mis. menutup SSE). */
  onLeave(fn: () => void): void;
}

type Layout = 'auth' | 'pelanggan' | 'panel';
interface Route {
  pola: string;
  view: (ctx: RouteCtx) => Promise<void> | void;
  roles?: Role[];
  layout: Layout;
  judul: string;
  aktif?: string;
}

const routes: Route[] = [
  { pola: '/login', view: akun.loginPage, layout: 'auth', judul: 'Masuk' },
  { pola: '/daftar', view: akun.registrasiPage, layout: 'auth', judul: 'Daftar' },
  { pola: '/lupa-kata-sandi', view: akun.lupaKataSandiPage, layout: 'auth', judul: 'Lupa kata sandi' },
  { pola: '/reset-kata-sandi', view: akun.resetKataSandiPage, layout: 'auth', judul: 'Atur ulang kata sandi' },
  { pola: '/', view: pencarian.pencarianRestoPage, layout: 'pelanggan', judul: 'Beranda', aktif: 'beranda' },
  { pola: '/restoran/:id', view: pencarian.detailRestoranPage, layout: 'pelanggan', judul: 'Restoran', aktif: 'beranda' },
  { pola: '/keranjang', view: pemesanan.keranjangPage, layout: 'pelanggan', judul: 'Keranjang', roles: ['PELANGGAN'] },
  { pola: '/booking', view: pemesanan.bookingPage, layout: 'pelanggan', judul: 'Jadwal booking', roles: ['PELANGGAN'] },
  { pola: '/pembayaran/:id', view: pembayaran.pembayaranPage, layout: 'pelanggan', judul: 'Pembayaran', roles: ['PELANGGAN'] },
  { pola: '/tiket/:id', view: pembayaran.tiketPage, layout: 'pelanggan', judul: 'Tiket antrean', roles: ['PELANGGAN'] },
  { pola: '/pesanan/:id', view: riwayatPesanan.detailPesananPage, layout: 'pelanggan', judul: 'Detail pesanan', roles: ['PELANGGAN'] },
  { pola: '/antrean', view: statusAntrean.antreanSayaPage, layout: 'pelanggan', judul: 'Antrean saya', roles: ['PELANGGAN'], aktif: 'antrean' },
  { pola: '/antrean/:id', view: statusAntrean.halamanStatusAntrean, layout: 'pelanggan', judul: 'Status antrean', roles: ['PELANGGAN'], aktif: 'antrean' },
  { pola: '/keluhan', view: keluhan.keluhanFormPage, layout: 'pelanggan', judul: 'Keluhan', roles: ['PELANGGAN'], aktif: 'keluhan' },
  { pola: '/profil', view: akun.halamanProfilPage, layout: 'pelanggan', judul: 'Profil', roles: ['PELANGGAN', 'RESTORAN', 'ADMIN'], aktif: 'profil' },
  { pola: '/mitra/daftar', view: mitra.registrasiRestoPage, layout: 'panel', judul: 'Pendaftaran mitra', roles: ['RESTORAN'], aktif: 'mitra' },
  { pola: '/resto', view: kelolaAntrean.dashboardAntreanPage, layout: 'panel', judul: 'Dashboard antrean', roles: ['RESTORAN'], aktif: 'resto' },
  { pola: '/resto/kuota', view: pengaturanKuota.pengaturanKuotaPage, layout: 'panel', judul: 'Kuota & meja', roles: ['RESTORAN'], aktif: 'kuota' },
  { pola: '/resto/profil', view: profilRestoran.profilRestoranPage, layout: 'panel', judul: 'Profil restoran', roles: ['RESTORAN'], aktif: 'resto-profil' },
  { pola: '/resto/menu', view: pengaturanMenu.pengaturanMenuPage, layout: 'panel', judul: 'Menu & stok', roles: ['RESTORAN'], aktif: 'menu' },
  { pola: '/admin', view: mitra.verifikasiRestoranPage, layout: 'panel', judul: 'Verifikasi mitra', roles: ['ADMIN'], aktif: 'admin' },
  { pola: '/admin/keluhan', view: keluhan.keluhanDashboardPage, layout: 'panel', judul: 'Daftar keluhan', roles: ['ADMIN'], aktif: 'admin-keluhan' },
  { pola: '/admin/restoran', view: kelolaRestoran.dashboardKelolaRestoranPage, layout: 'panel', judul: 'Kelola restoran', roles: ['ADMIN'], aktif: 'admin-restoran' },
];

function cocok(pola: string, path: string): Record<string, string> | null {
  const a = pola.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/** Halaman awal tiap peran setelah login. */
export function berandaPeran(u: User | null): string {
  if (!u) return '#/';
  if (u.role === 'ADMIN') return '#/admin';
  if (u.role === 'RESTORAN') return u.restoranId ? '#/resto' : '#/mitra/daftar';
  return '#/';
}

export function navigasi(hash: string): void {
  if (location.hash === hash) void render();
  else location.hash = hash;
}

let pembersih: (() => void)[] = [];
let sudahMuatUser = false;

export async function muatUlangUser(): Promise<User | null> {
  if (!session.token) {
    session.user = null;
    return null;
  }
  try {
    const profil = await api.get('/auth/me');
    session.user = profil;
  } catch {
    session.hapus();
  }
  return session.user;
}

async function render(): Promise<void> {
  pembersih.forEach((f) => f());
  pembersih = [];
  document.querySelectorAll('.overlay').forEach((o) => o.remove());
  const app = document.getElementById('app')!;
  if (!sudahMuatUser) {
    mount(app, memuat());
    await muatUlangUser();
    sudahMuatUser = true;
  }
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const user = session.user;
  let route: Route | undefined;
  let params: Record<string, string> = {};
  for (const r of routes) {
    const p = cocok(r.pola, path);
    if (p) {
      route = r;
      params = p;
      break;
    }
  }
  if (!route) return navigasi(berandaPeran(user));

  // Penjaga akses berdasarkan peran.
  if (route.roles && !user) return navigasi(`#/login?lanjut=${encodeURIComponent(location.hash)}`);
  if (route.roles && user && !route.roles.includes(user.role)) return navigasi(berandaPeran(user));
  if (user && user.role !== 'PELANGGAN' && route.layout === 'pelanggan' && !['/profil', '/restoran/:id'].includes(route.pola)) {
    return navigasi(berandaPeran(user));
  }
  if (user && route.layout === 'auth') return navigasi(berandaPeran(user));
  if (user?.role === 'RESTORAN' && !user.restoranId && route.pola.startsWith('/resto')) return navigasi('#/mitra/daftar');

  document.title = `${route.judul} · antri.in`;
  let isi: HTMLElement;
  let layout: SafeHtml;
  const layoutDipakai: Layout = route.pola === '/profil' && user && user.role !== 'PELANGGAN' ? 'panel' : route.layout;
  if (layoutDipakai === 'auth') layout = layoutAuth();
  else if (layoutDipakai === 'panel') layout = layoutPanel(user!, route.aktif ?? '');
  else layout = layoutPelanggan(user, route.aktif ?? '');
  mount(app, layout);
  isi = app.querySelector<HTMLElement>('#isi')!;
  if (user) pasangNotifikasi(app);
  mount(isi, memuat());
  window.scrollTo(0, 0);

  const ctx: RouteCtx = {
    root: isi,
    params,
    query: new URLSearchParams(qs ?? ''),
    user,
    onLeave: (fn) => pembersih.push(fn),
  };
  try {
    await route.view(ctx);
  } catch (err) {
    tampilkanGalat(err);
    mount(isi, html`<div class="kosong"><h3>Halaman gagal dimuat</h3><p>${(err as Error).message}</p>
      <a class="btn btn-utama" href="${berandaPeran(user)}">Kembali</a></div>`);
  }
}

window.addEventListener('hashchange', () => void render());
window.addEventListener('sesi-berakhir', () => navigasi('#/login'));
void render();
