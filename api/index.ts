import express from "express";
import pg from "pg"; 
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const query = (text: string, params?: any[]) => pool.query(text, params);

// --- 1. AUTH ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await query("SELECT id, username, role FROM users WHERE username = $1 AND password = $2", [username, password]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: "Username atau password salah" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

// --- 2. ITEMS (INVENTARIS) ---
app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal mengambil data items", details: err.message });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items WHERE id = $1", [req.params.id]);
    result.rows.length > 0 ? res.json(result.rows[0]) : res.status(404).json({ error: "Item tidak ditemukan" });
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post("/api/items", async (req, res) => {
  const b = req.body;
  const sql = `INSERT INTO items (name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
  
  const values = [
    b.name, b.nibar, b.register_code || b.registerCode, b.item_code || b.itemCode, 
    b.specifications, b.brand_type || b.brandType, b.procurement_year || b.procurementYear, 
    b.user_name || b.userName, b.user_status || b.userStatus, b.user_position || b.userPosition, 
    b.location, b.condition, b.photo_url || b.photoUrl, b.notes
  ];

  try {
    const result = await query(sql, values);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal menyimpan item", details: err.message });
  }
});

// --- 3. REPORTS (LAPORAN KERUSAKAN) ---
app.post("/api/reports", async (req, res) => {
  const { item_name, itemName, user_name, userName, location, report_date, reportDate, description } = req.body;
  try {
    const result = await query(
      "INSERT INTO reports (item_name, user_name, location, report_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name || itemName, user_name || userName, location, report_date || reportDate, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal mengirim laporan", details: err.message });
  }
});

// --- 4. REQUESTS (PERMINTAAN BARANG) ---
app.post("/api/requests", async (req, res) => {
  // Menangani item_name vs itemName dan requester_name vs requesterName
  const { item_name, itemName, quantity, urgency, notes, requester_name, requesterName } = req.body;
  try {
    const result = await query(
      "INSERT INTO requests (item_name, quantity, urgency, notes, requester_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name || itemName, quantity, urgency, notes, requester_name || requesterName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("Request POST Error:", err.message);
    res.status(500).json({ error: "Gagal menyimpan permintaan", details: err.message });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const result = await query("SELECT * FROM requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal mengambil data permintaan", details: err.message });
  }
});

// --- SPA ROUTING ---
const distPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: "API Endpoint not found" });
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;