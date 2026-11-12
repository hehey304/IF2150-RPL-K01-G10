/**
 * Profil restoran (iterasi 2): ubah deskripsi, alamat, jam buka, kontak, dan foto restoran.
 */
import { api } from '../core/api.js';
import { $, html, mount } from '../core/html.js';
import { bersihkanGalat, dataForm, ikon, sibuk, tampilkanGalat, tandaiGalat, toast } from '../core/ui.js';
import type { RouteCtx } from '../main.js';

export async function profilRestoranPage(ctx: RouteCtx): Promise<void> {
  let p = await api.get('/kelola/profil');
  const render = () => {
    mount(
      ctx.root,
      html`<header class="panel-kepala"><div><h1>Profil restoran</h1>
        <p class="redup">Informasi ini tampil di halaman restoran pada aplikasi pelanggan.</p></div>
        <a class="btn btn-ghost" href="#/restoran/${p.restoran_id}" target="_blank" rel="noopener">Lihat sebagai pelanggan</a></header>
      <div class="dua-kolom">
        <section class="kartu">
          <h3>Foto restoran</h3>
          <div class="foto-pratinjau warna-${p.warna}">${p.foto_path
            ? html`<img src="/api/restoran/${p.restoran_id}/foto?v=${encodeURIComponent(p.foto_path)}" alt="Foto ${p.nama_restoran}">`
            : ikon('mangkuk', 56)}</div>
          <label class="btn btn-ghost btn-penuh">Ganti foto<input type="file" id="foto" accept="image/jpeg,image/png,image/webp" hidden></label>
          <p class="redup kecil">JPG/PNG/WEBP, maksimum 2 MB.</p>
          <dl class="rincian"><dt>Nama</dt><dd>${p.nama_restoran}</dd><dt>Email</dt><dd>${p.email_kontak}</dd>
            <dt>Rating</dt><dd>${Number(p.rating_rerata).toFixed(1)} (${p.jumlah_ulasan} ulasan)</dd></dl>
        </section>
        <form class="kartu" id="form-profil-resto" novalidate>
          <div class="baris-2">
            <div class="field" data-field="kategori"><label for="pr-kat">Kategori makanan</label><input id="pr-kat" name="kategori" value="${p.kategori}"></div>
            <div class="field" data-field="lokasi"><label for="pr-lok">Area / kecamatan</label><input id="pr-lok" name="lokasi" value="${p.lokasi}"></div>
          </div>
          <div class="field" data-field="alamat"><label for="pr-al">Alamat lengkap</label><input id="pr-al" name="alamat" value="${p.alamat ?? ''}"></div>
          <div class="baris-2">
            <div class="field" data-field="jamBuka"><label for="pr-jam">Jam buka</label><input id="pr-jam" name="jamBuka" placeholder="10.00 - 22.00" value="${p.jam_buka ?? ''}"></div>
            <div class="field" data-field="noHp"><label for="pr-hp">Nomor telepon</label><input id="pr-hp" name="noHp" type="tel" value="${p.no_hp ?? ''}"></div>
          </div>
          <div class="field"><label for="pr-desk">Deskripsi</label><textarea id="pr-desk" name="deskripsi" rows="4" maxlength="500">${p.deskripsi ?? ''}</textarea></div>
          <p class="form-galat" hidden></p>
          <div class="aksi-kanan"><button class="btn btn-utama" type="submit">Simpan profil</button></div>
        </form>
      </div>`,
    );
    const form = $<HTMLFormElement>('#form-profil-resto', ctx.root);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      bersihkanGalat(form);
      try {
        p = await sibuk(form.querySelector('button[type=submit]'), () => api.put('/kelola/profil', dataForm(form)));
        toast('Profil restoran disimpan', 'sukses');
        render();
      } catch (err) {
        tandaiGalat(form, err);
      }
    });
    $<HTMLInputElement>('#foto', ctx.root).addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('foto', file);
      try {
        p = await api.post('/kelola/profil/foto', fd);
        toast('Foto restoran diperbarui', 'sukses');
        render();
      } catch (err) {
        tampilkanGalat(err);
      }
    });
  };
  render();
}
