/**
 * MetodePembayaranController (C07): membuat tagihan di payment gateway, menerima notifikasi status
 * bertanda tangan (webhook), memverifikasi pembayaran, menangani timeout & pengembalian dana,
 * dan menerbitkan tiket antrean setelah lunas (UC02).
 */
import type { AppContext, SessionUser } from '../context.js';
import { verifikasiTandaTangan, type NotifikasiGateway } from '../adapters/paymentGatewayAdapter.js';
import { SandboxPaymentGateway } from '../sandbox-pg/sandboxGateway.js';
import { Antrean, TiketAntrean } from '../models/antrean.js';
import { Menu } from '../models/menu.js';
import { Pesanan } from '../models/pesanan.js';
import { Pembayaran, RiwayatTransaksi, type TipePembayaran } from '../models/pembayaran.js';
import { Notifikasi } from '../models/notifikasi.js';
import { eventBus } from '../realtime/eventBus.js';
import { formatNomorAntrean, generateId } from '../utils/ids.js';
import { AppError, badRequest, conflict, forbidden, notFound } from '../utils/errors.js';

const TIPE: TipePembayaran[] = ['EWALLET', 'VIRTUAL_ACCOUNT', 'KARTU'];

export class MetodePembayaranController {
  constructor(private ctx: AppContext) {}

  /** buatTagihan() (Algo-045). */
  async buatTagihan(user: SessionUser, pesananId: string, tipeInput: unknown) {
    const tipe = TIPE.find((t) => t === tipeInput);
    if (!tipe) throw badRequest('Pilih metode pembayaran terlebih dahulu');
    const pesanan = await Pesanan.getById(this.ctx.db, pesananId);
    if (!pesanan) throw notFound('Pesanan tidak ditemukan');
    if (pesanan.pelanggan_id !== user.pelangganId) throw forbidden();
    if (pesanan.status_pemesanan !== 'MENUNGGU_PEMBAYARAN') {
      throw conflict('Pesanan ini tidak lagi menunggu pembayaran');
    }
    const idPembayaran = generateId('PAY');
    const menit = this.ctx.config.paymentTimeoutMinutes;
    const trx = await this.ctx.gateway.buatTransaksi({
      orderId: idPembayaran, jumlah: pesanan.total_harga, tipe, kedaluwarsa: new Date(Date.now() + menit * 60_000),
    });
    const lama = await this.ctx.db.query<{ kode_bayar: string }>(
      `SELECT kode_bayar FROM pembayaran WHERE pesanan_id = $1 AND status_pembayaran = 'MENUNGGU'`,
      [pesananId],
    );
    const pembayaran = await this.ctx.db.tx(async (q) => {
      await Pembayaran.gagalkanTagihanLama(q, pesananId);
      return Pembayaran.buat(q, { id: idPembayaran, pesananId, tipe, jumlah: pesanan.total_harga, kodeBayar: trx.kodeBayar, menit });
    });
    for (const l of lama) await this.ctx.gateway.batalkan(l.kode_bayar);
    return this.infoTagihan(pembayaran, trx.urlPembayaran, trx.instruksi);
  }

  private infoTagihan<T extends { id_pembayaran: string }>(p: T, urlPembayaran: string, instruksi: string) {
    return { ...p, instruksi, urlPembayaran, gateway: this.ctx.gateway.nama, sandbox: this.isSandbox() };
  }

  /** Tagihan aktif suatu pesanan beserta URL checkout gateway (dipakai saat pelanggan kembali ke I-09). */
  async tagihanAktif(user: SessionUser, pesananId: string) {
    const rows = await this.ctx.db.query<{ id_pembayaran: string; kode_bayar: string; pesanan_id: string }>(
      `SELECT b.* FROM pembayaran b JOIN pesanan p ON p.pesanan_id = b.pesanan_id
       WHERE b.pesanan_id = $1 AND p.pelanggan_id = $2 AND b.status_pembayaran = 'MENUNGGU'
       ORDER BY b.dibuat_pada DESC LIMIT 1`,
      [pesananId, user.pelangganId],
    );
    if (!rows[0]) return { tagihan: null };
    const gw = await this.ctx.db.query<{ id_transaksi: string }>(
      `SELECT id_transaksi FROM gateway_transaksi WHERE kode_bayar = $1`,
      [rows[0].kode_bayar],
    ).catch(() => []);
    return { tagihan: this.infoTagihan(rows[0], gw[0] ? `/pg/checkout/${gw[0].id_transaksi}` : '', '') };
  }

  isSandbox(): boolean {
    return this.ctx.gateway.sandbox;
  }

