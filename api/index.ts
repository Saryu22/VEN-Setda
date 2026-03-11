import express from "express";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors"; // Tambahkan cors untuk keamanan frontend-backend

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Inisialisasi Database dengan pengecekan koneksi
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test koneksi saat server nyala
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Database connection failed:', err.stack);
  }
  console.log('✅ Connected to Database');
  release();
});

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};

// 2. Middleware
app.use(cors()); // Mengizinkan request dari frontend (Vercel/Local)
app.use(express.json({ limit: '50mb' })); // Penting untuk kirim gambar Base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API ROUTES ---

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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

// ADD NEW ITEM (Perbaikan logika insert)
app.post("/api/items", async (req, res) => {
  console.log("📥 Incoming Request Body:", req.body); // Untuk debug di log Vercel

  const { 
    name, nibar, register_code, item_code, specifications, 
    brand_type, procurement_year, user_name, user_status, 
    user_position, location, condition, photo_url, notes 
  } = req.body;

  // Validasi Ketat
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
    name, 
    nibar || null, 
    register_code || null, 
    item_code, 
    specifications || null, 
    brand_type || null, 
    procurement_year ? parseInt(procurement_year.toString()) : null,
    user_name || null, 
    user_status || null, 
    user_position || null, 
    location || null, 
    condition || 'B', 
    photo_url || null, 
    notes || null
  ];

  try {
    const result = await db.query(queryText, values);
    console.log("✅ Data saved successfully:", result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ DB Insert Error:", err.message);
    
    // Memberikan pesan spesifik jika error adalah duplikat data
    if (err.code === '23505') {
      res.status(400).json({ error: "Gagal: Kode Barang atau Kode Register sudah terdaftar." });
    } else {
      res.status(500).json({ error: "Database error: " + err.message });
    }
  }
});

// Update Item (PENTING untuk fitur Edit)
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

// --- PRODUCTION SERVING ---
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

export default app;