import { session } from './session.js';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: Record<string, any> = {},
  ) {
    super(message);
  }
  get fields(): Record<string, string> {
    return (this.data.fields as Record<string, string>) ?? {};
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = session.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${url}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi Anda.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      session.hapus();
      window.dispatchEvent(new CustomEvent('sesi-berakhir'));
    }
    throw new ApiError(res.status, data.error ?? 'Terjadi kesalahan', data);
  }
  return data as T;
}

export const api = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T = any>(url: string, body?: unknown) => request<T>('PUT', url, body ?? {}),
  patch: <T = any>(url: string, body?: unknown) => request<T>('PATCH', url, body ?? {}),
  del: <T = any>(url: string) => request<T>('DELETE', url),
};

/** Berlangganan pembaruan real-time antrean suatu restoran (SSE). Mengembalikan fungsi penutup. */
export function pantauRestoran(restoranId: string, onUbah: (alasan: string) => void): () => void {
  const es = new EventSource(`/api/restoran/${encodeURIComponent(restoranId)}/stream`);
  es.addEventListener('antrean', (e) => {
    try {
      onUbah(JSON.parse((e as MessageEvent).data).alasan);
    } catch {
      onUbah('');
    }
  });
  return () => es.close();
}
