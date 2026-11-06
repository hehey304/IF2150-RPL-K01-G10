/**
 * MitraView: RegistrasiRestoPage (C37, I-13) untuk restoran dan VerifikasiRestoranPage (C36, I-18) untuk admin.
 */
import { api } from '../core/api.js';
import { $, html, mount, on } from '../core/html.js';
import { session } from '../core/session.js';
import {
  bersihkanGalat, ikon, konfirmasi, kosong, rupiah, sibuk, tampilkanGalat, tandaiGalat, tanggal, toast,
} from '../core/ui.js';
import { muatUlangUser, navigasi, type RouteCtx } from '../main.js';

const STATUS: Record<string, [string, string]> = {
  MENUNGGU: ['Menunggu verifikasi', 'badge-kuning'],
  DISETUJUI: ['Disetujui', 'badge-hijau'],
  DITOLAK: ['Ditolak', 'badge-merah'],
};

/** RegistrasiRestoPage (I-13). */
export async function registrasiRestoPage(ctx: RouteCtx): Promise<void> {
  const user = await muatUlangUser();
  if (user?.restoranId) return navigasi('#/resto');
  const pengajuan = await api.get('/mitra/pengajuan-saya');
  if (pengajuan?.status === 'MENUNGGU') {
    mount(
      ctx.root,
      html`<header class="panel-kepala"><div><h1>Pendaftaran mitra</h1></div></header>
        <section class="kartu tengah status-pengajuan">
          <span class="ikon-bulat besar">${ikon('jam', 32)}</span>
          <h2>Pengajuan sedang ditinjau</h2>
          <p><strong>${pengajuan.nama_restoran}</strong> diajukan pada ${tanggal(pengajuan.tgl_pengajuan, { dateStyle: 'long' })}.</p>
          <span class="badge ${STATUS.MENUNGGU[1]}">${STATUS.MENUNGGU[0]}</span>
          <p class="redup">Admin akan memverifikasi berkasmu. Hasilnya dikirim ke ${pengajuan.email_kontak}.</p>
          <button class="btn btn-ghost" id="cek">Cek status</button>
        </section>`,
    );
    $('#cek', ctx.root).addEventListener('click', () => navigasi('#/mitra/daftar'));
    return;
  }
  const awal = pengajuan?.status === 'DITOLAK' ? pengajuan : null;
  let menu: { namaMenu: string; harga: string }[] = awal
    ? awal.daftar_menu.map((m: any) => ({ namaMenu: m.namaMenu, harga: String(m.harga) }))
    : [{ namaMenu: '', harga: '' }];

  const barisMenu = () => html`${menu.map((m, i) => html`<li class="baris-menu">
      <input placeholder="Nama menu" value="${m.namaMenu}" data-menu="${i}" data-k="namaMenu" aria-label="Nama menu ${i + 1}">
      <input placeholder="Harga" inputmode="numeric" value="${m.harga}" data-menu="${i}" data-k="harga" aria-label="Harga menu ${i + 1}">
      <button type="button" class="ikon-btn" data-hapus-menu="${i}" aria-label="Hapus menu" ${menu.length === 1 ? 'disabled' : ''}>${ikon('hapus', 18)}</button>
    </li>`)}`;

  mount(
    ctx.root,
    html`<header class="panel-kepala"><div><h1>Pendaftaran mitra</h1>
      <p class="redup">Lengkapi profil, dokumen perizinan, dan menu restoranmu.</p></div></header>
      ${awal ? html`<p class="info-banner galat">Pengajuan sebelumnya ditolak. Alasan: <strong>${awal.alasan_penolakan}</strong>. Perbaiki data lalu ajukan kembali.</p>` : ''}
      <form class="form-mitra" id="form-mitra" novalidate>
        <section class="kartu"><h3>Profil restoran</h3>
          <div class="baris-2">
            <div class="field" data-field="namaRestoran"><label for="nr">Nama restoran</label><input id="nr" name="namaRestoran" value="${awal?.nama_restoran ?? ''}"></div>
            <div class="field" data-field="kategori"><label for="kt">Kategori makanan</label><input id="kt" name="kategori" placeholder="Bakso, Seblak, Kopi…" value="${awal?.kategori ?? ''}"></div>
          </div>
          <div class="baris-2">
            <div class="field" data-field="lokasi"><label for="lk">Area / kecamatan</label><input id="lk" name="lokasi" placeholder="Dago" value="${awal?.lokasi ?? ''}"></div>
            <div class="field" data-field="noHp"><label for="hp">Nomor telepon</label><input id="hp" name="noHp" type="tel" value="${awal?.no_hp ?? session.user?.noHp ?? ''}"></div>
          </div>
          <div class="field" data-field="alamat"><label for="al">Alamat lengkap</label><input id="al" name="alamat" value="${awal?.alamat ?? ''}"></div>
          <div class="field" data-field="emailKontak"><label for="em">Email kontak</label><input id="em" name="emailKontak" type="email" value="${awal?.email_kontak ?? session.user?.email ?? ''}"></div>
        </section>
        <section class="kartu"><h3>Foto &amp; dokumen perizinan</h3>
          <p class="redup kecil">Format PDF/JPG/PNG, maksimum 5 MB per berkas.</p>
          <div class="baris-2">
            <div class="field" data-field="foto"><label for="foto">Foto restoran (JPG/PNG, opsional)</label><input id="foto" name="foto" type="file" accept="image/jpeg,image/png"></div>
            <div class="field" data-field="nib"><label for="nib">NIB (wajib)</label><input id="nib" name="nib" type="file" accept=".pdf,image/jpeg,image/png"></div>
          </div>
          <div class="baris-2">
            <div class="field" data-field="izinUsaha"><label for="iu">Izin usaha (wajib)</label><input id="iu" name="izinUsaha" type="file" accept=".pdf,image/jpeg,image/png"></div>
            <div class="field" data-field="sertifikatHalal"><label for="sh">Sertifikat halal (opsional)</label><input id="sh" name="sertifikatHalal" type="file" accept=".pdf,image/jpeg,image/png"></div>
          </div>
        </section>
        <section class="kartu"><h3>Menu yang diajukan</h3>
          <div class="field" data-field="daftarMenu"><ul class="list" id="daftar-menu">${barisMenu()}</ul></div>
          <button type="button" class="btn btn-teks" id="tambah-menu">+ Tambah menu</button>
        </section>
        <p class="form-galat" hidden></p>
        <div class="aksi-kanan"><button type="submit" class="btn btn-utama btn-besar">Daftar</button></div>
      </form>`,
  );
  const form = $<HTMLFormElement>('#form-mitra', ctx.root);
  const renderMenu = () => mount($('#daftar-menu', ctx.root), barisMenu());
  on(ctx.root, 'input', '[data-menu]', (_e, t) => {
    const i = Number(t.dataset.menu);
    menu[i] = { ...menu[i], [t.dataset.k as 'namaMenu' | 'harga']: (t as HTMLInputElement).value };
  });
  on(ctx.root, 'click', '[data-hapus-menu]', (_e, t) => {
    menu.splice(Number(t.dataset.hapusMenu), 1);
    renderMenu();
  });
  $('#tambah-menu', ctx.root).addEventListener('click', () => {
    menu.push({ namaMenu: '', harga: '' });
    renderMenu();
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    bersihkanGalat(form);
    const fd = new FormData(form);
    for (const k of ['foto', 'nib', 'izinUsaha', 'sertifikatHalal']) {
      const f = fd.get(k);
      if (f instanceof File && f.size === 0) fd.delete(k);
    }
    fd.set('daftarMenu', JSON.stringify(menu.filter((m) => m.namaMenu || m.harga).map((m) => ({ namaMenu: m.namaMenu, harga: m.harga.replace(/\D/g, '') }))));
    try {
      await sibuk(form.querySelector('button[type=submit]'), () => api.post('/mitra/pengajuan', fd));
      toast('Pendaftaran berhasil dikirim dan menunggu verifikasi admin.', 'sukses', 5000);
      navigasi('#/mitra/daftar');
    } catch (err) {
      tandaiGalat(form, err);
      form.querySelector('.salah')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/** Membuka dokumen (butuh header Authorization) di tab baru. */
async function bukaDokumen(idDokumen: string): Promise<void> {
  const res = await fetch(`/api/admin/dokumen/${idDokumen}`, { headers: { Authorization: `Bearer ${session.token}` } });
  if (!res.ok) throw new Error('Dokumen tidak dapat dibuka');
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** VerifikasiRestoranPage (I-18). */
export async function verifikasiRestoranPage(ctx: RouteCtx): Promise<void> {
  let daftar: any[] = await api.get('/admin/pengajuan');
  let dipilih: string | null = daftar.find((p) => p.status === 'MENUNGGU')?.id_pengajuan ?? daftar[0]?.id_pengajuan ?? null;

  const render = async () => {
    const detail = dipilih ? await api.get(`/admin/pengajuan/${dipilih}`) : null;
    const st = (s: string) => html`<span class="badge ${STATUS[s][1]}">${STATUS[s][0]}</span>`;
    mount(
      ctx.root,
      html`<header class="panel-kepala"><div><h1>Verifikasi pengajuan mitra</h1>
        <p class="redup">${daftar.filter((p) => p.status === 'MENUNGGU').length} pengajuan menunggu verifikasi</p></div></header>
        ${daftar.length === 0 ? kosong('Belum ada pengajuan mitra') : html`<div class="dua-kolom">
          <section class="kartu"><ul class="list">${daftar.map((p) => html`<li><button class="list-item tautan ${p.id_pengajuan === dipilih ? 'dipilih' : ''}" data-pengajuan="${p.id_pengajuan}">
              <span class="tumbuh"><strong>${p.nama_restoran}</strong><small>${tanggal(p.tgl_pengajuan, { dateStyle: 'medium' })}</small></span>${st(p.status)}</button></li>`)}</ul></section>
          ${detail ? html`<section class="kartu">
            <div class="baris-antara"><h2>${detail.nama_restoran}</h2>${st(detail.status)}</div>
            <dl class="rincian">
              <dt>Kategori</dt><dd>${detail.kategori}</dd><dt>Area</dt><dd>${detail.lokasi}</dd>
              <dt>Alamat</dt><dd>${detail.alamat}</dd><dt>Email</dt><dd>${detail.email_kontak}</dd><dt>Telepon</dt><dd>${detail.no_hp}</dd>
            </dl>
            <h3>Dokumen perizinan</h3>
            ${detail.dokumen.length ? html`<ul class="list">${detail.dokumen.map((d: any) => html`<li><button class="list-item tautan" data-dokumen="${d.idDokumen}">
                ${ikon('dokumen')}<span class="tumbuh"><strong>${d.label}</strong><small>${d.namaFile}</small></span><span class="tautan-aksen">Lihat</span></button></li>`)}</ul>`
              : html`<p class="redup">Tidak ada dokumen.</p>`}
            <h3>Menu yang diajukan</h3>
            <ul class="list">${detail.daftar_menu.map((m: any) => html`<li class="baris-antara"><span>${m.namaMenu}</span><span>${rupiah(m.harga)}</span></li>`)}</ul>
            ${detail.status === 'MENUNGGU'
              ? html`<form id="form-keputusan" novalidate>
                  <div class="field" data-field="alasan"><label for="alasan">Alasan penolakan</label>
                    <textarea id="alasan" name="alasan" rows="3" placeholder="Wajib diisi jika pengajuan ditolak"></textarea></div>
                  <p class="form-galat" hidden></p>
                  <div class="aksi-kanan"><button type="button" class="btn btn-ghost-bahaya" id="tolak">Tolak</button>
                    <button type="button" class="btn btn-utama" id="setujui">Setujui</button></div></form>`
              : detail.status === 'DITOLAK'
                ? html`<p class="info-banner galat">Ditolak: ${detail.alasan_penolakan}</p>`
                : html`<p class="info-banner sukses">Restoran sudah tampil di daftar restoran viral.</p>`}
          </section>` : ''}
        </div>`}`,
    );
  };
  await render();

  on(ctx.root, 'click', '[data-pengajuan]', (_e, t) => {
    dipilih = t.dataset.pengajuan!;
    void render().catch(tampilkanGalat);
  });
  on(ctx.root, 'click', '[data-dokumen]', (_e, t) => void bukaDokumen(t.dataset.dokumen!).catch(tampilkanGalat));
  on(ctx.root, 'click', '#setujui', async (_e, t) => {
    if (!(await konfirmasi({ judul: 'Setujui pengajuan?', pesan: 'Restoran akan langsung tampil bagi pelanggan dan menerima email penerimaan.', ya: 'Setujui' }))) return;
    try {
      await sibuk(t as HTMLButtonElement, () => api.post(`/admin/pengajuan/${dipilih}/setujui`));
      toast('Pengajuan disetujui. Email penerimaan terkirim.', 'sukses');
      daftar = await api.get('/admin/pengajuan');
      await render();
    } catch (err) {
      tampilkanGalat(err);
    }
  });
  on(ctx.root, 'click', '#tolak', async (_e, t) => {
    const form = $<HTMLFormElement>('#form-keputusan', ctx.root);
    bersihkanGalat(form);
    try {
      await sibuk(t as HTMLButtonElement, () =>
        api.post(`/admin/pengajuan/${dipilih}/tolak`, { alasan: ($('#alasan', ctx.root) as HTMLTextAreaElement).value }));
      toast('Pengajuan ditolak. Email penolakan terkirim.', 'info');
      daftar = await api.get('/admin/pengajuan');
      await render();
    } catch (err) {
      tandaiGalat(form, err);
    }
  });
}
