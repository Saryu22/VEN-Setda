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

// MIDDLEWARE: Membersihkan query path dari Vercel
app.use((req, res, next) => {
  if (req.query.path) delete req.query.path;
  next();
});

// ==========================================
// 1. API ITEMS (/api/items)
// ==========================================
app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/items", async (req, res) => {
  const b = req.body;
  const sql = `INSERT INTO items (name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
  try {
    const result = await query(sql, [
      b.name, b.nibar, b.register_code || b.registerCode, 
      b.item_code || b.itemCode, b.specifications, b.brand_type || b.brandType, 
      b.procurement_year || b.procurementYear, b.user_name || b.userName, 
      b.user_status || b.userStatus, b.user_position || b.userPosition, 
      b.location, b.condition, b.photo_url || b.photoUrl, b.notes
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. API REPORTS (/api/reports)
// ==========================================
app.get("/api/reports", async (req, res) => {
  try {
    const result = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// UPDATE STATUS & LOKASI PERBAIKAN (Sesuai fungsi Ke di frontend)
// URL sekarang: /api/reports/:id/status
app.put("/api/reports/:id/status", async (req, res) => {
  const { status, repair_location, repair_date, repair_description } = req.body;
  try {
    const result = await query(
      `UPDATE reports 
       SET status=$1, repair_location=$2, repair_date=$3, repair_description=$4 
       WHERE id=$5 RETURNING *`,
      [status, repair_location, repair_date, repair_description, req.params.id]
    );
    
    if (result.rowCount === 0) return res.status(404).json({ error: "Laporan tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. API REQUESTS (/api/requests)
// ==========================================
app.get("/api/requests", async (req, res) => {
  try {
    const result = await query("SELECT * FROM requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/requests", async (req, res) => {
  const { item_name, quantity, urgency, notes, requester_name } = req.body;
  try {
    const result = await query(
      "INSERT INTO requests (item_name, quantity, urgency, notes, requester_name) VALUES ($1, $2, $3, $4, $5) RETURNING *", 
      [item_name, quantity, urgency, notes, requester_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE STATUS REQUEST (Sesuai fungsi Pt di frontend)
// URL sekarang: /api/requests/:id/status
app.put("/api/requests/:id/status", async (req, res) => {
  try {
    const result = await query(
      "UPDATE requests SET status=$1 WHERE id=$2 RETURNING *", 
      [req.body.status, req.params.id]
    );
    
    if (result.rowCount === 0) return res.status(404).json({ error: "Request tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AUTH & STATIC
// ==========================================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await query(
    "SELECT id, username, role FROM users WHERE username = $1 AND password = $2", 
    [username, password]
  );
  result.rows.length > 0 ? res.json(result.rows[0]) : res.status(401).json({ error: "Gagal login" });
});

const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) res.sendFile(path.join(distPath, "index.html"));
});

export default app;