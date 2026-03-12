import express from "express";
import pg from "pg"; 
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi Koneksi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const query = (text: string, params?: any[]) => pool.query(text, params);

// --- API Routes ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await query(
      "SELECT id, username, role FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: "Username atau password salah" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil data" });
  }
});

// Tambahkan route API lainnya di sini (items POST, reports, dll) sesuai kebutuhan

// --- Static Files (HANYA untuk Production) ---
const distPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// EXPORT UNTUK VERCEL (Paling Penting)
export default app;