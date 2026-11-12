/**
 * PencarianView: PencarianRestoPage (C34, I-05) dan detail restoran & menu (I-06).
 */
import { api, pantauRestoran } from '../core/api.js';
import { $, $$, html, mount, on } from '../core/html.js';
import { ikon, konfirmasi, kosong, nomorAntrean, rupiah, toast } from '../core/ui.js';
import { keranjang } from '../models/keranjang.js';
import { navigasi, type RouteCtx } from '../main.js';
import { badgeRestoran, kartuRestoran } from './komponen.js';
import { perbaruiBadgeKeranjang } from './layout.js';
import { daftarUlasan } from './ulasanView.js';

/** PencarianRestoPage (I-05): beranda, pencarian, filter, dan kartu antrean aktif. */
export async function pencarianRestoPage(ctx: RouteCtx): Promise<void> {
  const state = {
    q: ctx.query.get('q') ?? '',
    chip: ctx.query.get('f') ?? 'semua',
    lokasi: ctx.query.get('lokasi') ?? '',
  };
  const antreanSaya: any[] = ctx.user?.role === 'PELANGGAN' ? await api.get('/antrean-saya').catch(() => []) : [];
  const aktif = antreanSaya.find((a) => a.tiket.status_antrean !== 'TERJADWAL');

  mount(
    ctx.root,
    html`<section class="hero"><div class="wadah hero-isi">
        <div class="hero-teks">
          <h1>Makan makanan viral,<br><span class="aksen">tanpa antre berjam‑jam.</span></h1>
          <p>Cari restoran viral di Bandung, pesan lebih dulu, dan datang saat giliranmu.</p>
          <form class="cari" id="form-cari" role="search">
            <label class="cari-input">${ikon('cari')}<input name="q" placeholder="Cari restoran atau makanan viral…"
              value="${state.q}" aria-label="Kata kunci"></label>
            <button class="btn btn-utama btn-besar" type="submit">Cari</button>
          </form>
          <div class="baris-filter"><div class="chips" id="chips"></div>
            <label class="pilih-lokasi">Area <select id="lokasi" aria-label="Filter area"><option value="">Semua area</option></select></label></div>
        </div>
        ${aktif
          ? html`<a class="kartu-antreanmu" href="#/antrean/${aktif.tiket.id_tiket}">
              <div class="baris">${html`<span class="ikon-bulat">${ikon('tiket', 26)}</span>`}
                <div><small>Antreanmu · ${aktif.tiket.nama_restoran}</small><strong>${nomorAntrean(aktif.tiket.nomor_urut)}</strong></div></div>
              <div class="progress"><span style="width:${Math.max(8, 100 - aktif.sisaAntrean * 10)}%"></span></div>
              <div class="baris-antara"><strong>${aktif.giliranmu ? 'Giliranmu sekarang!' : `${aktif.sisaAntrean} antrean lagi`}</strong>
                <strong class="aksen">± ${aktif.estimasiMenit} mnt</strong></div>
              <span class="badge badge-oranye">${aktif.tiket.tipe_antrean === 'DINE_IN' ? `Dine-in · ${aktif.pesanan.jumlah_rombongan} orang` : 'Takeaway'}</span>
            </a>`
          : ''}
      </div></section>
      <section class="wadah bagian">
        <div class="baris-antara"><div><h2 id="judul-daftar">Lagi viral di Bandung</h2>
          <p class="redup">Diurutkan berdasarkan restoran paling viral</p></div>
          <a href="#/" id="lihat-semua" class="tautan-aksen">Lihat semua ›</a></div>
        <div id="hasil"></div>
      </section>`,
  );

  const hasilEl = $('#hasil', ctx.root);
  let kategori: string[] = [];

  async function muat(): Promise<void> {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.chip === 'rating') p.set('minRating', '4.5');
    else if (state.chip === 'pendek') p.set('antreanPendek', 'true');
    else if (state.chip !== 'semua') p.set('kategori', state.chip);
    if (state.lokasi) p.set('lokasi', state.lokasi);
    hasilEl.innerHTML = '<div class="memuat-halaman"><span class="spinner"></span></div>';
    const data = await api.get(`/restoran?${p}`);
    if (!kategori.length) {
      kategori = data.kategori;
      const sel = $<HTMLSelectElement>('#lokasi', ctx.root);
      for (const l of data.lokasi as string[]) sel.add(new Option(l, l, false, l === state.lokasi));
    }
    $('#judul-daftar', ctx.root).textContent = state.lokasi ? `Lagi viral di ${state.lokasi}` : 'Lagi viral di Bandung';
    renderChips();
    if (data.hasil.length) {
      mount(hasilEl, html`<div class="grid-resto">${data.hasil.map((r: any) => kartuRestoran(r))}</div>`);
    } else {
      mount(hasilEl, html`${kosong('Restoran tidak ditemukan', 'Coba kata kunci lain. Berikut restoran yang sedang viral:')}
        <div class="grid-resto">${data.saran.map((r: any) => kartuRestoran(r))}</div>`);
    }
  }

  function renderChips(): void {
    const chips: [string, string][] = [['semua', 'Semua'], ['rating', 'Rating 4.5+'], ['pendek', 'Antrean pendek'],
      ...kategori.map((k): [string, string] => [k, k])];
    mount($('#chips', ctx.root), html`${chips.map(([id, label]) =>
      html`<button type="button" class="chip ${state.chip === id ? 'aktif' : ''}" data-chip="${id}">${label}</button>`)}`);
  }

  $<HTMLFormElement>('#form-cari', ctx.root).addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = String(new FormData(e.target as HTMLFormElement).get('q') ?? '').trim();
    void muat();
  });
  on(ctx.root, 'click', '[data-chip]', (_e, t) => {
    state.chip = t.dataset.chip ?? 'semua';
    void muat();
  });
  $<HTMLSelectElement>('#lokasi', ctx.root).addEventListener('change', (e) => {
    state.lokasi = (e.target as HTMLSelectElement).value;
    void muat();
  });
  $('#lihat-semua', ctx.root).addEventListener('click', (e) => {
    e.preventDefault();
    state.q = '';
    state.chip = 'semua';
    state.lokasi = '';
    ($('#lokasi', ctx.root) as HTMLSelectElement).value = '';
    ($('#form-cari input', ctx.root) as HTMLInputElement).value = '';
    void muat();
  });
  await muat();
}

