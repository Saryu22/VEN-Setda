import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// 1. Inisialisasi Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

// [NEW] Route Login
// Menangani request dari Login.tsx
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  console.log(`Log: Mencoba login - User: ${username}`);

  // Logika autentikasi sederhana sesuai akun percobaan
  if (username === "admin" && password === "admin123") {
    res.json({ 
      id: 1, 
      username: "admin", 
      role: "admin", 
      name: "Administrator Setda" 
    });
  } else if (username === "user" && password === "user123") {
    res.json({ 
      id: 2, 
      username: "user", 
      role: "user", 
      name: "Staff Setda" 
    });
  } else {
    res.status(401).json({ error: "Username atau password salah!" });
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", server: "Vercel Serverless" });
});

// Get All Items
app.get("/api/items", async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM "items" ORDER BY id DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ADD NEW ITEM
app.post("/api/items", async (req, res) => {
  const { 
    name, nibar, register_code, item_code, specifications, 
    brand_type, procurement_year, user_name, user_status, 
    user_position, location, condition, photo_url, notes 
  } = req.body;

  if (!name || !item_code) {
    return res.status(400).json({ error: "Nama barang dan Kode Barang wajib diisi" });
  }

  const queryText = `
    INSERT INTO "items" (
      name, nibar, register_code, item_code, specifications, 
      brand_type, procurement_year, user_name, user_status, 
      user_position, location, condition, photo_url, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
    RETURNING *`;

  const values = [
    name, nibar || null, register_code || null, item_code, specifications || null, 
    brand_type || null, 
    procurement_year ? parseInt(procurement_year.toString()) : null,
    user_name || null, user_status || null, user_position || null, 
    location || null, condition || 'B', photo_url || null, notes || null
  ];

  try {
    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ error: "Gagal: Kode Barang atau Kode Register sudah terdaftar." });
    } else {
      res.status(500).json({ error: "Database error: " + err.message });
    }
  }
});

// Update Item
app.put("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const queryText = `
    UPDATE "items" SET 
      name=$1, nibar=$2, register_code=$3, item_code=$4, specifications=$5,
      brand_type=$6, procurement_year=$7, user_name=$8, user_status=$9,
      user_position=$10, location=$11, condition=$12, photo_url=$13, notes=$14
    WHERE id=$15 RETURNING *`;

  const values = [
    data.name, data.nibar, data.register_code, data.item_code, data.specifications,
    data.brand_type, data.procurement_year, data.user_name, data.user_status,
    data.user_position, data.location, data.condition, data.photo_url, data.notes,
    id
  ];

  try {
    const result = await db.query(queryText, values);
    if (result.rowCount === 0) return res.status(404).json({ error: "Barang tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;

// --- TAMBAHAN UNTUK JALAN DI LOKAL ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
🚀 Server Backend Standby!
📡 Port: ${PORT}
🔗 URL: http://localhost:${PORT}
📂 API Login: http://localhost:${PORT}/api/login
    `);
  });
}