import express from "express";
import pg from "pg"; 
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inisialisasi Pool PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const query = (text: string, params?: any[]) => pool.query(text, params);

// --- 1. AUTH ROUTES ---
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

// --- 2. ITEMS ROUTES (INVENTARIS) ---
app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    console.error("Fetch Items Error:", err.message);
    res.status(500).json({ error: "Gagal mengambil data items" });
  }
});

app.post("/api/items", async (req, res) => {
  const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
  const sql = `INSERT INTO items (name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
  try {
    const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Insert Item Error:", err.message);
    res.status(500).json({ error: "Gagal menyimpan item" });
  }
});

// ROUTE EDIT (PUT) - Ditambahkan untuk mendukung fungsionalitas edit di frontend
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
  
  const sql = `
    UPDATE items 
    SET name=$1, nibar=$2, register_code=$3, item_code=$4, specifications=$5, brand_type=$6, 
        procurement_year=$7, user_name=$8, user_status=$9, user_position=$10, location=$11, 
        condition=$12, photo_url=$13, notes=$14
    WHERE id=$15 RETURNING *`;
    
  try {
    const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes, id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Item tidak ditemukan" });
    }
  } catch (err: any) {
    console.error("Update Error:", err.message);
    res.status(500).json({ error: "Gagal mengupdate item" });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    await query("DELETE FROM items WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err: any) {
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: "Gagal menghapus item" });
  }
});

// --- 3. REPORTS ROUTES (LAPORAN) ---
app.get("/api/reports", async (req, res) => {
  try {
    const result = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    console.error("Fetch Reports Error:", err.message);
    res.status(500).json({ error: "Gagal mengambil data laporan" });
  }
});

app.post("/api/reports", async (req, res) => {
  const { item_name, user_name, location, report_date, description } = req.body;
  try {
    const result = await query(
      "INSERT INTO reports (item_name, user_name, location, report_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name, user_name, location, report_date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Insert Report Error:", err.message);
    res.status(500).json({ error: "Gagal membuat laporan" });
  }
});

// --- 4. STATIC FILES & SPA ROUTING ---
const distPath = path.resolve(__dirname, "..", "dist");

app.use(express.static(distPath));

// Penanganan rute terakhir
app.get("*", (req, res) => {
  // Jika rute diawali /api tapi tidak cocok dengan route di atas, kirim JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "API Endpoint not found" });
  }
  
  // Jika rute untuk frontend, kirim index.html
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(404).send("Frontend build not found. Jalankan 'npm run build'!");
    }
  });
});

export default app;