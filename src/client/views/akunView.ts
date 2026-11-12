/**
 * AkunView: RegistrasiPage (C38, I-01), LoginPage (C39, I-02),
 * HalamanProfilPage (C26, I-03), dan KonfirmasiLogoutPage (C27, I-04).
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import { session } from '../core/session.js';
import {
  bersihkanGalat, dialog, dataForm, ikon, inisial, konfirmasi, logo, MODE_LABEL, nomorAntrean, rupiah, sibuk, tandaiGalat,
  tanggal, toast,
} from '../core/ui.js';
import { berandaPeran, muatUlangUser, navigasi, type RouteCtx } from '../main.js';

const panelIdentitas = () => html`<section class="auth-identitas">
  ${logo()}
  <h1>Makan makanan viral, <span class="aksen">tanpa antre berjam‑jam.</span></h1>
  <p>Pesan lebih dulu, pantau antrean dari mana saja, dan datang tepat saat giliranmu.</p>
</section>`;

/** RegistrasiPage (I-01). */
export function registrasiPage(ctx: RouteCtx): void {
  const role = ctx.query.get('peran') === 'restoran' ? 'RESTORAN' : 'PELANGGAN';
  mount(
    ctx.root,
    html`<div class="auth-kartu">
      ${panelIdentitas()}
      <section class="auth-form">
        <h2>Buat akun</h2>
        <p class="redup">Sudah punya akun? <a href="#/login">Masuk</a></p>
        <form id="form-daftar" novalidate>
          <div class="segmen" role="radiogroup" aria-label="Peran akun">
            <label><input type="radio" name="role" value="PELANGGAN" ${role === 'PELANGGAN' ? 'checked' : ''}><span>Pelanggan</span></label>
            <label><input type="radio" name="role" value="RESTORAN" ${role === 'RESTORAN' ? 'checked' : ''}><span>Restoran</span></label>
          </div>
          <div class="field" data-field="nama"><label for="nama">Nama lengkap</label>
            <input id="nama" name="nama" autocomplete="name" required></div>
          <div class="field" data-field="email"><label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" required></div>
          <div class="field" data-field="noHp"><label for="noHp">Nomor telepon</label>
            <input id="noHp" name="noHp" type="tel" placeholder="081234567890" autocomplete="tel" required></div>
          <div class="baris-2">
            <div class="field" data-field="password"><label for="password">Kata sandi</label>
              <input id="password" name="password" type="password" minlength="8" autocomplete="new-password" required></div>
            <div class="field"><label for="konfirmasi">Konfirmasi kata sandi</label>
              <input id="konfirmasi" name="konfirmasiPassword" type="password" autocomplete="new-password" required></div>
          </div>
          <div class="field" data-field="setuju"><label class="cek"><input type="checkbox" name="setuju">
            <span>Saya menyetujui Syarat &amp; Ketentuan antri.in</span></label></div>
          <p class="form-galat" hidden></p>
          <button class="btn btn-utama btn-penuh" type="submit">Daftar</button>
          <p class="redup tengah" id="hint-resto">Pemilik restoran? Pilih peran <strong>Restoran</strong>, lalu
            <a href="#/daftar?peran=restoran">daftarkan restoranmu</a> setelah login.</p>
        </form>
      </section></div>`,
  );
  const form = $<HTMLFormElement>('#form-daftar', ctx.root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    const d = dataForm(form);
    const kirim = { ...d, setuju: (form.elements.namedItem('setuju') as HTMLInputElement).checked };
    try {
      await sibuk(form.querySelector('button[type=submit]'), () => api.post('/auth/register', kirim));
      toast('Registrasi berhasil. Silakan masuk.', 'sukses');
      navigasi(`#/login?email=${encodeURIComponent(d.email)}`);
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** LoginPage (I-02). */
export function loginPage(ctx: RouteCtx): void {
  mount(
    ctx.root,
    html`<div class="auth-kartu">
      ${panelIdentitas()}
      <section class="auth-form">
        <h2>Masuk</h2>
        <p class="redup">Untuk pelanggan, restoran, dan admin.</p>
        <form id="form-login" novalidate>
          <div class="field"><label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="username" value="${ctx.query.get('email') ?? ''}" required></div>
          <div class="field"><label for="password">Kata sandi</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required></div>
          <div class="baris-antara">
            <label class="cek"><input type="checkbox" name="ingat" checked><span>Ingat saya</span></label>
            <a href="#/lupa-kata-sandi">Lupa kata sandi?</a>
          </div>
          <p class="form-galat" hidden></p>
          <button class="btn btn-utama btn-penuh" type="submit">Masuk</button>
          <p class="redup tengah">Belum punya akun? <a href="#/daftar">Daftar sekarang</a></p>
        </form>
        <details class="akun-uji"><summary>Akun uji coba</summary>
          <ul>
            <li><button type="button" data-isi="pelanggan@antri.in|pelanggan123">Pelanggan</button></li>
            <li><button type="button" data-isi="bakso@antri.in|restoran123">Restoran</button></li>
            <li><button type="button" data-isi="mitrabaru@antri.in|restoran123">Calon mitra</button></li>
            <li><button type="button" data-isi="admin@antri.in|admin12345">Admin</button></li>
          </ul></details>
      </section></div>`,
  );
  const form = $<HTMLFormElement>('#form-login', ctx.root);
  on(ctx.root, 'click', '[data-isi]', (_e, t) => {
    const [email, pass] = (t.dataset.isi ?? '').split('|');
    (form.elements.namedItem('email') as HTMLInputElement).value = email;
    (form.elements.namedItem('password') as HTMLInputElement).value = pass;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    const d = dataForm(form);
    const ingat = (form.elements.namedItem('ingat') as HTMLInputElement).checked;
    try {
      const hasil = await sibuk(form.querySelector('button[type=submit]'), () =>
        api.post('/auth/login', { email: d.email, password: d.password, ingatSaya: ingat }),
      );
      session.simpan(hasil.token, ingat);
      const user = await muatUlangUser();
      toast(`Selamat datang, ${hasil.user.nama}!`, 'sukses');
      const lanjut = ctx.query.get('lanjut');
      navigasi(lanjut && user?.role === 'PELANGGAN' ? lanjut : berandaPeran(user));
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** HalamanProfilPage (I-03) + KonfirmasiLogoutPage (I-04). */
export async function halamanProfilPage(ctx: RouteCtx): Promise<void> {
  const profil = await api.get('/auth/me');
  const pesanan: any[] = profil.role === 'PELANGGAN' ? await api.get('/pesanan') : [];
  const aktif = pesanan.filter((p) => p.status_pemesanan === 'DIKONFIRMASI' || p.status_pemesanan === 'MENUNGGU_PEMBAYARAN');
  const riwayat = pesanan.filter((p) => p.status_pemesanan === 'SELESAI' || p.status_pemesanan === 'DIBATALKAN');
  const labelPeran = { PELANGGAN: 'Pelanggan', RESTORAN: 'Restoran', ADMIN: 'Admin' }[profil.role as string];
  const barisPesanan = (p: any) => html`<li class="list-item">
      <div class="tumbuh"><a href="#/pesanan/${p.pesanan_id}" class="tautan-gelap"><strong>${p.nama_restoran}</strong></a>
        <small>${MODE_LABEL[p.mode_pemesanan]} · ${tanggal(p.dibuat_pada, { dateStyle: 'medium', timeStyle: 'short' })}
        ${p.nomor_urut ? html` · ${nomorAntrean(p.nomor_urut)}` : ''}</small></div>
      <div class="kanan"><strong>${rupiah(p.total_harga)}</strong>
        ${p.status_pemesanan === 'MENUNGGU_PEMBAYARAN'
          ? html`<a class="btn btn-kecil btn-utama" href="#/pembayaran/${p.pesanan_id}">Bayar</a>`
          : p.id_tiket && p.status_pemesanan === 'DIKONFIRMASI'
            ? html`<a class="btn btn-kecil btn-ghost" href="#/antrean/${p.id_tiket}">Pantau</a>`
            : html`<span class="badge ${p.status_pemesanan === 'SELESAI' ? 'badge-hijau' : 'badge-abu'}">${
                p.status_pemesanan === 'SELESAI' ? 'Selesai' : 'Dibatalkan'}</span>
                <a class="btn btn-kecil btn-ghost" href="#/pesanan/${p.pesanan_id}">Detail</a>`}
      </div></li>`;

  mount(
    ctx.root,
    html`<div class="wadah wadah-sempit">
      <section class="kartu profil-kartu">
        <span class="avatar avatar-besar">${inisial(profil.nama)}</span>
        <div class="profil-info">
          <h2>${profil.nama}</h2>
          <p>${profil.email}${profil.noHp ? html` · ${profil.noHp}` : ''}</p>
          <span class="badge badge-oranye">${labelPeran}</span>
          ${profil.restoran ? html`<span class="badge badge-hijau">${profil.restoran.namaRestoran}</span>` : ''}
        </div>
        <button class="btn btn-ghost" id="ubah-profil">Ubah profil</button>
      </section>
      ${profil.role === 'PELANGGAN'
        ? html`<section class="kartu"><h3>Pesanan aktif</h3>
            ${aktif.length ? html`<ul class="list">${aktif.map(barisPesanan)}</ul>` : html`<p class="redup">Tidak ada pesanan aktif.</p>`}
          </section>
          <section class="kartu"><h3>Riwayat pesanan</h3>
            ${riwayat.length ? html`<ul class="list">${riwayat.map(barisPesanan)}</ul>` : html`<p class="redup">Belum ada riwayat.</p>`}
          </section>`
        : ''}
      <section class="kartu"><ul class="list menu-list">
        ${profil.role === 'PELANGGAN' ? html`<li><a class="list-item tautan" href="#/keluhan">${ikon('pesan')}<span>Kirim keluhan</span></a></li>` : ''}
        <li><button class="list-item tautan" id="keamanan">${ikon('perisai')}<span>Keamanan akun</span></button></li>
        <li><button class="list-item tautan bahaya" id="keluar">${ikon('keluar')}<span>Keluar dari akun</span></button></li>
      </ul></section>
    </div>`,
  );
  $('#ubah-profil', ctx.root).addEventListener('click', () => dialogUbahProfil(profil, () => void halamanProfilPage(ctx)));
  $('#keamanan', ctx.root).addEventListener('click', () => dialogGantiKataSandi());
  $('#keluar', ctx.root).addEventListener('click', async () => {
    const ya = await konfirmasi({
      judul: 'Keluar dari akun?',
      pesan: 'Anda perlu masuk kembali untuk memesan atau memantau antrean.',
      ya: 'Ya, keluar',
      bahaya: true,
    });
    if (!ya) return; // UC12 Skenario Alternatif 1: sesi tetap dipertahankan
    try {
      await api.post('/auth/logout');
    } catch {
      /* sesi mungkin sudah berakhir */
    }
    session.hapus();
    toast('Anda telah keluar.', 'info');
    navigasi('#/login');
  });
}

/** Dialog "Ubah profil" (iterasi 2). */
function dialogUbahProfil(profil: any, setelahSimpan: () => void): void {
  const { el, tutup } = dialog(html`<h3>Ubah profil</h3>
    <form id="form-profil" novalidate>
      <div class="field" data-field="nama"><label for="pf-nama">Nama lengkap</label><input id="pf-nama" name="nama" value="${profil.nama}"></div>
      <div class="field" data-field="noHp"><label for="pf-hp">Nomor telepon</label><input id="pf-hp" name="noHp" type="tel" value="${profil.noHp ?? ''}"></div>
      <div class="field"><label>Email</label><input value="${profil.email}" disabled><small class="redup">Email tidak dapat diubah.</small></div>
      <p class="form-galat" hidden></p>
      <div class="dialog-aksi"><button type="button" class="btn btn-ghost" data-tutup>Batal</button><button class="btn btn-utama" type="submit">Simpan</button></div>
    </form>`);
  const form = el.querySelector<HTMLFormElement>('#form-profil')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      await sibuk(form.querySelector('button[type=submit]'), () => api.put('/auth/profil', dataForm(form)));
      await muatUlangUser();
      toast('Profil diperbarui', 'sukses');
      tutup();
      setelahSimpan();
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** Dialog "Keamanan akun" untuk mengganti kata sandi (iterasi 2). */
function dialogGantiKataSandi(): void {
  const { el, tutup } = dialog(html`<h3>Ganti kata sandi</h3>
    <form id="form-sandi" novalidate>
      <div class="field" data-field="lama"><label for="ks-lama">Kata sandi lama</label><input id="ks-lama" name="lama" type="password" autocomplete="current-password"></div>
      <div class="field" data-field="baru"><label for="ks-baru">Kata sandi baru</label><input id="ks-baru" name="baru" type="password" autocomplete="new-password"></div>
      <div class="field"><label for="ks-konf">Konfirmasi kata sandi baru</label><input id="ks-konf" name="konfirmasi" type="password" autocomplete="new-password"></div>
      <p class="redup kecil">Setelah diganti, sesi di perangkat lain akan otomatis keluar.</p>
      <p class="form-galat" hidden></p>
      <div class="dialog-aksi"><button type="button" class="btn btn-ghost" data-tutup>Batal</button><button class="btn btn-utama" type="submit">Simpan</button></div>
    </form>`);
  const form = el.querySelector<HTMLFormElement>('#form-sandi')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      await sibuk(form.querySelector('button[type=submit]'), () => api.put('/auth/kata-sandi', dataForm(form)));
      toast('Kata sandi berhasil diganti', 'sukses');
      tutup();
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** Lupa kata sandi (iterasi 2). */
export function lupaKataSandiPage(ctx: RouteCtx): void {
  mount(
    ctx.root,
    html`<div class="auth-kartu">
      ${panelIdentitas()}
      <section class="auth-form">
        <h2>Lupa kata sandi</h2>
        <p class="redup">Masukkan email akunmu. Kami akan mengirim tautan untuk mengatur ulang kata sandi.</p>
        <form id="form-lupa" novalidate>
          <div class="field" data-field="email"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email"></div>
          <p class="form-galat" hidden></p>
          <button class="btn btn-utama btn-penuh" type="submit">Kirim tautan</button>
          <p class="redup tengah"><a href="#/login">Kembali ke halaman masuk</a></p>
        </form>
        <div id="hasil-lupa"></div>
      </section></div>`,
  );
  const form = $<HTMLFormElement>('#form-lupa', ctx.root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      const hasil = await sibuk(form.querySelector('button[type=submit]'), () => api.post('/auth/lupa-kata-sandi', dataForm(form)));
      mount($('#hasil-lupa', ctx.root), html`<p class="info-banner sukses">${hasil.pesan}</p>
        ${hasil.tautanSimulasi
          ? html`<div class="sandbox-kotak"><strong>Mode simulasi email</strong>
              <p class="redup kecil">Email tidak benar-benar dikirim. Buka tautan atur ulang di bawah ini:</p>
              <a class="btn btn-ghost" href="${hasil.tautanSimulasi}">Atur ulang kata sandi</a></div>`
          : ''}`);
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}

/** Atur ulang kata sandi dari tautan email (iterasi 2). */
export function resetKataSandiPage(ctx: RouteCtx): void {
  const token = ctx.query.get('token') ?? '';
  mount(
    ctx.root,
    html`<div class="auth-kartu">
      ${panelIdentitas()}
      <section class="auth-form">
        <h2>Atur ulang kata sandi</h2>
        <form id="form-reset" novalidate>
          <div class="field" data-field="baru"><label for="baru">Kata sandi baru</label><input id="baru" name="baru" type="password" autocomplete="new-password"></div>
          <div class="field"><label for="konfirmasi">Konfirmasi kata sandi baru</label><input id="konfirmasi" name="konfirmasi" type="password" autocomplete="new-password"></div>
          <p class="form-galat" hidden></p>
          <button class="btn btn-utama btn-penuh" type="submit">Simpan kata sandi</button>
        </form>
      </section></div>`,
  );
  const form = $<HTMLFormElement>('#form-reset', ctx.root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    try {
      await sibuk(form.querySelector('button[type=submit]'), () => api.post('/auth/reset-kata-sandi', { ...dataForm(form), token }));
      toast('Kata sandi diperbarui. Silakan masuk.', 'sukses');
      navigasi('#/login');
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}
