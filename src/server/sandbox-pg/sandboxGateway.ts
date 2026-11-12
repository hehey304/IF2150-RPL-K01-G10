/**
 * AntriPay Sandbox: payment gateway simulasi yang berperilaku seperti penyedia sungguhan.
 *
 * - Transaksi disimpan di tabel gateway_transaksi (bertahan walau server dimulai ulang).
 * - Pelanggan membayar di halaman checkout terpisah (/pg/checkout/:id):
 *     e-wallet -> pindai QR lalu setujui di simulator aplikasi e-wallet,
 *     virtual account -> transfer lewat simulator m-banking (nominal harus tepat),
 *     kartu -> hanya kartu uji sandbox + OTP 3-D Secure.
 * - Setiap perubahan status dikirim ke antri.in sebagai notifikasi bertanda tangan HMAC.
 * Tidak ada uang sungguhan yang berpindah dan data kartu tidak pernah disimpan (hanya 4 digit terakhir).
 */
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import type { Queryable } from '../db/database.js';
import type { TipePembayaran } from '../models/pembayaran.js';
import {
  tandaTanganNotifikasi,
  type NotifikasiGateway,
  type PaymentGatewayAdapter,
  type PenerimaNotifikasi,
  type StatusGateway,
  type TransaksiGateway,
} from '../adapters/paymentGatewayAdapter.js';
import { AppError, badRequest, conflict, notFound } from '../utils/errors.js';

type StatusInternal = StatusGateway | 'OTP';

export interface TransaksiSandbox {
  id_transaksi: string;
  order_id: string;
  kode_bayar: string;
  metode: TipePembayaran;
  jumlah: number;
  status: StatusInternal;
  kedaluwarsa: Date;
  detail: Record<string, unknown>;
  dibuat_pada: Date;
}

/** Kartu uji sandbox. Nomor lain ditolak agar data kartu sungguhan tidak pernah dimasukkan. */
export const KARTU_UJI: Record<string, { hasil: 'LUNAS' | 'GAGAL'; keterangan: string }> = {
  '4811111111111114': { hasil: 'LUNAS', keterangan: 'Visa - berhasil (OTP 112233)' },
  '5211111111111117': { hasil: 'LUNAS', keterangan: 'Mastercard - berhasil (OTP 112233)' },
  '4911111111111113': { hasil: 'GAGAL', keterangan: 'Visa - ditolak bank penerbit' },
};
export const OTP_UJI = '112233';

