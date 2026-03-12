import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg"; // Ganti better-sqlite3 ke pg
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi Koneksi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Diperlukan untuk Supabase/Cloud DB
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Helper untuk menjalankan query (karena pg menggunakan async/await)
  const query = (text: string, params?: any[]) => pool.query(text, params);

  // --- API Routes ---

  // Auth Routes
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

  // Get Items
  app.get("/api/items", async (req, res) => {
    try {
      const result = await query("SELECT * FROM items ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Gagal mengambil data" });
    }
  });

  // Post Item
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

  // Put Item
  app.put("/api/items/:id", async (req, res) => {
    const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
    const sql = `
      UPDATE items SET name=$1, nibar=$2, register_code=$3, item_code=$4, specifications=$5, brand_type=$6, procurement_year=$7, 
      user_name=$8, user_status=$9, user_position=$10, location=$11, condition=$12, photo_url=$13, notes=$14 
      WHERE id=$15 RETURNING *`;
    
    try {
      const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes, req.params.id]);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Gagal update item" });
    }
  });

  // Delete Item
  app.delete("/api/items/:id", async (req, res) => {
    try {
      await query("DELETE FROM items WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Gagal menghapus item" });
    }
  });

  // --- Report Routes ---
  app.get("/api/reports", async (req, res) => {
    const result = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(result.rows);
  });

  app.post("/api/reports", async (req, res) => {
    const { item_name, user_name, location, report_date, description } = req.body;
    const result = await query(
      "INSERT INTO reports (item_name, user_name, location, report_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name, user_name, location, report_date, description]
    );
    res.status(201).json(result.rows[0]);
  });

  // --- Vite / Static Files ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => console.error("Startup Error:", err));