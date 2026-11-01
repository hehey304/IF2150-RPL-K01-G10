import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js";
import authRoutes from "./routes/auth.js";
import { AppError } from "./services/authService.js";
// import { authenticate, requireRole } from "./middleware/auth.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const r = await pool.query("SELECT NOW()");
  res.json({ ok: true, time: r.rows[0].now });
});

app.use("/api/auth", authRoutes);
// example of a role-protected route:
// app.use("/api/admin", authenticate, requireRole("ADMIN"), adminRoutes);

// error handler: must come AFTER all routes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan server" });
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`API jalan di http://localhost:${PORT}`));