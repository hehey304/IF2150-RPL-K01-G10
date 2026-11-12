/**
 * PemesananView (UC02): Keranjang & mode layanan (I-07) dan pilih jadwal booking (I-08).
 * Pembayaran (I-09) dan tiket (I-10) ada di pembayaranView.ts.
 */
import { api, ApiError } from '../core/api.js';
import { html, mount, on, type SafeHtml } from '../core/html.js';
import { konfigurasi } from '../core/konfigurasi.js';
import { ikon, kosong, MODE_LABEL, rupiah, sibuk, tampilkanGalat, tanggal, toast } from '../core/ui.js';
import { keranjang, type Mode } from '../models/keranjang.js';
import { navigasi, type RouteCtx } from '../main.js';
import { perbaruiBadgeKeranjang } from './layout.js';

const stepper = (attr: string, nilai: number, label: string, min = 1, max = 20): SafeHtml =>
  html`<div class="stepper" aria-label="${label}">
    <button type="button" data-${attr}="-1" ${nilai <= min ? 'disabled' : ''} aria-label="Kurangi">−</button>
    <span>${nilai}</span>
    <button type="button" data-${attr}="1" ${nilai >= max ? 'disabled' : ''} aria-label="Tambah">+</button></div>`;

/** Keranjang & mode layanan (I-07). */
export async function keranjangPage(ctx: RouteCtx): Promise<void> {
  const krj = keranjang();
  if (!krj.data.restoranId || krj.data.items.length === 0) {
    mount(ctx.root, html`<div class="wadah bagian">${kosong('Keranjang masih kosong', 'Pilih menu dari restoran viral favoritmu.',
      html`<a class="btn btn-utama" href="#/">Cari restoran</a>`)}</div>`);
    return;
  }
  const [cfg, detail] = await Promise.all([konfigurasi(), api.get(`/restoran/${krj.data.restoranId}`)]);
  const r = detail.restoran;
  const stokMenu = new Map<string, number>(detail.menu.map((m: any) => [m.menu_id, m.stok]));
  let menuHabis = new Set<string>();

  const bisaDineIn = r.status_antrean === 'BUKA' && r.kapasitas_meja > 0 && r.meja_tersisa > 0;
  const bisaTakeaway = r.status_antrean === 'BUKA';
  if ((krj.data.mode === 'DINE_IN' && !bisaDineIn) || (krj.data.mode === 'TAKEAWAY' && !bisaTakeaway)) {
    krj.aturMode(bisaTakeaway ? 'TAKEAWAY' : 'BOOKING');
  }

  const render = () => {
    const d = krj.data;
    const subtotal = krj.hitungTotal();
    const opsi = (mode: Mode, judul: string, ket: string, aktif: boolean, alasan: string) =>
      html`<label class="radio-kartu ${d.mode === mode ? 'dipilih' : ''} ${aktif ? '' : 'nonaktif'}">
        <input type="radio" name="mode" value="${mode}" ${d.mode === mode ? 'checked' : ''} ${aktif ? '' : 'disabled'}>
        <strong>${judul}</strong><small>${aktif ? ket : alasan}</small></label>`;
    mount(
      ctx.root,
      html`<div class="wadah bagian">
        <a href="#/restoran/${r.restoran_id}" class="kembali">${ikon('kembali', 18)} ${r.nama_restoran}</a>
        <h1>Keranjang</h1>
        <div class="checkout-grid">
          <div>
            <section class="kartu"><h3>Cara makan</h3>
              <div class="radio-grup">
                ${opsi('DINE_IN', 'Dine-in', `Makan di tempat · ${r.meja_tersisa} meja tersisa`, bisaDineIn,
                  r.kapasitas_meja === 0 ? 'Restoran tidak melayani dine-in' : r.status_antrean !== 'BUKA' ? 'Antrean ditutup/penuh' : 'Meja sedang penuh')}
                ${opsi('TAKEAWAY', 'Takeaway', 'Ambil sendiri saat nomor dipanggil', bisaTakeaway, 'Antrean ditutup/penuh')}
                ${opsi('BOOKING', 'Booking tempat', 'Reservasi meja hingga 7 hari ke depan', r.kapasitas_meja > 0, 'Restoran tidak menerima booking')}
              </div>
              ${d.mode === 'DINE_IN'
                ? html`<div class="baris-antara mt"><span>Jumlah rombongan</span>${stepper('rombongan', d.jumlahRombongan, 'Jumlah rombongan')}</div>`
                : ''}
              ${d.mode === 'BOOKING'
                ? html`<div class="baris-antara mt"><span>${d.tanggalBooking
                    ? html`${ikon('kalender', 18)} <strong>${tanggal(d.tanggalBooking, { weekday: 'long', day: 'numeric', month: 'long' })}, ${d.slotWaktuBooking}</strong> · ${d.jumlahRombongan} orang`
                    : html`<span class="aksen">Jadwal booking belum dipilih</span>`}</span>
                    <a class="btn btn-kecil btn-ghost" href="#/booking">${d.tanggalBooking ? 'Ubah jadwal' : 'Pilih jadwal'}</a></div>`
                : ''}
            </section>
            <section class="kartu"><h3>Pesanan dari ${r.nama_restoran}</h3>
              <ul class="list">${d.items.map((i) => {
                const stok = stokMenu.get(i.menuId) ?? 0;
                const habis = menuHabis.has(i.menuId) || stok < i.jumlah;
                return html`<li class="list-item ${habis ? 'item-habis' : ''}">
                  <div class="menu-mini warna-${r.warna}">${ikon('mangkuk', 20)}</div>
                  <div class="tumbuh"><strong>${i.namaMenu}</strong><small>${rupiah(i.harga)}${habis
                    ? html` · <span class="merah">${stok === 0 ? 'Habis' : `Stok tersisa ${stok}`}</span>` : ''}</small></div>
                  <div class="stepper" aria-label="Jumlah ${i.namaMenu}">
                    <button type="button" data-item="${i.menuId}" data-delta="-1" aria-label="Kurangi">−</button><span>${i.jumlah}</span>
                    <button type="button" data-item="${i.menuId}" data-delta="1" aria-label="Tambah" ${i.jumlah >= Math.min(50, stok) ? 'disabled' : ''}>+</button></div>
                  <strong class="lebar-harga">${rupiah(i.harga * i.jumlah)}</strong></li>`;
              })}</ul>
              <a href="#/restoran/${r.restoran_id}" class="tautan-aksen tambah-menu">+ Tambah menu</a>
            </section>
          </div>
          <aside class="kartu ringkasan">
            <h3>Ringkasan</h3>
            <div class="baris-antara"><span>Cara makan</span><span>${MODE_LABEL[d.mode]}${d.mode !== 'TAKEAWAY' ? ` · ${d.jumlahRombongan} orang` : ''}</span></div>
            <div class="baris-antara"><span>Subtotal</span><span>${rupiah(subtotal)}</span></div>
            <div class="baris-antara"><span>Biaya layanan</span><span>${rupiah(cfg.biayaLayanan)}</span></div>
            <div class="baris-antara total"><span>Total</span><strong>${rupiah(subtotal + cfg.biayaLayanan)}</strong></div>
            <button class="btn btn-utama btn-penuh" id="lanjut" ${d.mode === 'BOOKING' && !d.tanggalBooking ? 'disabled' : ''}>Lanjut ke pembayaran</button>
            <p class="info-banner">Stok dan meja diperiksa ulang sebelum pembayaran.</p>
          </aside>
        </div></div>`,
    );
  };
  render();

  on(ctx.root, 'change', 'input[name=mode]', (_e, t) => {
    const mode = (t as HTMLInputElement).value as Mode;
    krj.aturMode(mode);
    if (mode === 'BOOKING') return navigasi('#/booking');
    render();
  });
  on(ctx.root, 'click', 'button[data-rombongan]', (_e, t) => {
    krj.aturRombongan(krj.data.jumlahRombongan + Number(t.dataset.rombongan));
    render();
  });
  on(ctx.root, 'click', 'button[data-item]', (_e, t) => {
    const id = t.dataset.item!;
    krj.ubahJumlah(id, krj.jumlahItem(id) + Number(t.dataset.delta));
    menuHabis.delete(id);
    perbaruiBadgeKeranjang();
    if (krj.data.items.length === 0) return void keranjangPage(ctx);
    render();
  });
  on(ctx.root, 'click', '#lanjut', async (_e, t) => {
    try {
      const pesanan = await sibuk(t as HTMLButtonElement, () => api.post('/pesanan', krj.keRequest()));
      navigasi(`#/pembayaran/${pesanan.pesanan_id}`);
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.data.menuHabis)) {
        menuHabis = new Set(err.data.menuHabis.map((m: any) => m.menuId));
        for (const m of err.data.menuHabis) stokMenu.set(m.menuId, m.stok);
        render();
      }
      tampilkanGalat(err);
    }
  });
}

