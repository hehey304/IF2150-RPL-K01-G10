/**
 * Keranjang (C05): draf pesanan pelanggan sebelum checkout. Disimpan di sisi klien;
 * harga final selalu dihitung ulang server saat pesanan dibuat.
 */
export interface ItemKeranjang {
  menuId: string;
  namaMenu: string;
  harga: number;
  jumlah: number;
}

export type Mode = 'DINE_IN' | 'TAKEAWAY' | 'BOOKING';

export interface DataKeranjang {
  restoranId: string | null;
  namaRestoran: string;
  items: ItemKeranjang[];
  mode: Mode;
  jumlahRombongan: number;
  tanggalBooking: string | null;
  slotWaktuBooking: string | null;
}

export interface Penyimpanan {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export const MAKS_PER_ITEM = 50;

export class Keranjang {
  data: DataKeranjang;

  constructor(
    private store: Penyimpanan | null = null,
    private key = 'antriin.keranjang',
  ) {
    this.data = Keranjang.kosong();
    try {
      const raw = store?.getItem(key);
      if (raw) this.data = { ...Keranjang.kosong(), ...JSON.parse(raw) };
    } catch {
      this.data = Keranjang.kosong();
    }
  }

  static kosong(): DataKeranjang {
    return {
      restoranId: null,
      namaRestoran: '',
      items: [],
      mode: 'DINE_IN',
      jumlahRombongan: 2,
      tanggalBooking: null,
      slotWaktuBooking: null,
    };
  }

  private simpan(): void {
    try {
      this.store?.setItem(this.key, JSON.stringify(this.data));
    } catch {
      /* penyimpanan penuh/diblokir: keranjang tetap ada di memori */
    }
  }

  /** Apakah menambahkan menu dari restoran lain akan mengosongkan keranjang. */
  bedaRestoran(restoranId: string): boolean {
    return this.data.restoranId !== null && this.data.restoranId !== restoranId && this.data.items.length > 0;
  }

  /** tambahItem(): menambah jumlah menu (membuat keranjang baru bila restoran berbeda). */
  tambahItem(restoran: { restoranId: string; namaRestoran: string }, menu: Omit<ItemKeranjang, 'jumlah'>, jumlah = 1): void {
    if (jumlah <= 0) throw new Error('Jumlah menu tidak valid');
    if (this.bedaRestoran(restoran.restoranId)) this.kosongkanKeranjang();
    this.data.restoranId = restoran.restoranId;
    this.data.namaRestoran = restoran.namaRestoran;
    const ada = this.data.items.find((i) => i.menuId === menu.menuId);
    if (ada) ada.jumlah = Math.min(MAKS_PER_ITEM, ada.jumlah + jumlah);
    else this.data.items.push({ ...menu, jumlah: Math.min(MAKS_PER_ITEM, jumlah) });
    this.simpan();
  }

  /** Mengatur jumlah suatu menu; 0 berarti menghapus. */
  ubahJumlah(menuId: string, jumlah: number): void {
    if (jumlah <= 0) return this.hapusItem(menuId);
    const item = this.data.items.find((i) => i.menuId === menuId);
    if (item) item.jumlah = Math.min(MAKS_PER_ITEM, Math.floor(jumlah));
    this.simpan();
  }

  /** hapusItem(). */
  hapusItem(menuId: string): void {
    this.data.items = this.data.items.filter((i) => i.menuId !== menuId);
    if (this.data.items.length === 0) this.data.restoranId = null;
    this.simpan();
  }

  jumlahItem(menuId: string): number {
    return this.data.items.find((i) => i.menuId === menuId)?.jumlah ?? 0;
  }

  get totalItem(): number {
    return this.data.items.reduce((s, i) => s + i.jumlah, 0);
  }

  /** hitungTotal(): subtotal menu (belum termasuk biaya layanan). */
  hitungTotal(): number {
    return this.data.items.reduce((s, i) => s + i.harga * i.jumlah, 0);
  }

  aturMode(mode: Mode): void {
    this.data.mode = mode;
    if (mode !== 'BOOKING') {
      this.data.tanggalBooking = null;
      this.data.slotWaktuBooking = null;
    }
    this.simpan();
  }

  aturRombongan(n: number): void {
    this.data.jumlahRombongan = Math.max(1, Math.min(20, Math.floor(n)));
    this.simpan();
  }

  aturJadwal(tanggal: string, slot: string, rombongan: number): void {
    this.data.mode = 'BOOKING';
    this.data.tanggalBooking = tanggal;
    this.data.slotWaktuBooking = slot;
    this.aturRombongan(rombongan);
  }

  /** kosongkanKeranjang(). */
  kosongkanKeranjang(): void {
    this.data = { ...Keranjang.kosong(), mode: this.data.mode, jumlahRombongan: this.data.jumlahRombongan };
    if (this.data.mode === 'BOOKING') this.data.mode = 'DINE_IN';
    this.simpan();
  }

  /** Payload untuk POST /api/pesanan. */
  keRequest() {
    return {
      restoranId: this.data.restoranId,
      mode: this.data.mode,
      jumlahRombongan: this.data.jumlahRombongan,
      tanggalBooking: this.data.tanggalBooking,
      slotWaktuBooking: this.data.slotWaktuBooking,
      items: this.data.items.map((i) => ({ menuId: i.menuId, jumlah: i.jumlah })),
    };
  }
}

let instance: Keranjang | null = null;
/** Keranjang global aplikasi (tersimpan di localStorage). */
export function keranjang(): Keranjang {
  if (!instance) {
    let store: Penyimpanan | null = null;
    try {
      store = window.localStorage;
    } catch {
      store = null;
    }
    instance = new Keranjang(store);
  }
  return instance;
}
