/**
 * Notifikasi dalam aplikasi (iterasi 2): ikon lonceng dengan jumlah belum dibaca dan daftar notifikasi.
 */
import { api } from '../core/api.js';
import { html, mount } from '../core/html.js';
import { session } from '../core/session.js';
import { ikon, tanggal } from '../core/ui.js';

export const tombolNotifikasi = () =>
  html`<div class="notif-wadah"><button class="ikon-btn" id="notif-tombol" aria-label="Notifikasi" aria-expanded="false">
    ${ikon('lonceng', 22)}<span class="titik-angka" id="notif-jumlah" hidden></span></button>
    <div class="notif-panel" id="notif-panel" hidden></div></div>`;

let poll = 0;

// Menutup panel notifikasi saat mengklik di luar panel (dipasang sekali).
document.addEventListener('click', () => {
  const panel = document.getElementById('notif-panel');
  if (panel) panel.hidden = true;
});

function aturJumlah(n: number): void {
  const el = document.getElementById('notif-jumlah');
  if (!el) return;
  el.hidden = n === 0;
  el.textContent = n > 9 ? '9+' : String(n);
}

async function segarkanJumlah(): Promise<void> {
  if (!session.token || !document.getElementById('notif-tombol')) return;
  try {
    aturJumlah((await api.get('/notifikasi/jumlah')).belumDibaca);
  } catch {
    /* abaikan gangguan jaringan sementara */
  }
}

async function bukaPanel(panel: HTMLElement): Promise<void> {
  mount(panel, html`<div class="memuat-halaman"><span class="spinner"></span></div>`);
  const { items, belumDibaca } = await api.get('/notifikasi');
  aturJumlah(belumDibaca);
  mount(panel, html`<div class="notif-kepala"><strong>Notifikasi</strong>
      ${belumDibaca ? html`<button class="btn-teks kecil" id="notif-semua">Tandai semua dibaca</button>` : ''}</div>
    ${items.length
      ? html`<ul class="notif-list">${items.map((n: any) => html`<li><a href="${n.tautan ?? '#'}" class="notif-item ${n.dibaca ? '' : 'baru'}" data-notif="${n.id_notifikasi}">
          <strong>${n.judul}</strong>${n.isi ? html`<span>${n.isi}</span>` : ''}
          <small>${tanggal(n.waktu, { dateStyle: 'medium', timeStyle: 'short' })}</small></a></li>`)}</ul>`
      : html`<p class="redup tengah notif-kosong">Belum ada notifikasi.</p>`}`);
}

/** Memasang perilaku lonceng setelah tata letak dirender. Dipanggil oleh router setiap pindah halaman. */
export function pasangNotifikasi(root: HTMLElement): void {
  const tombol = root.querySelector<HTMLButtonElement>('#notif-tombol');
  const panel = root.querySelector<HTMLElement>('#notif-panel');
  if (!tombol || !panel) return;
  tombol.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    tombol.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) void bukaPanel(panel).catch(() => mount(panel, html`<p class="redup tengah notif-kosong">Gagal memuat.</p>`));
  });
  panel.addEventListener('click', async (e) => {
    e.stopPropagation();
    const t = e.target as HTMLElement;
    if (t.closest('#notif-semua')) {
      aturJumlah((await api.post('/notifikasi/dibaca')).belumDibaca);
      void bukaPanel(panel);
      return;
    }
    const item = t.closest<HTMLElement>('[data-notif]');
    if (item) {
      panel.hidden = true;
      void api.post(`/notifikasi/${item.dataset.notif}/dibaca`).then((r) => aturJumlah(r.belumDibaca)).catch(() => {});
    }
  });
  void segarkanJumlah();
  clearInterval(poll);
  poll = window.setInterval(segarkanJumlah, 20_000);
}