  /**
   * Menerima notifikasi status dari payment gateway (webhook). Tanda tangan HMAC diverifikasi
   * sebelum status apa pun diproses.
   */
  async terimaNotifikasi(n: NotifikasiGateway, tandaTangan: string) {
    if (!verifikasiTandaTangan(n, tandaTangan, this.ctx.config.gatewayServerKey)) {
      throw new AppError(401, 'Tanda tangan notifikasi tidak valid');
    }
    const pembayaran = await Pembayaran.getById(this.ctx.db, n.orderId);
    if (!pembayaran || pembayaran.kode_bayar !== n.kodeBayar || pembayaran.jumlah !== n.jumlah) {
      throw notFound('Tagihan untuk notifikasi ini tidak ditemukan');
    }
    if (n.status === 'LUNAS') return this.proses(n.orderId);
    if (n.status === 'GAGAL' || n.status === 'KEDALUWARSA') {
      await this.ctx.db.tx(async (q) => {
        if (n.status === 'GAGAL') await Pembayaran.tandaiGagal(q, n.orderId);
        else await q.query(
          `UPDATE pembayaran SET status_pembayaran = 'KEDALUWARSA' WHERE id_pembayaran = $1 AND status_pembayaran = 'MENUNGGU'`,
          [n.orderId],
        );
        // Pesanan dibatalkan hanya bila tidak ada tagihan lain yang masih menunggu (mis. ganti metode).
        await q.query(
          `UPDATE pesanan SET status_pemesanan = 'DIBATALKAN' WHERE pesanan_id = $1 AND status_pemesanan = 'MENUNGGU_PEMBAYARAN'
             AND NOT EXISTS (SELECT 1 FROM pembayaran WHERE pesanan_id = $1 AND status_pembayaran = 'MENUNGGU')`,
          [pembayaran.pesanan_id],
        );
      });
    }
    return { diterima: true };
  }

  /** Khusus gateway simulasi: menentukan hasil transaksi lalu memverifikasinya. */
  async simulasikan(user: SessionUser, idPembayaran: string, hasil: unknown) {
    if (!(this.ctx.gateway instanceof SandboxPaymentGateway)) throw forbidden('Mode simulasi tidak aktif');
    const pembayaran = await this.getMilik(user, idPembayaran);
    await this.ctx.gateway.simulasikan(pembayaran.kode_bayar, hasil === 'GAGAL' ? 'GAGAL' : 'LUNAS');
    return this.verifikasiPembayaran(user, idPembayaran);
  }

  private async getMilik(user: SessionUser, idPembayaran: string) {
    const pembayaran = await Pembayaran.getById(this.ctx.db, idPembayaran);
    if (!pembayaran) throw notFound('Tagihan tidak ditemukan');
    const pesanan = await Pesanan.getById(this.ctx.db, pembayaran.pesanan_id);
    if (!pesanan || pesanan.pelanggan_id !== user.pelangganId) throw forbidden();
    return pembayaran;
  }

  /**
   * verifikasiPembayaran() (Algo-046): menanyakan status ke gateway. Bila lunas, dalam satu transaksi:
   * tandai lunas, kurangi stok, catat riwayat, konfirmasi pesanan, dan terbitkan tiket antrean.
   */
  async verifikasiPembayaran(user: SessionUser, idPembayaran: string) {
    await this.getMilik(user, idPembayaran);
    return this.proses(idPembayaran);
  }

