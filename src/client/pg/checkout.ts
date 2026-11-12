/**
 * Halaman checkout AntriPay Sandbox (payment gateway simulasi).
 * Halaman ini berperan sebagai milik penyedia gateway, terpisah dari aplikasi antri.in.
 */
import { $, html, mount, on, type SafeHtml } from '../core/html.js';
import { bersihkanGalat, ikon, rupiah, sibuk, tandaiGalat, toast } from '../core/ui.js';
import { ApiError } from '../core/api.js';

const id = location.pathname.split('/').pop() ?? '';
const kembaliParam = new URLSearchParams(location.search).get('kembali') ?? '';
/** Hanya izinkan kembali ke rute internal antri.in (mencegah open redirect). */
const urlKembali = /^#\/[\w\-/?=&%.]*$/.test(kembaliParam) ? `/${kembaliParam}` : '/#/';
const root = document.getElementById('pg')!;

interface Info {
  id: string; merchant: string; orderId: string; metode: 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'KARTU'; jumlah: number;
  kodeBayar: string; status: string; sisaDetik: number; kartu: { merek: string; akhir: string } | null; alasan: string | null;
  kartuUji: { nomor: string; hasil: string; keterangan: string }[];
}

let info: Info;
let tenggat = 0;
let timer = 0;
let redirect = 0;

