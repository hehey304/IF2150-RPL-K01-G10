/**
 * Detail & riwayat pesanan pelanggan (iterasi 2): status, rincian item, bukti pembayaran, tiket, dan ulasan.
 */
import { api } from '../core/api.js';
import { $, html, mount } from '../core/html.js';
import { ikon, MODE_LABEL, nomorAntrean, rupiah, tanggal, TIPE_BAYAR_LABEL } from '../core/ui.js';
import type { RouteCtx } from '../main.js';
import { formUlasan } from './ulasanView.js';

const STATUS: Record<string, [string, string]> = {
  MENUNGGU_PEMBAYARAN: ['Menunggu pembayaran', 'badge-kuning'],
  DIKONFIRMASI: ['Dalam antrean', 'badge-oranye'],
  SELESAI: ['Selesai', 'badge-hijau'],
  DIBATALKAN: ['Dibatalkan', 'badge-abu'],
};

export async function detailPesananPage(ctx: RouteCtx): Promise<void> {
  const p = await api.get(`/pesanan/${ctx.params.id}`);
  const [label, kelas] = STATUS[p.status_pemesanan] ?? [p.status_pemesanan, 'badge-abu'];
  mount(
    ctx.root,
    html`<div class="wadah wadah-sempit bagian">
      <a href="#/profil" class="kembali">${ikon('kembali', 18)} Profil & riwayat pesanan</a>
      <div class="baris-antara"><h1>${p.nama_restoran}</h1><span class="badge ${kelas}">${label}</span></div>
      <p class="redup">${MODE_LABEL[p.mode_pemesanan]}${p.mode_pemesanan !== 'TAKEAWAY' ? ` · ${p.jumlah_rombongan} orang` : ''} ·
        ${tanggal(p.dibuat_pada, { dateStyle: 'long', timeStyle: 'short' })}</p>
      ${p.tiket && p.status_pemesanan === 'DIKONFIRMASI'
        ? html`<div class="aksi-halaman">
            <a class="btn btn-utama" href="${p.tiket.status_antrean === 'TERJADWAL' ? `#/tiket/${p.tiket.id_tiket}` : `#/antrean/${p.tiket.id_tiket}`}">
              ${p.tiket.status_antrean === 'TERJADWAL' ? 'Lihat tiket booking' : 'Pantau antrean'}</a>
            <a class="btn btn-ghost" href="#/keluhan?pesanan=${p.pesanan_id}">Kirim keluhan</a></div>`
        : ''}
      <section class="kartu">
        <h3>Rincian pesanan</h3>
        <dl class="rincian">
          <dt>ID pesanan</dt><dd><code>${p.pesanan_id}</code></dd>
          ${p.tiket ? html`<dt>Nomor antrean</dt><dd>${nomorAntrean(p.tiket.nomor_urut)}</dd>` : ''}
          ${p.tanggal_booking ? html`<dt>Jadwal booking</dt><dd>${tanggal(p.tanggal_booking, { weekday: 'long', day: 'numeric', month: 'long' })}, ${p.slot_waktu_booking}</dd>` : ''}
        </dl>
        <ul class="list">${p.items.map((i: any) => html`<li class="baris-antara"><span>${i.jumlah}× ${i.nama_menu}</span><span>${rupiah(i.subtotal)}</span></li>`)}</ul>
        <div class="baris-antara"><span>Subtotal</span><span>${rupiah(p.subtotal)}</span></div>
        <div class="baris-antara"><span>Biaya layanan</span><span>${rupiah(p.biaya_layanan)}</span></div>
        <div class="baris-antara total"><span>Total</span><strong>${rupiah(p.total_harga)}</strong></div>
      </section>
      <section class="kartu">
        <h3>Bukti pembayaran</h3>
        ${p.bukti
          ? html`<dl class="rincian">
              <dt>ID transaksi</dt><dd><code>${p.bukti.id_transaksi}</code></dd>
              <dt>Metode</dt><dd>${TIPE_BAYAR_LABEL[p.bukti.tipe_pembayaran]}</dd>
              <dt>Waktu bayar</dt><dd>${tanggal(p.bukti.tanggal_transaksi, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
              <dt>Jumlah dibayar</dt><dd>${rupiah(p.bukti.jumlah_dibayar)}</dd>
              <dt>Status</dt><dd>${p.bukti.status_pelunasan === 'LUNAS' ? 'Lunas' : p.bukti.status_pelunasan}</dd>
            </dl>
            <button class="btn btn-ghost" id="cetak">Cetak bukti</button>`
          : html`<p class="redup">Belum ada pembayaran.</p>
              ${p.status_pemesanan === 'MENUNGGU_PEMBAYARAN' ? html`<a class="btn btn-utama" href="#/pembayaran/${p.pesanan_id}">Bayar sekarang</a>` : ''}`}
      </section>
      ${p.status_pemesanan === 'SELESAI' ? html`<section class="kartu" id="ulasan"></section>` : ''}
    </div>`,
  );
  document.getElementById('cetak')?.addEventListener('click', () => window.print());
  if (p.status_pemesanan === 'SELESAI') await formUlasan($('#ulasan', ctx.root), p.pesanan_id);
}
