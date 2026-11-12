/**
 * Komponen ulasan & rating (iterasi 2): formulir ulasan pada detail pesanan dan daftar ulasan pada detail restoran.
 */
import { api } from '../core/api.js';
import { html, mount, type SafeHtml } from '../core/html.js';
import { bersihkanGalat, ikon, sibuk, tandaiGalat, tanggal, toast } from '../core/ui.js';

export const bintang = (n: number): SafeHtml =>
  html`<span class="bintang" aria-label="${n} dari 5 bintang">${[1, 2, 3, 4, 5].map((i) =>
    html`<span class="${i <= n ? 'isi' : ''}">${ikon('bintang', 16)}</span>`)}</span>`;

/** Daftar ulasan terbaru suatu restoran (dipakai di I-06). */
export async function daftarUlasan(el: HTMLElement, restoranId: string): Promise<void> {
  const ulasan: any[] = await api.get(`/restoran/${restoranId}/ulasan`);
  mount(el, ulasan.length
    ? html`<ul class="list">${ulasan.map((u) => html`<li class="list-item kolom-item">
        <div class="baris-antara"><strong>${u.nama_pelanggan}</strong>${bintang(u.rating)}</div>
        ${u.komentar ? html`<p>${u.komentar}</p>` : ''}
        <small class="redup">${tanggal(u.waktu, { dateStyle: 'medium' })}</small></li>`)}</ul>`
    : html`<p class="redup">Belum ada ulasan dari pengguna antri.in.</p>`);
}

/** Formulir/hasil ulasan untuk satu pesanan (dipakai di detail pesanan). */
export async function formUlasan(el: HTMLElement, pesananId: string): Promise<void> {
  const { ulasan, bisaDiulas } = await api.get(`/pesanan/${pesananId}/ulasan`);
  if (ulasan) {
    mount(el, html`<h3>Ulasanmu</h3>${bintang(ulasan.rating)}${ulasan.komentar ? html`<p>${ulasan.komentar}</p>` : ''}`);
    return;
  }
  if (!bisaDiulas) {
    mount(el, html`<h3>Ulasan</h3><p class="redup">Ulasan dapat diberikan setelah pesanan selesai.</p>`);
    return;
  }
  let rating = 0;
  mount(el, html`<h3>Beri ulasan</h3>
    <form id="form-ulasan" novalidate>
      <div class="field" data-field="rating"><div class="pilih-bintang" role="radiogroup" aria-label="Rating">
        ${[1, 2, 3, 4, 5].map((i) => html`<button type="button" data-rating="${i}" aria-label="${i} bintang">${ikon('bintang', 30)}</button>`)}
      </div></div>
      <div class="field" data-field="komentar"><label for="komentar">Ceritakan pengalamanmu (opsional)</label>
        <textarea id="komentar" name="komentar" rows="3" maxlength="300"></textarea></div>
      <p class="form-galat" hidden></p>
      <button class="btn btn-utama" type="submit">Kirim ulasan</button>
    </form>`);
  const form = el.querySelector<HTMLFormElement>('#form-ulasan')!;
  form.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-rating]');
    if (!b) return;
    rating = Number(b.dataset.rating);
    form.querySelectorAll<HTMLElement>('[data-rating]').forEach((x) => x.classList.toggle('isi', Number(x.dataset.rating) <= rating));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      await sibuk(form.querySelector('button[type=submit]'), () =>
        api.post(`/pesanan/${pesananId}/ulasan`, { rating, komentar: (form.elements.namedItem('komentar') as HTMLTextAreaElement).value }));
      toast('Terima kasih atas ulasanmu!', 'sukses');
      await formUlasan(el, pesananId);
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}