async function req(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`/pg/api/${id}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Terjadi kesalahan', data);
  return data;
}

const NAMA_METODE = { EWALLET: 'E-wallet (QR)', VIRTUAL_ACCOUNT: 'Virtual account', KARTU: 'Kartu debit / kredit' };
const fmt = (d: number) => `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
const nomorKelompok = (s: string) => s.replace(/(\d{4})(?=\d)/g, '$1 ');

function kerangka(isi: SafeHtml): SafeHtml {
  return html`<div class="pg-wadah">
    <header class="pg-kepala"><span class="pg-logo">${ikon('gembok', 18)} AntriPay</span><span class="pg-sandbox">SANDBOX · MODE UJI</span></header>
    <section class="pg-kartu">
      <div class="pg-merchant"><div><small>Pembayaran ke</small><strong>${info.merchant}</strong><small class="mono">Order ${info.orderId}</small></div>
        <div class="kanan"><small>Total</small><strong class="pg-jumlah">${rupiah(info.jumlah)}</strong></div></div>
      ${['MENUNGGU', 'OTP'].includes(info.status)
        ? html`<div class="pg-timer">${ikon('jam', 16)} Bayar sebelum <strong id="pg-sisa">${fmt(info.sisaDetik)}</strong> · ${NAMA_METODE[info.metode]}</div>`
        : ''}
      <div class="pg-isi">${isi}</div>
    </section>
    <footer class="pg-kaki"><span class="baris-ikon">${ikon('gembok', 14)} Ini lingkungan uji. Tidak ada uang sungguhan yang berpindah dan data kartu tidak disimpan.</span>
      <a href="${urlKembali}">Kembali ke antri.in</a></footer>
  </div>`;
}

function hasil(jenis: 'sukses' | 'gagal', judul: string, teks: string): SafeHtml {
  return html`<div class="pg-hasil ${jenis}"><span class="pg-hasil-ikon">${ikon(jenis === 'sukses' ? 'cek' : 'silang', 36)}</span>
    <h2>${judul}</h2><p>${teks}</p><a class="btn btn-utama btn-penuh" href="${urlKembali}">Kembali ke antri.in</a>
    ${jenis === 'sukses' ? html`<small class="redup">Mengalihkan otomatis dalam 3 detik…</small>` : ''}</div>`;
}

function isiMetode(): SafeHtml {
  switch (info.status) {
    case 'LUNAS':
      return hasil('sukses', 'Pembayaran berhasil', `${rupiah(info.jumlah)} diterima oleh ${info.merchant}.`);
    case 'GAGAL':
      return hasil('gagal', 'Pembayaran gagal', info.alasan ?? 'Transaksi dibatalkan.');
    case 'KEDALUWARSA':
      return hasil('gagal', 'Transaksi kedaluwarsa', 'Batas waktu pembayaran sudah habis.');
    case 'DIKEMBALIKAN':
      return hasil('gagal', 'Dana dikembalikan', 'Merchant membatalkan pesanan dan dana sudah dikembalikan.');
    case 'OTP':
      return html`<form id="form-otp" class="pg-form" novalidate>
        <h3>Verifikasi 3-D Secure</h3>
        <p class="redup">Kode OTP dikirim ke nomor yang terdaftar pada kartu <span class="nowrap">${info.kartu?.merek} •••• ${info.kartu?.akhir}</span>.</p>
        <div class="field" data-field="otp"><label for="otp">Kode OTP</label>
          <input id="otp" name="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="6 digit"></div>
        <p class="pg-petunjuk">Mode uji: gunakan OTP <code>112233</code>.</p>
        <p class="form-galat" hidden></p>
        <button class="btn btn-utama btn-penuh" type="submit">Verifikasi</button></form>`;
  }
  if (info.metode === 'EWALLET') {
    return html`<div class="pg-qr-wadah"><img src="/pg/api/${id}/qr" alt="Kode QR pembayaran" width="220" height="220"></div>
      <ol class="langkah"><li>Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, dll.)</li><li>Pilih <strong>Bayar / Scan</strong>, lalu pindai kode QR</li>
      <li>Periksa nominal ${rupiah(info.jumlah)} dan konfirmasi</li></ol>
      <div class="pg-simulator"><div class="pg-sim-judul">${ikon('hp', 18)} Simulator aplikasi e-wallet</div>
        <p>Bayar <strong>${rupiah(info.jumlah)}</strong> ke <strong>${info.merchant}</strong>?</p>
        <div class="aksi-dua"><button class="btn btn-ghost" data-ewallet="0">Tolak</button><button class="btn btn-utama" data-ewallet="1">Bayar</button></div></div>`;
  }
  if (info.metode === 'VIRTUAL_ACCOUNT') {
    return html`<div class="pg-va"><small>Nomor virtual account</small>
        <div class="pg-va-nomor"><code>${nomorKelompok(info.kodeBayar)}</code>
          <button class="btn btn-ghost btn-kecil" data-salin="${info.kodeBayar}">${ikon('salin', 16)} Salin</button></div>
        <small class="redup">Bank tujuan: antri.in (AntriPay VA)</small></div>
      <ol class="langkah"><li>Buka m-banking atau ATM bank mana pun</li><li>Pilih <strong>Transfer › Virtual Account</strong></li>
      <li>Masukkan nomor di atas dan transfer <strong>tepat ${rupiah(info.jumlah)}</strong></li></ol>
      <form class="pg-simulator" id="form-va" novalidate><div class="pg-sim-judul">${ikon('bank', 18)} Simulator m-banking</div>
        <div class="field"><label for="nominal">Nominal transfer</label><input id="nominal" name="nominal" inputmode="numeric" value="${info.jumlah}"></div>
        <p class="form-galat" hidden></p>
        <button class="btn btn-utama btn-penuh" type="submit">Transfer sekarang</button></form>`;
  }
  return html`<form id="form-kartu" class="pg-form" novalidate autocomplete="off">
      <div class="field" data-field="nama"><label for="nama">Nama pada kartu</label><input id="nama" name="nama" autocomplete="off"></div>
      <div class="field" data-field="nomor"><label for="nomor">Nomor kartu</label>
        <input id="nomor" name="nomor" inputmode="numeric" maxlength="19" placeholder="0000 0000 0000 0000" autocomplete="off"></div>
      <div class="baris-2">
        <div class="field" data-field="kedaluwarsa"><label for="exp">Berlaku hingga</label><input id="exp" name="kedaluwarsa" placeholder="MM/YY" maxlength="5" autocomplete="off"></div>
        <div class="field" data-field="cvv"><label for="cvv">CVV</label><input id="cvv" name="cvv" inputmode="numeric" maxlength="3" type="password" autocomplete="off"></div>
      </div>
      <p class="form-galat" hidden></p>
      <button class="btn btn-utama btn-penuh" type="submit">Bayar ${rupiah(info.jumlah)}</button>
    </form>
    <div class="pg-kartu-uji"><strong>Kartu uji sandbox</strong><p class="redup kecil">Mode uji hanya menerima kartu berikut. Jangan masukkan kartu sungguhan.</p>
      <ul>${info.kartuUji.map((k) => html`<li><code>${nomorKelompok(k.nomor)}</code><span>${k.keterangan}</span>
        <button type="button" class="btn btn-ghost btn-kecil" data-pakai="${k.nomor}">Pakai</button></li>`)}</ul></div>`;
}

function render(): void {
  mount(root, kerangka(isiMetode()));
  document.title = `AntriPay Sandbox · ${rupiah(info.jumlah)}`;
  clearTimeout(redirect);
  if (info.status === 'LUNAS') redirect = window.setTimeout(() => location.assign(urlKembali), 3000);
}

async function muat(): Promise<void> {
  try {
    const baru: Info = await req('GET', '');
    const berubah = !info || baru.status !== info.status;
    info = baru;
    tenggat = Date.now() + info.sisaDetik * 1000;
    if (berubah) render();
  } catch (err) {
    mount(root, html`<div class="pg-wadah"><section class="pg-kartu"><div class="pg-isi">
      <div class="pg-hasil gagal"><span class="pg-hasil-ikon">${ikon('silang', 36)}</span><h2>Transaksi tidak ditemukan</h2>
      <p>${(err as Error).message}</p><a class="btn btn-utama btn-penuh" href="${urlKembali}">Kembali ke antri.in</a></div></div></section></div>`);
  }
}

async function aksi(tombol: HTMLButtonElement | null, form: HTMLElement | null, fn: () => Promise<Info>): Promise<void> {
  if (form) bersihkanGalat(form);
  try {
    info = await sibuk(tombol, fn);
    render();
  } catch (err) {
    if (form) tandaiGalat(form, err);
    else toast((err as Error).message, 'galat');
    if (err instanceof ApiError && (err.status === 409 || err.status === 410)) void muat();
  }
}

on(root, 'click', '[data-ewallet]', (_e, t) =>
  void aksi(t as HTMLButtonElement, null, () => req('POST', '/ewallet', { setuju: t.dataset.ewallet === '1' })));
on(root, 'click', '[data-salin]', async (_e, t) => {
  try {
    await navigator.clipboard.writeText(t.dataset.salin ?? '');
    toast('Nomor VA disalin', 'sukses', 1500);
  } catch {
    toast(`Salin manual: ${t.dataset.salin}`, 'info');
  }
});
on(root, 'click', '[data-pakai]', (_e, t) => {
  ($('#nomor', root) as HTMLInputElement).value = nomorKelompok(t.dataset.pakai ?? '');
  ($('#exp', root) as HTMLInputElement).value = '12/30';
  ($('#cvv', root) as HTMLInputElement).value = '123';
  const nama = $('#nama', root) as HTMLInputElement;
  if (!nama.value) nama.value = 'Pengguna Uji';
});
on(root, 'input', '#nomor', (_e, t) => {
  const el = t as HTMLInputElement;
  el.value = nomorKelompok(el.value.replace(/\D/g, '').slice(0, 16));
});
on(root, 'input', '#exp', (_e, t) => {
  const el = t as HTMLInputElement;
  const d = el.value.replace(/\D/g, '').slice(0, 4);
  el.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
});
on(root, 'submit', '#form-va', (e, f) => {
  e.preventDefault();
  void aksi(f.querySelector('button'), f, () => req('POST', '/va', { nominal: Number(($('#nominal', f) as HTMLInputElement).value.replace(/\D/g, '')) }));
});
on(root, 'submit', '#form-kartu', (e, f) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f as HTMLFormElement)) as Record<string, string>;
  void aksi(f.querySelector('button[type=submit]'), f, () => req('POST', '/kartu', d));
});
on(root, 'submit', '#form-otp', (e, f) => {
  e.preventDefault();
  void aksi(f.querySelector('button'), f, () => req('POST', '/otp', { otp: ($('#otp', f) as HTMLInputElement).value }));
});

void muat().then(() => {
  timer = window.setInterval(() => {
    const el = document.getElementById('pg-sisa');
    const sisa = Math.max(0, Math.round((tenggat - Date.now()) / 1000));
    if (el) el.textContent = fmt(sisa);
    if (sisa === 0 && ['MENUNGGU', 'OTP'].includes(info.status)) void muat();
  }, 1000);
  // Status dapat berubah dari sisi merchant (dibatalkan/ganti metode) atau kedaluwarsa.
  window.setInterval(() => ['MENUNGGU', 'OTP'].includes(info?.status) && void muat(), 5000);
});
void timer;
