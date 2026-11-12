/**
 * AutentikasiController (C28): registrasi, login, validasi sesi, dan logout untuk semua peran (UC10-UC12).
 */
import type { AppContext, SessionUser } from '../context.js';
import { Pelanggan, Pengguna, ProfilAkun, ResetKataSandi, SesiPengguna, type Role } from '../models/akun.js';
import { Restoran } from '../models/restoran.js';
import { PengajuanMitra } from '../models/mitra.js';
import { badRequest, conflict, notFound, unauthorized } from '../utils/errors.js';
import { EMAIL_RE, NO_HP_RE, normalisasiNoHp, teks } from '../utils/validasi.js';

export interface RegistrasiInput {
  role?: unknown;
  nama?: unknown;
  email?: unknown;
  noHp?: unknown;
  password?: unknown;
  konfirmasiPassword?: unknown;
  setuju?: unknown;
}

export class AutentikasiController {
  constructor(private ctx: AppContext) {}

  /** createAccount() (UC10). */
  async createAccount(input: RegistrasiInput) {
    const role = input.role === 'RESTORAN' ? 'RESTORAN' : 'PELANGGAN';
    const nama = teks(input.nama);
    const email = teks(input.email).toLowerCase();
    const noHp = normalisasiNoHp(teks(input.noHp));
    const password = typeof input.password === 'string' ? input.password : '';
    const konfirmasi = typeof input.konfirmasiPassword === 'string' ? input.konfirmasiPassword : '';

    const galat: Record<string, string> = {};
    if (nama.length < 2) galat.nama = 'Nama lengkap wajib diisi';
    if (!EMAIL_RE.test(email)) galat.email = 'Format email tidak valid';
    if (!NO_HP_RE.test(noHp)) galat.noHp = 'Nomor telepon tidak valid (contoh: 081234567890)';
    if (password.length < 8 || password !== konfirmasi) {
      galat.password = 'Konfirmasi kata sandi tidak cocok atau kata sandi minimal 8 karakter';
    }
    if (input.setuju !== true) galat.setuju = 'Anda harus menyetujui Syarat & Ketentuan antri.in';
    if (Object.keys(galat).length) throw badRequest('Data registrasi belum valid', { fields: galat });

    return this.ctx.db.tx(async (q) => {
      const dup = await Pengguna.isDuplikat(q, email, noHp);
      if (dup.email || dup.noHp) {
        throw conflict('Email atau nomor telepon sudah terdaftar. Silakan gunakan akun lain atau lakukan login', {
          fields: {
            ...(dup.email ? { email: 'Email sudah terdaftar' } : {}),
            ...(dup.noHp ? { noHp: 'Nomor telepon sudah terdaftar' } : {}),
          },
        });
      }
      const akun = await Pengguna.saveCredentials(q, { nama, email, noHp, password, role: role as Role });
      if (role === 'PELANGGAN') await Pelanggan.accountRegister(q, akun);
      return { idPengguna: akun.id_pengguna, role: akun.role, email: akun.email };
    });
  }

  /** validation(): memverifikasi kredensial lalu menerbitkan sesi (UC11). */
  async validation(input: { email?: unknown; password?: unknown; ingatSaya?: unknown }) {
    const identitas = teks(input.email).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    if (!identitas || !password) throw badRequest('Email dan kata sandi wajib diisi');
    const akun = await Pengguna.validateAccount(this.ctx.db, identitas, password);
    if (!akun) throw unauthorized('Email atau kata sandi yang Anda masukkan salah');
    const jam = input.ingatSaya === true ? this.ctx.config.sessionHours * 7 : this.ctx.config.sessionHours;
    const sesi = await SesiPengguna.buat(this.ctx.db, akun.id_pengguna, jam);
    const user = await this.loadSessionUser(akun.id_pengguna, sesi.token);
    return { token: sesi.token, kedaluwarsa: sesi.kedaluwarsa, user: user ? this.publicUser(user) : null };
  }

  /** validateSession(): dipakai middleware untuk setiap request. */
  async validateSession(token: string): Promise<SessionUser | null> {
    if (!token) return null;
    const idPengguna = await SesiPengguna.validateToken(this.ctx.db, token);
    return idPengguna ? this.loadSessionUser(idPengguna, token) : null;
  }

  /** processLogout() + handleSessionDeletion() (UC12). */
  async processLogout(user: SessionUser): Promise<void> {
    await SesiPengguna.hapusSesi(this.ctx.db, user.token);
    await Pengguna.logout(this.ctx.db, user.idPengguna);
  }

  /** getUserInfo() untuk halaman profil, termasuk status kemitraan akun restoran. */
  async getProfil(user: SessionUser) {
    const pengajuan =
      user.role === 'RESTORAN' && !user.restoranId
        ? await PengajuanMitra.terakhirMilik(this.ctx.db, user.idPengguna)
        : null;
    const restoran = user.restoranId ? await Restoran.getDetailRestoran(this.ctx.db, user.restoranId) : null;
    return {
      ...this.publicUser(user),
      restoran: restoran ? { restoranId: restoran.restoran_id, namaRestoran: restoran.nama_restoran } : null,
      pengajuan: pengajuan
        ? { idPengajuan: pengajuan.id_pengajuan, status: pengajuan.status, alasanPenolakan: pengajuan.alasan_penolakan,
            namaRestoran: pengajuan.nama_restoran }
        : null,
    };
  }

