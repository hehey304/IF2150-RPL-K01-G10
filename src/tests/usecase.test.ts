/**
 * Pengujian Use Case UC01 - UC15 (HIUPL Subbab 4.4). Penanggung jawab: Athallah.
 *
 * Tingkat pengujian: sistem. Aplikasi dirakit utuh (basis data PGlite + data contoh, payment gateway sandbox,
 * notifikasi email) lalu diuji dari luar lewat REST API yang dipakai antarmuka web, sesuai skenario normal dan
 * alternatif pada SKPL Subbab 4.4. Setiap use case memakai aplikasi baru agar keadaannya tidak saling memengaruhi.
 * Nama test memuat ID pengujian [UCxx-TCyy] sesuai Tabel 4.4.1 - 4.4.15 HIUPL.
 *
 * Hasil yang diharapkan diturunkan dari SKPL (acuan lain disebut pada komentar), bukan disalin dari keluaran kode.
 *
 * Test case yang hanya berupa interaksi antarmuka tanpa permintaan ke server (menekan "Batal" pada dialog
 * konfirmasi) tidak diotomasi di sini dan dibuktikan dengan tangkapan layar: UC06-TC02, UC12-TC02, UC15-TC02.
 *
 * Menjalankan: cd src && npm test   (atau hanya file ini: npx tsx --test tests/usecase.test.ts)
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { App } from '../server/app.js';
import { appUji } from './helpers.js';

// ---------------------------------------------------------------------------------------------------------------
// Utilitas: sistem yang sedang diuji dan klien HTTP
// ---------------------------------------------------------------------------------------------------------------

interface Respon {
  status: number;
  data: any;
  headers: Headers;
}

interface Opsi {
  token?: string;
  body?: unknown;
  form?: FormData;
}

class Sistem {
  app!: App;
  server!: Server;
  base = '';

  async mulai(): Promise<void> {
    this.app = await appUji();
    this.server = this.app.app.listen(0, '127.0.0.1');
    if (!this.server.listening) await once(this.server, 'listening');
    this.base = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/api`;
  }

  async selesai(): Promise<void> {
    this.server.closeAllConnections();
    await new Promise((r) => this.server.close(() => r(null)));
    await this.app.close();
  }

  async api(method: string, path: string, opsi: Opsi = {}): Promise<Respon> {
    const headers: Record<string, string> = {};
    if (opsi.token) headers.Authorization = `Bearer ${opsi.token}`;
    let body: RequestInit['body'];
    if (opsi.form) body = opsi.form;
    else if (opsi.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(opsi.body);
    }
    const res = await fetch(this.base + path, { method, headers, body });
    const teks = await res.text();
    let data: any = teks;
    try {
      data = teks ? JSON.parse(teks) : null;
    } catch {
      /* bukan JSON (mis. berkas dokumen) */
    }
    return { status: res.status, data, headers: res.headers };
  }

  async login(email: string, password = 'pelanggan123'): Promise<string> {
    const r = await this.api('POST', '/auth/login', { body: { email, password } });
    assert.equal(r.status, 200, `login ${email} gagal: ${JSON.stringify(r.data)}`);
    return r.data.token as string;
  }

  async idRestoran(nama: string): Promise<string> {
    const r = await this.api('GET', `/restoran?q=${encodeURIComponent(nama)}`);
    const resto = r.data.hasil.find((x: any) => x.nama_restoran === nama);
    assert.ok(resto, `restoran ${nama} tidak ditemukan`);
    return resto.restoran_id;
  }

  async detailRestoran(id: string): Promise<any> {
    const r = await this.api('GET', `/restoran/${id}`);
    assert.equal(r.status, 200);
    return r.data;
  }

  async menu(idRestoran: string, nama: string): Promise<any> {
    const { menu } = await this.detailRestoran(idRestoran);
    const m = menu.find((x: any) => x.nama_menu === nama);
    assert.ok(m, `menu ${nama} tidak ditemukan`);
    return m;
  }

  /** Membuat pesanan lalu membayarnya lewat simulator gateway sandbox. */
  async pesanLunas(token: string, body: Record<string, unknown>, tipe = 'EWALLET') {
    const p = await this.api('POST', '/pesanan', { token, body });
    assert.equal(p.status, 200, JSON.stringify(p.data));
    const t = await this.api('POST', `/pesanan/${p.data.pesanan_id}/pembayaran`, { token, body: { tipePembayaran: tipe } });
    assert.equal(t.status, 200, JSON.stringify(t.data));
    const h = await this.api('POST', `/pembayaran/${t.data.id_pembayaran}/simulasi`, { token, body: { hasil: 'LUNAS' } });
    assert.equal(h.status, 200, JSON.stringify(h.data));
    return { pesanan: p.data, tagihan: t.data, hasil: h.data };
  }

  /**
   * Membuka kanal Server-Sent Events restoran, menjalankan pemicu, lalu menunggu event antrean dengan alasan
   * tertentu. Mengembalikan isi event (gagal bila tidak datang dalam batas waktu).
   */
  async tungguEvent(idRestoran: string, alasan: string, pemicu: () => Promise<unknown>, batasMs = 5000): Promise<any> {
    const ac = new AbortController();
    const res = await fetch(`${this.base}/restoran/${idRestoran}/stream`, { signal: ac.signal });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const baca = async (cocok: (b: string) => boolean) => {
      const batas = Date.now() + batasMs;
      while (!cocok(buf)) {
        const sisa = batas - Date.now();
        if (sisa <= 0) throw new Error(`event "${alasan}" tidak diterima dalam ${batasMs} ms`);
        const hasil = await Promise.race([
          reader.read(),
          new Promise<null>((r) => setTimeout(() => r(null), sisa)),
        ]);
        if (hasil === null) continue;
        if (hasil.done) throw new Error('kanal SSE tertutup');
        buf += dec.decode(hasil.value, { stream: true });
      }
    };
    try {
      await baca((b) => b.includes('event: siap'));
      await pemicu();
      const pola = `"alasan":"${alasan}"`;
      await baca((b) => b.includes(pola));
      const baris = buf.split('\n').find((l) => l.startsWith('data: ') && l.includes(pola))!;
      return JSON.parse(baris.slice(6));
    } finally {
      ac.abort();
      await reader.cancel().catch(() => {});
    }
  }

  db<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.app.ctx.db.query<T>(sql, params);
  }
}

/** Tanggal lokal H+n dalam format YYYY-MM-DD (H = hari pengujian). */
function tanggalH(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Berkas PDF kecil yang sah, opsional diperbesar hingga tepat `ukuran` byte. */
function berkasPdf(ukuran?: number): Uint8Array {
  const isi = Buffer.from(
    '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  );
  if (!ukuran) return isi;
  const b = Buffer.alloc(ukuran, 0x20);
  isi.copy(b);
  return b;
}

const MB5 = 5 * 1024 * 1024;

/** Formulir pendaftaran mitra yang lengkap; `ubah` menimpa kolom (nilai null = kolom tidak dikirim). */
function formulirMitra(ubah: Record<string, string | Blob | null> = {}, namaBerkas: Record<string, string> = {}): FormData {
  const dasar: Record<string, string | Blob> = {
    namaRestoran: 'Warung Nasi Ampera Uji',
    kategori: 'Nasi',
    lokasi: 'Coblong',
    alamat: 'Jl. Dipatiukur No. 10, Bandung',
    emailKontak: 'mitrabaru@antri.in',
    noHp: '081234567890',
    daftarMenu: JSON.stringify([{ namaMenu: 'Nasi Ampera', harga: 20000 }]),
    nib: new Blob([berkasPdf()], { type: 'application/pdf' }),
    izinUsaha: new Blob([berkasPdf()], { type: 'application/pdf' }),
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...dasar, ...ubah })) {
    if (v === null) continue;
    if (v instanceof Blob) fd.set(k, v, namaBerkas[k] ?? `${k}.pdf`);
    else fd.set(k, v);
  }
  return fd;
}

function nama(daftar: any[]): string[] {
  return daftar.map((r) => r.nama_restoran);
}

