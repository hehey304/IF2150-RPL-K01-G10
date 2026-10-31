import express from "express";
import cors from "cors";
import { pool } from "./db/pool.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const r = await pool.query("SELECT NOW()");
  res.json({ ok: true, time: r.rows[0].now });
});

app.listen(process.env.PORT ?? 4000, () =>
  console.log("API jalan di http://localhost:4000")
);