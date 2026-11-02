export class AppError extends Error {
  constructor(public status: number, public code: string, msg: string, public data?: unknown) {
    super(msg);
  }
}
