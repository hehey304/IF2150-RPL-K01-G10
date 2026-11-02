// C03 Menu (bagian UC02): getInfoMenu, cekStok (Algo-020), kurangiStok (Algo-021), isTersedia
import type { Db } from '../db/tx.js';

export class Menu {
  constructor(
    private menuId: string,
    private namaMenu: string,
    private harga: number,
    private stok: number,
    private restoranId: string,
  ) {}
  getMenuId() { return this.menuId; }
  getNamaMenu() { return this.namaMenu; }
  getHarga() { return this.harga; }
  getRestoranId() { return this.restoranId; }

  // Hanya menu aktif.
  static async getInfoMenu(menuId: string, db: Db): Promise<Menu | null> {
    const r = await db.query(
      'SELECT menu_id, nama_menu, harga, stok, restoran_id FROM menu WHERE menu_id = $1 AND aktif = true', [menuId]);
    const x = r.rows[0];
    return x ? new Menu(x.menu_id, x.nama_menu, Number(x.harga), x.stok, x.restoran_id) : null;
  }

  async cekStok(db: Db): Promise<number> { // Q-013
    const r = await db.query('SELECT stok FROM menu WHERE menu_id = $1 AND aktif = true', [this.menuId]);
    this.stok = r.rows[0]?.stok ?? 0;
    return this.stok;
  }

  async isTersedia(jumlah: number, db: Db): Promise<boolean> {
    return jumlah > 0 && (await this.cekStok(db)) >= jumlah;
  }

  async kurangiStok(jumlah: number, db: Db): Promise<boolean> { // Q-014
    if (jumlah <= 0) return false;
    const r = await db.query('UPDATE menu SET stok = stok - $2 WHERE menu_id = $1 AND stok >= $2', [this.menuId, jumlah]);
    if (r.rowCount === 0) return false;
    this.stok -= jumlah;
    return true;
  }
}
