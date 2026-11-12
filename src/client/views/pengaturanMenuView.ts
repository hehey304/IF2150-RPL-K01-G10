/**
 * PengaturanView: PengaturanMenuPage (C23, I-17) - menu & stok (UC08).
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import {
  bersihkanGalat, dataForm, dialog, ikon, konfirmasi, kosong, rupiah, sibuk, tampilkanGalat, tandaiGalat, toast,
} from '../core/ui.js';
import type { RouteCtx } from '../main.js';

/** PengaturanMenuPage (I-17). */
export async function pengaturanMenuPage(ctx: RouteCtx): Promise<void> {
  let menu: any[] = await api.get('/kelola/menu');
  const state = { q: '', kategori: 'Semua' };

  const render = () => {
    const kategori = ['Semua', ...new Set<string>(menu.map((m) => m.kategori_menu))];
    const tampil = menu.filter((m) => (state.kategori === 'Semua' || m.kategori_menu === state.kategori)
      && m.nama_menu.toLowerCase().includes(state.q.toLowerCase()));
    mount(
      $('#menu-isi', ctx.root),
      html`<div class="baris-antara alat">
          <div class="chips">${kategori.map((k) => html`<button class="chip ${state.kategori === k ? 'aktif' : ''}" data-kat="${k}">${k}</button>`)}</div>
        </div>
        ${tampil.length ? html`<div class="tabel-wadah"><table class="tabel"><thead><tr><th>Menu</th><th>Kategori</th><th>Harga</th><th>Stok (porsi)</th><th>Status</th><th></th></tr></thead>
          <tbody>${tampil.map((m) => html`<tr>
            <td><div class="menu-sel"><label class="menu-thumb" title="Ganti foto ${m.nama_menu}">${m.foto_path
                ? html`<img src="/api/menu/${m.menu_id}/foto?v=${encodeURIComponent(m.foto_path)}" alt="">`
                : ikon('mangkuk', 20)}<input type="file" accept="image/jpeg,image/png,image/webp" data-foto="${m.menu_id}" hidden></label>
              <div><strong>${m.nama_menu}</strong><small class="blok redup">${m.deskripsi_menu}</small></div></div></td>
            <td>${m.kategori_menu}</td><td>${rupiah(m.harga)}</td>
            <td><input class="input-stok" type="number" min="0" max="9999" value="${m.stok}" data-stok="${m.menu_id}" aria-label="Stok ${m.nama_menu}"></td>
            <td>${m.stok > 0 ? html`<span class="badge badge-hijau">Tersedia</span>` : html`<span class="badge badge-abu">Habis</span>`}</td>
            <td class="aksi-ikon"><button class="ikon-btn" data-edit="${m.menu_id}" aria-label="Ubah ${m.nama_menu}">${ikon('edit', 18)}</button>
              <button class="ikon-btn bahaya" data-hapus="${m.menu_id}" aria-label="Hapus ${m.nama_menu}">${ikon('hapus', 18)}</button></td></tr>`)}</tbody></table></div>`
          : kosong('Menu tidak ditemukan')}`,
    );
  };

  mount(
    ctx.root,
    html`<header class="panel-kepala"><div><h1>Menu &amp; stok</h1><p class="redup">Stok 0 otomatis tampil "Habis" di aplikasi pelanggan.</p></div>
        <button class="btn btn-utama" id="tambah">+ Tambah menu</button></header>
      <section class="kartu"><input class="input-cari" id="cari" placeholder="Cari menu…" aria-label="Cari menu"><div id="menu-isi"></div></section>`,
  );
  render();

  const formMenu = (m?: any) => {
    const { el, tutup } = dialog(html`<h3>${m ? 'Ubah menu' : 'Tambah menu'}</h3>
      <form id="form-menu" novalidate>
        <div class="field" data-field="namaMenu"><label for="fm-nama">Nama menu</label><input id="fm-nama" name="namaMenu" value="${m?.nama_menu ?? ''}"></div>
        <div class="field"><label for="fm-desk">Deskripsi</label><textarea id="fm-desk" name="deskripsiMenu" rows="2">${m?.deskripsi_menu ?? ''}</textarea></div>
        <div class="baris-3">
          <div class="field"><label for="fm-kat">Kategori</label><input id="fm-kat" name="kategoriMenu" value="${m?.kategori_menu ?? ''}" list="daftar-kat"></div>
          <div class="field" data-field="harga"><label for="fm-harga">Harga (Rp)</label><input id="fm-harga" name="harga" inputmode="numeric" value="${m?.harga ?? ''}"></div>
          <div class="field" data-field="stok"><label for="fm-stok">Stok</label><input id="fm-stok" name="stok" inputmode="numeric" value="${m?.stok ?? 0}"></div>
        </div>
        <datalist id="daftar-kat">${[...new Set(menu.map((x) => x.kategori_menu))].map((k) => html`<option value="${k}">`)}</datalist>
        <p class="form-galat" hidden></p>
        <div class="dialog-aksi"><button type="button" class="btn btn-ghost" data-tutup>Batal</button><button class="btn btn-utama" type="submit">Simpan</button></div>
      </form>`);
    const form = el.querySelector<HTMLFormElement>('#form-menu')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      bersihkanGalat(form);
      try {
        const d = dataForm(form);
        await sibuk(form.querySelector('button[type=submit]'), () =>
          m ? api.put(`/kelola/menu/${m.menu_id}`, d) : api.post('/kelola/menu', d));
        toast(m ? 'Menu diperbarui' : 'Menu ditambahkan', 'sukses');
        tutup();
        menu = await api.get('/kelola/menu');
        render();
      } catch (err) {
        tandaiGalat(form, err);
      }
    });
  };

  $('#tambah', ctx.root).addEventListener('click', () => formMenu());
  $<HTMLInputElement>('#cari', ctx.root).addEventListener('input', (e) => {
    state.q = (e.target as HTMLInputElement).value;
    render();
  });
  on(ctx.root, 'click', '[data-kat]', (_e, t) => {
    state.kategori = t.dataset.kat!;
    render();
  });
  on(ctx.root, 'click', '[data-edit]', (_e, t) => formMenu(menu.find((m) => m.menu_id === t.dataset.edit)));
  on(ctx.root, 'click', '[data-hapus]', async (_e, t) => {
    const m = menu.find((x) => x.menu_id === t.dataset.hapus);
    if (!m || !(await konfirmasi({ judul: `Hapus ${m.nama_menu}?`, pesan: 'Menu tidak akan tampil lagi bagi pelanggan.', ya: 'Hapus', bahaya: true }))) return;
    try {
      await api.del(`/kelola/menu/${m.menu_id}`);
      menu = menu.filter((x) => x.menu_id !== m.menu_id);
      toast('Menu dihapus', 'info');
      render();
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  // Iterasi 2: unggah foto menu dengan mengklik gambar kecil di tabel.
  on(ctx.root, 'change', '[data-foto]', async (_e, t) => {
    const input = t as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('foto', file);
    try {
      const baru = await api.post(`/kelola/menu/${input.dataset.foto}/foto`, fd);
      menu = menu.map((x) => (x.menu_id === baru.menu_id ? baru : x));
      toast(`Foto ${baru.nama_menu} diperbarui`, 'sukses');
      render();
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  on(ctx.root, 'change', '[data-stok]', async (_e, t) => {
    const input = t as HTMLInputElement;
    try {
      const baru = await api.patch(`/kelola/menu/${input.dataset.stok}/stok`, { stok: input.value });
      menu = menu.map((x) => (x.menu_id === baru.menu_id ? baru : x));
      toast(`Stok ${baru.nama_menu} diperbarui`, 'sukses', 2000);
      render();
    } catch (err) {
      tampilkanGalat(err);
      render();
    }
  });
}
