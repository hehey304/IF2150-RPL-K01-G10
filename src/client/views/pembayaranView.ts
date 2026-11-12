/**
 * PemesananView (UC02) bagian pembayaran: Pembayaran (I-09) dan tiket antrean (I-10).
 */
import { api, ApiError } from '../core/api.js';
import { html, mount, on } from '../core/html.js';
import { konfigurasi } from '../core/konfigurasi.js';
import { dialog, ikon, konfirmasi, MODE_LABEL, nomorAntrean, rupiah, sibuk, tampilkanGalat, tanggal, TIPE_BAYAR_LABEL, toast } from '../core/ui.js';
import { keranjang } from '../models/keranjang.js';
import { navigasi, type RouteCtx } from '../main.js';
import { perbaruiBadgeKeranjang } from './layout.js';

/** Pembayaran (I-09): membuat tagihan di payment gateway, lalu memantau statusnya. */
export async function pembayaranPage(ctx: RouteCtx): Promise<void> {
  const id = ctx.params.id;
  const cfg = await konfigurasi();
  let pesanan = await api.get(`/pesanan/${id}`);
  if (pesanan.status_pemesanan === 'DIKONFIRMASI' && pesanan.tiket) return navigasi(`#/tiket/${pesanan.tiket.id_tiket}`);
  let tagihan: any = pesanan.status_pemesanan === 'MENUNGGU_PEMBAYARAN' ? (await api.get(`/pesanan/${id}/tagihan`)).tagihan : null;
  let tipe: string = tagihan?.tipe_pembayaran ?? 'EWALLET';
  let timer = 0;
  let poll = 0;
  let selesai = false;
  ctx.onLeave(() => {
    clearInterval(timer);
    clearInterval(poll);
  });

  const sisaDetik = () =>
    tagihan ? Math.max(0, Math.floor((new Date(tagihan.batas_waktu_bayar).getTime() - Date.now()) / 1000)) : cfg.paymentTimeoutMinutes * 60;
  const fmt = (d: number) => `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
  const urlCheckout = () => `${tagihan.urlPembayaran}?kembali=${encodeURIComponent(`#/pembayaran/${id}`)}`;

  const render = () => {
    const batal = pesanan.status_pemesanan === 'DIBATALKAN';
    mount(
      ctx.root,
      html`<div class="wadah bagian">
        <h1>Pembayaran</h1>
        ${batal ? html`<div class="info-banner galat">Pesanan ini sudah dibatalkan. <a href="#/">Kembali ke beranda</a></div>` : ''}
        <div class="checkout-grid">
          <div>
            <section class="kartu"><h3>Metode pembayaran</h3>
              <div class="radio-grup kolom">${Object.entries(TIPE_BAYAR_LABEL).map(([k, label]) =>
                html`<label class="radio-kartu radio-baris ${tipe === k ? 'dipilih' : ''} ${tagihan || batal ? 'nonaktif' : ''}">
                  <input type="radio" name="tipe" value="${k}" ${tipe === k ? 'checked' : ''} ${tagihan || batal ? 'disabled' : ''}>
                  <span class="ikon-metode">${ikon(k === 'EWALLET' ? 'qr' : k === 'VIRTUAL_ACCOUNT' ? 'bank' : 'kartu', 22)}</span>
                  <span class="tumbuh"><strong>${label}</strong><small>${KET_METODE[k]}</small></span>
                  <span class="radio-titik"></span></label>`)}</div>
            </section>
            ${tagihan && !batal
              ? html`<section class="kartu menunggu-bayar">
                  <div class="baris-antara"><h3>Menunggu pembayaran</h3><span class="badge badge-live"><span class="titik-live"></span>Memantau</span></div>
                  <p class="redup">Selesaikan pembayaran di halaman aman <strong>${tagihan.gateway}</strong>. Halaman ini otomatis lanjut ke tiket antrean begitu pembayaran diterima.</p>
                  <dl class="rincian"><dt>Metode</dt><dd>${TIPE_BAYAR_LABEL[tagihan.tipe_pembayaran]}</dd>
                    <dt>${tagihan.tipe_pembayaran === 'VIRTUAL_ACCOUNT' ? 'Nomor VA' : 'Kode pembayaran'}</dt><dd><code>${tagihan.kode_bayar}</code></dd></dl>
                  <div class="aksi-kiri">
                    <a class="btn btn-utama" href="${urlCheckout()}">Lanjutkan pembayaran</a>
                    <button class="btn btn-ghost" id="ganti">Ganti metode</button>
                  </div>
                </section>`
              : ''}
          </div>
          <aside class="kartu ringkasan">
            <h3>Rincian pesanan</h3>
            <p class="ringkas-resto"><strong>${pesanan.nama_restoran}</strong><small class="redup">${MODE_LABEL[pesanan.mode_pemesanan]}${
              pesanan.mode_pemesanan !== 'TAKEAWAY' ? ` · ${pesanan.jumlah_rombongan} orang` : ''}${
              pesanan.tanggal_booking ? ` · ${tanggal(pesanan.tanggal_booking)} ${pesanan.slot_waktu_booking}` : ''}</small></p>
            <ul class="list">${pesanan.items.map((i: any) => html`<li class="baris-antara"><span>${i.jumlah}× ${i.nama_menu}</span><span>${rupiah(i.subtotal)}</span></li>`)}</ul>
            <div class="baris-antara"><span>Subtotal</span><span>${rupiah(pesanan.subtotal)}</span></div>
            <div class="baris-antara"><span>Biaya layanan</span><span>${rupiah(pesanan.biaya_layanan)}</span></div>
            <div class="baris-antara total"><span>Total tagihan</span><strong>${rupiah(pesanan.total_harga)}</strong></div>
            ${batal ? '' : html`<div class="timer">${ikon('jam', 18)}<span>Selesaikan pembayaran dalam</span><strong id="sisa">${fmt(sisaDetik())}</strong></div>
            ${tagihan ? '' : html`<button class="btn btn-utama btn-penuh" id="bayar">Bayar ${rupiah(pesanan.total_harga)}</button>`}
            <p class="redup kecil tengah">Pesanan dibatalkan otomatis jika waktu habis.</p>
            <button class="btn btn-teks btn-penuh" id="batalkan">Batalkan pesanan</button>`}
          </aside>
        </div></div>`,
    );
  };

  const habisWaktu = () => {
    clearInterval(timer);
    clearInterval(poll);
    if (selesai) return;
    selesai = true;
    const { el } = dialog(html`<h3>Batas waktu pembayaran habis</h3><p>Batas waktu pembayaran habis. Transaksi dibatalkan.</p>
      <div class="dialog-aksi"><button class="btn btn-utama" data-ke-beranda>Kembali ke beranda</button></div>`);
    el.querySelector('[data-ke-beranda]')?.addEventListener('click', () => navigasi('#/'));
  };

  const lunas = (idTiket: string) => {
    if (selesai) return;
    selesai = true;
    clearInterval(timer);
    clearInterval(poll);
    keranjang().kosongkanKeranjang();
    perbaruiBadgeKeranjang();
    toast('Pembayaran berhasil!', 'sukses');
    navigasi(`#/tiket/${idTiket}`);
  };

  /** Menanyakan status ke server (yang meneruskan ke gateway). */
  const cekStatus = async () => {
    if (!tagihan || selesai) return;
    try {
      const hasil = await api.post(`/pembayaran/${tagihan.id_pembayaran}/verifikasi`);
      if (hasil.status === 'LUNAS' && hasil.idTiket) return lunas(hasil.idTiket);
      if (hasil.status === 'GAGAL') {
        clearInterval(poll);
        pesanan = await api.get(`/pesanan/${id}`);
        tagihan = pesanan.status_pemesanan === 'MENUNGGU_PEMBAYARAN' ? (await api.get(`/pesanan/${id}/tagihan`)).tagihan : null;
        if (!tagihan) toast('Pembayaran gagal. Pesanan dibatalkan.', 'galat', 5000);
        render();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) return habisWaktu();
      if (err instanceof ApiError && err.status === 409) {
        tampilkanGalat(err);
        pesanan = await api.get(`/pesanan/${id}`);
        tagihan = null;
        render();
      }
    }
  };

  const mulaiPantau = () => {
    clearInterval(timer);
    clearInterval(poll);
    if (!tagihan) return;
    timer = window.setInterval(() => {
      const d = sisaDetik();
      const el = document.getElementById('sisa');
      if (el) el.textContent = fmt(d);
      if (d <= 0) void cekStatus().then(() => !selesai && habisWaktu());
    }, 1000);
    poll = window.setInterval(cekStatus, 3000);
    void cekStatus();
  };

  render();
  mulaiPantau();

  on(ctx.root, 'change', 'input[name=tipe]', (_e, t) => {
    tipe = (t as HTMLInputElement).value;
    render();
  });
  on(ctx.root, 'click', '#bayar', async (_e, t) => {
    try {
      tagihan = await sibuk(t as HTMLButtonElement, () => api.post(`/pesanan/${id}/pembayaran`, { tipePembayaran: tipe }));
      location.href = urlCheckout(); // ke halaman checkout payment gateway
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  on(ctx.root, 'click', '#ganti', () => {
    // Tagihan lama dibatalkan otomatis oleh server saat tagihan baru dibuat.
    tagihan = null;
    clearInterval(poll);
    render();
  });
  on(ctx.root, 'click', '#batalkan', async (_e, t) => {
    const ya = await konfirmasi({ judul: 'Batalkan pesanan?', pesan: 'Pesanan dan tagihannya akan dibatalkan.', ya: 'Ya, batalkan', bahaya: true });
    if (!ya) return;
    try {
      await sibuk(t as HTMLButtonElement, () => api.post(`/pesanan/${id}/batal`));
      selesai = true;
      clearInterval(timer);
      clearInterval(poll);
      toast('Pesanan dibatalkan', 'info');
      navigasi('#/');
    } catch (err) {
      tampilkanGalat(err);
    }
  });
}

const KET_METODE: Record<string, string> = {
  EWALLET: 'Pindai QR dengan GoPay, OVO, DANA, ShopeePay, dll.',
  VIRTUAL_ACCOUNT: 'Transfer dari m-banking atau ATM bank mana pun',
  KARTU: 'Visa / Mastercard dengan verifikasi 3-D Secure',
};

/** Tiket antrean (I-10). */
export async function tiketPage(ctx: RouteCtx): Promise<void> {
  const { tiket, pesanan } = await api.get(`/tiket/${ctx.params.id}`);
  const booking = tiket.tipe_antrean === 'BOOKING';
  mount(
    ctx.root,
    html`<div class="wadah wadah-sempit bagian tengah">
      <div class="centang">${ikon('cek', 40)}</div>
      <h1>Pembayaran berhasil!</h1>
      <p class="redup">${booking ? 'Reservasi kamu sudah terkunci.' : 'Kamu sudah masuk antrean. Datang saat giliranmu tiba.'}</p>
      <section class="kartu tiket">
        <small>${booking ? 'Nomor booking' : 'Nomor antrean'}</small>
        <div class="nomor-besar">${nomorAntrean(tiket.nomor_urut)}</div>
        <span class="badge badge-oranye">${MODE_LABEL[pesanan.mode_pemesanan]}${pesanan.mode_pemesanan !== 'TAKEAWAY' ? ` · ${pesanan.jumlah_rombongan} orang` : ''}</span>
        <dl class="rincian">
          <dt>Restoran</dt><dd>${pesanan.nama_restoran}</dd>
          <dt>ID pesanan</dt><dd><code>${pesanan.pesanan_id}</code></dd>
          ${booking
            ? html`<dt>Jadwal</dt><dd>${tanggal(pesanan.tanggal_booking, { weekday: 'long', day: 'numeric', month: 'long' })}, ${pesanan.slot_waktu_booking}</dd>`
            : html`<dt>Estimasi siap</dt><dd>± ${tiket.estimasi_waktu_tunggu} menit</dd>`}
          <dt>Total dibayar</dt><dd>${rupiah(pesanan.bukti?.jumlah_dibayar ?? pesanan.total_harga)}</dd>
          <dt>Metode</dt><dd>${TIPE_BAYAR_LABEL[pesanan.bukti?.tipe_pembayaran] ?? '-'}</dd>
          <dt>ID transaksi</dt><dd><code>${pesanan.bukti?.id_transaksi ?? '-'}</code></dd>
        </dl>
      </section>
      <div class="aksi-tengah">
        ${booking ? '' : html`<a class="btn btn-utama" href="#/antrean/${tiket.id_tiket}">Pantau antrean</a>`}
        <a class="btn btn-ghost" href="#/">Kembali ke beranda</a>
      </div></div>`,
  );
}
