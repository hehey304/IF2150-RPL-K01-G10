/**
 * StatusAntreanView: HalamanStatusAntrean (C11, I-11) - status antrean real-time dan notifikasi giliran (UC03).
 */
import { api, pantauRestoran } from '../core/api.js';
import { html, mount } from '../core/html.js';
import { ikon, kosong, MODE_LABEL, nomorAntrean, rupiah, tanggal, toast } from '../core/ui.js';
import { navigasi, type RouteCtx } from '../main.js';

/** Daftar tiket aktif pelanggan ("Antrean saya"). */
export async function antreanSayaPage(ctx: RouteCtx): Promise<void> {
  const daftar: any[] = await api.get('/antrean-saya');
  const aktif = daftar.filter((d) => d.tiket.status_antrean !== 'TERJADWAL');
  if (aktif.length === 1 && daftar.length === 1) return navigasi(`#/antrean/${aktif[0].tiket.id_tiket}`);
  mount(
    ctx.root,
    html`<div class="wadah wadah-sempit bagian"><h1>Antrean saya</h1>
      ${daftar.length
        ? html`<ul class="list kartu kartu-list">${daftar.map((d) => html`<li><a class="list-item tautan" href="${
            d.tiket.status_antrean === 'TERJADWAL' ? `#/tiket/${d.tiket.id_tiket}` : `#/antrean/${d.tiket.id_tiket}`}">
            <span class="nomor-kecil">${nomorAntrean(d.tiket.nomor_urut)}</span>
            <span class="tumbuh"><strong>${d.tiket.nama_restoran}</strong><small>${
              d.tiket.status_antrean === 'TERJADWAL'
                ? `Booking · ${tanggal(d.pesanan.tanggal_booking, { weekday: 'short', day: 'numeric', month: 'short' })}, ${d.pesanan.slot_waktu_booking} · ${d.pesanan.jumlah_rombongan} orang`
                : `${MODE_LABEL[d.tiket.tipe_antrean]} · ${d.giliranmu ? 'Giliranmu sekarang!' : `${d.sisaAntrean} antrean lagi · ± ${d.estimasiMenit} mnt`}`}</small></span>
            ${d.tiket.status_antrean === 'TERJADWAL' ? html`<span class="badge badge-ungu">Terjadwal</span>`
              : d.giliranmu ? html`<span class="badge badge-hijau">Dipanggil</span>` : html`<span class="badge badge-oranye">Menunggu</span>`}
            ${ikon('kanan', 18)}</a></li>`)}</ul>`
        : kosong('Belum ada antrean aktif', 'Pesan dari restoran viral untuk mendapatkan nomor antrean.',
            html`<a class="btn btn-utama" href="#/">Cari restoran</a>`)}
    </div>`,
  );
}

const LANGKAH = ['Pembayaran diterima', 'Masuk antrean dapur', 'Sedang disiapkan', 'Siap / meja siap'];

function langkahAktif(d: any): number {
  const s = d.tiket.status_antrean;
  if (s === 'DIPANGGIL' || s === 'SELESAI') return 3;
  if (d.disiapkan) return 2;
  return 1;
}

/** HalamanStatusAntrean (I-11). */
export async function halamanStatusAntrean(ctx: RouteCtx): Promise<void> {
  const id = ctx.params.id;
  let data = await api.get(`/tiket/${id}/status`);
  let sudahDipanggil = data.giliranmu;
  const totalAwal = Math.max(data.sisaAntrean, 1);
  if (data.tiket.status_antrean === 'TERJADWAL') return navigasi(`#/tiket/${id}`);

  const renderData = () => {
    const t = data.tiket;
    const p = data.pesanan;
    const selesai = ['SELESAI', 'DILEWATI', 'DIBATALKAN'].includes(t.status_antrean);
    const langkah = selesai ? (t.status_antrean === 'SELESAI' ? 4 : -1) : langkahAktif(data);
    const persen = selesai ? 100 : data.giliranmu ? 100 : Math.max(6, Math.round(100 * (1 - data.sisaAntrean / (totalAwal + 1))));
    mount(
      ctx.root,
      html`<div class="wadah bagian">
        <div class="baris-antara"><div><h1>Status antrean</h1><p class="redup">${t.nama_restoran} · ${MODE_LABEL[t.tipe_antrean]}</p></div>
          ${selesai ? '' : html`<span class="badge badge-live"><span class="titik-live"></span>Live</span>`}</div>
        ${data.giliranmu
          ? html`<div class="info-banner sukses" role="alert">${ikon('lonceng', 20)} <strong>Giliranmu sekarang!</strong>
              ${t.tipe_antrean === 'DINE_IN' ? 'Meja sudah siap, silakan menuju restoran.' : 'Pesanan siap diambil di kasir.'}
              Hadir dalam ${data.batasHadirMenit} menit agar nomor tidak dilewati.</div>`
          : ''}
        ${t.status_antrean === 'DILEWATI' ? html`<div class="info-banner galat">Nomor antrean dilewati karena tidak hadir dalam ${data.batasHadirMenit} menit.</div>` : ''}
        ${t.status_antrean === 'DIBATALKAN' ? html`<div class="info-banner galat">Antrean dibatalkan oleh sistem (restoran dinonaktifkan).</div>` : ''}
        <div class="status-grid">
          <section class="kartu status-utama">
            <div class="dua-nomor">
              <div><small>Nomor antreanmu</small><div class="nomor-besar">${nomorAntrean(t.nomor_urut)}</div></div>
              <div><small>Sedang dilayani</small>${t.nomor_dilayani ? html`<div class="nomor-sedang">${nomorAntrean(t.nomor_dilayani)}</div>` : html`<div class="nomor-sedang kosong">Belum ada</div>`}</div>
            </div>
            <div class="progress besar"><span style="width:${persen}%"></span></div>
            <div class="baris-antara"><strong>${selesai ? (t.status_antrean === 'SELESAI' ? 'Pesanan selesai' : 'Antrean berakhir')
              : data.giliranmu ? 'Giliranmu!' : `${data.sisaAntrean} antrean lagi`}</strong>
              ${selesai ? '' : html`<strong class="aksen">± ${data.estimasiMenit} menit</strong>`}</div>
            <ol class="stepper-vertikal">${LANGKAH.map((l, i) =>
              html`<li class="${i < langkah ? 'selesai' : i === langkah ? 'aktif' : ''}"><span>${i < langkah ? ikon('cek', 14) : i + 1}</span>${l}</li>`)}</ol>
          </section>
          <section class="kartu">
            <h3>Detail pesanan</h3>
            <dl class="rincian">
              <dt>ID pesanan</dt><dd><code>${p.pesanan_id}</code></dd>
              <dt>Cara makan</dt><dd>${MODE_LABEL[p.mode_pemesanan]}${p.mode_pemesanan === 'DINE_IN' ? ` · ${p.jumlah_rombongan} orang` : ''}</dd>
              <dt>Waktu bayar</dt><dd>${p.pembayaran ? tanggal(p.pembayaran.dibuat_pada ?? t.waktu_terbit, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</dd>
            </dl>
            <ul class="list">${p.items.map((i: any) => html`<li class="baris-antara"><span>${i.jumlah}× ${i.nama_menu}</span><span>${rupiah(i.subtotal)}</span></li>`)}</ul>
            <div class="baris-antara total"><span>Total</span><strong>${rupiah(p.total_harga)}</strong></div>
            <div class="aksi-kiri">
              <a class="btn btn-ghost" href="#/tiket/${t.id_tiket}">Lihat tiket</a>
              <a class="btn btn-ghost" href="#/keluhan?pesanan=${p.pesanan_id}">Kirim keluhan</a>
            </div>
          </section>
        </div></div>`,
    );
  };

  const beriTahu = () => {
    toast('Giliranmu sekarang! Segera menuju restoran.', 'sukses', 8000);
    try {
      navigator.vibrate?.([200, 100, 200]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('antri.in - Giliranmu!', { body: `${data.tiket.nama_restoran}: nomor ${nomorAntrean(data.tiket.nomor_urut)} dipanggil.` });
      }
    } catch {
      /* notifikasi tidak didukung */
    }
  };

  renderData();
  try {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
  } catch {
    /* abaikan */
  }

  const perbarui = async () => {
    try {
      data = await api.get(`/tiket/${id}/status`);
      if (data.giliranmu && !sudahDipanggil) beriTahu();
      sudahDipanggil = data.giliranmu;
      renderData();
    } catch {
      /* koneksi terputus sementara */
    }
  };
  ctx.onLeave(pantauRestoran(data.tiket.restoran_id, perbarui));
  // Cadangan bila koneksi SSE terputus: segarkan tiap 30 detik.
  const cadangan = window.setInterval(perbarui, 30_000);
  ctx.onLeave(() => clearInterval(cadangan));
}
