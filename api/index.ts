import express from "express";
import { createServer as createViteServer } from "vite";
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

async function startServer() {
  const app = express();
  // Vercel akan otomatis menentukan PORT, jadi gunakan process.env.PORT
  const PORT = process.env.PORT || 3000;

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
      console.error(err);
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

  app.post("/api/items", async (req, res) => {
    const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
    const sql = `
      INSERT INTO items (name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
    
    try {
      const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Gagal menyimpan item" });
    }
  });

  // --- Vite / Static Files (Perbaikan Path) ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // KARENA FILE ADA DI DALAM api/, NAIK 1 LEVEL (..) UNTUK CARI dist
    const distPath = path.resolve(__dirname, "..", "dist");
    
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Penting untuk local development, Vercel akan menangani listener-nya sendiri
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer().catch(err => console.error("Startup Error:", err));

// Tambahan export untuk Vercel Serverless Function
export default startServer;