import { api } from './client';
import type { User } from '../types';

export const loginApi = (identifier: string, password: string) =>
  api<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

export const registerApi = (body: {
  nama: string; username: string; email: string; noHp?: string; password: string;
}) => api<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const logoutApi = () => api('/auth/logout', { method: 'POST' });