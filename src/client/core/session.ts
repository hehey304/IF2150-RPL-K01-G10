/** Penyimpanan token sesi di sisi klien ("Ingat saya" -> localStorage, selain itu sessionStorage). */
export type Role = 'PELANGGAN' | 'RESTORAN' | 'ADMIN';

export interface User {
  idPengguna: string;
  nama: string;
  email: string;
  noHp: string | null;
  role: Role;
  pelangganId: string | null;
  restoranId: string | null;
}

const KEY = 'antriin.token';

function store(): Storage[] {
  const s: Storage[] = [];
  try {
    s.push(localStorage, sessionStorage);
  } catch {
    /* penyimpanan diblokir */
  }
  return s;
}

let user: User | null = null;

export const session = {
  get token(): string {
    for (const s of store()) {
      const t = s.getItem(KEY);
      if (t) return t;
    }
    return '';
  },
  simpan(token: string, ingat: boolean): void {
    this.hapus();
    try {
      (ingat ? localStorage : sessionStorage).setItem(KEY, token);
    } catch {
      /* abaikan */
    }
  },
  hapus(): void {
    for (const s of store()) s.removeItem(KEY);
    user = null;
  },
  get user(): User | null {
    return user;
  },
  set user(u: User | null) {
    user = u;
  },
};
