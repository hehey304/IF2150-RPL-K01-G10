/**
 * Data pengajuan mitra (dipakai PengajuanMitraController C12) dan DokumenVerifikasi (C13).
 * Bagian dari ModelRestoran pada DPPL 2.3.
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export type StatusPengajuan = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

export interface MenuPengajuan {
  namaMenu: string;
  harga: number;
}

export interface PengajuanRow {
  id_pengajuan: string;
  id_pengguna: string | null;
  nama_restoran: string;
  kategori: string;
  lokasi: string;
  alamat: string;
  email_kontak: string;
  no_hp: string;
  daftar_menu: MenuPengajuan[];
  status: StatusPengajuan;
  tgl_pengajuan: Date;
  alasan_penolakan: string | null;
  restoran_id: string | null;
}

export interface DokumenRow {
  id_dokumen: string;
  id_pengajuan: string;
  jenis_dokumen: string;
  nama_file: string;
  path_file: string;
  mime_type: string;
}

export const JENIS_DOKUMEN = {
  foto: { label: 'Foto restoran', wajib: false, mime: ['image/jpeg', 'image/png'] },
  nib: { label: 'NIB', wajib: true, mime: ['application/pdf', 'image/jpeg', 'image/png'] },
  izinUsaha: { label: 'Izin usaha', wajib: true, mime: ['application/pdf', 'image/jpeg', 'image/png'] },
  sertifikatHalal: { label: 'Sertifikat halal', wajib: false, mime: ['application/pdf', 'image/jpeg', 'image/png'] },
} as const;
export type JenisDokumen = keyof typeof JENIS_DOKUMEN;
export const MAKS_UKURAN_DOKUMEN = 5 * 1024 * 1024;

export const PengajuanMitra = {
  /** simpanPengajuan() (Q-042). */
  async simpan(
    q: Queryable,
    d: Omit<PengajuanRow, 'id_pengajuan' | 'status' | 'tgl_pengajuan' | 'alasan_penolakan' | 'restoran_id'>,
  ): Promise<string> {
    const id = generateId('PGJ');
    await q.query(
      `INSERT INTO pengajuan_mitra (id_pengajuan, id_pengguna, nama_restoran, kategori, lokasi, alamat, email_kontak,
                                    no_hp, daftar_menu, status, tgl_pengajuan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'MENUNGGU', NOW())`,
      [id, d.id_pengguna, d.nama_restoran, d.kategori, d.lokasi, d.alamat, d.email_kontak, d.no_hp,
        JSON.stringify(d.daftar_menu)],
    );
    return id;
  },

  /** Q-047. */
  async getById(q: Queryable, id: string): Promise<PengajuanRow | null> {
    const rows = await q.query<PengajuanRow>(`SELECT * FROM pengajuan_mitra WHERE id_pengajuan = $1`, [id]);
    return rows[0] ?? null;
  },

  async terakhirMilik(q: Queryable, idPengguna: string): Promise<PengajuanRow | null> {
    const rows = await q.query<PengajuanRow>(
      `SELECT * FROM pengajuan_mitra WHERE id_pengguna = $1 ORDER BY tgl_pengajuan DESC LIMIT 1`,
      [idPengguna],
    );
    return rows[0] ?? null;
  },

  async daftar(q: Queryable): Promise<PengajuanRow[]> {
    return q.query<PengajuanRow>(
      `SELECT * FROM pengajuan_mitra ORDER BY (status = 'MENUNGGU') DESC, tgl_pengajuan DESC`,
    );
  },

  /** setujui() (Q-043). */
  async setujui(q: Queryable, id: string): Promise<PengajuanRow | null> {
    const rows = await q.query<PengajuanRow>(
      `UPDATE pengajuan_mitra SET status = 'DISETUJUI' WHERE id_pengajuan = $1 AND status = 'MENUNGGU' RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },

  async tautkanRestoran(q: Queryable, id: string, restoranId: string): Promise<void> {
    await q.query(`UPDATE pengajuan_mitra SET restoran_id = $2 WHERE id_pengajuan = $1`, [id, restoranId]);
  },

  /** tolak(alasan) (Q-045). */
  async tolak(q: Queryable, id: string, alasan: string): Promise<PengajuanRow | null> {
    const rows = await q.query<PengajuanRow>(
      `UPDATE pengajuan_mitra SET status = 'DITOLAK', alasan_penolakan = $2
       WHERE id_pengajuan = $1 AND status = 'MENUNGGU' RETURNING *`,
      [id, alasan],
    );
    return rows[0] ?? null;
  },
};

export const DokumenVerifikasi = {
  /** unggahDokumen() (Q-046). */
  async unggahDokumen(
    q: Queryable,
    d: { idPengajuan: string; jenis: string; namaFile: string; path: string; mime: string },
  ): Promise<void> {
    await q.query(
      `INSERT INTO dokumen_verifikasi (id_dokumen, id_pengajuan, jenis_dokumen, nama_file, path_file, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [generateId('DOK'), d.idPengajuan, d.jenis, d.namaFile, d.path, d.mime],
    );
  },

  /** validasiFormat(): tipe file dan ukuran maksimum 5 MB. */
  validasiFormat(jenis: JenisDokumen, mime: string, ukuran: number): string | null {
    const aturan = JENIS_DOKUMEN[jenis];
    if (!(aturan.mime as readonly string[]).includes(mime)) {
      return `${aturan.label} harus berformat ${aturan.mime.map((m) => m.split('/')[1].toUpperCase()).join('/')}`;
    }
    if (ukuran > MAKS_UKURAN_DOKUMEN) return `${aturan.label} melebihi ukuran maksimum 5 MB`;
    return null;
  },

  /** Q-048. */
  async daftar(q: Queryable, idPengajuan: string): Promise<DokumenRow[]> {
    return q.query<DokumenRow>(`SELECT * FROM dokumen_verifikasi WHERE id_pengajuan = $1`, [idPengajuan]);
  },

  async getById(q: Queryable, idDokumen: string): Promise<DokumenRow | null> {
    const rows = await q.query<DokumenRow>(`SELECT * FROM dokumen_verifikasi WHERE id_dokumen = $1`, [idDokumen]);
    return rows[0] ?? null;
  },
};
