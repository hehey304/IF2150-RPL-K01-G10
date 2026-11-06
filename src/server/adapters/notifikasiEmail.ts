/**
 * NotifikasiEmail (C15, Integrasi Eksternal).
 * Implementasi bawaan tidak mengirim email sungguhan: pesan dicatat ke tabel log_notifikasi
 * (Q-049) dan ke konsol server, sehingga aplikasi dapat dijalankan tanpa akun layanan email.
 */
import type { Queryable } from '../db/database.js';

export interface Email {
  penerima: string;
  jenis: 'MITRA_DITERIMA' | 'MITRA_DITOLAK' | 'RESTORAN_DIHAPUS';
  subjek: string;
  isiPesan: string;
}

export class NotifikasiEmail {
  constructor(
    private db: Queryable,
    private cetakKeKonsol = true,
  ) {}

  async kirimEmail(email: Email): Promise<void> {
    let status = 'TERKIRIM';
    try {
      if (this.cetakKeKonsol) {
        console.log(`[email] -> ${email.penerima} | ${email.subjek}\n${email.isiPesan}\n`);
      }
    } catch {
      status = 'GAGAL';
    }
    await this.db.query(
      `INSERT INTO log_notifikasi (penerima, jenis, subjek, isi_pesan, status, waktu_kirim)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [email.penerima, email.jenis, email.subjek, email.isiPesan, status],
    );
  }
}
