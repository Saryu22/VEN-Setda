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
    result.rows.length > 0 ? res.json(result.rows[0]) : res.status(401).json({ error: "Salah login" });
  } catch (err: any) {
    res.status(500).json({ error: "DB Error" });
  }
});

// --- 2. ITEMS ---
app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

// GET Single Item (Penting untuk halaman Detail/Edit)
app.get("/api/items/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items WHERE id = $1", [req.params.id]);
    result.rows.length > 0 ? res.json(result.rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.post("/api/items", async (req, res) => {
  const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
  const sql = `INSERT INTO items (name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`;
  try {
    const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Save failed" }); }
});

app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes } = req.body;
  const sql = `UPDATE items SET name=$1, nibar=$2, register_code=$3, item_code=$4, specifications=$5, brand_type=$6, procurement_year=$7, user_name=$8, user_status=$9, user_position=$10, location=$11, condition=$12, photo_url=$13, notes=$14 WHERE id=$15 RETURNING *`;
  try {
    const result = await query(sql, [name, nibar, register_code, item_code, specifications, brand_type, procurement_year, user_name, user_status, user_position, location, condition, photo_url, notes, id]);
    res.json(result.rows[0] || { error: "Not found" });
  } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete("/api/items/:id", async (req, res) => {
  try { await query("DELETE FROM items WHERE id = $1", [req.params.id]); res.status(204).send(); }
  catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// --- 3. REPORTS ---
app.get("/api/reports", async (req, res) => {
  try {
    const result = await query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

app.post("/api/reports", async (req, res) => {
  const { item_name, user_name, location, report_date, description } = req.body;
  try {
    const result = await query("INSERT INTO reports (item_name, user_name, location, report_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *", [item_name, user_name, location, report_date, description]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Report failed" }); }
});

// Update Status Report (Penting untuk Admin)
app.put("/api/reports/:id/status", async (req, res) => {
  try {
    const result = await query("UPDATE reports SET status = $1 WHERE id = $2 RETURNING *", [req.body.status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Status update failed" }); }
});

// --- 4. REQUESTS ---
app.get("/api/requests", async (req, res) => {
  try {
    const result = await query("SELECT * FROM requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Fetch failed" }); }
});

app.post("/api/requests", async (req, res) => {
  const { item_name, quantity, urgency, notes, requester_name } = req.body;
  try {
    const result = await query("INSERT INTO requests (item_name, quantity, urgency, notes, requester_name) VALUES ($1, $2, $3, $4, $5) RETURNING *", [item_name, quantity, urgency, notes, requester_name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Request failed" }); }
});

// --- SPA ROUTING ---
const distPath = path.resolve(__dirname, "..", "dist");
app.use(express.static(distPath));

app.get("*", (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: "API not found" });
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;