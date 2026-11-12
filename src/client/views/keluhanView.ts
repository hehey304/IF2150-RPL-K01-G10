/**
 * KeluhanView: KeluhanFormPage (C40, I-12) untuk pelanggan dan KeluhanDashboardPage (C42, I-19) untuk admin.
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import { bersihkanGalat, dialog, kosong, rupiah, sibuk, tampilkanGalat, tandaiGalat, tanggal, toast } from '../core/ui.js';
import { navigasi, type RouteCtx } from '../main.js';

const KATEGORI = ['Pesanan tidak sesuai', 'Waktu tunggu', 'Pelayanan', 'Pembayaran', 'Lainnya'];
const STATUS_LABEL: Record<string, string> = { BARU: 'Baru', DIBACA: 'Dibaca', DITANGGAPI: 'Ditanggapi' };
const badgeStatus = (s: string) =>
  html`<span class="badge ${s === 'BARU' ? 'badge-oranye' : s === 'DITANGGAPI' ? 'badge-hijau' : 'badge-abu'}">${STATUS_LABEL[s] ?? s}</span>`;

/** KeluhanFormPage (I-12). */
export async function keluhanFormPage(ctx: RouteCtx): Promise<void> {
  const [pesanan, riwayat] = await Promise.all([api.get('/pesanan'), api.get('/keluhan/saya')]);
  const dipilih = ctx.query.get('pesanan') ?? '';
  let kategori = '';
  mount(
    ctx.root,
    html`<div class="wadah wadah-sempit bagian">
      <h1>Kirim keluhan</h1>
      <p class="redup">Keluhanmu akan ditinjau oleh admin antri.in.</p>
      <form class="kartu" id="form-keluhan" novalidate>
        <div class="field"><label for="pesanan">Pesanan terkait</label>
          <select id="pesanan" name="pesananId">
            <option value="">Tidak terkait pesanan tertentu</option>
            ${pesanan.filter((p: any) => p.status_pemesanan !== 'MENUNGGU_PEMBAYARAN').map((p: any) =>
              html`<option value="${p.pesanan_id}" ${p.pesanan_id === dipilih ? 'selected' : ''}>${p.nama_restoran} · ${
                tanggal(p.dibuat_pada)} · ${rupiah(p.total_harga)}</option>`)}
          </select></div>
        <div class="field" data-field="kategori"><label>Kategori keluhan</label>
          <div class="chips" id="kategori">${KATEGORI.map((k) => html`<button type="button" class="chip" data-kategori="${k}">${k}</button>`)}</div></div>
        <div class="field" data-field="isi"><label for="isi">Isi keluhan</label>
          <textarea id="isi" name="isi" rows="5" maxlength="500" placeholder="Ceritakan apa yang terjadi…"></textarea>
          <small class="redup" id="hitung">0/500</small></div>
        <p class="form-galat" hidden></p>
        <div class="aksi-kanan"><button type="button" class="btn btn-ghost" id="batal">Batal</button>
          <button type="submit" class="btn btn-utama">Kirim keluhan</button></div>
      </form>
      <section class="kartu"><h3>Keluhan saya</h3>
        ${riwayat.length
          ? html`<ul class="list">${riwayat.map((k: any) => html`<li class="list-item kolom-item">
              <div class="baris-antara"><strong>${k.kategori}${k.nama_restoran ? ` · ${k.nama_restoran}` : ''}</strong>${badgeStatus(k.status)}</div>
              <p>${k.isi_keluhan}</p><small class="redup">${tanggal(k.waktu_kirim, { dateStyle: 'medium', timeStyle: 'short' })}</small>
              ${k.tanggapan ? html`<div class="tanggapan"><strong>Tanggapan admin:</strong> ${k.tanggapan}</div>` : ''}</li>`)}</ul>`
          : html`<p class="redup">Belum ada keluhan.</p>`}
      </section></div>`,
  );
  const form = $<HTMLFormElement>('#form-keluhan', ctx.root);
  const isi = $<HTMLTextAreaElement>('#isi', ctx.root);
  isi.addEventListener('input', () => ($('#hitung', ctx.root).textContent = `${isi.value.length}/500`));
  on(ctx.root, 'click', '[data-kategori]', (_e, t) => {
    kategori = t.dataset.kategori!;
    ctx.root.querySelectorAll('[data-kategori]').forEach((c) => c.classList.toggle('aktif', c === t));
  });
  $('#batal', ctx.root).addEventListener('click', () => history.back());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      await sibuk(form.querySelector('button[type=submit]'), () =>
        api.post('/keluhan', { pesananId: (form.elements.namedItem('pesananId') as HTMLSelectElement).value, kategori, isi: isi.value }));
      toast('Keluhan terkirim. Terima kasih atas masukanmu!', 'sukses');
      navigasi('#/keluhan');
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** KeluhanDashboardPage (I-19). */
export async function keluhanDashboardPage(ctx: RouteCtx): Promise<void> {
  const state = { status: '', q: '' };
  mount(
    ctx.root,
    html`<header class="panel-kepala"><div><h1>Daftar keluhan</h1><p class="redup">Keluhan dari seluruh pelanggan</p></div></header>
      <section class="kartu">
        <div class="baris-antara alat">
          <div class="chips">
            <button class="chip aktif" data-status="">Semua</button>
            <button class="chip" data-status="BARU">Baru</button>
            <button class="chip" data-status="DIBACA">Dibaca</button>
            <button class="chip" data-status="DITANGGAPI">Ditanggapi</button>
          </div>
          <input class="input-cari" id="cari" placeholder="Cari restoran…" aria-label="Cari restoran">
        </div>
        <div id="banner"></div>
        <div id="tabel"></div>
      </section>`,
  );
  const muat = async () => {
    const p = new URLSearchParams();
    if (state.status) p.set('status', state.status);
    if (state.q) p.set('q', state.q);
    const daftar: any[] = await api.get(`/admin/keluhan?${p}`);
    const perResto = new Map<string, number>();
    daftar.forEach((k) => k.nama_restoran && perResto.set(k.nama_restoran, k.keluhan_restoran_7_hari));
    const terbanyak = [...perResto.entries()].sort((a, b) => b[1] - a[1])[0];
    mount($('#banner', ctx.root), terbanyak && terbanyak[1] > 0
      ? html`<p class="info-banner">${terbanyak[0]} menerima ${terbanyak[1]} keluhan dalam 7 hari terakhir.
          <a href="#/admin/restoran">Lihat di Kelola Restoran</a></p>` : html``);
    mount($('#tabel', ctx.root), daftar.length
      ? html`<div class="tabel-wadah"><table class="tabel"><thead><tr><th>Pelanggan</th><th>Restoran</th><th>Isi keluhan</th><th>Waktu</th><th>Status</th></tr></thead>
          <tbody>${daftar.map((k) => html`<tr class="klik ${k.status === 'BARU' ? 'baris-baru' : ''}" data-keluhan="${k.id_keluhan}">
            <td>${k.nama_pelanggan}</td><td>${k.nama_restoran ?? '-'}</td>
            <td class="potong"><strong>${k.kategori}</strong> · ${k.isi_keluhan}</td>
            <td>${tanggal(k.waktu_kirim, { dateStyle: 'short', timeStyle: 'short' })}</td><td>${badgeStatus(k.status)}</td></tr>`)}</tbody></table></div>`
      : kosong('Tidak ada keluhan'));
  };
  await muat();
  on(ctx.root, 'click', '[data-status]', (_e, t) => {
    state.status = t.dataset.status ?? '';
    ctx.root.querySelectorAll('[data-status]').forEach((c) => c.classList.toggle('aktif', c === t));
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
  on(ctx.root, 'click', '[data-keluhan]', async (_e, t) => {
    try {
      const k = await api.get(`/admin/keluhan/${t.dataset.keluhan}`);
      const { el, tutup } = dialog(html`<h3>Detail keluhan</h3>
        <dl class="rincian">
          <dt>Pelanggan</dt><dd>${k.nama_pelanggan}</dd><dt>Restoran</dt><dd>${k.nama_restoran ?? '-'}</dd>
          <dt>Kategori</dt><dd>${k.kategori}</dd><dt>Waktu</dt><dd>${tanggal(k.waktu_kirim, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
          ${k.pesanan ? html`<dt>Pesanan</dt><dd><code>${k.pesanan.pesanan_id}</code> · ${rupiah(k.pesanan.total_harga)}</dd>` : ''}
        </dl>
        <p class="kutipan">${k.isi_keluhan}</p>
        <form id="form-tanggapan"><div class="field"><label for="tanggapan">Tanggapan admin</label>
          <textarea id="tanggapan" name="tanggapan" rows="3" maxlength="1000">${k.tanggapan ?? ''}</textarea></div>
          <div class="dialog-aksi"><button type="button" class="btn btn-ghost" data-tutup>Tutup</button>
          <button class="btn btn-utama" type="submit">Kirim tanggapan</button></div></form>`, 560);
      void muat();
      el.querySelector('form')!.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.post(`/admin/keluhan/${k.id_keluhan}/tanggapan`, { tanggapan: (el.querySelector('#tanggapan') as HTMLTextAreaElement).value });
          toast('Tanggapan tersimpan', 'sukses');
          tutup();
          void muat();
        } catch (err) {
          tampilkanGalat(err);
        }
      });
    } catch (err) {
      tampilkanGalat(err);
    }
  });
}
