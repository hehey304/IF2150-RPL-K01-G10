/**
 * KelolaMenuController (C24): menambah, mengubah, menghapus menu, dan memperbarui stok (UC08).
 */
import type { AppContext, SessionUser } from '../context.js';
import { Menu, type MenuInput } from '../models/menu.js';
import { eventBus } from '../realtime/eventBus.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { hapusBerkas } from '../utils/unggah.js';
import { bilanganCacah, teks } from '../utils/validasi.js';

export class KelolaMenuController {
  constructor(private ctx: AppContext) {}

  private restoranId(user: SessionUser): string {
    if (!user.restoranId) throw forbidden('Akun restoran belum terverifikasi sebagai mitra');
    return user.restoranId;
  }

  validasiMenu(input: Record<string, unknown>): MenuInput {
    const namaMenu = teks(input.namaMenu);
    const harga = bilanganCacah(input.harga);
    const stok = bilanganCacah(input.stok);
    const galat: Record<string, string> = {};
    if (namaMenu.length < 2 || namaMenu.length > 80) galat.namaMenu = 'Nama menu 2 - 80 karakter';
    if (harga === null || harga < 500 || harga > 10_000_000) galat.harga = 'Harga harus angka bulat Rp500 - Rp10.000.000';
    if (stok === null || stok > 9_999) galat.stok = 'Stok harus angka bulat 0 - 9999';
    if (Object.keys(galat).length) throw badRequest('Data menu belum valid', { fields: galat });
    return {
      namaMenu,
      deskripsiMenu: teks(input.deskripsiMenu).slice(0, 300),
      kategoriMenu: teks(input.kategoriMenu).slice(0, 40) || 'Lainnya',
      harga: harga!,
      stok: stok!,
    };
  }

  /** handleFetchMenu(). */
  async handleFetchMenu(user: SessionUser) {
    return Menu.getDaftarMenu(this.ctx.db, this.restoranId(user));
  }

  /** handleAddMenu(). */
  async handleAddMenu(user: SessionUser, input: Record<string, unknown>) {
    const restoranId = this.restoranId(user);
    const menu = await Menu.tambahMenu(this.ctx.db, restoranId, this.validasiMenu(input));
    eventBus.antreanBerubah(restoranId, 'menu');
    return menu;
  }

  /** handleUpdateMenu(). */
  async handleUpdateMenu(user: SessionUser, menuId: string, input: Record<string, unknown>) {
    const restoranId = this.restoranId(user);
    const menu = await Menu.updateInfoMenu(this.ctx.db, restoranId, menuId, this.validasiMenu(input));
    if (!menu) throw notFound('Menu tidak ditemukan');
    eventBus.antreanBerubah(restoranId, 'menu');
    return menu;
  }

  /** Memperbarui stok saja (I-17-05). */
  async handleUpdateStok(user: SessionUser, menuId: string, stokInput: unknown) {
    const restoranId = this.restoranId(user);
    const stok = bilanganCacah(stokInput);
    if (stok === null || stok > 9_999) throw badRequest('Stok harus angka bulat 0 - 9999');
    const menu = await Menu.updateStok(this.ctx.db, restoranId, menuId, stok);
    if (!menu) throw notFound('Menu tidak ditemukan');
    eventBus.antreanBerubah(restoranId, 'menu');
    return menu;
  }

  /** handleDeleteMenu(). */
  async handleDeleteMenu(user: SessionUser, menuId: string) {
    const restoranId = this.restoranId(user);
    if (!(await Menu.hapusMenu(this.ctx.db, restoranId, menuId))) throw notFound('Menu tidak ditemukan');
    eventBus.antreanBerubah(restoranId, 'menu');
    return { menuId, dihapus: true };
  }

  /** Unggah foto menu (iterasi 2). */
  async handleUploadFoto(user: SessionUser, menuId: string, berkas: { filename: string } | undefined) {
    const restoranId = this.restoranId(user);
    if (!berkas) throw badRequest('Pilih foto terlebih dahulu');
    const lama = await Menu.aturFoto(this.ctx.db, restoranId, menuId, berkas.filename);
    if (lama === undefined) {
      hapusBerkas(this.ctx.config.uploadDir, berkas.filename);
      throw notFound('Menu tidak ditemukan');
    }
    hapusBerkas(this.ctx.config.uploadDir, lama);
    eventBus.antreanBerubah(restoranId, 'menu');
    return Menu.getInfoMenu(this.ctx.db, menuId);
  }

  async getFoto(menuId: string) {
    return Menu.getFoto(this.ctx.db, menuId);
  }
}