  /** Inti verifikasi (dipakai pelanggan maupun notifikasi gateway). Aman dipanggil berulang. */
  private async proses(idPembayaran: string) {
    await this.cekTimeout();
    const pembayaran = await Pembayaran.getById(this.ctx.db, idPembayaran);
    if (!pembayaran) throw notFound('Tagihan tidak ditemukan');
    if (pembayaran.status_pembayaran === 'KEDALUWARSA') {
      // Pelanggan sempat membayar setelah batas waktu: dana dikembalikan otomatis.
      if ((await this.ctx.gateway.cekStatus(pembayaran.kode_bayar)) === 'LUNAS') {
        await this.ctx.gateway.kembalikanDana(pembayaran.kode_bayar);
        const pes = await Pesanan.getById(this.ctx.db, pembayaran.pesanan_id);
        if (pes) {
          await Notifikasi.kePelanggan(this.ctx.db, pes.pelanggan_id, {
            judul: 'Dana pembayaran dikembalikan',
            isi: 'Pembayaran diterima setelah batas waktu sehingga pesanan dibatalkan dan dana dikembalikan.',
            tautan: `#/pesanan/${pes.pesanan_id}`,
          });
        }
      }
      throw new AppError(410, 'Batas waktu pembayaran habis. Transaksi dibatalkan');
    }
    if (pembayaran.status_pembayaran === 'LUNAS') return this.hasilLunas(pembayaran.pesanan_id);
    if (pembayaran.status_pembayaran === 'GAGAL') return { status: 'GAGAL' as const, pesananId: pembayaran.pesanan_id };

    const statusGateway = await this.ctx.gateway.cekStatus(pembayaran.kode_bayar);
    if (statusGateway === 'MENUNGGU') return { status: 'MENUNGGU' as const, pesananId: pembayaran.pesanan_id };
    if (statusGateway === 'KEDALUWARSA') {
      await this.cekTimeout();
      throw new AppError(410, 'Batas waktu pembayaran habis. Transaksi dibatalkan');
    }
    if (statusGateway !== 'LUNAS') {
      await this.ctx.db.tx(async (q) => {
        await Pembayaran.tandaiGagal(q, idPembayaran);
        await Pesanan.batalkanPesanan(q, pembayaran.pesanan_id);
      });
      return { status: 'GAGAL' as const, pesananId: pembayaran.pesanan_id };
    }

    let restoranId = '';
    try {
      await this.ctx.db.tx(async (q) => {
        const lunas = await Pembayaran.tandaiLunas(q, idPembayaran);
        if (!lunas) throw new AppError(410, 'Batas waktu pembayaran habis. Transaksi dibatalkan');
        const pesanan = (await Pesanan.getById(q, lunas.pesanan_id))!;
        restoranId = pesanan.restoran_id;
        for (const item of await Pesanan.getItems(q, pesanan.pesanan_id)) {
          if (!(await Menu.kurangiStok(q, item.menu_id, item.jumlah))) {
            throw conflict(`Stok ${item.nama_menu} habis saat pembayaran diproses. Dana akan dikembalikan`, {
              stokHabis: true,
            });
          }
        }
        await RiwayatTransaksi.catatLogTransaksi(q, lunas.id_pembayaran, lunas.jumlah);
        await Pesanan.updateStatus(q, pesanan.pesanan_id, 'DIKONFIRMASI');
        const antrean = await Antrean.getByRestoran(q, pesanan.restoran_id);
        if (!antrean) throw conflict('Antrean restoran tidak ditemukan');
        const tiket = await TiketAntrean.terbitkan(q, {
          antreanId: antrean.antrean_id,
          pelangganId: pesanan.pelanggan_id,
          pesananId: pesanan.pesanan_id,
          tipe: pesanan.mode_pemesanan,
        });
        await Notifikasi.keRestoran(q, pesanan.restoran_id, {
          judul: pesanan.mode_pemesanan === 'BOOKING'
            ? `Booking baru ${pesanan.tanggal_booking} ${pesanan.slot_waktu_booking}`
            : `Pesanan baru ${formatNomorAntrean(tiket.nomor_urut)}`,
          isi: `${pesanan.mode_pemesanan.replace('_', '-').toLowerCase()} · ${pesanan.jumlah_rombongan} orang`,
          tautan: '#/resto',
        });
        await Antrean.updateStatus(q, pesanan.restoran_id, this.ctx.config.menitPerAntrean);
      });
    } catch (err) {
      if (err instanceof AppError && err.details?.stokHabis) {
        // Dana dikembalikan lewat gateway, lalu tagihan & pesanan dibatalkan.
        await this.ctx.gateway.kembalikanDana(pembayaran.kode_bayar);
        await this.ctx.db.tx(async (q) => {
          await q.query(`UPDATE pembayaran SET status_pembayaran = 'GAGAL' WHERE id_pembayaran = $1`, [idPembayaran]);
          await Pesanan.batalkanPesanan(q, pembayaran.pesanan_id);
          await Notifikasi.kePelanggan(q, (await Pesanan.getById(q, pembayaran.pesanan_id))!.pelanggan_id, {
            judul: 'Dana pembayaran dikembalikan',
            isi: `${err.message.replace('. Dana akan dikembalikan', '')}. Dana ${pembayaran.jumlah.toLocaleString('id-ID')} dikembalikan ke metode pembayaranmu.`,
            tautan: `#/pesanan/${pembayaran.pesanan_id}`,
          });
        });
      }
      throw err;
    }
    eventBus.antreanBerubah(restoranId, 'tiket-baru');
    return this.hasilLunas(pembayaran.pesanan_id);
  }

  private async hasilLunas(pesananId: string) {
    const tiket = await TiketAntrean.getByPesanan(this.ctx.db, pesananId);
    return { status: 'LUNAS' as const, pesananId, idTiket: tiket?.id_tiket ?? null };
  }

  /** cekTimeout() (Algo-047): membatalkan pesanan yang tagihannya kedaluwarsa. */
  async cekTimeout(): Promise<number> {
    return this.ctx.db.tx(async (q) => {
      const pesananIds = await Pembayaran.kedaluwarsakan(q);
      for (const id of pesananIds) await Pesanan.batalkanPesanan(q, id);
      // Pesanan yang tidak pernah dibuatkan tagihan juga dibatalkan setelah 2x batas waktu bayar.
      const tanpaTagihan = await q.query<{ pesanan_id: string }>(
        `UPDATE pesanan p SET status_pemesanan = 'DIBATALKAN'
         WHERE p.status_pemesanan = 'MENUNGGU_PEMBAYARAN'
           AND p.dibuat_pada < NOW() - make_interval(mins => $1::int)
           AND NOT EXISTS (SELECT 1 FROM pembayaran b WHERE b.pesanan_id = p.pesanan_id AND b.status_pembayaran = 'MENUNGGU')
         RETURNING p.pesanan_id`,
        [this.ctx.config.paymentTimeoutMinutes * 2],
      );
      return pesananIds.length + tanpaTagihan.length;
    });
  }
}
