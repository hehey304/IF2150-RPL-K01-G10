export type Role = 'PELANGGAN' | 'RESTORAN' | 'ADMIN';
export interface User { id: string; username: string; email: string; role: Role }

export const HOME_BY_ROLE: Record<Role, string> = {
  PELANGGAN: '/pelanggan',
  RESTORAN: '/restoran',
  ADMIN: '/admin',
};