import { useAuthStore } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// Error dengan detail dari server (dipakai UC02 untuk kode STOK_HABIS, BOOKING_TIDAK_VALID, dst.)
export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;
  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  console.log("Token saat fetch tagihan:", token);
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) useAuthStore.getState().clear(); // expired session
    throw new ApiError(data.message ?? 'Terjadi kesalahan', res.status, data.code, data.data);
  }
  return data as T;
}