/** Pilih jadwal booking (I-08). */
export async function bookingPage(ctx: RouteCtx): Promise<void> {
  const krj = keranjang();
  if (!krj.data.restoranId) return navigasi('#/keranjang');
  const cfg = await konfigurasi();
  const restoranId = krj.data.restoranId;
  const hari: string[] = [];
  const now = new Date();
  for (let i = 0; i <= cfg.maxBookingDays; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    hari.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  const state = {
    tanggal: krj.data.tanggalBooking && hari.includes(krj.data.tanggalBooking) ? krj.data.tanggalBooking : hari[0],
    slot: krj.data.slotWaktuBooking,
    kursi: krj.data.jumlahRombongan,
    slots: [] as any[],
  };

  const render = () => {
    mount(
      ctx.root,
      html`<div class="wadah wadah-sempit bagian">
        <a href="#/keranjang" class="kembali">${ikon('kembali', 18)} Kembali ke keranjang</a>
        <h1>Pilih jadwal booking</h1>
        <p class="info-banner">${ikon('kalender', 18)} Reservasi hanya bisa untuk ${cfg.maxBookingDays} hari ke depan.</p>
        <section class="kartu">
          <h3>Tanggal kedatangan</h3>
          <div class="kalender">${hari.map((t) => {
            const d = new Date(`${t}T00:00:00`);
            return html`<button class="hari ${state.tanggal === t ? 'dipilih' : ''}" data-tanggal="${t}">
              <small>${d.toLocaleDateString('id-ID', { weekday: 'short' })}</small><strong>${d.getDate()}</strong>
              <small>${d.toLocaleDateString('id-ID', { month: 'short' })}</small></button>`;
          })}</div>
          <h3>Jam kedatangan</h3>
          <div class="slot-grid">${state.slots.map((s) => html`<button class="slot ${state.slot === s.jam ? 'dipilih' : ''}"
              data-slot="${s.jam}" ${s.tersedia ? '' : 'disabled'}><strong>${s.jam}</strong>
              <small>${s.tersedia ? `Tersedia (${s.kapasitas - s.terpakai})` : s.alasan === 'Penuh' ? 'Penuh' : 'Tidak tersedia'}</small></button>`)}</div>
          <div class="baris-antara mt"><span>Jumlah kursi</span>${stepper('kursi', state.kursi, 'Jumlah kursi')}</div>
          <div class="ringkas-jadwal">${ikon('kalender', 18)} <span>Jadwal dipilih:
            <strong>${state.slot ? `${tanggal(state.tanggal, { weekday: 'long', day: 'numeric', month: 'long' })}, ${state.slot} · ${state.kursi} orang` : '—'}</strong></span></div>
          <div class="aksi-kanan">
            <a href="#/keranjang" class="btn btn-ghost">Batal</a>
            <button class="btn btn-utama" id="simpan" ${state.slot ? '' : 'disabled'}>Simpan jadwal</button>
          </div>
        </section></div>`,
    );
  };

  async function muatSlot() {
    const data = await api.get(`/restoran/${restoranId}/slot-booking?tanggal=${state.tanggal}`);
    state.slots = data.slot;
    if (state.slot && !state.slots.find((s) => s.jam === state.slot && s.tersedia)) state.slot = null;
    render();
  }
  await muatSlot();

  on(ctx.root, 'click', '[data-tanggal]', (_e, t) => {
    state.tanggal = t.dataset.tanggal!;
    void muatSlot().catch(tampilkanGalat);
  });
  on(ctx.root, 'click', '[data-slot]', (_e, t) => {
    state.slot = t.dataset.slot!;
    render();
  });
  on(ctx.root, 'click', '[data-kursi]', (_e, t) => {
    state.kursi = Math.max(1, Math.min(20, state.kursi + Number(t.dataset.kursi)));
    render();
  });
  on(ctx.root, 'click', '#simpan', () => {
    if (!state.slot) return;
    krj.aturJadwal(state.tanggal, state.slot, state.kursi);
    toast('Jadwal booking disimpan', 'sukses');
    navigasi('#/keranjang');
  });
}
