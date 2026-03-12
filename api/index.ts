import express from "express";
import pg from "pg"; 
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi Koneksi PostgreSQL dengan konfigurasi Pool yang lebih stabil
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Batasi jumlah koneksi maksimal
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper untuk menjalankan query
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
  } catch (err: any) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    console.error("Fetch Items Error:", err.message);
    res.status(500).json({ error: "Gagal mengambil data" });
  }
});

// --- Penanganan Static Files ---
// Pastikan folder 'dist' hasil build Vite sudah ada
const distPath = path.resolve(__dirname, "..", "dist");

app.use(express.static(distPath));

// Route terakhir untuk menangani SPA (Single Page Application)
app.get("*", (req, res) => {
  // Jika request bukan untuk API, kirim index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) {
        res.status(404).send("Frontend build not found. Make sure to run 'npm run build'.");
      }
    });
  }
});

// EXPORT UNTUK VERCEL
export default app;