import { api } from './api.js';

export interface Konfigurasi {
  biayaLayanan: number;
  maxBookingDays: number;
  paymentTimeoutMinutes: number;
  autoDequeueMinutes: number;
  sandboxPembayaran: boolean;
}

let cache: Promise<Konfigurasi> | null = null;
export function konfigurasi(): Promise<Konfigurasi> {
  cache ??= api.get<Konfigurasi>('/config').catch((e) => {
    cache = null;
    throw e;
  });
  return cache;
}
