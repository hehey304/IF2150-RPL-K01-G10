import { $, $$, html, mount, raw, type SafeHtml } from './html.js';
import { ApiError } from './api.js';

export const rupiah = (n: number): string => `Rp${Math.round(n).toLocaleString('id-ID')}`;
export const nomorAntrean = (n: number | null | undefined): string =>
  n === null || n === undefined ? '-' : `A-${String(n).padStart(3, '0')}`;

export function tanggal(d: string | Date, opsi: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  const dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  return dt.toLocaleString('id-ID', opsi);
}
export const jam = (d: string | Date): string =>
  new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const MODE_LABEL: Record<string, string> = { DINE_IN: 'Dine-in', TAKEAWAY: 'Takeaway', BOOKING: 'Booking' };
export const TIPE_BAYAR_LABEL: Record<string, string> = {
  EWALLET: 'Dompet digital (e-wallet)',
  VIRTUAL_ACCOUNT: 'Virtual account bank',
  KARTU: 'Kartu debit / kredit',
};

export function badgeMode(mode: string): SafeHtml {
  const cls = mode === 'DINE_IN' ? 'badge-oranye' : mode === 'TAKEAWAY' ? 'badge-biru' : 'badge-ungu';
  return html`<span class="badge ${cls}">${MODE_LABEL[mode] ?? mode}</span>`;
}

/** Ikon garis sederhana (SVG inline). */
const IKON: Record<string, string> = {
  cari: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  keranjang: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/>',
  mangkuk: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 20h8"/>',
  tiket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3Z"/><path d="M9 6v12" stroke-dasharray="2 2"/>',
  bintang: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" fill="currentColor" stroke="none"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  slider: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  toko: '<path d="M4 10v10h16V10"/><path d="M3 10 5 4h14l2 6"/><path d="M10 20v-5h4v5"/>',
  cek: '<path d="m5 12 5 5 9-10"/>',
  jam: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pesan: '<path d="M4 5h16v11H8l-4 4Z"/>',
  dokumen: '<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/>',
  keluar: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  hapus: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16Z"/>',
  lonceng: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  orang: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  perisai: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>',
  kalender: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  kembali: '<path d="m15 5-7 7 7 7"/>',
  kanan: '<path d="m9 5 7 7-7 7"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3"/>',
  bank: '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
  kartu: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  salin: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  gembok: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  hp: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  silang: '<path d="M6 6l12 12M18 6 6 18"/>',
};
export function ikon(nama: string, ukuran = 20): SafeHtml {
  return raw(
    `<svg class="ikon" width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[nama] ?? ''}</svg>`,
  );
}

export const logo = (sub = ''): SafeHtml => html`<a href="#/" class="logo" aria-label="antri.in beranda">
  <img src="/img/logo.png" alt="antri.in" width="120" height="65">${sub ? html`<span class="logo-sub">${sub}</span>` : ''}</a>`;

// ---- Notifikasi toast
export function toast(pesan: string, jenis: 'sukses' | 'galat' | 'info' = 'info', durasi = 3500): void {
  let wadah = document.getElementById('toasts');
  if (!wadah) {
    wadah = document.createElement('div');
    wadah.id = 'toasts';
    wadah.setAttribute('role', 'status');
    document.body.appendChild(wadah);
  }
  const el = document.createElement('div');
  el.className = `toast toast-${jenis}`;
  el.textContent = pesan;
  wadah.appendChild(el);
  setTimeout(() => el.classList.add('keluar'), durasi);
  setTimeout(() => el.remove(), durasi + 400);
}

export function tampilkanGalat(err: unknown): void {
  toast(err instanceof Error ? err.message : 'Terjadi kesalahan', 'galat', 5000);
}

// ---- Dialog konfirmasi (dipakai I-04, I-15, I-21)
export function konfirmasi(opsi: {
  judul: string;
  pesan: string;
  ya: string;
  batal?: string;
  bahaya?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    mount(
      overlay,
      html`<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-judul">
        <h3 id="dlg-judul">${opsi.judul}</h3>
        <p>${opsi.pesan}</p>
        <div class="dialog-aksi">
          <button class="btn btn-ghost" data-r="0">${opsi.batal ?? 'Batal'}</button>
          <button class="btn ${opsi.bahaya ? 'btn-bahaya' : 'btn-utama'}" data-r="1">${opsi.ya}</button>
        </div></div>`,
    );
    const tutup = (hasil: boolean) => {
      overlay.remove();
      document.removeEventListener('keydown', esc);
      resolve(hasil);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && tutup(false);
    overlay.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t === overlay) tutup(false);
      const r = t.closest<HTMLElement>('[data-r]');
      if (r) tutup(r.dataset.r === '1');
    });
    document.addEventListener('keydown', esc);
    document.body.appendChild(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-r="1"]')?.focus();
  });
}

/** Dialog bebas berisi konten; mengembalikan elemen dialog dan fungsi penutup. */
export function dialog(konten: SafeHtml, lebar = 520): { el: HTMLElement; tutup: () => void } {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  mount(overlay, html`<div class="dialog" role="dialog" aria-modal="true" style="max-width:${lebar}px">${konten}</div>`);
  const tutup = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('[data-tutup]')) tutup();
  });
  document.body.appendChild(overlay);
  return { el: overlay.querySelector('.dialog') as HTMLElement, tutup };
}

// ---- Form
export function dataForm(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  new FormData(form).forEach((v, k) => {
    if (typeof v === 'string') out[k] = v;
  });
  return out;
}

/** Menandai kolom bermasalah berdasarkan galat dari server (atribut data-field pada .field). */
export function tandaiGalat(form: HTMLElement, err: unknown): void {
  bersihkanGalat(form);
  const fields = err instanceof ApiError ? err.fields : {};
  for (const [nama, pesan] of Object.entries(fields)) {
    const field = form.querySelector<HTMLElement>(`[data-field="${nama}"]`);
    if (!field) continue;
    field.classList.add('salah');
    const p = document.createElement('small');
    p.className = 'pesan-galat';
    p.textContent = pesan;
    field.appendChild(p);
  }
  const ringkas = form.querySelector<HTMLElement>('.form-galat');
  if (ringkas) {
    ringkas.textContent = err instanceof Error ? err.message : 'Terjadi kesalahan';
    ringkas.hidden = false;
  } else {
    tampilkanGalat(err);
  }
}

export function bersihkanGalat(form: HTMLElement): void {
  $$('.salah', form).forEach((f) => f.classList.remove('salah'));
  $$('.pesan-galat', form).forEach((p) => p.remove());
  const ringkas = form.querySelector<HTMLElement>('.form-galat');
  if (ringkas) ringkas.hidden = true;
}

/** Menonaktifkan tombol selama proses async berjalan. */
export async function sibuk<T>(tombol: HTMLButtonElement | null, fn: () => Promise<T>): Promise<T> {
  if (!tombol) return fn();
  const teks = tombol.innerHTML;
  tombol.disabled = true;
  tombol.classList.add('memuat');
  try {
    return await fn();
  } finally {
    tombol.disabled = false;
    tombol.classList.remove('memuat');
    tombol.innerHTML = teks;
  }
}

export const memuat = (): SafeHtml => html`<div class="memuat-halaman"><span class="spinner"></span></div>`;

export function kosong(judul: string, teks = '', aksi?: SafeHtml): SafeHtml {
  return html`<div class="kosong">${ikon('mangkuk', 40)}<h3>${judul}</h3>${teks ? html`<p>${teks}</p>` : ''}${aksi ?? ''}</div>`;
}

export function inisial(nama: string): string {
  return nama.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('');
}

export { $ };
