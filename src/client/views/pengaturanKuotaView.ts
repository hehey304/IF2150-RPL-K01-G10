/**
 * PengaturanView: PengaturanKuotaPage (C22, I-16) - kuota antrean & kapasitas meja (UC07).
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import { bersihkanGalat, dataForm, sibuk, tandaiGalat, toast } from '../core/ui.js';
import type { RouteCtx } from '../main.js';
import { kartuRestoran } from './komponen.js';

/** PengaturanKuotaPage (I-16). */
export async function pengaturanKuotaPage(ctx: RouteCtx): Promise<void> {
  let data = await api.get('/kelola/kuota');

  const render = () => {
    mount(
      ctx.root,
      html`<header class="panel-kepala"><div><h1>Kuota &amp; meja</h1><p class="redup">Perubahan langsung terlihat oleh pelanggan.</p></div></header>
        <div class="dua-kolom">
          <form class="kartu" id="form-kuota" novalidate>
            <div class="field" data-field="kuotaMaksimum"><label for="kuota">Kuota antrean maksimum (per hari)</label>
              <input id="kuota" name="kuotaMaksimum" inputmode="numeric" value="${data.kuotaMaksimum}">
              <small class="redup">Nilai kuota tetap tersimpan walaupun antrean ditutup sementara.</small></div>
            <div class="field" data-field="kapasitasMeja"><label for="meja">Kapasitas meja dine-in</label>
              <input id="meja" name="kapasitasMeja" inputmode="numeric" value="${data.kapasitasMeja}">
              <small class="redup">Isi 0 jika restoran hanya melayani takeaway.</small></div>
            <label class="toggle"><input type="checkbox" id="tutup" ${data.antreanTutup ? 'checked' : ''}>
              <span class="toggle-ui"></span><span><strong>Tutup antrean sementara</strong><small>Setara kuota 0. Pelanggan melihat status "Antrean ditutup".</small></span></label>
            <p class="form-galat" hidden></p>
            <div class="aksi-kanan"><button type="button" class="btn btn-ghost" id="batal">Batal</button>
              <button type="submit" class="btn btn-utama">Simpan pengaturan</button></div>
          </form>
          <section><h3>Pratinjau di aplikasi pelanggan</h3><div class="pratinjau">${kartuRestoran(data.pratinjau, false)}</div></section>
        </div>`,
    );
  };
  render();

  on(ctx.root, 'click', '#batal', () => render());
  on(ctx.root, 'submit', '#form-kuota', async (e, form) => {
    e.preventDefault();
    bersihkanGalat(form);
    const d = dataForm(form as HTMLFormElement);
    try {
      data = await sibuk(form.querySelector('button[type=submit]'), () =>
        api.put('/kelola/kuota', { ...d, tutup: $<HTMLInputElement>('#tutup', ctx.root).checked }));
      toast('Pengaturan tersimpan', 'sukses');
      render();
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}
