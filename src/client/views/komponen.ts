import { html, type SafeHtml } from '../core/html.js';
import { ikon } from '../core/ui.js';

/** Badge status antrean & meja pada kartu restoran (I-05-08, I-16-06). */
export function badgeRestoran(r: any): SafeHtml {
  const antrean =
    r.status_antrean === 'TUTUP'
      ? html`<span class="badge badge-abu">Antrean ditutup</span>`
      : r.status_antrean === 'PENUH'
        ? html`<span class="badge badge-merah">Kuota penuh</span>`
        : html`<span class="badge badge-oranye">Antrean ${r.total_antrean}</span>`;
  const meja =
    r.kapasitas_meja === 0
      ? html`<span class="badge badge-biru">Takeaway saja</span>`
      : r.meja_tersisa === 0
        ? html`<span class="badge badge-merah">Meja penuh</span>`
        : html`<span class="badge ${r.meja_tersisa <= 1 ? 'badge-kuning' : 'badge-hijau'}">Meja tersisa ${r.meja_tersisa}</span>`;
  return html`${antrean}${r.status_antrean === 'TUTUP' ? '' : meja}`;
}

export function kartuRestoran(r: any, tautan = true): SafeHtml {
  const isi = html`<div class="kartu-foto warna-${r.warna}">${ikon('mangkuk', 56)}</div>
    <div class="kartu-badan">
      <h3>${r.nama_restoran}</h3>
      <p class="redup">${r.kategori} · ${r.lokasi}</p>
      <p class="rating">${ikon('bintang', 16)} ${Number(r.rating_rerata).toFixed(1)}</p>
      <div class="badge-baris">${badgeRestoran(r)}</div>
    </div>`;
  return tautan
    ? html`<a class="kartu-resto" href="#/restoran/${r.restoran_id}">${isi}</a>`
    : html`<div class="kartu-resto">${isi}</div>`;
}