// ---------------------------------------------------------------------------------------------------------------
// UC01 Mencari dan filter resto (KF01, KF02)
// ---------------------------------------------------------------------------------------------------------------
describe('UC01 Mencari dan filter resto', () => {
  const s = new Sistem();
  before(() => s.mulai());
  after(() => s.selesai());

  test('[UC01-TC01] Normal: pencarian kata kunci "bakso" hanya memuat restoran yang sesuai', async () => {
    const r = await s.api('GET', '/restoran?q=bakso');
    assert.equal(r.status, 200);
    assert.ok(nama(r.data.hasil).includes('Bakso Mang Ujang'));
    assert.ok(!nama(r.data.hasil).includes('Kopi Senja Braga'));
  });

  test('[UC01-TC02] Normal: filter rating 4.5+ (batas 4,5 ikut, 4,4 dan 4,3 tidak)', async () => {
    const r = await s.api('GET', '/restoran?minRating=4.5');
    const hasil = nama(r.data.hasil);
    assert.ok(hasil.includes('Kopi Senja Braga'), 'rating tepat 4,5 harus tampil');
    assert.ok(hasil.includes('Batagor Riri Viral'), 'rating tepat 4,5 harus tampil');
    assert.ok(!hasil.includes('Martabak Kubang 99'), 'rating 4,4 tidak boleh tampil');
    assert.ok(!hasil.includes('Cilok Gang Senggol'), 'rating 4,3 tidak boleh tampil');
    assert.ok(r.data.hasil.every((x: any) => x.rating_rerata >= 4.5));
  });

  test('[UC01-TC03] Normal: filter jenis makanan "Mie"', async () => {
    const r = await s.api('GET', '/restoran?kategori=Mie');
    assert.deepEqual(nama(r.data.hasil), ['Mie Kocok Pak Haji']);
  });

  test('[UC01-TC04] Normal: detail restoran memuat menu, rating, ulasan, dan status antrean', async () => {
    const id = await s.idRestoran('Bakso Mang Ujang');
    const { restoran, menu } = await s.detailRestoran(id);
    assert.equal(restoran.rating_rerata, 4.8);
    assert.ok(restoran.jumlah_ulasan > 0);
    assert.ok(['BUKA', 'PENUH', 'TUTUP'].includes(restoran.status_antrean));
    for (const k of ['total_antrean', 'estimasi_waktu_tunggu', 'meja_tersisa']) assert.equal(typeof restoran[k], 'number', k);
    assert.ok(menu.length > 0);
    assert.ok(menu.every((m: any) => typeof m.nama_menu === 'string' && m.harga > 0 && typeof m.stok === 'number'));
    const ulasan = await s.api('GET', `/restoran/${id}/ulasan`);
    assert.equal(ulasan.status, 200);
  });

  test('[UC01-TC05] Normal: restoran yang belum disetujui admin tidak tampil', async () => {
    const r = await s.api('GET', '/restoran?q=Surabi');
    assert.deepEqual(r.data.hasil, []);
  });

  test('[UC01-TC06] Alt 1: kata kunci tidak ditemukan, sistem memberi daftar default terurut paling viral', async () => {
    const r = await s.api('GET', '/restoran?q=sushi');
    assert.deepEqual(r.data.hasil, []);
    assert.ok(r.data.saran.length > 0, 'daftar restoran default harus ada');
    const skor = r.data.saran.map((x: any) => x.jumlah_ulasan * x.rating_rerata);
    assert.deepEqual(skor, [...skor].sort((a: number, b: number) => b - a), 'saran harus terurut dari paling viral');
  });

  test('[UC01-TC07] Alt 1: setelah kata kunci dan filter direset, seluruh restoran aktif tampil kembali', async () => {
    const r = await s.api('GET', '/restoran');
    assert.equal(r.data.hasil.length, 8);
    assert.ok(!nama(r.data.hasil).includes('Surabi Enhaii'));
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC02 Melakukan pemesanan dan pembayaran digital (KF05 - KF13)
// ---------------------------------------------------------------------------------------------------------------
describe('UC02 Melakukan pemesanan dan pembayaran digital', () => {
  const s = new Sistem();
  let token = '';
  let bakso = '';
  let tc01: { pesanan: any; idTiket: string; stokAwal: number; mejaAwal: number };

  before(async () => {
    await s.mulai();
    token = await s.login('pelanggan@antri.in');
    bakso = await s.idRestoran('Bakso Mang Ujang');
  });
  after(() => s.selesai());

  test('[UC02-TC01] Normal: dine-in, bayar e-wallet, tiket antrean terbit', async () => {
    const stokAwal = (await s.menu(bakso, 'Bakso Urat')).stok;
    const mejaAwal = (await s.detailRestoran(bakso)).restoran.meja_tersisa;
    const urat = await s.menu(bakso, 'Bakso Urat');
    const teh = await s.menu(bakso, 'Es Teh Manis');

    const p = await s.api('POST', '/pesanan', {
      token,
      body: { restoranId: bakso, mode: 'DINE_IN', jumlahRombongan: 2,
        items: [{ menuId: urat.menu_id, jumlah: 2 }, { menuId: teh.menu_id, jumlah: 1 }] },
    });
    assert.equal(p.status, 200, JSON.stringify(p.data));
    assert.equal(p.data.subtotal, 56000);
    assert.equal(p.data.biaya_layanan, 2000);
    assert.equal(p.data.total_harga, 58000);

    const t = await s.api('POST', `/pesanan/${p.data.pesanan_id}/pembayaran`, { token, body: { tipePembayaran: 'EWALLET' } });
    assert.equal(t.status, 200);
    assert.equal(t.data.jumlah, 58000);
    assert.ok(new Date(t.data.batas_waktu_bayar).getTime() > Date.now(), 'batas waktu pembayaran ditampilkan');

    const h = await s.api('POST', `/pembayaran/${t.data.id_pembayaran}/simulasi`, { token, body: { hasil: 'LUNAS' } });
    assert.equal(h.data.status, 'LUNAS');
    assert.ok(h.data.idTiket, 'tiket antrean terbit');

    const tiket = await s.api('GET', `/tiket/${h.data.idTiket}`, { token });
    assert.equal(tiket.status, 200);
    assert.equal(tiket.data.pesanan.pesanan_id, p.data.pesanan_id);
    assert.ok(tiket.data.tiket.nomor_urut > 0);
    assert.equal(tiket.data.pesanan.items.length, 2);
    tc01 = { pesanan: p.data, idTiket: h.data.idTiket, stokAwal, mejaAwal };
  });

  test('[UC02-TC02] Normal: pesanan tersimpan, tampil di restoran, stok dan meja terpotong', async () => {
    const resto = await s.login('bakso@antri.in', 'restoran123');
    const dash = await s.api('GET', '/kelola/antrean', { token: resto });
    const baris = dash.data.daftar.find((d: any) => d.pesanan_id === tc01.pesanan.pesanan_id);
    assert.ok(baris, 'pesanan tampil di dashboard restoran');
    assert.match(baris.rincian, /Bakso Urat x2/);
    assert.equal((await s.menu(bakso, 'Bakso Urat')).stok, tc01.stokAwal - 2);
    assert.equal((await s.detailRestoran(bakso)).restoran.meja_tersisa, tc01.mejaAwal - 1);
  });

  test('[UC02-TC03] Alt 1: pre-order takeaway tanpa pemeriksaan meja, bayar virtual account', async () => {
    const martabak = await s.idRestoran('Martabak Kubang 99');
    assert.equal((await s.detailRestoran(martabak)).restoran.kapasitas_meja, 0, 'prasyarat: restoran tanpa meja');
    const m = await s.menu(martabak, 'Martabak Telor Spesial');
    const { pesanan, tagihan, hasil } = await s.pesanLunas(token,
      { restoranId: martabak, mode: 'TAKEAWAY', items: [{ menuId: m.menu_id, jumlah: 1 }] }, 'VIRTUAL_ACCOUNT');
    assert.equal(pesanan.total_harga, 47000);
    assert.equal(tagihan.tipe_pembayaran, 'VIRTUAL_ACCOUNT');
    const tiket = await s.api('GET', `/tiket/${hasil.idTiket}`, { token });
    assert.equal(tiket.data.tiket.tipe_antrean, 'TAKEAWAY');
    assert.ok(tiket.data.tiket.nomor_urut > 0, 'nomor panggilan pengambilan');
    assert.ok(tiket.data.pesanan.bukti, 'bukti pembayaran tersedia');
  });

  test('[UC02-TC04] Alt 2: booking tempat pada batas H+7 diterima, bayar kartu', async () => {
    const tanggal = tanggalH(7);
    const mie = await s.menu(bakso, 'Mie Bakso');
    const { pesanan, hasil } = await s.pesanLunas(token, {
      restoranId: bakso, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tanggal, slotWaktuBooking: '19:00',
      items: [{ menuId: mie.menu_id, jumlah: 2 }],
    }, 'KARTU');
    assert.equal(pesanan.total_harga, 46000);
    assert.equal(pesanan.slot_waktu_booking, '19:00');
    const tiket = await s.api('GET', `/tiket/${hasil.idTiket}`, { token });
    assert.equal(tiket.data.tiket.status_antrean, 'TERJADWAL', 'bukti reservasi terbit');
    const slot = await s.api('GET', `/restoran/${bakso}/slot-booking?tanggal=${tanggal}`);
    assert.equal(slot.data.slot.find((x: any) => x.jam === '19:00').terpakai, 1, 'kuota meja pada jadwal terkunci');
  });

  test('[UC02-TC05] Alt 3: menu habis saat checkout ditolak, lalu berhasil setelah menu dihapus dari keranjang', async () => {
    const resto = await s.login('bakso@antri.in', 'restoran123');
    const mercon = await s.menu(bakso, 'Bakso Mercon');
    const teh = await s.menu(bakso, 'Es Teh Manis');
    const u = await s.api('PATCH', `/kelola/menu/${mercon.menu_id}/stok`, { token: resto, body: { stok: 0 } });
    assert.equal(u.status, 200);

    const tolak = await s.api('POST', '/pesanan', {
      token, body: { restoranId: bakso, mode: 'TAKEAWAY',
        items: [{ menuId: mercon.menu_id, jumlah: 1 }, { menuId: teh.menu_id, jumlah: 1 }] },
    });
    assert.equal(tolak.status, 409);
    assert.equal(tolak.data.error, 'Mohon maaf, terdapat menu pilihan yang telah habis');
    assert.deepEqual(tolak.data.menuHabis.map((x: any) => x.namaMenu), ['Bakso Mercon'], 'menu habis ditandai');

    const lanjut = await s.api('POST', '/pesanan', {
      token, body: { restoranId: bakso, mode: 'TAKEAWAY', items: [{ menuId: teh.menu_id, jumlah: 1 }] },
    });
    assert.equal(lanjut.status, 200);
    assert.equal(lanjut.data.total_harga, 8000, 'total diperbarui: Rp6.000 + biaya layanan Rp2.000');
  });

  test('[UC02-TC06] Alt 3: jumlah stok + 1 ditolak, jumlah sama dengan stok diterima (nilai batas)', async () => {
    const resto = await s.login('bakso@antri.in', 'restoran123');
    const komplit = await s.menu(bakso, 'Mie Bakso Komplit');
    await s.api('PATCH', `/kelola/menu/${komplit.menu_id}/stok`, { token: resto, body: { stok: 2 } });
    const body = (jumlah: number) => ({ restoranId: bakso, mode: 'TAKEAWAY', items: [{ menuId: komplit.menu_id, jumlah }] });

    const tiga = await s.api('POST', '/pesanan', { token, body: body(3) });
    assert.equal(tiga.status, 409);
    assert.equal(tiga.data.error, 'Mohon maaf, terdapat menu pilihan yang telah habis');
    assert.equal(tiga.data.menuHabis[0].stok, 2, 'keterangan sisa stok');
    const dua = await s.api('POST', '/pesanan', { token, body: body(2) });
    assert.equal(dua.status, 200);
  });

  test('[UC02-TC07] Alt 4: batas waktu pembayaran habis, transaksi dibatalkan tanpa tiket', async () => {
    const seblak = await s.idRestoran('Seblak Teh Nining');
    const m = await s.menu(seblak, 'Seblak Original');
    const p = await s.api('POST', '/pesanan', {
      token, body: { restoranId: seblak, mode: 'TAKEAWAY', items: [{ menuId: m.menu_id, jumlah: 1 }] },
    });
    const t = await s.api('POST', `/pesanan/${p.data.pesanan_id}/pembayaran`, { token, body: { tipePembayaran: 'EWALLET' } });
    // Mensimulasikan berlalunya waktu: batas waktu tagihan dimundurkan sehingga sudah lewat.
    await s.db(`UPDATE pembayaran SET batas_waktu_bayar = NOW() - INTERVAL '1 second' WHERE id_pembayaran = $1`,
      [t.data.id_pembayaran]);

    const v = await s.api('POST', `/pembayaran/${t.data.id_pembayaran}/verifikasi`, { token });
    assert.equal(v.status, 410);
    assert.equal(v.data.error, 'Batas waktu pembayaran habis. Transaksi dibatalkan');
    const detail = await s.api('GET', `/pesanan/${p.data.pesanan_id}`, { token });
    assert.equal(detail.data.status_pemesanan, 'DIBATALKAN');
    assert.equal(detail.data.tiket, null, 'tidak ada tiket antrean yang terbit');
  });

  test('[UC02-TC08] Alt 4: pembayaran ditolak, pesanan dibatalkan tanpa tiket', async () => {
    const seblak = await s.idRestoran('Seblak Teh Nining');
    const m = await s.menu(seblak, 'Seblak Original');
    const p = await s.api('POST', '/pesanan', {
      token, body: { restoranId: seblak, mode: 'TAKEAWAY', items: [{ menuId: m.menu_id, jumlah: 1 }] },
    });
    const t = await s.api('POST', `/pesanan/${p.data.pesanan_id}/pembayaran`, { token, body: { tipePembayaran: 'EWALLET' } });
    const h = await s.api('POST', `/pembayaran/${t.data.id_pembayaran}/simulasi`, { token, body: { hasil: 'GAGAL' } });
    assert.equal(h.data.status, 'GAGAL');
    const detail = await s.api('GET', `/pesanan/${p.data.pesanan_id}`, { token });
    assert.equal(detail.data.status_pemesanan, 'DIBATALKAN');
    assert.equal(detail.data.tiket, null);
  });

  test('[UC02-TC09] Alt 5: booking H+8 (lewat batas 7 hari) ditolak dan tidak tersimpan', async () => {
    const tanggal = tanggalH(8);
    const slot = await s.api('GET', `/restoran/${bakso}/slot-booking?tanggal=${tanggal}`);
    assert.ok(slot.data.slot.every((x: any) => x.tersedia === false), 'tidak ada slot yang dapat dipilih pada H+8');

    const sebelum = (await s.api('GET', '/pesanan', { token })).data.length;
    const mie = await s.menu(bakso, 'Mie Bakso');
    const r = await s.api('POST', '/pesanan', {
      token, body: { restoranId: bakso, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tanggal,
        slotWaktuBooking: '19:00', items: [{ menuId: mie.menu_id, jumlah: 1 }] },
    });
    assert.equal(r.status, 400);
    assert.match(r.data.error, /Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan/);
    assert.equal((await s.api('GET', '/pesanan', { token })).data.length, sebelum, 'tidak ada pesanan tersimpan');
  });

  test('[UC02-TC10] Alt 5: slot booking yang penuh ditolak, slot lain dapat dipilih', async () => {
    const resto = await s.login('bakso@antri.in', 'restoran123');
    const k = await s.api('PUT', '/kelola/kuota', { token: resto, body: { kuotaMaksimum: 30, kapasitasMeja: 1 } });
    assert.equal(k.status, 200);
    const tanggal = tanggalH(2);
    const mie = await s.menu(bakso, 'Mie Bakso');
    const booking = (slot: string) => ({ restoranId: bakso, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tanggal,
      slotWaktuBooking: slot, items: [{ menuId: mie.menu_id, jumlah: 1 }] });
    try {
      await s.pesanLunas(await s.login('dinda@contoh.id'), booking('19:00'));

      const slot = await s.api('GET', `/restoran/${bakso}/slot-booking?tanggal=${tanggal}`);
      const s19 = slot.data.slot.find((x: any) => x.jam === '19:00');
      const s20 = slot.data.slot.find((x: any) => x.jam === '20:00');
      assert.equal(s19.tersedia, false);
      assert.equal(s19.alasan, 'Penuh');
      assert.equal(s20.tersedia, true);

      const penuh = await s.api('POST', '/pesanan', { token, body: booking('19:00') });
      assert.equal(penuh.status, 409);
      assert.equal(penuh.data.error,
        'Reservasi hanya dapat dilakukan maksimal 7 hari sebelum kedatangan atau kuota meja pada jam tersebut telah penuh');
      const lain = await s.api('POST', '/pesanan', { token, body: booking('20:00') });
      assert.equal(lain.status, 200);
    } finally {
      await s.api('PUT', '/kelola/kuota', { token: resto, body: { kuotaMaksimum: 30, kapasitasMeja: 12 } });
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC03 Menampilkan status antrean (KF03, KF17)
// ---------------------------------------------------------------------------------------------------------------
describe('UC03 Menampilkan status antrean', () => {
  const s = new Sistem();
  let token = '';
  let resto = '';
  let bakso = '';
  let idTiket = '';

  before(async () => {
    await s.mulai();
    token = await s.login('pelanggan@antri.in');
    resto = await s.login('bakso@antri.in', 'restoran123');
    bakso = await s.idRestoran('Bakso Mang Ujang');
  });
  after(() => s.selesai());

  test('[UC03-TC01] Normal: status menampilkan nomor, nomor dilayani, sisa antrean, estimasi, dan rincian', async () => {
    const r = await s.api('GET', '/antrean-saya', { token });
    assert.equal(r.status, 200);
    const st = r.data.find((x: any) => x.tiket.nama_restoran === 'Bakso Mang Ujang');
    assert.ok(st, 'tiket Bakso Mang Ujang ada');
    idTiket = st.tiket.id_tiket;
    assert.equal(st.tiket.nomor_urut, 7);
    assert.equal(typeof st.tiket.nomor_dilayani, 'number');
    assert.equal(st.sisaAntrean, 6, 'enam pelanggan di depan');
    assert.ok(st.estimasiMenit > 0);
    assert.equal(st.pesanan.items.length, 2);
  });

  test('[UC03-TC02] Normal: dequeue restoran diteruskan real-time dan sisa antrean pelanggan berkurang', async () => {
    const awal = (await s.api('GET', `/tiket/${idTiket}/status`, { token })).data;
    const event = await s.tungguEvent(bakso, 'dequeue', () =>
      s.api('POST', '/kelola/antrean/dequeue', { token: resto, body: {} }));
    assert.equal(event.restoranId, bakso);
    const akhir = (await s.api('GET', `/tiket/${idTiket}/status`, { token })).data;
    assert.equal(akhir.sisaAntrean, awal.sisaAntrean - 1);
    assert.ok(akhir.tiket.nomor_dilayani > awal.tiket.nomor_dilayani, 'nomor yang dilayani berganti');
  });

  test('[UC03-TC03] Normal: notifikasi giliran saat tiket pelanggan menjadi terdepan', async () => {
    let st = (await s.api('GET', `/tiket/${idTiket}/status`, { token })).data;
    for (let i = 0; i < 10 && !st.giliranmu; i++) {
      await s.api('POST', '/kelola/antrean/dequeue', { token: resto, body: {} });
      st = (await s.api('GET', `/tiket/${idTiket}/status`, { token })).data;
    }
    assert.equal(st.giliranmu, true);
    assert.equal(st.tiket.status_antrean, 'DIPANGGIL');
    const notif = await s.api('GET', '/notifikasi', { token });
    assert.ok(notif.data.items.some((n: any) => /Giliranmu/.test(n.judul)), 'notifikasi giliran terkirim');
  });

  test('[UC03-TC04] Normal: ID antrean milik pelanggan lain ditolak', async () => {
    const lain = await s.login('dinda@contoh.id');
    const r = await s.api('GET', `/tiket/${idTiket}/status`, { token: lain });
    assert.equal(r.status, 403);
    assert.equal(r.data.tiket, undefined, 'data antrean tidak dikirim');
    assert.equal((await s.api('GET', `/tiket/${idTiket}`, { token: lain })).status, 403);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC04 Pendaftaran mitra restoran baru (KF14)
// ---------------------------------------------------------------------------------------------------------------
describe('UC04 Pendaftaran mitra restoran baru', () => {
  const s = new Sistem();
  let mitra = '';
  let admin = '';

  const jumlahPengajuan = async (namaResto: string) =>
    (await s.api('GET', '/admin/pengajuan', { token: admin })).data.filter((p: any) => p.nama_restoran === namaResto).length;

  before(async () => {
    await s.mulai();
    mitra = await s.login('mitrabaru@antri.in', 'restoran123');
    admin = await s.login('admin@antri.in', 'admin12345');
  });
  after(() => s.selesai());

  test('[UC04-TC02] Alt 1: data tidak lengkap ditolak dan kolom bermasalah ditandai', async () => {
    const r = await s.api('POST', '/mitra/pengajuan', { token: mitra, form: formulirMitra({ namaRestoran: '', nib: null }) });
    assert.equal(r.status, 400);
    assert.ok(r.data.fields.namaRestoran, 'kolom nama restoran ditandai');
    assert.ok(r.data.fields.nib, 'kolom NIB ditandai');
    assert.equal(await jumlahPengajuan('Warung Nasi Ampera Uji'), 0, 'tidak tersimpan');
  });

  test('[UC04-TC03] Alt 1: dokumen berformat .docx ditolak', async () => {
    const docx = new Blob([Buffer.from('PK dokumen word')], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const r = await s.api('POST', '/mitra/pengajuan', { token: mitra, form: formulirMitra({ nib: docx }, { nib: 'nib.docx' }) });
    assert.equal(r.status, 400);
    assert.match(r.data.fields.nib, /PDF/);
    assert.equal(await jumlahPengajuan('Warung Nasi Ampera Uji'), 0);
  });

  test('[UC04-TC04] Alt 1: dokumen 5 MB + 1 KB ditolak dan kolom NIB ditandai (nilai batas)', {
    todo: 'batas ukuran ditangani multer (LIMIT_FILE_SIZE) sehingga galat tidak memuat fields.nib',
  }, async () => {
    const besar = new Blob([berkasPdf(MB5 + 1024)], { type: 'application/pdf' });
    const r = await s.api('POST', '/mitra/pengajuan', { token: mitra, form: formulirMitra({ nib: besar }) });
    assert.equal(r.status, 400);
    assert.match(r.data.error, /5 MB/);
    assert.equal(await jumlahPengajuan('Warung Nasi Ampera Uji'), 0, 'tidak tersimpan');
    assert.ok(r.data.fields?.nib, 'kolom NIB ditandai (SKPL UC04 Alt 1: bagian yang bermasalah ditandai)');
  });

  test('[UC04-TC01] Normal: pendaftaran lengkap tersimpan dengan status menunggu verifikasi', async () => {
    const r = await s.api('POST', '/mitra/pengajuan', { token: mitra, form: formulirMitra() });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.status, 'MENUNGGU');
    const saya = await s.api('GET', '/mitra/pengajuan-saya', { token: mitra });
    assert.equal(saya.data.status, 'MENUNGGU');
    assert.equal(await jumlahPengajuan('Warung Nasi Ampera Uji'), 1, 'tampil di daftar verifikasi admin');
  });

  test('[UC04-TC05] Normal: dokumen tepat 5 MB diterima (nilai batas)', async () => {
    const daftar = await s.api('POST', '/auth/register', {
      body: { role: 'RESTORAN', nama: 'Resto Batas', email: 'resto.batas@contoh.id', noHp: '081299990009',
        password: 'restoran123', konfirmasiPassword: 'restoran123', setuju: true },
    });
    assert.equal(daftar.status, 200);
    const token = await s.login('resto.batas@contoh.id', 'restoran123');
    const pas = new Blob([berkasPdf(MB5)], { type: 'application/pdf' });
    const r = await s.api('POST', '/mitra/pengajuan', {
      token, form: formulirMitra({ namaRestoran: 'Resto Batas Lima MB', emailKontak: 'resto.batas@contoh.id', nib: pas }),
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.status, 'MENUNGGU');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC05 Memverifikasi pendaftaran restoran (KF15, KF16)
// ---------------------------------------------------------------------------------------------------------------
describe('UC05 Memverifikasi pendaftaran restoran', () => {
  const s = new Sistem();
  let admin = '';
  let surabi: any;
  let ampera: any;

  before(async () => {
    await s.mulai();
    admin = await s.login('admin@antri.in', 'admin12345');
    // Prasyarat: satu pengajuan lain dari akun calon mitra (setara UC04-TC01).
    const mitra = await s.login('mitrabaru@antri.in', 'restoran123');
    const r = await s.api('POST', '/mitra/pengajuan', { token: mitra, form: formulirMitra() });
    assert.equal(r.status, 200);
    const daftar = (await s.api('GET', '/admin/pengajuan', { token: admin })).data;
    surabi = daftar.find((p: any) => p.nama_restoran === 'Surabi Enhaii');
    ampera = daftar.find((p: any) => p.nama_restoran === 'Warung Nasi Ampera Uji');
  });
  after(() => s.selesai());

  test('[UC05-TC01] Normal: detail pengajuan memuat profil, dokumen verifikasi, dan daftar menu', async () => {
    const d = (await s.api('GET', `/admin/pengajuan/${surabi.id_pengajuan}`, { token: admin })).data;
    assert.equal(d.nama_restoran, 'Surabi Enhaii');
    assert.equal(d.status, 'MENUNGGU');
    assert.ok(d.alamat && d.email_kontak && d.no_hp, 'profil restoran');
    assert.deepEqual(d.dokumen.map((x: any) => x.label).sort(), ['Izin usaha', 'NIB']);
    assert.deepEqual(d.daftar_menu.map((m: any) => m.namaMenu), ['Surabi Oncom', 'Surabi Cokelat Keju']);
    const berkas = await s.api('GET', `/admin/dokumen/${d.dokumen[0].idDokumen}`, { token: admin });
    assert.equal(berkas.status, 200, 'dokumen dapat dibuka');
    assert.match(berkas.headers.get('content-type') ?? '', /application\/pdf/);
  });

  test('[UC05-TC02] Normal: pengajuan disetujui, email penerimaan terkirim, restoran tampil ke pelanggan', async () => {
    const r = await s.api('POST', `/admin/pengajuan/${surabi.id_pengajuan}/setujui`, { token: admin });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'DISETUJUI');
    const email = await s.db(`SELECT * FROM log_notifikasi WHERE penerima = 'surabi@antri.in' AND jenis = 'MITRA_DITERIMA'`);
    assert.equal(email.length, 1);
    assert.equal(email[0].status, 'TERKIRIM');
    const cari = await s.api('GET', '/restoran?q=Surabi');
    assert.deepEqual(nama(cari.data.hasil), ['Surabi Enhaii']);
  });

  test('[UC05-TC03] Alt 1: penolakan tanpa alasan tidak diproses', async () => {
    const r = await s.api('POST', `/admin/pengajuan/${ampera.id_pengajuan}/tolak`, { token: admin, body: { alasan: '' } });
    assert.equal(r.status, 400);
    assert.ok(r.data.fields.alasan, 'alasan wajib diisi');
    const d = (await s.api('GET', `/admin/pengajuan/${ampera.id_pengajuan}`, { token: admin })).data;
    assert.equal(d.status, 'MENUNGGU');
  });

  test('[UC05-TC04] Alt 1: pengajuan ditolak dengan alasan, email penolakan beserta alasan terkirim', async () => {
    const alasan = 'Dokumen NIB tidak terbaca, mohon unggah ulang.';
    const r = await s.api('POST', `/admin/pengajuan/${ampera.id_pengajuan}/tolak`, { token: admin, body: { alasan } });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'DITOLAK');
    const email = await s.db(`SELECT * FROM log_notifikasi WHERE penerima = 'mitrabaru@antri.in' AND jenis = 'MITRA_DITOLAK'`);
    assert.equal(email.length, 1);
    assert.ok(email[0].isi_pesan.includes(alasan), 'email memuat alasan penolakan');
    const me = await s.api('GET', '/auth/me', { token: await s.login('mitrabaru@antri.in', 'restoran123') });
    assert.equal(me.data.pengajuan.status, 'DITOLAK');
    assert.equal(me.data.pengajuan.alasanPenolakan, alasan);
    assert.deepEqual((await s.api('GET', '/restoran?q=Ampera')).data.hasil, []);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC06 Mengelola antrean (KF04, KF17)
// ---------------------------------------------------------------------------------------------------------------
describe('UC06 Mengelola antrean', () => {
  const s = new Sistem();
  let resto = '';

  before(async () => {
    await s.mulai();
    resto = await s.login('bakso@antri.in', 'restoran123');
  });
  after(() => s.selesai());

  test('[UC06-TC01] Normal: dequeue pelanggan terdepan, pelanggan berikutnya menjadi terdepan', async () => {
    const awal = (await s.api('GET', '/kelola/antrean', { token: resto })).data;
    const front = awal.daftar[0];
    assert.equal(front.status_antrean, 'DIPANGGIL');
    const r = await s.api('POST', '/kelola/antrean/dequeue', { token: resto, body: { idTiket: front.id_tiket } });
    assert.equal(r.status, 200);
    const akhir = (await s.api('GET', '/kelola/antrean', { token: resto })).data;
    assert.equal(akhir.ringkasan.antreanAktif, awal.ringkasan.antreanAktif - 1);
    assert.ok(!akhir.daftar.some((d: any) => d.id_tiket === front.id_tiket), 'pelanggan terdepan keluar dari antrean');
    assert.equal(akhir.daftar[0].id_tiket, awal.daftar[1].id_tiket);
    assert.equal(akhir.daftar[0].status_antrean, 'DIPANGGIL');
  });

  test('[UC06-TC03] Alt 2: pelanggan tidak hadir di-dequeue otomatis setelah batas waktu (nilai batas)', async () => {
    const menit = s.app.ctx.config.autoDequeueMinutes;
    const awal = (await s.api('GET', '/kelola/antrean', { token: resto })).data;
    const front = awal.daftar[0];
    const mundur = (m: number) =>
      s.db(`UPDATE tiket_antrean SET waktu_dipanggil = NOW() - make_interval(mins => $2::int) WHERE id_tiket = $1`,
        [front.id_tiket, m]);

    await mundur(menit - 1);
    await s.app.controllers.kelolaAntrean.autoDequeue();
    let st = await s.db(`SELECT status_antrean FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]);
    assert.equal(st[0].status_antrean, 'DIPANGGIL', `sebelum ${menit} menit pelanggan tetap di antrean`);

    await mundur(menit + 1);
    await s.app.controllers.kelolaAntrean.autoDequeue();
    st = await s.db(`SELECT status_antrean, pelanggan_id FROM tiket_antrean WHERE id_tiket = $1`, [front.id_tiket]);
    assert.equal(st[0].status_antrean, 'DILEWATI', `setelah ${menit} menit pelanggan di-dequeue otomatis`);

    const akhir = (await s.api('GET', '/kelola/antrean', { token: resto })).data;
    assert.equal(akhir.daftar[0].id_tiket, awal.daftar[1].id_tiket);
    assert.equal(akhir.daftar[0].status_antrean, 'DIPANGGIL');
    const pemilik = await s.db(`SELECT email FROM pelanggan WHERE pelanggan_id = $1`, [st[0].pelanggan_id]);
    const tokenPemilik = await s.login(pemilik[0].email);
    const status = (await s.api('GET', `/tiket/${front.id_tiket}/status`, { token: tokenPemilik })).data;
    assert.equal(status.tiket.status_antrean, 'DILEWATI', 'status di sisi pelanggan ikut diperbarui');
    assert.equal(status.sisaAntrean, 0);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC07 Mengatur kuota antrean dan meja (KF18, KF08)
// ---------------------------------------------------------------------------------------------------------------
describe('UC07 Mengatur kuota antrean dan meja', () => {
  const s = new Sistem();
  let resto = '';
  let token = '';
  let bakso = '';
  let teh: any;

  const atur = (kuota: unknown, meja: unknown = 12) =>
    s.api('PUT', '/kelola/kuota', { token: resto, body: { kuotaMaksimum: kuota, kapasitasMeja: meja } });
  const pesan = (mode: string, extra: Record<string, unknown> = {}) =>
    s.api('POST', '/pesanan', {
      token, body: { restoranId: bakso, mode, jumlahRombongan: 2, items: [{ menuId: teh.menu_id, jumlah: 1 }], ...extra },
    });

  before(async () => {
    await s.mulai();
    resto = await s.login('bakso@antri.in', 'restoran123');
    token = await s.login('pelanggan@antri.in');
    bakso = await s.idRestoran('Bakso Mang Ujang');
    teh = await s.menu(bakso, 'Es Teh Manis');
  });
  after(() => s.selesai());

  test('[UC07-TC01] Normal: kuota dan kapasitas meja baru tersimpan dan tampil ke pelanggan', async () => {
    const awal = (await s.api('GET', '/kelola/kuota', { token: resto })).data;
    assert.equal(awal.kuotaMaksimum, 30);
    assert.equal(awal.kapasitasMeja, 12);
    const r = await atur(40, 10);
    assert.equal(r.status, 200);
    assert.equal(r.data.kuotaMaksimum, 40);
    assert.equal(r.data.kapasitasMeja, 10);
    const ulang = (await s.api('GET', '/kelola/kuota', { token: resto })).data;
    assert.equal(ulang.kuotaMaksimum, 40);
    const { restoran } = await s.detailRestoran(bakso);
    assert.equal(restoran.kapasitas_meja, 10);
    assert.equal(restoran.meja_tersisa, Math.max(10 - restoran.meja_terisi, 0));
  });

  test('[UC07-TC02] Alt 1: kuota negatif ditolak, nilai tidak berubah, lalu diperbaiki', async () => {
    const r = await atur(-5, 10);
    assert.equal(r.status, 400);
    assert.equal(r.data.error, 'Input tidak valid. Masukkan angka bulat yang tidak negatif');
    assert.ok(r.data.fields.kuotaMaksimum);
    assert.equal((await s.api('GET', '/kelola/kuota', { token: resto })).data.kuotaMaksimum, 40);
    assert.equal((await atur(40, 10)).status, 200);
  });

  test('[UC07-TC03] Alt 1: kuota bukan angka ditolak', async () => {
    const r = await atur('abc', 10);
    assert.equal(r.status, 400);
    assert.ok(r.data.fields.kuotaMaksimum);
    assert.equal((await s.api('GET', '/kelola/kuota', { token: resto })).data.kuotaMaksimum, 40);
  });

  test('[UC07-TC04] Alt 2: kuota 0 menutup antrean, pesanan dine-in/takeaway ditolak', async () => {
    assert.equal((await atur(0)).status, 200);
    assert.equal((await s.detailRestoran(bakso)).restoran.status_antrean, 'TUTUP');
    for (const mode of ['DINE_IN', 'TAKEAWAY']) {
      const r = await pesan(mode);
      assert.equal(r.status, 409, mode);
      assert.equal(r.data.error, 'Antrean restoran sedang ditutup');
    }
  });

  test('[UC07-TC05] Alt 2: booking saat kuota 0 ditolak (SKPL: tidak ada pesanan baru yang bisa masuk)', {
    todo: 'buatPesanan hanya memeriksa status antrean untuk dine-in/takeaway; booking tetap diterima',
  }, async () => {
    assert.equal((await s.detailRestoran(bakso)).restoran.status_antrean, 'TUTUP', 'prasyarat: kuota masih 0');
    const r = await pesan('BOOKING', { tanggalBooking: tanggalH(1), slotWaktuBooking: '12:00' });
    assert.ok(r.status >= 400, `booking seharusnya ditolak, tetapi status ${r.status}`);
  });

  test('[UC07-TC06] Alt 2: kuota = tiket hari ini menjadi penuh, kuota + 1 dibuka kembali (nilai batas)', async () => {
    const T = (await s.api('GET', '/kelola/antrean', { token: resto })).data.ringkasan.tiketHariIni;
    assert.equal((await atur(T)).status, 200);
    assert.equal((await s.detailRestoran(bakso)).restoran.status_antrean, 'PENUH');
    const penuh = await pesan('TAKEAWAY');
    assert.equal(penuh.status, 409);
    assert.equal(penuh.data.error, 'Kuota antrean restoran hari ini sudah penuh');

    assert.equal((await atur(T + 1)).status, 200);
    assert.equal((await s.detailRestoran(bakso)).restoran.status_antrean, 'BUKA');
    assert.equal((await pesan('TAKEAWAY')).status, 200);
    await atur(30);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC08 Mengelola stok dan menu makanan (KF07)
// ---------------------------------------------------------------------------------------------------------------
describe('UC08 Mengelola stok dan menu makanan', () => {
  const s = new Sistem();
  let resto = '';
  let token = '';
  let bakso = '';
  let idKeju = '';

  const menuResto = async (namaMenu: string) =>
    (await s.api('GET', '/kelola/menu', { token: resto })).data.find((m: any) => m.nama_menu === namaMenu);
  const pesan = (menuId: string, jumlah: number) =>
    s.api('POST', '/pesanan', { token, body: { restoranId: bakso, mode: 'TAKEAWAY', items: [{ menuId, jumlah }] } });

  before(async () => {
    await s.mulai();
    resto = await s.login('bakso@antri.in', 'restoran123');
    token = await s.login('pelanggan@antri.in');
    bakso = await s.idRestoran('Bakso Mang Ujang');
  });
  after(() => s.selesai());

  test('[UC08-TC01] Normal: mengubah informasi (harga) menu', async () => {
    const mie = await menuResto('Mie Bakso');
    assert.equal(mie.harga, 22000);
    const r = await s.api('PUT', `/kelola/menu/${mie.menu_id}`, {
      token: resto,
      body: { namaMenu: 'Mie Bakso', kategoriMenu: mie.kategori_menu, deskripsiMenu: mie.deskripsi_menu, harga: 23000, stok: mie.stok },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.harga, 23000);
    assert.equal((await s.menu(bakso, 'Mie Bakso')).harga, 23000, 'harga baru tampil di halaman pelanggan');
  });

  test('[UC08-TC02] Normal: mengubah stok menu', async () => {
    const mercon = await menuResto('Bakso Mercon');
    const r = await s.api('PATCH', `/kelola/menu/${mercon.menu_id}/stok`, { token: resto, body: { stok: 30 } });
    assert.equal(r.status, 200);
    assert.equal((await menuResto('Bakso Mercon')).stok, 30);
  });

  test('[UC08-TC03] Alt 1: menambah menu baru', async () => {
    const r = await s.api('POST', '/kelola/menu', {
      token: resto, body: { namaMenu: 'Bakso Keju', kategoriMenu: 'Bakso', harga: 30000, stok: 20 },
    });
    assert.equal(r.status, 200);
    idKeju = r.data.menu_id;
    assert.ok(await menuResto('Bakso Keju'), 'tampil di daftar menu restoran');
    const m = await s.menu(bakso, 'Bakso Keju');
    assert.equal(m.harga, 30000);
    assert.equal(m.stok, 20);
  });

  test('[UC08-TC04] Alt 2: menghapus menu', async () => {
    const r = await s.api('DELETE', `/kelola/menu/${idKeju}`, { token: resto });
    assert.equal(r.status, 200);
    assert.equal(await menuResto('Bakso Keju'), undefined);
    const { menu } = await s.detailRestoran(bakso);
    assert.ok(!menu.some((m: any) => m.nama_menu === 'Bakso Keju'), 'tidak tampil di halaman pelanggan');
  });

  test('[UC08-TC05] Alt 3: stok 0 membuat menu habis dan tidak dapat dipesan (nilai batas)', async () => {
    const mie = await menuResto('Mie Bakso');
    assert.equal((await s.api('PATCH', `/kelola/menu/${mie.menu_id}/stok`, { token: resto, body: { stok: 0 } })).status, 200);
    assert.equal((await s.menu(bakso, 'Mie Bakso')).stok, 0, 'pelanggan melihat stok 0 (badge "Habis")');
    const r = await pesan(mie.menu_id, 1);
    assert.equal(r.status, 409);
    assert.equal(r.data.error, 'Mohon maaf, terdapat menu pilihan yang telah habis');
  });

  test('[UC08-TC06] Alt 3: stok 1 dapat dipesan 1 porsi tetapi tidak 2 (nilai batas)', async () => {
    const mie = await menuResto('Mie Bakso');
    assert.equal((await s.api('PATCH', `/kelola/menu/${mie.menu_id}/stok`, { token: resto, body: { stok: 1 } })).status, 200);
    assert.equal((await pesan(mie.menu_id, 2)).status, 409);
    assert.equal((await pesan(mie.menu_id, 1)).status, 200);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC09 Menampilkan dashboard antrean restoran (KF13)
// ---------------------------------------------------------------------------------------------------------------
describe('UC09 Menampilkan dashboard antrean restoran', () => {
  const s = new Sistem();
  let resto = '';
  let token = '';
  let bakso = '';

  before(async () => {
    await s.mulai();
    resto = await s.login('bakso@antri.in', 'restoran123');
    token = await s.login('pelanggan@antri.in');
    bakso = await s.idRestoran('Bakso Mang Ujang');
    // Prasyarat: satu booking lunas untuk H+1 pukul 12:00.
    const mie = await s.menu(bakso, 'Mie Bakso');
    await s.pesanLunas(token, { restoranId: bakso, mode: 'BOOKING', jumlahRombongan: 2, tanggalBooking: tanggalH(1),
      slotWaktuBooking: '12:00', items: [{ menuId: mie.menu_id, jumlah: 1 }] });
  });
  after(() => s.selesai());

  test('[UC09-TC01] Normal: dashboard memuat antrean, rincian pesanan, meja tersisa, dan booking', async () => {
    const r = await s.api('GET', '/kelola/antrean', { token: resto });
    assert.equal(r.status, 200);
    assert.ok(r.data.daftar.length >= 7);
    assert.ok(r.data.daftar.every((d: any) => d.nomor_urut > 0 && d.nama_pelanggan && d.tipe_antrean && d.rincian));
    assert.equal(r.data.ringkasan.kapasitasMeja, 12);
    assert.equal(typeof r.data.ringkasan.mejaTerisi, 'number');
    assert.ok(r.data.booking.some((b: any) => b.slot_waktu_booking === '12:00' && b.tanggal_booking === tanggalH(1)));
  });

  test('[UC09-TC02] Normal: antrean baru muncul tanpa memuat ulang (event real-time)', async () => {
    const teh = await s.menu(bakso, 'Es Teh Manis');
    let pesananId = '';
    const event = await s.tungguEvent(bakso, 'tiket-baru', async () => {
      const { pesanan } = await s.pesanLunas(token,
        { restoranId: bakso, mode: 'TAKEAWAY', items: [{ menuId: teh.menu_id, jumlah: 1 }] });
      pesananId = pesanan.pesanan_id;
    });
    assert.equal(event.restoranId, bakso);
    const r = await s.api('GET', '/kelola/antrean', { token: resto });
    assert.ok(r.data.daftar.some((d: any) => d.pesanan_id === pesananId));
  });

  test('[UC09-TC03] Alt 1: restoran baru tanpa pesanan menampilkan antrean kosong', async () => {
    const admin = await s.login('admin@antri.in', 'admin12345');
    const p = (await s.api('GET', '/admin/pengajuan', { token: admin })).data.find((x: any) => x.nama_restoran === 'Surabi Enhaii');
    assert.equal((await s.api('POST', `/admin/pengajuan/${p.id_pengajuan}/setujui`, { token: admin })).status, 200);
    const surabi = await s.login('surabi@antri.in', 'restoran123');
    const r = await s.api('GET', '/kelola/antrean', { token: surabi });
    assert.equal(r.status, 200);
    assert.deepEqual(r.data.daftar, []);
    assert.equal(r.data.ringkasan.antreanAktif, 0);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC10 Registrasi akun (KF21)
// ---------------------------------------------------------------------------------------------------------------
describe('UC10 Registrasi akun', () => {
  const s = new Sistem();
  const PESAN_DUPLIKAT = 'Email atau nomor telepon sudah terdaftar. Silakan gunakan akun lain atau lakukan login';
  const PESAN_SANDI = 'Konfirmasi kata sandi tidak cocok atau kata sandi minimal 8 karakter';
  const daftar = (data: Record<string, unknown>) =>
    s.api('POST', '/auth/register', {
      body: { role: 'PELANGGAN', nama: 'Uji Pelanggan', password: 'rahasia123', konfirmasiPassword: 'rahasia123', setuju: true, ...data },
    });

  before(() => s.mulai());
  after(() => s.selesai());

  test('[UC10-TC01] Normal: registrasi pelanggan berhasil lalu dapat login', async () => {
    const r = await daftar({ email: 'uji.pelanggan@contoh.id', noHp: '081299990001' });
    assert.equal(r.status, 200);
    assert.equal(r.data.role, 'PELANGGAN');
    const login = await s.api('POST', '/auth/login', { body: { email: 'uji.pelanggan@contoh.id', password: 'rahasia123' } });
    assert.equal(login.status, 200);
  });

  test('[UC10-TC02] Normal: registrasi restoran berhasil dengan peran Restoran', async () => {
    const r = await daftar({ role: 'RESTORAN', nama: 'Uji Resto', email: 'uji.resto@contoh.id', noHp: '081299990002' });
    assert.equal(r.status, 200);
    assert.equal(r.data.role, 'RESTORAN');
    const login = await s.api('POST', '/auth/login', { body: { email: 'uji.resto@contoh.id', password: 'rahasia123' } });
    assert.equal(login.data.user.role, 'RESTORAN');
    assert.ok(!login.data.user.restoranId, 'belum bermitra, diarahkan ke pendaftaran mitra');
  });

  test('[UC10-TC03] Alt 1: email sudah terdaftar ditolak', async () => {
    const r = await daftar({ email: 'pelanggan@antri.in', noHp: '081299990003' });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, PESAN_DUPLIKAT);
    assert.ok(r.data.fields.email);
  });

  test('[UC10-TC04] Alt 1: nomor telepon sudah terdaftar ditolak dan akun tidak tersimpan', async () => {
    const r = await daftar({ email: 'uji.telepon@contoh.id', noHp: '081200000001' });
    assert.equal(r.status, 409);
    assert.equal(r.data.error, PESAN_DUPLIKAT);
    assert.ok(r.data.fields.noHp);
    const login = await s.api('POST', '/auth/login', { body: { email: 'uji.telepon@contoh.id', password: 'rahasia123' } });
    assert.equal(login.status, 401);
  });

  test('[UC10-TC05] Alt 2: kata sandi 7 karakter ditolak (nilai batas)', async () => {
    const r = await daftar({ email: 'uji.sandi7@contoh.id', noHp: '081299990004', password: 'abc1234', konfirmasiPassword: 'abc1234' });
    assert.equal(r.status, 400);
    assert.equal(r.data.fields.password, PESAN_SANDI);
  });

  test('[UC10-TC06] Alt 2: kata sandi tepat 8 karakter diterima (nilai batas)', async () => {
    const r = await daftar({ email: 'uji.sandi8@contoh.id', noHp: '081299990005', password: 'abcd1234', konfirmasiPassword: 'abcd1234' });
    assert.equal(r.status, 200);
  });

  test('[UC10-TC07] Alt 2: konfirmasi kata sandi tidak cocok ditolak, lalu berhasil setelah diperbaiki', async () => {
    const data = { email: 'uji.konfirmasi@contoh.id', noHp: '081299990006' };
    const salah = await daftar({ ...data, konfirmasiPassword: 'rahasia124' });
    assert.equal(salah.status, 400);
    assert.equal(salah.data.fields.password, PESAN_SANDI);
    const benar = await daftar(data);
    assert.equal(benar.status, 200);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC11 Login akun (KF21)
// ---------------------------------------------------------------------------------------------------------------
describe('UC11 Login akun', () => {
  const s = new Sistem();
  const PESAN = 'Email atau kata sandi yang Anda masukkan salah';
  const masuk = (email: string, password: string) => s.api('POST', '/auth/login', { body: { email, password } });

  before(() => s.mulai());
  after(() => s.selesai());

  test('[UC11-TC01] Normal: login pelanggan membentuk sesi berperan Pelanggan', async () => {
    const r = await masuk('pelanggan@antri.in', 'pelanggan123');
    assert.equal(r.status, 200);
    assert.ok(r.data.token);
    assert.equal(r.data.user.role, 'PELANGGAN');
    assert.equal((await s.api('GET', '/auth/me', { token: r.data.token })).status, 200);
  });

  test('[UC11-TC02] Normal: login restoran membentuk sesi berperan Restoran', async () => {
    const r = await masuk('bakso@antri.in', 'restoran123');
    assert.equal(r.status, 200);
    assert.equal(r.data.user.role, 'RESTORAN');
    assert.ok(r.data.user.restoranId);
  });

  test('[UC11-TC03] Normal: login admin membentuk sesi berperan Admin', async () => {
    const r = await masuk('admin@antri.in', 'admin12345');
    assert.equal(r.status, 200);
    assert.equal(r.data.user.role, 'ADMIN');
  });

  test('[UC11-TC04] Alt 1: kata sandi salah ditolak, lalu berhasil dengan kata sandi benar', async () => {
    const salah = await masuk('pelanggan@antri.in', 'pelanggan124');
    assert.equal(salah.status, 401);
    assert.equal(salah.data.error, PESAN);
    assert.equal(salah.data.token, undefined);
    assert.equal((await masuk('pelanggan@antri.in', 'pelanggan123')).status, 200);
  });

  test('[UC11-TC05] Alt 1: email tidak terdaftar ditolak dengan pesan yang sama', async () => {
    const r = await masuk('tidakada@contoh.id', 'pelanggan123');
    assert.equal(r.status, 401);
    assert.equal(r.data.error, PESAN);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC12 Keluar akun (KF21)
// ---------------------------------------------------------------------------------------------------------------
describe('UC12 Keluar akun', () => {
  const s = new Sistem();
  before(() => s.mulai());
  after(() => s.selesai());

  test('[UC12-TC01] Normal: pelanggan keluar, sesi dihapus dan halaman terlindungi tidak dapat dibuka', async () => {
    const token = await s.login('pelanggan@antri.in');
    assert.equal((await s.api('POST', '/auth/logout', { token })).status, 200);
    assert.equal((await s.api('GET', '/auth/me', { token })).status, 401);
    assert.equal((await s.api('GET', '/antrean-saya', { token })).status, 401);
  });

  test('[UC12-TC03] Normal: restoran keluar, sesi dihapus', async () => {
    const token = await s.login('bakso@antri.in', 'restoran123');
    assert.equal((await s.api('POST', '/auth/logout', { token })).status, 200);
    assert.equal((await s.api('GET', '/kelola/antrean', { token })).status, 401);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC13 Penyampaian keluhan pelanggan (KF19)
// ---------------------------------------------------------------------------------------------------------------
describe('UC13 Penyampaian keluhan pelanggan', () => {
  const s = new Sistem();
  let token = '';
  const ISI = 'Estimasi 10 menit, tetapi saya menunggu 35 menit di lokasi.';

  before(async () => {
    await s.mulai();
    token = await s.login('pelanggan@antri.in');
  });
  after(() => s.selesai());

  test('[UC13-TC01] Normal: keluhan tersimpan berstatus Baru dan dapat diperiksa admin', async () => {
    const tiket = (await s.api('GET', '/antrean-saya', { token })).data.find((x: any) => x.tiket.nama_restoran === 'Bakso Mang Ujang');
    const r = await s.api('POST', '/keluhan', {
      token, body: { pesananId: tiket.pesanan.pesanan_id, kategori: 'Waktu tunggu', isi: ISI },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'BARU');
    const saya = (await s.api('GET', '/keluhan/saya', { token })).data;
    assert.ok(saya.some((k: any) => k.isi_keluhan === ISI));
    const admin = await s.login('admin@antri.in', 'admin12345');
    assert.ok((await s.api('GET', '/admin/keluhan', { token: admin })).data.some((k: any) => k.isi_keluhan === ISI));
  });

  test('[UC13-TC02] Normal: formulir tanpa kategori dan isi terlalu singkat ditolak (acuan DPPL C41)', async () => {
    const sebelum = (await s.api('GET', '/keluhan/saya', { token })).data.length;
    const r = await s.api('POST', '/keluhan', { token, body: { kategori: '', isi: 'Lama' } });
    assert.equal(r.status, 400);
    assert.ok(r.data.fields.kategori);
    assert.ok(r.data.fields.isi);
    assert.equal((await s.api('GET', '/keluhan/saya', { token })).data.length, sebelum, 'keluhan tidak tersimpan');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC14 Penanggapan keluhan pelanggan (KF19)
// ---------------------------------------------------------------------------------------------------------------
describe('UC14 Penanggapan keluhan pelanggan', () => {
  const s = new Sistem();
  let admin = '';
  let pelanggan = '';
  let idKeluhan = '';
  const ISI = 'Pesanan saya tertukar dengan pelanggan lain di meja sebelah.';

  before(async () => {
    await s.mulai();
    admin = await s.login('admin@antri.in', 'admin12345');
    pelanggan = await s.login('pelanggan@antri.in');
    const r = await s.api('POST', '/keluhan', { token: pelanggan, body: { kategori: 'Pesanan tidak sesuai', isi: ISI } });
    idKeluhan = r.data.id_keluhan;
  });
  after(() => s.selesai());

  test('[UC14-TC01] Normal: admin melihat daftar keluhan dari semua pelanggan', async () => {
    const r = await s.api('GET', '/admin/keluhan', { token: admin });
    assert.equal(r.status, 200);
    const isi = r.data.map((k: any) => k.isi_keluhan);
    assert.ok(isi.includes(ISI));
    assert.ok(isi.some((x: string) => x.startsWith('Estimasi di aplikasi 15 menit')), 'keluhan dari data awal');
  });

  test('[UC14-TC02] Normal: membuka detail keluhan mengubah status Baru menjadi Dibaca (acuan DPPL C30)', async () => {
    const r = await s.api('GET', `/admin/keluhan/${idKeluhan}`, { token: admin });
    assert.equal(r.status, 200);
    assert.equal(r.data.isi_keluhan, ISI);
    assert.equal(r.data.status, 'DIBACA');
    const dibaca = (await s.api('GET', '/admin/keluhan?status=DIBACA', { token: admin })).data;
    assert.ok(dibaca.some((k: any) => k.id_keluhan === idKeluhan), 'status tersimpan');
  });

  test('[UC14-TC03] Normal: tanggapan admin tersimpan dan terlihat oleh pelanggan (KF19)', async () => {
    const tanggapan = 'Mohon maaf, kami sudah menindaklanjuti restoran terkait.';
    const r = await s.api('POST', `/admin/keluhan/${idKeluhan}/tanggapan`, { token: admin, body: { tanggapan } });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'DITANGGAPI');
    const saya = (await s.api('GET', '/keluhan/saya', { token: pelanggan })).data.find((k: any) => k.id_keluhan === idKeluhan);
    assert.equal(saya.tanggapan, tanggapan);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// UC15 Penghapusan restoran (KF20)
// ---------------------------------------------------------------------------------------------------------------
describe('UC15 Penghapusan restoran', () => {
  const s = new Sistem();
  let admin = '';
  let seblak = '';
  let tiketSeblak = '';

  before(async () => {
    await s.mulai();
    admin = await s.login('admin@antri.in', 'admin12345');
    seblak = await s.idRestoran('Seblak Teh Nining');
    const st = (await s.api('GET', '/antrean-saya', { token: await s.login('seblak1@contoh.id') })).data;
    tiketSeblak = st[0].tiket.id_tiket;
  });
  after(() => s.selesai());

  test('[UC15-TC01] Normal: restoran dihapus, menjadi nonaktif, dan hilang dari daftar pelanggan', async () => {
    const daftar = (await s.api('GET', '/admin/restoran?q=Seblak', { token: admin })).data;
    assert.equal(daftar[0].status_aktif, true);
    const r = await s.api('DELETE', `/admin/restoran/${seblak}`, { token: admin });
    assert.equal(r.status, 200);
    assert.equal(r.data.dihapus, true);
    assert.deepEqual((await s.api('GET', '/restoran?q=Seblak')).data.hasil, []);
    assert.equal((await s.api('GET', `/restoran/${seblak}`)).status, 404);
    assert.equal((await s.api('GET', '/admin/restoran?q=Seblak', { token: admin })).data[0].status_aktif, false);
  });

  test('[UC15-TC03] Normal: antrean aktif pelanggan di restoran yang dihapus dibatalkan (acuan DPPL C33)', async () => {
    const token = await s.login('seblak1@contoh.id');
    const aktif = (await s.api('GET', '/antrean-saya', { token })).data;
    assert.ok(!aktif.some((x: any) => x.tiket.id_tiket === tiketSeblak), 'tiket tidak lagi aktif');
    const st = (await s.api('GET', `/tiket/${tiketSeblak}/status`, { token })).data;
    assert.equal(st.tiket.status_antrean, 'DIBATALKAN');
    const notif = (await s.api('GET', '/notifikasi', { token })).data.items;
    assert.ok(notif.some((n: any) => n.judul === 'Antrean di Seblak Teh Nining dibatalkan'));
  });
});
