// Handler HTTP UC02 (boundary -> Pelanggan/Pesanan). Tidak ada logika bisnis di sini.
import type { Request, Response } from 'express';
import { Pelanggan } from '../models/Pelanggan.js';
import { Pesanan } from '../models/Pesanan.js';
import { pool } from '../db/tx.js';
import { AppError } from '../errors.js';

const SLOT = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
// ASUMSI: middleware auth mengisi req.user.id (= pengguna.id_pengguna). Sesuaikan dengan middleware/auth.ts.
// Bentuk payload token bisa berbeda-beda; coba beberapa nama field umum.
const uid = (req: Request): string => {
  // Mendukung req.auth (yang digunakan middleware Anda) maupun req.user
  const u = (req as any).auth ?? (req as any).user; 
  const id = u?.id ?? u?.id_pengguna ?? u?.idPengguna ?? u?.userId ?? u?.sub;
  if (!id) {
    console.error('[uid] req.auth / req.user tidak berisi id pengguna. Isi =', u);
    throw new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Sesi tidak valid, silakan login ulang');
  }
  return String(id);
};

function gagal(res: Response, e: any) {
  if (e instanceof AppError) return res.status(e.status).json({ code: e.code, message: e.message, data: e.data });
  console.error(e);
  return res.status(500).json({ code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
}
export const pilihMetodeBayar = async (req: Request, res: Response) => {
  try { res.status(201).json(await Pelanggan.pilihMetodeBayar(uid(req), req.body)); } catch (e) { gagal(res, e); }
};
export const konfirmasiPembayaran = async (req: Request, res: Response) => {
  try { res.json(await Pelanggan.konfirmasiPembayaran(uid(req), String(req.params.idPembayaran))); } catch (e) { gagal(res, e); }
};
export const lihatPesanan = async (req: Request, res: Response) => {
  try { res.json(await Pelanggan.lihatPesanan(uid(req), String(req.params.id))); } catch (e) { gagal(res, e); }
};
export const slotBooking = async (req: Request, res: Response) => {
  try { res.json(await Pesanan.slotTersedia(String(req.query.restoranId), String(req.query.tanggal), SLOT, pool)); } catch (e) { gagal(res, e); }
};

// SEMENTARA untuk UC02 (daftar menu sebuah restoran); pindahkan ke modul Restoran/UC01 bila sudah ada.
export const menuRestoran = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const r = (await pool.query('SELECT restoran_id, nama_restoran FROM restoran WHERE restoran_id = $1 AND status_aktif = true AND dihapus_pada IS NULL', [id])).rows[0];
    if (!r) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Restoran tidak ditemukan');
    const m = (await pool.query(
      'SELECT menu_id, nama_menu, deskripsi_menu, harga, stok FROM menu WHERE restoran_id = $1 AND aktif = true ORDER BY nama_menu', [id])).rows;
    res.json({ restoranId: r.restoran_id, namaRestoran: r.nama_restoran,
      menu: m.map((x: any) => ({ menuId: x.menu_id, namaMenu: x.nama_menu, deskripsiMenu: x.deskripsi_menu, harga: Number(x.harga), stok: x.stok })) });
  } catch (e) { gagal(res, e); }
};