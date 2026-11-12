import { html, type SafeHtml } from '../core/html.js';
import type { User } from '../core/session.js';
import { ikon, inisial, logo } from '../core/ui.js';
import { keranjang } from '../models/keranjang.js';
import { tombolNotifikasi } from './notifikasiView.js';

export function layoutAuth(): SafeHtml {
  return html`<main id="isi" class="auth-wrap"></main>`;
}

/** Navbar pelanggan (I-03-01 / I-05-01). */
export function layoutPelanggan(user: User | null, aktif: string): SafeHtml {
  const n = keranjang().totalItem;
  const menu = (id: string, href: string, label: string) =>
    html`<a href="${href}" class="nav-link ${aktif === id ? 'aktif' : ''}">${label}</a>`;
  return html`
  <header class="navbar">
    <div class="wadah navbar-isi">
      ${logo()}
      <nav class="nav-menu" aria-label="Navigasi utama">
        ${menu('beranda', '#/', 'Beranda')}
        ${user ? menu('antrean', '#/antrean', 'Antrean saya') : ''}
        ${user ? menu('keluhan', '#/keluhan', 'Keluhan') : ''}
      </nav>
      <div class="nav-kanan">
        ${user
          ? html`${tombolNotifikasi()}<a href="#/keranjang" class="ikon-btn" aria-label="Keranjang">${ikon('keranjang', 24)}${
              n ? html`<span class="titik-angka" id="badge-keranjang">${n}</span>` : ''
            }</a>
            <a href="#/profil" class="avatar" aria-label="Profil">${inisial(user.nama)}</a>`
          : html`<a href="#/login" class="btn btn-ghost btn-kecil">Masuk</a><a href="#/daftar" class="btn btn-utama btn-kecil">Daftar</a>`}
      </div>
    </div>
  </header>
  <main id="isi" class="halaman"></main>
  <footer class="footer"><div class="wadah footer-isi">
    <span>© 2026 antri.in · Kelompok Ducklings</span>
    <span>Bantuan · Syarat &amp; Ketentuan · Kebijakan Privasi</span>
  </div></footer>`;
}

/** Sidebar panel restoran (I-14-01) dan admin (I-18-01). */
export function layoutPanel(user: User, aktif: string): SafeHtml {
  const item = (id: string, href: string, ik: string, label: string) =>
    html`<a href="${href}" class="side-link ${aktif === id ? 'aktif' : ''}">${ikon(ik)}<span>${label}</span></a>`;
  const menu =
    user.role === 'ADMIN'
      ? [
          item('admin', '#/admin', 'dokumen', 'Verifikasi Mitra'),
          item('admin-keluhan', '#/admin/keluhan', 'pesan', 'Keluhan'),
          item('admin-restoran', '#/admin/restoran', 'toko', 'Kelola Restoran'),
        ]
      : user.restoranId
        ? [
            item('resto', '#/resto', 'grid', 'Dashboard Antrean'),
            item('kuota', '#/resto/kuota', 'slider', 'Kuota & Meja'),
            item('menu', '#/resto/menu', 'mangkuk', 'Menu & Stok'),
            item('resto-profil', '#/resto/profil', 'toko', 'Profil Restoran'),
            item('profil', '#/profil', 'orang', 'Akun'),
          ]
        : [item('mitra', '#/mitra/daftar', 'dokumen', 'Pendaftaran Mitra'), item('profil', '#/profil', 'orang', 'Profil Akun')];
  const label = user.role === 'ADMIN' ? 'ADMIN' : 'RESTORAN';
  const namaTampil = user.role === 'RESTORAN' && (user as User & { restoran?: { namaRestoran: string } }).restoran
    ? (user as User & { restoran: { namaRestoran: string } }).restoran.namaRestoran
    : user.nama;
  return html`
  <div class="panel">
    <aside class="sidebar">
      <div class="sidebar-logo">${logo(label)}${tombolNotifikasi()}</div>
      <nav class="side-menu" aria-label="Navigasi panel">${menu}</nav>
      <a href="#/profil" class="side-akun">
        <span class="avatar">${inisial(namaTampil)}</span>
        <span><strong>${namaTampil}</strong><small>${user.role === 'ADMIN' ? 'Akun admin' : 'Akun restoran'}</small></span>
      </a>
    </aside>
    <main id="isi" class="panel-isi"></main>
  </div>`;
}

/** Memperbarui angka keranjang di navbar tanpa render ulang halaman. */
export function perbaruiBadgeKeranjang(): void {
  const n = keranjang().totalItem;
  const tautan = document.querySelector<HTMLElement>('a[href="#/keranjang"]');
  if (!tautan) return;
  let badge = document.getElementById('badge-keranjang');
  if (!n) return badge?.remove();
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'badge-keranjang';
    badge.className = 'titik-angka';
    tautan.appendChild(badge);
  }
  badge.textContent = String(n);
}
