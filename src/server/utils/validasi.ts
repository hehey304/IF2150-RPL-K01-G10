/** Fungsi validasi masukan yang dipakai beberapa controller. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NO_HP_RE = /^(\+62|62|0)8\d{7,12}$/;

export function teks(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Mengubah masukan menjadi bilangan bulat >= 0, atau null jika tidak valid (angka negatif / bukan angka). */
export function bilanganCacah(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 ? v : null;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
}

export function normalisasiNoHp(v: string): string {
  return v.replace(/[\s-]/g, '');
}