  /** Ubah profil (iterasi 2): nama dan nomor telepon. */
  async ubahProfil(user: SessionUser, input: { nama?: unknown; noHp?: unknown }) {
    const nama = teks(input.nama);
    const noHp = normalisasiNoHp(teks(input.noHp));
    const galat: Record<string, string> = {};
    if (nama.length < 2) galat.nama = 'Nama lengkap wajib diisi';
    if (!NO_HP_RE.test(noHp)) galat.noHp = 'Nomor telepon tidak valid (contoh: 081234567890)';
    if (Object.keys(galat).length) throw badRequest('Data profil belum valid', { fields: galat });
    await this.ctx.db.tx(async (q) => {
      if (await ProfilAkun.noHpDipakaiOrangLain(q, user.idPengguna, noHp)) {
        throw conflict('Nomor telepon sudah dipakai akun lain', { fields: { noHp: 'Nomor telepon sudah terdaftar' } });
      }
      await ProfilAkun.ubahProfil(q, user.idPengguna, nama, noHp);
    });
    const baru = await this.validateSession(user.token);
    return baru ? this.getProfil(baru) : null;
  }

  /** Ganti kata sandi (iterasi 2): sesi lain diakhiri, sesi saat ini dipertahankan. */
  async gantiKataSandi(user: SessionUser, input: { lama?: unknown; baru?: unknown; konfirmasi?: unknown }) {
    const lama = typeof input.lama === 'string' ? input.lama : '';
    const baru = typeof input.baru === 'string' ? input.baru : '';
    const konfirmasi = typeof input.konfirmasi === 'string' ? input.konfirmasi : '';
    if (!(await ProfilAkun.cocokkanKataSandi(this.ctx.db, user.idPengguna, lama))) {
      throw badRequest('Kata sandi lama salah', { fields: { lama: 'Kata sandi lama salah' } });
    }
    this.validasiKataSandiBaru(baru, konfirmasi);
    await ProfilAkun.simpanKataSandi(this.ctx.db, user.idPengguna, baru);
    await ProfilAkun.akhiriSesiLain(this.ctx.db, user.idPengguna, user.token);
    return { ok: true };
  }

  private validasiKataSandiBaru(baru: string, konfirmasi: string): void {
    if (baru.length < 8 || baru !== konfirmasi) {
      throw badRequest('Konfirmasi kata sandi tidak cocok atau kata sandi minimal 8 karakter', {
        fields: { baru: 'Minimal 8 karakter dan harus sama dengan konfirmasi' },
      });
    }
  }

  /**
   * Lupa kata sandi (iterasi 2): membuat token reset dan "mengirim" email. Respons selalu sama
   * agar tidak membocorkan email mana yang terdaftar. Pada mode simulasi, tautan ikut dikembalikan.
   */
  async lupaKataSandi(input: { email?: unknown }) {
    const email = teks(input.email).toLowerCase();
    if (!EMAIL_RE.test(email)) throw badRequest('Format email tidak valid', { fields: { email: 'Format email tidak valid' } });
    const akun = await ResetKataSandi.getByEmail(this.ctx.db, email);
    let tautan: string | null = null;
    if (akun) {
      const token = await ResetKataSandi.buat(this.ctx.db, akun.id_pengguna);
      tautan = `#/reset-kata-sandi?token=${token}`;
      await this.ctx.email.kirimEmail({
        penerima: email,
        jenis: 'RESET_KATA_SANDI',
        subjek: 'Atur ulang kata sandi antri.in',
        isiPesan: `Halo ${akun.nama}, buka tautan berikut dalam 30 menit untuk mengatur ulang kata sandi:\n${tautan}`,
      });
    }
    return {
      pesan: 'Jika email terdaftar, tautan atur ulang kata sandi telah dikirim.',
      tautanSimulasi: this.ctx.config.emailSimulasi ? tautan : null,
    };
  }

  /** Atur ulang kata sandi memakai token; seluruh sesi lama diakhiri. */
  async resetKataSandi(input: { token?: unknown; baru?: unknown; konfirmasi?: unknown }) {
    const baru = typeof input.baru === 'string' ? input.baru : '';
    const konfirmasi = typeof input.konfirmasi === 'string' ? input.konfirmasi : '';
    this.validasiKataSandiBaru(baru, konfirmasi);
    const idPengguna = await ResetKataSandi.pakai(this.ctx.db, teks(input.token));
    if (!idPengguna) throw notFound('Tautan atur ulang tidak berlaku atau sudah kedaluwarsa');
    await ProfilAkun.simpanKataSandi(this.ctx.db, idPengguna, baru);
    await ProfilAkun.akhiriSesiLain(this.ctx.db, idPengguna, null);
    return { ok: true };
  }

  publicUser(u: SessionUser) {
    return {
      idPengguna: u.idPengguna,
      nama: u.nama,
      email: u.email,
      noHp: u.noHp,
      role: u.role,
      pelangganId: u.pelangganId,
      restoranId: u.restoranId,
    };
  }

  private async loadSessionUser(idPengguna: string, token: string): Promise<SessionUser | null> {
    const akun = await Pengguna.getUserInfo(this.ctx.db, idPengguna);
    if (!akun) return null;
    const pelanggan = akun.role === 'PELANGGAN' ? await Pelanggan.getByAkun(this.ctx.db, idPengguna) : null;
    const restoran = akun.role === 'RESTORAN' ? await Restoran.getByAkun(this.ctx.db, idPengguna) : null;
    return {
      idPengguna,
      nama: akun.nama,
      email: akun.email,
      noHp: akun.no_hp,
      role: akun.role,
      token,
      pelangganId: pelanggan?.pelanggan_id ?? null,
      restoranId: restoran?.restoran_id ?? null,
    };
  }
}
