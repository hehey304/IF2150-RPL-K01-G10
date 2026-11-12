/**
 * KelolaAntreanView: DashboardAntreanPage (C19) / KelolaAntreanPage (C18) pada I-14
 * dan KonfirmasiDequeuePage (C17, I-15) (UC06, UC09).
 */
import { api, pantauRestoran } from '../core/api.js';
import { html, mount, on } from '../core/html.js';
import { badgeMode, ikon, konfirmasi, kosong, nomorAntrean, sibuk, tampilkanGalat, tanggal, toast } from '../core/ui.js';
import type { RouteCtx } from '../main.js';
import { panelSimulasi } from './simulasiView.js';

const fmtDurasi = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export async function dashboardAntreanPage(ctx: RouteCtx): Promise<void> {
  let data = await api.get('/kelola/antrean');
  let filter: 'SEMUA' | 'DINE_IN' | 'TAKEAWAY' = 'SEMUA';

  mount(ctx.root, html`<div id="dash"></div><section class="kartu" id="simulasi"></section>`);
  const dashEl = ctx.root.querySelector<HTMLElement>('#dash')!;
  void panelSimulasi(ctx.root.querySelector<HTMLElement>('#simulasi')!).catch(() => {});

  const statusLabel = (s: string) =>
    s === 'BUKA' ? html`<strong class="hijau">Dibuka</strong>` : s === 'PENUH' ? html`<strong class="merah">Penuh</strong>` : html`<strong class="abu">Ditutup</strong>`;

  /** displayQueue(). */
  const render = () => {
    const r = data.ringkasan;
    const daftar = data.daftar.filter((d: any) => filter === 'SEMUA' || d.tipe_antrean === filter);
    const front = data.daftar[0];
    mount(
      dashEl,
      html`<header class="panel-kepala"><div><h1>Dashboard antrean</h1>
          <p class="redup">${tanggal(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · diperbarui otomatis</p></div>
          <span class="badge badge-live"><span class="titik-live"></span>Live</span></header>
        <div class="statistik-4">
          <div class="kartu stat"><small>Antrean aktif</small><strong class="aksen">${r.antreanAktif}</strong><small>${r.tiketHariIni} tiket hari ini</small></div>
          <div class="kartu stat"><small>Meja terisi</small><strong>${r.mejaTerisi} / ${r.kapasitasMeja}</strong><small>${Math.max(0, r.kapasitasMeja - r.mejaTerisi)} meja tersisa</small></div>
          <div class="kartu stat"><small>Dine-in · Takeaway</small><strong>${r.dineIn} · ${r.takeaway}</strong><small>Antrean dipisah</small></div>
          <div class="kartu stat"><small>Status antrean</small>${statusLabel(r.statusAntrean)}<small>${r.antreanDitutup ? 'Ditutup sementara' : `Kuota ${r.kuotaMaksimum} / hari`} · ± ${r.menitPerAntrean} mnt/antrean</small></div>
        </div>
        <section class="kartu">
          <div class="baris-antara alat">
            <div class="baris"><h2>Daftar antrean</h2>
              <div class="chips">
                <button class="chip ${filter === 'SEMUA' ? 'aktif' : ''}" data-filter="SEMUA">Semua (${data.daftar.length})</button>
                <button class="chip ${filter === 'DINE_IN' ? 'aktif' : ''}" data-filter="DINE_IN">Dine-in (${r.dineIn})</button>
                <button class="chip ${filter === 'TAKEAWAY' ? 'aktif' : ''}" data-filter="TAKEAWAY">Takeaway (${r.takeaway})</button>
              </div></div>
            <button class="btn btn-utama" data-dequeue="${front?.id_tiket ?? ''}" ${front ? '' : 'disabled'}>Dequeue terdepan</button>
          </div>
          ${daftar.length
            ? html`<div class="tabel-wadah"><table class="tabel"><thead><tr><th>No. antrean</th><th>Pelanggan</th><th>Mode</th>
                <th>Rombongan</th><th>Pesanan</th><th>Menunggu</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>${daftar.map((d: any) => {
                  const terdepan = d.id_tiket === front?.id_tiket;
                  return html`<tr class="${terdepan ? 'baris-terdepan' : ''}">
                    <td><strong>${nomorAntrean(d.nomor_urut)}</strong></td><td>${d.nama_pelanggan}</td><td>${badgeMode(d.tipe_antrean)}</td>
                    <td>${d.tipe_antrean === 'DINE_IN' ? `${d.jumlah_rombongan} orang` : '-'}</td><td>${d.rincian}</td>
                    <td>${d.waktu_dipanggil ? html`<span class="timer-kecil" data-sejak="${d.waktu_dipanggil}">${fmtDurasi(Date.now() - new Date(d.waktu_dipanggil).getTime())}</span>` : '—'}</td>
                    <td>${terdepan ? html`<span class="badge badge-oranye">Terdepan</span>`
                      : d.disiapkan_pada ? html`<span class="badge badge-kuning">Disiapkan</span>` : html`<span class="badge badge-abu">Menunggu</span>`}</td>
                    <td>${terdepan ? html`<button class="btn btn-kecil btn-lembut" data-dequeue="${d.id_tiket}">Dequeue</button>`
                      : d.disiapkan_pada ? '' : html`<button class="btn btn-kecil btn-ghost" data-siapkan="${d.id_tiket}">Mulai siapkan</button>`}</td></tr>`;
                })}</tbody></table></div>`
            : kosong('Belum ada antrean saat ini', 'Antrean baru akan muncul otomatis tanpa memuat ulang halaman.')}
          <p class="catatan">${ikon('jam', 18)} Pelanggan terdepan otomatis di-dequeue jika tidak hadir dalam ${data.autoDequeueMenit} menit.</p>
        </section>
        ${data.booking.length
          ? html`<section class="kartu"><h2>Booking mendatang</h2>
              <div class="tabel-wadah"><table class="tabel"><thead><tr><th>No.</th><th>Jadwal</th><th>Pelanggan</th><th>Kursi</th><th>Pesanan</th><th>Aksi</th></tr></thead>
              <tbody>${data.booking.map((b: any) => html`<tr><td>${nomorAntrean(b.nomor_urut)}</td>
                <td>${tanggal(b.tanggal_booking, { weekday: 'short', day: 'numeric', month: 'short' })}, ${b.slot_waktu_booking}</td>
                <td>${b.nama_pelanggan}</td><td>${b.jumlah_rombongan} orang</td><td>${b.rincian}</td>
                <td><button class="btn btn-kecil btn-ghost" data-hadir="${b.id_tiket}">Tandai hadir</button></td></tr>`)}</tbody></table></div>
            </section>`
          : ''}`,
    );
  };

  const muatUlang = async () => {
    data = await api.get('/kelola/antrean');
    if (!document.querySelector('.overlay')) render();
  };
  render();

  on(ctx.root, 'click', '[data-filter]', (_e, t) => {
    filter = t.dataset.filter as typeof filter;
    render();
  });
  on(ctx.root, 'click', '[data-dequeue]', async (_e, t) => {
    const idTiket = t.dataset.dequeue;
    const d = data.daftar.find((x: any) => x.id_tiket === idTiket);
    if (!d) return;
    const ya = await konfirmasi({
      judul: `Dequeue antrean ${nomorAntrean(d.nomor_urut)}?`,
      pesan: `${d.nama_pelanggan} akan dikeluarkan dari antrean dan pelanggan berikutnya dipanggil.`,
      ya: 'Ya, dequeue',
    });
    if (!ya) return; // UC06 Skenario Alternatif 1
    try {
      const hasil = await sibuk(t as HTMLButtonElement, () => api.post('/kelola/antrean/dequeue', { idTiket }));
      toast(`Antrean ${hasil.nomor} selesai dilayani`, 'sukses');
      await muatUlang();
    } catch (err) {
      tampilkanGalat(err);
      await muatUlang();
    }
  });
  on(ctx.root, 'click', '[data-siapkan]', async (_e, t) => {
    try {
      await sibuk(t as HTMLButtonElement, () => api.post(`/kelola/antrean/${t.dataset.siapkan}/siapkan`));
      await muatUlang();
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  on(ctx.root, 'click', '[data-hadir]', async (_e, t) => {
    try {
      await sibuk(t as HTMLButtonElement, () => api.post(`/kelola/booking/${t.dataset.hadir}/hadir`));
      toast('Booking ditandai hadir', 'sukses');
      await muatUlang();
    } catch (err) {
      tampilkanGalat(err);
    }
  });

  ctx.onLeave(pantauRestoran(data.restoran.restoranId, (alasan) => {
    if (alasan === 'tiket-baru') toast('Antrean baru masuk', 'info', 2500);
    void muatUlang().catch(() => {});
  }));
  const detak = window.setInterval(() => {
    ctx.root.querySelectorAll<HTMLElement>('[data-sejak]').forEach((el) => {
      el.textContent = fmtDurasi(Date.now() - new Date(el.dataset.sejak!).getTime());
    });
  }, 1000);
  ctx.onLeave(() => clearInterval(detak));

}
