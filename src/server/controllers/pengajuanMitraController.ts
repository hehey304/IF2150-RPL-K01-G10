/**
 * PengajuanMitraController (C12): validasi & penyimpanan pengajuan mitra (UC04) serta
 * keputusan admin setujui/tolak beserta notifikasi email (UC05).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { AppContext, SessionUser } from '../context.js';
import { DokumenVerifikasi, JENIS_DOKUMEN, PengajuanMitra, type JenisDokumen, type MenuPengajuan } from '../models/mitra.js';
import { Restoran } from '../models/restoran.js';
import { Notifikasi } from '../models/notifikasi.js';
import { Menu } from '../models/menu.js';
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js';
import { EMAIL_RE, NO_HP_RE, bilanganCacah, normalisasiNoHp, teks } from '../utils/validasi.js';

export interface BerkasUnggahan {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export class PengajuanMitraController {
  constructor(private ctx: AppContext) {}

  /** validasiKelengkapan() (Algo-058). Mengembalikan galat per kolom. */
  validasiKelengkapan(body: Record<string, unknown>, files: BerkasUnggahan[]) {
    const galat: Record<string, string> = {};
    const data = {
      namaRestoran: teks(body.namaRestoran),
      kategori: teks(body.kategori),
      lokasi: teks(body.lokasi),
      alamat: teks(body.alamat),
      emailKontak: teks(body.emailKontak).toLowerCase(),
      noHp: normalisasiNoHp(teks(body.noHp)),
    };
    if (data.namaRestoran.length < 3) galat.namaRestoran = 'Nama restoran minimal 3 karakter';
    if (data.kategori.length < 3) galat.kategori = 'Kategori makanan wajib diisi';
    if (data.lokasi.length < 3) galat.lokasi = 'Area/kecamatan wajib diisi';
    if (data.alamat.length < 10) galat.alamat = 'Alamat lengkap minimal 10 karakter';
    if (!EMAIL_RE.test(data.emailKontak)) galat.emailKontak = 'Format email tidak valid';
    if (!NO_HP_RE.test(data.noHp)) galat.noHp = 'Nomor telepon tidak valid';

    let menu: MenuPengajuan[] = [];
    try {
      const raw = typeof body.daftarMenu === 'string' ? JSON.parse(body.daftarMenu) : body.daftarMenu;
      menu = (Array.isArray(raw) ? raw : []).map((m: { namaMenu?: unknown; harga?: unknown }) => ({
        namaMenu: teks(m?.namaMenu),
        harga: bilanganCacah(m?.harga) ?? -1,
      }));
    } catch {
      menu = [];
    }
    if (menu.length === 0) galat.daftarMenu = 'Ajukan minimal satu menu';
    else if (menu.some((m) => m.namaMenu.length < 2 || m.harga < 500)) {
      galat.daftarMenu = 'Setiap menu wajib memiliki nama dan harga minimal Rp500';
    }

    for (const [jenis, aturan] of Object.entries(JENIS_DOKUMEN) as [JenisDokumen, (typeof JENIS_DOKUMEN)[JenisDokumen]][]) {
      const file = files.find((f) => f.fieldname === jenis);
      if (!file) {
        if (aturan.wajib) galat[jenis] = `${aturan.label} wajib diunggah`;
        continue;
      }
      const salah = DokumenVerifikasi.validasiFormat(jenis, file.mimetype, file.size);
      if (salah) galat[jenis] = salah;
    }
    return { data, menu, galat };
  }

  /** simpanPengajuan() (Algo-059). */
  async simpanPengajuan(user: SessionUser, body: Record<string, unknown>, files: BerkasUnggahan[]) {
    const hapusBerkas = () => files.forEach((f) => fs.rm(f.path, { force: true }, () => {}));
    try {
      if (user.role !== 'RESTORAN') throw forbidden('Hanya akun restoran yang dapat mengajukan kemitraan');
      if (user.restoranId) throw conflict('Akun ini sudah terdaftar sebagai mitra');
      const terakhir = await PengajuanMitra.terakhirMilik(this.ctx.db, user.idPengguna);
      if (terakhir?.status === 'MENUNGGU') throw conflict('Pengajuan Anda masih menunggu verifikasi admin');

      const { data, menu, galat } = this.validasiKelengkapan(body, files);
      if (Object.keys(galat).length) {
        throw badRequest('Data pendaftaran belum lengkap atau format dokumen tidak valid. Periksa bagian yang ditandai', {
          fields: galat,
        });
      }
      const id = await this.ctx.db.tx(async (q) => {
        const idPengajuan = await PengajuanMitra.simpan(q, {
          id_pengguna: user.idPengguna,
          nama_restoran: data.namaRestoran,
          kategori: data.kategori,
          lokasi: data.lokasi,
          alamat: data.alamat,
          email_kontak: data.emailKontak,
          no_hp: data.noHp,
          daftar_menu: menu,
        });
        for (const f of files) {
          await DokumenVerifikasi.unggahDokumen(q, {
            idPengajuan,
            jenis: f.fieldname,
            namaFile: f.originalname.slice(0, 120),
            path: path.basename(f.path),
            mime: f.mimetype,
          });
        }
        return idPengajuan;
      });
      return { idPengajuan: id, status: 'MENUNGGU' };
    } catch (err) {
      hapusBerkas();
      throw err;
    }
  }

  async statusSaya(user: SessionUser) {
    return PengajuanMitra.terakhirMilik(this.ctx.db, user.idPengguna);
  }

  async daftarPengajuan() {
    return PengajuanMitra.daftar(this.ctx.db);
  }

  /** tampilkanDetailBerkas() (I-18-03). */
  async detailPengajuan(idPengajuan: string) {
    const pengajuan = await PengajuanMitra.getById(this.ctx.db, idPengajuan);
    if (!pengajuan) throw notFound('Pengajuan tidak ditemukan');
    const dokumen = await DokumenVerifikasi.daftar(this.ctx.db, idPengajuan);
    return {
      ...pengajuan,
      dokumen: dokumen.map((d) => ({
        idDokumen: d.id_dokumen,
        jenis: d.jenis_dokumen,
        label: JENIS_DOKUMEN[d.jenis_dokumen as JenisDokumen]?.label ?? d.jenis_dokumen,
        namaFile: d.nama_file,
        mimeType: d.mime_type,
      })),
    };
  }

  /** Path absolut dokumen untuk diunduh admin. */
  async getBerkasDokumen(idDokumen: string) {
    const dok = await DokumenVerifikasi.getById(this.ctx.db, idDokumen);
    if (!dok) throw notFound('Dokumen tidak ditemukan');
    const full = path.join(this.ctx.config.uploadDir, path.basename(dok.path_file));
    if (!fs.existsSync(full)) throw notFound('Berkas dokumen tidak ditemukan di server');
    return { path: full, mime: dok.mime_type, namaFile: dok.nama_file };
  }

  /** setujui() (Algo-060): membuat restoran aktif beserta menu, kuota, dan antrean. */
  async setujui(idPengajuan: string) {
    const hasil = await this.ctx.db.tx(async (q) => {
      const p = await PengajuanMitra.setujui(q, idPengajuan);
      if (!p) throw conflict('Pengajuan sudah diproses sebelumnya');
      const restoranId = await Restoran.buat(q, {
        nama: p.nama_restoran,
        kategori: p.kategori,
        lokasi: p.lokasi,
        alamat: p.alamat,
        email: p.email_kontak,
        noHp: p.no_hp,
        idAkun: p.id_pengguna,
      });
      for (const m of p.daftar_menu) {
        await Menu.tambahMenu(q, restoranId, {
          namaMenu: m.namaMenu,
          harga: m.harga,
          stok: 0,
          deskripsiMenu: '',
          kategoriMenu: p.kategori,
        });
      }
      await PengajuanMitra.tautkanRestoran(q, idPengajuan, restoranId);
      // Iterasi 2: foto restoran dari pengajuan langsung dipakai sebagai foto profil restoran.
      const foto = (await DokumenVerifikasi.daftar(q, idPengajuan)).find((d) => d.jenis_dokumen === 'foto');
      if (foto) await q.query(`UPDATE restoran SET foto_path = $2 WHERE restoran_id = $1`, [restoranId, foto.path_file]);
      await Notifikasi.kirim(q, p.id_pengguna, {
        judul: 'Pendaftaran mitra disetujui 🎉',
        isi: `${p.nama_restoran} sudah tampil di antri.in. Atur stok menu dan kuota antrean sekarang.`,
        tautan: '#/resto/menu',
      });
      return { pengajuan: p, restoranId };
    });
    await this.ctx.email.kirimEmail({
      penerima: hasil.pengajuan.email_kontak,
      jenis: 'MITRA_DITERIMA',
      subjek: 'Pendaftaran mitra antri.in disetujui',
      isiPesan: `Selamat! ${hasil.pengajuan.nama_restoran} kini terdaftar sebagai mitra antri.in. ` +
        'Silakan login untuk mengatur stok menu dan kuota antrean.',
    });
    return { idPengajuan, status: 'DISETUJUI', restoranId: hasil.restoranId };
  }

  /** tolak(alasan) (Algo-061). */
  async tolak(idPengajuan: string, alasanInput: unknown) {
    const alasan = teks(alasanInput);
    if (alasan.length < 5) throw badRequest('Alasan penolakan wajib diisi (minimal 5 karakter)', {
      fields: { alasan: 'Alasan penolakan wajib diisi' },
    });
    const p = await PengajuanMitra.tolak(this.ctx.db, idPengajuan, alasan);
    if (!p) throw conflict('Pengajuan sudah diproses sebelumnya');
    await Notifikasi.kirim(this.ctx.db, p.id_pengguna, {
      judul: 'Pendaftaran mitra ditolak',
      isi: `Alasan: ${alasan}`,
      tautan: '#/mitra/daftar',
    });
    await this.ctx.email.kirimEmail({
      penerima: p.email_kontak,
      jenis: 'MITRA_DITOLAK',
      subjek: 'Pendaftaran mitra antri.in ditolak',
      isiPesan: `Mohon maaf, pengajuan ${p.nama_restoran} belum dapat kami setujui.\nAlasan: ${alasan}\n` +
        'Anda dapat memperbaiki data lalu mengajukan kembali.',
    });
    return { idPengajuan, status: 'DITOLAK' };
  }
}
