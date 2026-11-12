/**
 * Bagian ModelRestoran (DPPL 2.3): Menu (C03).
 */
import type { Queryable } from '../db/database.js';
import { generateId } from '../utils/ids.js';

export interface MenuRow {
  menu_id: string;
  restoran_id: string;
  nama_menu: string;
  deskripsi_menu: string;
  kategori_menu: string;
  harga: number;
  stok: number;
  terjual: number;
  aktif: boolean;
  foto_path: string | null;
}

export interface MenuInput {
  namaMenu: string;
  deskripsiMenu: string;
  kategoriMenu: string;
  harga: number;
  stok: number;
}

export const Menu = {
  /** getMenu() / getDaftarMenu() (Q-007). Menu habis tetap ditampilkan dengan badge "Habis". */
  async getDaftarMenu(q: Queryable, restoranId: string): Promise<MenuRow[]> {
    return q.query<MenuRow>(
      `SELECT * FROM menu WHERE restoran_id = $1 AND aktif = true ORDER BY terjual DESC, nama_menu ASC`,
      [restoranId],
    );
  },

  /** getInfoMenu() (Q-012). */
  async getInfoMenu(q: Queryable, menuId: string): Promise<MenuRow | null> {
    const rows = await q.query<MenuRow>(`SELECT * FROM menu WHERE menu_id = $1 AND aktif = true`, [menuId]);
    return rows[0] ?? null;
  },

  /** isTersedia() / cekStok(). */
  isTersedia(menu: Pick<MenuRow, 'stok' | 'aktif'>, jumlah: number): boolean {
    return menu.aktif && jumlah > 0 && menu.stok >= jumlah;
  },

  /** kurangiStok(): pengurangan atomik, gagal bila stok tidak cukup (Q-014). */
  async kurangiStok(q: Queryable, menuId: string, jumlah: number): Promise<boolean> {
    const rows = await q.query(
      `UPDATE menu SET stok = stok - $2, terjual = terjual + $2 WHERE menu_id = $1 AND aktif = true AND stok >= $2
       RETURNING menu_id`,
      [menuId, jumlah],
    );
    return rows.length > 0;
  },

  /** tambahMenu() (Q-015 / Q-060). */
  async tambahMenu(q: Queryable, restoranId: string, m: MenuInput): Promise<MenuRow> {
    const rows = await q.query<MenuRow>(
      `INSERT INTO menu (menu_id, restoran_id, nama_menu, deskripsi_menu, kategori_menu, harga, stok, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [generateId('MNU'), restoranId, m.namaMenu, m.deskripsiMenu, m.kategoriMenu, m.harga, m.stok],
    );
    return rows[0];
  },

  /** updateInfoMenu() + updateStok() (Q-061). */
  async updateInfoMenu(q: Queryable, restoranId: string, menuId: string, m: MenuInput): Promise<MenuRow | null> {
    const rows = await q.query<MenuRow>(
      `UPDATE menu SET nama_menu = $3, deskripsi_menu = $4, kategori_menu = $5, harga = $6, stok = $7
       WHERE menu_id = $1 AND restoran_id = $2 AND aktif = true RETURNING *`,
      [menuId, restoranId, m.namaMenu, m.deskripsiMenu, m.kategoriMenu, m.harga, m.stok],
    );
    return rows[0] ?? null;
  },

  /** updateStok() (Q-016). */
  async updateStok(q: Queryable, restoranId: string, menuId: string, stok: number): Promise<MenuRow | null> {
    const rows = await q.query<MenuRow>(
      `UPDATE menu SET stok = $3 WHERE menu_id = $1 AND restoran_id = $2 AND aktif = true RETURNING *`,
      [menuId, restoranId, stok],
    );
    return rows[0] ?? null;
  },

  /** hapusMenu(): soft delete agar riwayat pesanan tetap utuh (Q-018 / Q-062). */
  async hapusMenu(q: Queryable, restoranId: string, menuId: string): Promise<boolean> {
    const rows = await q.query(
      `UPDATE menu SET aktif = false, stok = 0 WHERE menu_id = $1 AND restoran_id = $2 AND aktif = true RETURNING menu_id`,
      [menuId, restoranId],
    );
    return rows.length > 0;
  },

  /** Mengganti foto menu (iterasi 2); mengembalikan path foto lama. */
  async aturFoto(q: Queryable, restoranId: string, menuId: string, path: string): Promise<string | null | undefined> {
    const lama = await q.query<{ foto_path: string | null }>(
      `SELECT foto_path FROM menu WHERE menu_id = $1 AND restoran_id = $2 AND aktif`,
      [menuId, restoranId],
    );
    if (!lama[0]) return undefined;
    await q.query(`UPDATE menu SET foto_path = $2 WHERE menu_id = $1`, [menuId, path]);
    return lama[0].foto_path;
  },

  async getFoto(q: Queryable, menuId: string): Promise<string | null> {
    const rows = await q.query<{ foto_path: string | null }>(`SELECT foto_path FROM menu WHERE menu_id = $1`, [menuId]);
    return rows[0]?.foto_path ?? null;
  },
};
