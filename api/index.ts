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

// --- 2. ITEMS ---
app.get("/api/items", async (req, res) => {
  try {
    const result = await query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Fetch failed", details: err.message });
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
    res.status(500).json({ error: "Save failed", details: err.message });
  }
});

// --- 3. REPORTS ---
app.post("/api/reports", async (req, res) => {
  const { item_name, itemName, user_name, userName, location, report_date, reportDate, description } = req.body;
  try {
    const result = await query(
      "INSERT INTO reports (item_name, user_name, location, report_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name || itemName, user_name || userName, location, report_date || reportDate, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Report failed", details: err.message });
  }
});

// --- 4. REQUESTS (PENTING: Perhatikan endpoint ini) ---
app.get("/api/requests", async (req, res) => {
  try {
    const result = await query("SELECT * FROM requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: "Fetch requests failed", details: err.message });
  }
});

app.post("/api/requests", async (req, res) => {
  const { item_name, itemName, quantity, urgency, notes, requester_name, requesterName } = req.body;
  try {
    const result = await query(
      "INSERT INTO requests (item_name, quantity, urgency, notes, requester_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [item_name || itemName, quantity, urgency, notes, requester_name || requesterName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: "Insert request failed", details: err.message });
  }
});

// --- HANDLING STATIC FILES & SPA ---
// Di Vercel, folder 'dist' biasanya berada sejajar dengan folder 'api'
const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));

// Middleware khusus untuk menangkap rute API yang salah ketik agar tidak dilempar ke index.html
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

// Mengarahkan sisa rute ke index.html (untuk SPA React/Vite)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("index.html not found. Make sure you have built your frontend.");
    }
  });
});

export default app;