/**
 * Panel simulasi antrean dummy (iterasi 2) pada dashboard restoran.
 */
import { api } from '../core/api.js';
import { html, mount } from '../core/html.js';
import { sibuk, tampilkanGalat, toast } from '../core/ui.js';

const MODE: [string, string, string][] = [
  ['MATI', 'Mati', 'Tidak ada pelanggan dummy.'],
  ['PELANGGAN', 'Pelanggan dummy', 'Pelanggan dummy datang & memesan otomatis; kamu yang melayani.'],
  ['PENUH', 'Otomatis penuh', 'Pelanggan dummy datang, dan antrean dilayani otomatis (stok diisi ulang).'],
];

/** Memasang panel simulasi ke elemen `el`. */
export async function panelSimulasi(el: HTMLElement): Promise<void> {
  const data = await api.get('/kelola/simulasi');
  const render = (mode: string) => mount(el, html`<div class="baris-antara alat"><div><h2>Simulasi antrean dummy</h2>
      <p class="redup kecil">${data.simulatorAktif
        ? `Untuk demo: pelanggan dummy memesan lewat alur pembayaran simulasi, dicek setiap ${data.intervalDetik} detik.`
        : 'Simulator dinonaktifkan di server (SIMULASI_ANTREAN=false). Tombol "Tambah 1 pelanggan" tetap bisa dipakai.'}</p></div>
      <button class="btn btn-ghost btn-kecil" id="sim-tambah">+ Tambah 1 pelanggan dummy</button></div>
    <div class="radio-grup">${MODE.map(([k, label, ket]) => html`<label class="radio-kartu ${mode === k ? 'dipilih' : ''}">
      <input type="radio" name="mode-simulasi" value="${k}" ${mode === k ? 'checked' : ''}><strong>${label}</strong><small>${ket}</small></label>`)}</div>`);
  render(data.mode);
  el.addEventListener('change', async (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name !== 'mode-simulasi') return;
    try {
      const baru = await api.put('/kelola/simulasi', { mode: t.value });
      render(baru.mode);
      toast(`Mode simulasi: ${MODE.find((m) => m[0] === baru.mode)?.[1]}`, 'info');
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  el.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('#sim-tambah');
    if (!b) return;
    try {
      await sibuk(b, () => api.post('/kelola/simulasi/pelanggan'));
      toast('Pelanggan dummy masuk antrean', 'sukses');
    } catch (err) {
      tampilkanGalat(err);
    }
  });
}
