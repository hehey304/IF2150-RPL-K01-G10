/**
 * Pengujian REST API (hak akses & routing). Penanggung jawab: Fauzi.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { App } from '../server/app.js';
import { appUji } from './helpers.js';

let app: App;
before(async () => {
  app = await appUji();
});
after(async () => {
  await app.close();
});

describe('REST API', () => {
  test('endpoint terlindungi memerlukan login dan peran yang sesuai', async () => {
    const server = app.app.listen(0);
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
    try {
      assert.equal((await fetch(`${base}/kelola/antrean`)).status, 401);
      const login = await fetch(`${base}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'pelanggan@antri.in', password: 'pelanggan123' }),
      });
      const { token } = await login.json();
      const auth = { Authorization: `Bearer ${token}` };
      assert.equal((await fetch(`${base}/admin/keluhan`, { headers: auth })).status, 403);
      assert.equal((await fetch(`${base}/antrean-saya`, { headers: auth })).status, 200);
      const cari = await (await fetch(`${base}/restoran?q=bakso`)).json();
      assert.ok(cari.hasil.length >= 1);
      assert.equal((await fetch(`${base}/tidak-ada`)).status, 404);
    } finally {
      server.close();
    }
  });
});
