import crypto from 'node:crypto';

/** Membuat ID unik berawalan, misalnya "PSN-1a2b3c4d5e6f". */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Format nomor antrean tampilan, contoh 27 -> "A-027". */
export function formatNomorAntrean(nomor: number): string {
  return `A-${String(nomor).padStart(3, '0')}`;
}
