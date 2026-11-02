// C05 Keranjang. Di klien keranjang disimpan di zustand (store/keranjangStore.ts);
// di server keranjang dibangun ulang dari item permintaan supaya harga/stok tidak dipercaya dari klien.
import { Menu } from './Menu.js';
import type { Db } from '../db/tx.js';
import { AppError } from '../errors.js';

export interface ItemKeranjang { menu: Menu; jumlah: number }

export class Keranjang {
  private idKeranjang = '';
  private daftarMenu: ItemKeranjang[] = [];
  private totalEstimasiHarga = 0;

  getDaftarMenu() { return this.daftarMenu; }

  tambahItem(menu: Menu, jumlah: number): void { // Algo-035
    const item = this.daftarMenu.find(i => i.menu.getMenuId() === menu.getMenuId());
    if (!item) this.daftarMenu.push({ menu, jumlah });
    else item.jumlah += jumlah;
    this.hitungTotal();
  }
  hapusItem(menuId: string): void { // Algo-036
    this.daftarMenu = this.daftarMenu.filter(i => i.menu.getMenuId() !== menuId);
    this.hitungTotal();
  }
  hitungTotal(): number { // Algo-037
    this.totalEstimasiHarga = this.daftarMenu.reduce((s, i) => s + i.menu.getHarga() * i.jumlah, 0);
    return this.totalEstimasiHarga;
  }
  kosongkanKeranjang(): void { // Algo-038
    this.daftarMenu = [];
    this.totalEstimasiHarga = 0;
  }

  static async dariPermintaan(items: { menuId: string; jumlah: number }[], restoranId: string, db: Db): Promise<Keranjang> {
    const k = new Keranjang();
    for (const it of items ?? []) {
      if (!Number.isInteger(it.jumlah) || it.jumlah <= 0) throw new AppError(400, 'ITEM_TIDAK_VALID', 'Jumlah item tidak valid');
      const m = await Menu.getInfoMenu(it.menuId, db);
      if (!m || m.getRestoranId() !== restoranId) throw new AppError(400, 'ITEM_TIDAK_VALID', 'Menu tidak ditemukan di restoran ini');
      k.tambahItem(m, it.jumlah);
    }
    return k;
  }
}
