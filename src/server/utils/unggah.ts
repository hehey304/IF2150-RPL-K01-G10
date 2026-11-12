/**
 * Unggah gambar tunggal (foto restoran & foto menu, iterasi 2) dan penyajiannya.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import multer from 'multer';
import { generateId } from './ids.js';
import { badRequest, notFound } from './errors.js';

export const MAKS_UKURAN_GAMBAR = 2 * 1024 * 1024;
const MIME_GAMBAR = ['image/jpeg', 'image/png', 'image/webp'];

/** Middleware multer untuk satu berkas gambar pada field `foto` (JPG/PNG/WEBP, maks. 2 MB). */
export function unggahGambar(uploadDir: string) {
  fs.mkdirSync(uploadDir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => cb(null, `${generateId('IMG')}${path.extname(file.originalname).toLowerCase().slice(0, 6)}`),
    }),
    limits: { fileSize: MAKS_UKURAN_GAMBAR, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (MIME_GAMBAR.includes(file.mimetype)) cb(null, true);
      else cb(badRequest('Foto harus berformat JPG, PNG, atau WEBP'));
    },
  }).single('foto');
}

/** Menghapus berkas lama di folder unggahan (abaikan bila tidak ada). */
export function hapusBerkas(uploadDir: string, nama: string | null | undefined): void {
  if (nama) fs.rm(path.join(uploadDir, path.basename(nama)), { force: true }, () => {});
}

/** Mengirim berkas gambar dari folder unggahan. */
export function kirimGambar(res: Response, uploadDir: string, nama: string | null): void {
  if (!nama) throw notFound('Foto tidak tersedia');
  const full = path.join(uploadDir, path.basename(nama));
  if (!fs.existsSync(full)) throw notFound('Foto tidak tersedia');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.sendFile(full);
}
