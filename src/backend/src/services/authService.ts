import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js'; // adjust to your export name

export class AppError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'ganti-di-env';
const SESSION_HOURS = 8;

type AkunInput = { username: string; email: string; noHp?: string; password: string };

async function registerAkun(role: "PELANGGAN" | "RESTORAN", input: AkunInput & { nama?: string }) {
  if (input.password.length < 8) throw new AppError(400, "Password minimal 8 karakter");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(input.password, 10);

    const { rows } = await client.query(
      `INSERT INTO pengguna (username, email, no_hp, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_pengguna, username, email, role`,
      [input.username, input.email, input.noHp || null, hash, role]
    );

    // only customers get a row in `pelanggan`
    if (role === "PELANGGAN") {
      await client.query(
        `INSERT INTO pelanggan (id_akun, nama, no_hp, email) VALUES ($1, $2, $3, $4)`,
        [rows[0].id_pengguna, input.nama, input.noHp || null, input.email]
      );
    }

    await client.query("COMMIT");
    return rows[0];
  } catch (e: any) {
    await client.query('ROLLBACK');
    await client.query("ROLLBACK");
    if (e.code === "23505") throw new AppError(409, "Username, email, atau nomor HP sudah terdaftar");
    throw e;
  } finally {
    client.release();
  }
}

export const registerPelanggan = (i: AkunInput & { nama: string }) => registerAkun("PELANGGAN", i);
export const registerRestoran = (i: AkunInput) => registerAkun("RESTORAN", i);

export async function login(identifier: string, password: string) {
  const { rows } = await pool.query(
    `SELECT * FROM pengguna WHERE username = $1 OR email = $1`,
    [identifier]
  );
  const user = rows[0];
  // same message for both cases so attackers can't tell which accounts exist
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Username/email atau password salah');
  }

  const token = jwt.sign(
    { sub: user.id_pengguna, role: user.role },
    JWT_SECRET,
    { expiresIn: `${SESSION_HOURS}h` }
  );
  await pool.query(
    `INSERT INTO sesi_pengguna (id_pengguna, token, waktu_kedaluwarsa)
     VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)`,
    [user.id_pengguna, token, String(SESSION_HOURS)]
  );

  return {
    token,
    user: { id: user.id_pengguna, username: user.username, email: user.email, role: user.role },
  };
}

export async function logout(token: string, userId: string) {
  await pool.query(`UPDATE sesi_pengguna SET status_aktif = FALSE WHERE token = $1`, [token]);
  await pool.query(`UPDATE pengguna SET terakhir_logout = NOW() WHERE id_pengguna = $1`, [userId]);
}

export { JWT_SECRET };