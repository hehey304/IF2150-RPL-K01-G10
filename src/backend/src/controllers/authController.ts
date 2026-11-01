import type { Request, Response, NextFunction } from "express";
import * as auth from "../services/authService.js";

const wrap = (fn: (req: Request, res: Response) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export const register = wrap(async (req, res) => {
  const { nama, username, email, noHp, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Data belum lengkap" });
  }
  if (role === "RESTORAN") {
    const user = await auth.registerRestoran({ username, email, noHp, password });
    return res.status(201).json({ user });
  }
  // anything else (including "ADMIN" or missing) is treated as PELANGGAN
  if (!nama) return res.status(400).json({ message: "Nama wajib diisi" });
  const user = await auth.registerPelanggan({ nama, username, email, noHp, password });
  res.status(201).json({ user });
});

export const login = wrap(async (req, res) => {
  const { identifier, password } = req.body;
  res.json(await auth.login(identifier, password));
});

export const logout = wrap(async (req, res) => {
  await auth.logout(req.auth!.token, req.auth!.userId);
  res.json({ message: 'Berhasil logout' });
});