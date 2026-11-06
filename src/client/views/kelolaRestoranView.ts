/**
 * KelolaRestoranView: DashboardKelolaRestoranPage (C31, I-20) dan KonfirmasiHapusRestoranPage (C32, I-21) (UC15).
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import { ikon, konfirmasi, kosong, sibuk, tampilkanGalat, tanggal, toast } from '../core/ui.js';
import type { RouteCtx } from '../main.js';

export async function dashboardKelolaRestoranPage(ctx: RouteCtx): Promise<void> {
  const state = { q: '', filter: 'semua' };
  let daftar: any[] = [];
  mount(
    ctx.root,
    html`<header class="panel-kepala"><div><h1>Kelola restoran mitra</h1><p class="redup">Nonaktifkan restoran yang melanggar ketentuan platform.</p></div></header>
      <section class="kartu">
        <div class="baris-antara alat">
          <div class="chips"><button class="chip aktif" data-f="semua">Semua</button><button class="chip" data-f="aktif">Aktif</button><button class="chip" data-f="nonaktif">Nonaktif</button>
            <button class="chip" data-f="banyak-keluhan">Banyak keluhan</button></div>
          <input class="input-cari" id="cari" placeholder="Cari nama restoran…" aria-label="Cari nama restoran">
        </div><div id="tabel"></div></section>`,
  );
  const muat = async () => {
    const p = new URLSearchParams({ q: state.q, filter: state.filter });
    daftar = await api.get(`/admin/restoran?${p}`);
    mount($('#tabel', ctx.root), daftar.length
      ? html`<div class="tabel-wadah"><table class="tabel"><thead><tr><th>Restoran</th><th>Kategori</th><th>Rating</th><th>Keluhan 7 hari</th><th>Bergabung</th><th>Status</th><th></th></tr></thead>
        <tbody>${daftar.map((r) => html`<tr class="${r.status_aktif ? '' : 'baris-nonaktif'}"><td><strong>${r.nama_restoran}</strong><small class="blok redup">${r.lokasi}</small></td>
          <td>${r.kategori}</td><td>${ikon('bintang', 14)} ${Number(r.rating_rerata).toFixed(1)}</td>
          <td>${r.keluhan_7_hari >= 3 ? html`<span class="badge badge-merah">${r.keluhan_7_hari}</span>` : r.keluhan_7_hari}</td>
          <td>${tanggal(r.bergabung_pada)}</td>
          <td>${r.status_aktif ? html`<span class="badge badge-hijau">Aktif</span>`
            : html`<span class="badge badge-abu">Nonaktif</span><small class="blok redup">sejak ${tanggal(r.dihapus_pada)}</small>`}</td>
          <td>${r.status_aktif ? html`<button class="btn btn-kecil btn-ghost-bahaya" data-hapus="${r.restoran_id}">Hapus</button>` : ''}</td></tr>`)}</tbody></table></div>`
      : kosong('Restoran tidak ditemukan'));
  };
  await muat();

  on(ctx.root, 'click', '[data-f]', (_e, t) => {
    state.filter = t.dataset.f!;
    ctx.root.querySelectorAll('[data-f]').forEach((c) => c.classList.toggle('aktif', c === t));
    void muat().catch(tampilkanGalat);
  });
  let jeda = 0;
  $<HTMLInputElement>('#cari', ctx.root).addEventListener('input', (e) => {
    clearTimeout(jeda);
    jeda = window.setTimeout(() => {
      state.q = (e.target as HTMLInputElement).value.trim();
      void muat().catch(tampilkanGalat);
    }, 250);
  });
  on(ctx.root, 'click', '[data-hapus]', async (_e, t) => {
    const r = daftar.find((x) => x.restoran_id === t.dataset.hapus);
    if (!r) return;
    const ya = await konfirmasi({
      judul: `Hapus ${r.nama_restoran}?`,
      pesan: 'Restoran dan seluruh menunya akan dinonaktifkan, antrean aktif dibatalkan. Tindakan ini tidak dapat dibatalkan.',
      ya: 'Hapus restoran',
      bahaya: true,
    });
    if (!ya) return; // UC15 Skenario Alternatif 1
    try {
      await sibuk(t as HTMLButtonElement, () => api.del(`/admin/restoran/${r.restoran_id}`));
      toast('Restoran berhasil dihapus', 'sukses');
      await muat();
    } catch (err) {
      tampilkanGalat(err);
    }
  });
}
