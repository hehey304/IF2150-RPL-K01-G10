/**
 * ModelAkun (DPPL 2.3): Pengguna (C25), SesiPengguna (C29), Pelanggan (C01), Admin (C14).
 */
import bcrypt from 'bcryptjs';
import type { Queryable } from '../db/database.js';
import { generateId, generateToken } from '../utils/ids.js';

export type Role = 'PELANGGAN' | 'RESTORAN' | 'ADMIN';

export interface PenggunaRow {
  id_pengguna: string;
  username: string;
  email: string;
  no_hp: string | null;
  nama: string;
  role: Role;
  dibuat_pada: Date;
}

export const Pengguna = {
  /** saveCredentials(): mengenkripsi kata sandi dan menyimpan akun (Q-066). */
  async saveCredentials(
    q: Queryable,
    data: { nama: string; email: string; noHp: string | null; password: string; role: Role },
  ): Promise<PenggunaRow> {
    const id = generateId('USR');
    const hash = await bcrypt.hash(data.password, 10);
    const rows = await q.query<PenggunaRow>(
      `INSERT INTO pengguna (id_pengguna, username, email, no_hp, nama, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_pengguna, username, email, no_hp, nama, role, dibuat_pada`,
      [id, data.email, data.email, data.noHp, data.nama, hash, data.role],
    );
    return rows[0];
  },

  /** Memeriksa duplikasi email / nomor telepon (Q-067). */
  async isDuplikat(q: Queryable, email: string, noHp: string | null): Promise<{ email: boolean; noHp: boolean }> {
    const rows = await q.query<{ email: string; no_hp: string | null }>(
      `SELECT email, no_hp FROM pengguna WHERE email = $1 OR username = $1 OR ($2::text IS NOT NULL AND no_hp = $2)`,
      [email, noHp],
    );
    return { email: rows.some((r) => r.email === email), noHp: noHp !== null && rows.some((r) => r.no_hp === noHp) };
  },

  /** validateAccount(): mencocokkan kredensial (Q-063). */
  async validateAccount(q: Queryable, identitas: string, password: string): Promise<PenggunaRow | null> {
    const rows = await q.query<PenggunaRow & { password_hash: string }>(
      `SELECT id_pengguna, username, email, no_hp, nama, role, dibuat_pada, password_hash
       FROM pengguna WHERE username = $1 OR email = $1`,
      [identitas],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
    const { password_hash: _ignored, ...rest } = user;
    return rest;
  },

  /** getUserInfo() (Q-065). */
  async getUserInfo(q: Queryable, id: string): Promise<PenggunaRow | null> {
    const rows = await q.query<PenggunaRow>(
      `SELECT id_pengguna, username, email, no_hp, nama, role, dibuat_pada FROM pengguna WHERE id_pengguna = $1`,
      [id],
    );
    return rows[0] ?? null;
  },

  /** logout(): mencatat waktu logout terakhir (Q-064). */
  async logout(q: Queryable, id: string): Promise<void> {
    await q.query(`UPDATE pengguna SET terakhir_logout = NOW() WHERE id_pengguna = $1`, [id]);
  },
};

export const SesiPengguna = {
  /** Menerbitkan sesi baru (Q-068). */
  async buat(q: Queryable, idPengguna: string, jam: number): Promise<{ token: string; kedaluwarsa: Date }> {
    const token = generateToken();
    const rows = await q.query<{ waktu_kedaluwarsa: Date }>(
      `INSERT INTO sesi_pengguna (id_sesi, id_pengguna, token, status_aktif, waktu_login, waktu_kedaluwarsa)
       VALUES ($1, $2, $3, true, NOW(), NOW() + make_interval(hours => $4::int)) RETURNING waktu_kedaluwarsa`,
      [generateId('SES'), idPengguna, token, jam],
    );
    return { token, kedaluwarsa: rows[0].waktu_kedaluwarsa };
  },

  /** validateToken(): sesi aktif dan belum kedaluwarsa (Q-071). Mengembalikan id pengguna. */
  async validateToken(q: Queryable, token: string): Promise<string | null> {
    const rows = await q.query<{ id_pengguna: string }>(
      `SELECT id_pengguna FROM sesi_pengguna WHERE token = $1 AND status_aktif = true AND waktu_kedaluwarsa > NOW()`,
      [token],
    );
    return rows[0]?.id_pengguna ?? null;
  },

  /** hapusSesi() (Q-070). */
  async hapusSesi(q: Queryable, token: string): Promise<boolean> {
    const rows = await q.query(
      `UPDATE sesi_pengguna SET status_aktif = false WHERE token = $1 AND status_aktif = true RETURNING id_sesi`,
      [token],
    );
    return rows.length > 0;
  },
};

export interface PelangganRow {
  pelanggan_id: string;
  nama: string;
  no_hp: string | null;
  id_akun: string;
  email: string;
}

export const Pelanggan = {
  /** accountRegister(): membuat profil pelanggan (Q-002). */
  async accountRegister(q: Queryable, akun: PenggunaRow): Promise<PelangganRow> {
    const rows = await q.query<PelangganRow>(
      `INSERT INTO pelanggan (pelanggan_id, nama, no_hp, id_akun, email) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [generateId('PLG'), akun.nama, akun.no_hp, akun.id_pengguna, akun.email],
    );
    return rows[0];
  },

  /** getDetails() berdasarkan id akun. */
  async getByAkun(q: Queryable, idAkun: string): Promise<PelangganRow | null> {
    const rows = await q.query<PelangganRow>(`SELECT * FROM pelanggan WHERE id_akun = $1`, [idAkun]);
    return rows[0] ?? null;
  },
};

export const Admin = {
  async accountRegister(q: Queryable, akun: PenggunaRow): Promise<void> {
    await q.query(`INSERT INTO admin (id_admin, nama, email_admin, id_akun) VALUES ($1, $2, $3, $4)`, [
      generateId('ADM'),
      akun.nama,
      akun.email,
      akun.id_pengguna,
    ]);
  },
};

/** Pembaruan profil & kata sandi (iterasi 2, melengkapi I-03 "Ubah profil" dan "Keamanan akun"). */
export const ProfilAkun = {
  async ubahProfil(q: Queryable, idPengguna: string, nama: string, noHp: string | null): Promise<void> {
    await q.query(`UPDATE pengguna SET nama = $2, no_hp = $3 WHERE id_pengguna = $1`, [idPengguna, nama, noHp]);
    await q.query(`UPDATE pelanggan SET nama = $2, no_hp = $3 WHERE id_akun = $1`, [idPengguna, nama, noHp]);
    await q.query(`UPDATE admin SET nama = $2 WHERE id_akun = $1`, [idPengguna, nama]);
  },

  async noHpDipakaiOrangLain(q: Queryable, idPengguna: string, noHp: string): Promise<boolean> {
    const rows = await q.query(`SELECT 1 FROM pengguna WHERE no_hp = $1 AND id_pengguna <> $2`, [noHp, idPengguna]);
    return rows.length > 0;
  },

  async cocokkanKataSandi(q: Queryable, idPengguna: string, kataSandi: string): Promise<boolean> {
    const rows = await q.query<{ password_hash: string }>(`SELECT password_hash FROM pengguna WHERE id_pengguna = $1`, [idPengguna]);
    return !!rows[0] && bcrypt.compare(kataSandi, rows[0].password_hash);
  },

  async simpanKataSandi(q: Queryable, idPengguna: string, kataSandi: string): Promise<void> {
    await q.query(`UPDATE pengguna SET password_hash = $2 WHERE id_pengguna = $1`, [idPengguna, await bcrypt.hash(kataSandi, 10)]);
  },

  /** Mengakhiri semua sesi lain (setelah kata sandi diganti). */
  async akhiriSesiLain(q: Queryable, idPengguna: string, tokenDipertahankan: string | null): Promise<void> {
    await q.query(
      `UPDATE sesi_pengguna SET status_aktif = false WHERE id_pengguna = $1 AND ($2::text IS NULL OR token <> $2)`,
      [idPengguna, tokenDipertahankan],
    );
  },
};

/** Token sekali pakai untuk "Lupa kata sandi" (berlaku 30 menit). */
export const ResetKataSandi = {
  async buat(q: Queryable, idPengguna: string): Promise<string> {
    const token = generateToken();
    await q.query(`UPDATE reset_kata_sandi SET dipakai = true WHERE id_pengguna = $1 AND NOT dipakai`, [idPengguna]);
    await q.query(
      `INSERT INTO reset_kata_sandi (token, id_pengguna, kedaluwarsa) VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [token, idPengguna],
    );
    return token;
  },

  /** Memakai token: mengembalikan id pengguna bila token sah, lalu menandainya terpakai. */
  async pakai(q: Queryable, token: string): Promise<string | null> {
    const rows = await q.query<{ id_pengguna: string }>(
      `UPDATE reset_kata_sandi SET dipakai = true WHERE token = $1 AND NOT dipakai AND kedaluwarsa > NOW()
       RETURNING id_pengguna`,
      [token],
    );
    return rows[0]?.id_pengguna ?? null;
  },

  async getByEmail(q: Queryable, email: string): Promise<{ id_pengguna: string; nama: string } | null> {
    const rows = await q.query<{ id_pengguna: string; nama: string }>(
      `SELECT id_pengguna, nama FROM pengguna WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  },
};
