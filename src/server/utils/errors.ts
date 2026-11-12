/** Kesalahan yang dapat ditampilkan ke pengguna, dengan kode status HTTP. */
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: Record<string, unknown>) => new AppError(400, msg, details);
export const unauthorized = (msg = 'Silakan login terlebih dahulu') => new AppError(401, msg);
export const forbidden = (msg = 'Anda tidak memiliki akses ke fitur ini') => new AppError(403, msg);
export const notFound = (msg = 'Data tidak ditemukan') => new AppError(404, msg);
export const conflict = (msg: string, details?: Record<string, unknown>) => new AppError(409, msg, details);
