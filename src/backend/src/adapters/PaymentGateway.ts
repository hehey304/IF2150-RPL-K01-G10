// Mock Payment Gateway (dev). Ganti dengan integrasi nyata nanti.
import { randomInt } from 'crypto';

export const PaymentGateway = {
  async buatTagihan(_idPembayaran: string, _total: number, tipe: string): Promise<string> {
    const prefix = tipe === 'QRIS' ? 'QR' : tipe === 'TRANSFER_BANK' ? 'VA' : 'EW';
    return `${prefix}${randomInt(10 ** 9, 10 ** 10)}`;
  },
  // Dev: selalu LUNAS. Set env MOCK_PG_STATUS=MENUNGGU untuk menguji "Pembayaran belum diterima".
  async cekStatus(_idPembayaran: string): Promise<'LUNAS' | 'MENUNGGU' | 'GAGAL'> {
    return (process.env.MOCK_PG_STATUS as any) || 'LUNAS';
  },
};