export function lolosLuhn(nomor: string): boolean {
  let total = 0;
  for (let i = 0; i < nomor.length; i++) {
    let d = Number(nomor[nomor.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return nomor.length >= 12 && total % 10 === 0;
}

const INSTRUKSI: Record<TipePembayaran, string> = {
  EWALLET: 'Pindai kode QR dengan aplikasi e-wallet, lalu setujui pembayaran.',
  VIRTUAL_ACCOUNT: 'Transfer tepat sesuai nominal ke nomor virtual account melalui m-banking/ATM.',
  KARTU: 'Masukkan data kartu di halaman aman AntriPay, lalu verifikasi OTP 3-D Secure.',
};

export class SandboxPaymentGateway implements PaymentGatewayAdapter {
  readonly nama = 'AntriPay Sandbox';
  readonly sandbox = true;
  private penerima: PenerimaNotifikasi[] = [];

  constructor(
    private db: Queryable,
    private kunciServer: string,
  ) {}

  onNotifikasi(penerima: PenerimaNotifikasi): void {
    this.penerima.push(penerima);
  }

  async buatTransaksi(d: { orderId: string; jumlah: number; tipe: TipePembayaran; kedaluwarsa: Date }): Promise<TransaksiGateway> {
    const id = crypto.randomBytes(12).toString('hex');
    const kodeBayar = d.tipe === 'VIRTUAL_ACCOUNT'
      ? `8808${String(crypto.randomInt(0, 1e12)).padStart(12, '0')}`
      : `APY-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    await this.db.query(
      `INSERT INTO gateway_transaksi (id_transaksi, order_id, kode_bayar, metode, jumlah, status, kedaluwarsa)
       VALUES ($1, $2, $3, $4, $5, 'MENUNGGU', $6)`,
      [id, d.orderId, kodeBayar, d.tipe, d.jumlah, d.kedaluwarsa],
    );
    return { kodeBayar, instruksi: INSTRUKSI[d.tipe], urlPembayaran: `/pg/checkout/${id}` };
  }

  private async ambil(kolom: 'id_transaksi' | 'kode_bayar', nilai: string): Promise<TransaksiSandbox> {
    const rows = await this.db.query<TransaksiSandbox>(`SELECT * FROM gateway_transaksi WHERE ${kolom} = $1`, [nilai]);
    if (!rows[0]) throw notFound('Transaksi tidak ditemukan');
    const t = rows[0];
    if ((t.status === 'MENUNGGU' || t.status === 'OTP') && new Date(t.kedaluwarsa).getTime() < Date.now()) {
      return this.ubahStatus(t, 'KEDALUWARSA');
    }
    return t;
  }

  /** Mengubah status, lalu mengirim notifikasi bertanda tangan ke antri.in (untuk status publik). */
  private async ubahStatus(t: TransaksiSandbox, status: StatusInternal, detail: Record<string, unknown> = {}): Promise<TransaksiSandbox> {
    const rows = await this.db.query<TransaksiSandbox>(
      `UPDATE gateway_transaksi SET status = $2, detail = detail || $3::jsonb, diperbarui = NOW()
       WHERE id_transaksi = $1 AND status = $4 RETURNING *`,
      [t.id_transaksi, status, JSON.stringify(detail), t.status],
    );
    const baru = rows[0];
    if (!baru) return this.ambil('id_transaksi', t.id_transaksi); // sudah diubah proses lain
    if (status !== 'OTP') {
      const n: NotifikasiGateway = {
        orderId: baru.order_id, kodeBayar: baru.kode_bayar, status, jumlah: baru.jumlah, waktu: new Date().toISOString(),
      };
      const tandaTangan = tandaTanganNotifikasi(n, this.kunciServer);
      for (const p of this.penerima) {
        try {
          await p(n, tandaTangan);
        } catch (err) {
          // Seperti penyedia sungguhan: kegagalan merchant memproses notifikasi tidak membatalkan transaksi.
          console.error('[antripay] notifikasi gagal diproses merchant:', (err as Error).message);
        }
      }
    }
    return baru;
  }

  async cekStatus(kodeBayar: string): Promise<StatusGateway> {
    const t = await this.ambil('kode_bayar', kodeBayar);
    return t.status === 'OTP' ? 'MENUNGGU' : t.status;
  }

  async batalkan(kodeBayar: string): Promise<void> {
    const t = await this.ambil('kode_bayar', kodeBayar).catch(() => null);
    if (t && (t.status === 'MENUNGGU' || t.status === 'OTP')) await this.ubahStatus(t, 'GAGAL', { alasan: 'Dibatalkan merchant' });
  }

  async kembalikanDana(kodeBayar: string): Promise<void> {
    const t = await this.ambil('kode_bayar', kodeBayar).catch(() => null);
    if (t?.status === 'LUNAS') await this.ubahStatus(t, 'DIKEMBALIKAN', { dikembalikanPada: new Date().toISOString() });
  }

  // ------------------------------------------------------------------
  // Operasi halaman checkout AntriPay (dipanggil dari router sandbox)
  // ------------------------------------------------------------------

  async infoCheckout(id: string) {
    const t = await this.ambil('id_transaksi', id);
    const sisaDetik = Math.max(0, Math.floor((new Date(t.kedaluwarsa).getTime() - Date.now()) / 1000));
    return {
      id: t.id_transaksi,
      merchant: 'antri.in',
      orderId: t.order_id,
      metode: t.metode,
      jumlah: t.jumlah,
      kodeBayar: t.kode_bayar,
      status: t.status,
      sisaDetik,
      kartu: t.detail.kartu ?? null,
      alasan: t.detail.alasan ?? null,
      kartuUji: t.metode === 'KARTU' ? Object.entries(KARTU_UJI).map(([nomor, k]) => ({ nomor, ...k })) : [],
    };
  }

  async qrSvg(id: string): Promise<string> {
    const t = await this.ambil('id_transaksi', id);
    if (t.metode !== 'EWALLET') throw badRequest('QR hanya untuk pembayaran e-wallet');
    return QRCode.toString(`ANTRIPAY://pay?kode=${t.kode_bayar}&jumlah=${t.jumlah}`, { type: 'svg', margin: 1, width: 240 });
  }

  private async harusMenunggu(id: string, metode: TipePembayaran): Promise<TransaksiSandbox> {
    const t = await this.ambil('id_transaksi', id);
    if (t.metode !== metode) throw badRequest('Metode pembayaran tidak sesuai');
    if (t.status === 'KEDALUWARSA') throw new AppError(410, 'Transaksi sudah kedaluwarsa');
    if (t.status !== 'MENUNGGU' && t.status !== 'OTP') throw conflict('Transaksi sudah diproses');
    return t;
  }

  /** Simulator aplikasi e-wallet: pelanggan menyetujui/menolak pembayaran setelah memindai QR. */
  async bayarEwallet(id: string, setuju: boolean) {
    const t = await this.harusMenunggu(id, 'EWALLET');
    await this.ubahStatus(t, setuju ? 'LUNAS' : 'GAGAL', setuju ? { dibayarPada: new Date().toISOString() } : { alasan: 'Ditolak di aplikasi e-wallet' });
    return this.infoCheckout(id);
  }

  /** Simulator m-banking: transfer ke nomor VA. Nominal harus tepat. */
  async transferVa(id: string, nominal: unknown) {
    const t = await this.harusMenunggu(id, 'VIRTUAL_ACCOUNT');
    const n = Number(nominal);
    if (!Number.isInteger(n) || n !== t.jumlah) {
      throw badRequest(`Nominal transfer harus tepat Rp${t.jumlah.toLocaleString('id-ID')}`);
    }
    await this.ubahStatus(t, 'LUNAS', { dibayarPada: new Date().toISOString() });
    return this.infoCheckout(id);
  }

  /** Pembayaran kartu: hanya kartu uji; kartu yang lolos meminta OTP 3-D Secure. */
  async bayarKartu(id: string, input: { nomor?: unknown; kedaluwarsa?: unknown; cvv?: unknown; nama?: unknown }) {
    const t = await this.harusMenunggu(id, 'KARTU');
    const nomor = String(input.nomor ?? '').replace(/\D/g, '');
    const exp = String(input.kedaluwarsa ?? '').trim();
    const cvv = String(input.cvv ?? '').trim();
    const galat: Record<string, string> = {};
    if (!lolosLuhn(nomor)) galat.nomor = 'Nomor kartu tidak valid';
    else if (!KARTU_UJI[nomor]) galat.nomor = 'Mode sandbox hanya menerima kartu uji (lihat daftar di bawah)';
    const m = exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!m) galat.kedaluwarsa = 'Format MM/YY';
    else {
      const akhir = new Date(2000 + Number(m[2]), Number(m[1]), 1);
      if (akhir.getTime() <= Date.now()) galat.kedaluwarsa = 'Kartu sudah kedaluwarsa';
    }
    if (!/^\d{3}$/.test(cvv)) galat.cvv = 'CVV 3 digit';
    if (String(input.nama ?? '').trim().length < 2) galat.nama = 'Nama pada kartu wajib diisi';
    if (Object.keys(galat).length) throw badRequest('Data kartu belum valid', { fields: galat });

    const kartu = { merek: nomor.startsWith('5') ? 'Mastercard' : 'Visa', akhir: nomor.slice(-4) };
    if (KARTU_UJI[nomor].hasil === 'GAGAL') {
      await this.ubahStatus(t, 'GAGAL', { kartu, alasan: 'Kartu ditolak bank penerbit' });
    } else {
      await this.ubahStatus(t, 'OTP', { kartu });
    }
    return this.infoCheckout(id);
  }

  /** Verifikasi OTP 3-D Secure. Tiga kali salah -> transaksi gagal. */
  async konfirmasiOtp(id: string, otp: unknown) {
    const t = await this.ambil('id_transaksi', id);
    if (t.status !== 'OTP') throw conflict('Transaksi tidak sedang menunggu OTP');
    if (String(otp ?? '').trim() === OTP_UJI) {
      await this.ubahStatus(t, 'LUNAS', { dibayarPada: new Date().toISOString() });
      return this.infoCheckout(id);
    }
    const salah = Number(t.detail.otpSalah ?? 0) + 1;
    if (salah >= 3) {
      await this.ubahStatus(t, 'GAGAL', { otpSalah: salah, alasan: 'OTP salah 3 kali' });
      return this.infoCheckout(id);
    }
    await this.db.query(`UPDATE gateway_transaksi SET detail = detail || $2::jsonb WHERE id_transaksi = $1`, [
      t.id_transaksi,
      JSON.stringify({ otpSalah: salah }),
    ]);
    throw badRequest(`Kode OTP salah (${3 - salah} percobaan tersisa)`, { fields: { otp: 'Kode OTP salah' } });
  }

  /** Alat uji/pengembang: langsung menetapkan hasil transaksi (dipakai test & simulator antrean dummy). */
  async simulasikan(kodeBayar: string, hasil: 'LUNAS' | 'GAGAL'): Promise<void> {
    const t = await this.ambil('kode_bayar', kodeBayar);
    if (t.status === 'MENUNGGU' || t.status === 'OTP') await this.ubahStatus(t, hasil, { simulasi: true });
  }
}