/** Detail restoran & menu (I-06). */
export async function detailRestoranPage(ctx: RouteCtx): Promise<void> {
  const id = ctx.params.id;
  const krj = keranjang();
  let data = await api.get(`/restoran/${id}`);
  let filterMenu = 'Semua';

  const render = () => {
    const r = data.restoran;
    const kategoriMenu = ['Semua', ...new Set<string>(data.menu.map((m: any) => m.kategori_menu))];
    const menuTampil = data.menu.filter((m: any) => filterMenu === 'Semua' || m.kategori_menu === filterMenu);
    const milikIni = krj.data.restoranId === r.restoran_id;
    mount(
      ctx.root,
      html`<div class="wadah bagian">
        <nav class="breadcrumb"><a href="#/">Beranda</a> › <span>${r.lokasi}</span> › <span>${r.nama_restoran}</span></nav>
        <div class="banner warna-${r.warna}">${r.foto_path
          ? html`<img src="/api/restoran/${r.restoran_id}/foto?v=${encodeURIComponent(r.foto_path)}" alt="Foto ${r.nama_restoran}">`
          : ikon('mangkuk', 72)}</div>
        <div class="detail-grid">
          <div>
            <div class="detail-kepala">
              <div><h1>${r.nama_restoran}</h1>
                <p class="redup">${ikon('bintang', 16)} ${Number(r.rating_rerata).toFixed(1)} (${r.jumlah_ulasan.toLocaleString('id-ID')} ulasan)
                  · ${r.kategori} · ${r.alamat ?? r.lokasi} · Buka ${r.jam_buka}</p></div>
              <div class="badge-baris">${badgeRestoran(r)}</div>
            </div>
            <div class="statistik-3">
              <div class="kartu stat"><small>Antrean saat ini</small><strong>${r.status_antrean === 'TUTUP' ? 'Ditutup' : r.total_antrean}</strong></div>
              <div class="kartu stat"><small>Estimasi tunggu</small><strong>± ${r.estimasi_waktu_tunggu} mnt</strong></div>
              <div class="kartu stat"><small>Tersisa untuk dine-in</small><strong>${r.meja_tersisa} meja</strong></div>
            </div>
            <div class="chips">${kategoriMenu.map((k) =>
              html`<button class="chip ${filterMenu === k ? 'aktif' : ''}" data-filter="${k}">${k}</button>`)}</div>
            <div class="grid-menu">
              ${menuTampil.map((m: any) => {
                const n = milikIni ? krj.jumlahItem(m.menu_id) : 0;
                const habis = m.stok <= 0;
                return html`<article class="kartu-menu ${habis ? 'habis' : ''}">
                  <div class="menu-foto warna-${r.warna}">${m.foto_path
                    ? html`<img src="/api/menu/${m.menu_id}/foto?v=${encodeURIComponent(m.foto_path)}" alt="${m.nama_menu}" loading="lazy">`
                    : ikon('mangkuk', 32)}</div>
                  <div class="menu-badan">
                    <h3>${m.nama_menu} ${habis ? html`<span class="badge badge-abu">Habis</span>` : ''}</h3>
                    <p class="redup">${m.deskripsi_menu}</p>
                    <div class="baris-antara"><strong>${rupiah(m.harga)}</strong>
                      ${habis ? html`<small class="redup">Stok habis</small>`
                        : ctx.user && ctx.user.role !== 'PELANGGAN' ? ''
                        : n > 0
                          ? html`<div class="stepper" aria-label="Jumlah ${m.nama_menu}">
                              <button data-kurang="${m.menu_id}" aria-label="Kurangi">−</button><span>${n}</span>
                              <button data-tambah="${m.menu_id}" aria-label="Tambah" ${n >= m.stok ? 'disabled' : ''}>+</button></div>`
                          : html`<button class="btn btn-kecil btn-utama" data-tambah="${m.menu_id}">Tambah</button>`}
                    </div>
                    ${!habis && m.stok <= 5 ? html`<small class="aksen">Sisa ${m.stok} porsi</small>` : ''}
                  </div></article>`;
              })}
            </div>
            ${menuTampil.length ? '' : kosong('Belum ada menu')}
            <section class="kartu mt"><h3>Ulasan pelanggan</h3><div id="ulasan"><span class="spinner"></span></div></section>
          </div>
          <aside class="kartu ringkasan-keranjang">
            <h3>Pesananmu</h3>
            ${milikIni && krj.data.items.length
              ? html`<ul class="list">${krj.data.items.map((i) => html`<li class="baris-antara"><span>${i.jumlah}× ${i.namaMenu}</span>
                  <span>${rupiah(i.harga * i.jumlah)}</span></li>`)}</ul>
                <div class="baris-antara total"><span>Subtotal</span><strong>${rupiah(krj.hitungTotal())}</strong></div>
                <p class="redup kecil">${r.kapasitas_meja === 0 ? 'Restoran ini hanya melayani takeaway.' : `Meja tersisa untuk dine-in: ${r.meja_tersisa}`}</p>
                <a class="btn btn-utama btn-penuh" href="#/keranjang">Lanjut ke keranjang</a>`
              : html`<p class="redup">Belum ada menu yang dipilih.</p>`}
            ${r.status_antrean !== 'BUKA'
              ? html`<p class="info-banner">${r.status_antrean === 'TUTUP' ? 'Antrean sedang ditutup.' : 'Kuota antrean hari ini penuh.'}
                  Kamu masih bisa booking tempat untuk hari lain.</p>`
              : ''}
          </aside>
        </div></div>`,
    );
    const ulasanEl = ctx.root.querySelector<HTMLElement>('#ulasan');
    if (ulasanEl) void daftarUlasan(ulasanEl, id).catch(() => (ulasanEl.textContent = 'Ulasan gagal dimuat.'));
  };

  render();

  on(ctx.root, 'click', '[data-filter]', (_e, t) => {
    filterMenu = t.dataset.filter ?? 'Semua';
    render();
  });
  on(ctx.root, 'click', '[data-tambah]', async (_e, t) => {
    if (!ctx.user) return navigasi(`#/login?lanjut=${encodeURIComponent(location.hash)}`);
    const m = data.menu.find((x: any) => x.menu_id === t.dataset.tambah);
    if (!m) return;
    if (krj.bedaRestoran(data.restoran.restoran_id)) {
      const ya = await konfirmasi({
        judul: 'Ganti restoran?',
        pesan: `Keranjangmu berisi menu dari ${krj.data.namaRestoran}. Kosongkan keranjang dan pesan dari ${data.restoran.nama_restoran}?`,
        ya: 'Ya, ganti',
      });
      if (!ya) return;
    }
    if (krj.jumlahItem(m.menu_id) + 1 > m.stok) return toast('Stok menu tidak mencukupi', 'galat');
    krj.tambahItem(
      { restoranId: data.restoran.restoran_id, namaRestoran: data.restoran.nama_restoran },
      { menuId: m.menu_id, namaMenu: m.nama_menu, harga: m.harga },
    );
    perbaruiBadgeKeranjang();
    render();
  });
  on(ctx.root, 'click', '[data-kurang]', (_e, t) => {
    const menuId = t.dataset.kurang!;
    krj.ubahJumlah(menuId, krj.jumlahItem(menuId) - 1);
    perbaruiBadgeKeranjang();
    render();
  });

  // Stok & antrean diperbarui otomatis saat restoran mengubahnya.
  ctx.onLeave(
    pantauRestoran(id, async () => {
      try {
        data = await api.get(`/restoran/${id}`);
        if (!$$('.overlay').length) render();
      } catch {
        /* restoran mungkin dihapus */
      }
    }),
  );
}
