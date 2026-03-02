import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_name TEXT,
    procurement_year INTEGER,
    location TEXT,
    condition TEXT,
    specifications TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    location TEXT NOT NULL,
    report_date TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed users if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  insertUser.run("admin", "admin123", "admin");
  insertUser.run("user", "user123", "user");
}

// Migration: Add user_name if it doesn't exist
try {
  db.prepare("ALTER TABLE items ADD COLUMN user_name TEXT").run();
} catch (e) {}

// Migration: Add item_name to reports if it doesn't exist
try {
  db.prepare("ALTER TABLE reports ADD COLUMN item_name TEXT NOT NULL DEFAULT ''").run();
} catch (e) {}

// Migration: Add status to reports if it doesn't exist
try {
  db.prepare("ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'pending'").run();
} catch (e) {}

// Migration: Add repair columns to reports
try {
  db.prepare("ALTER TABLE reports ADD COLUMN repair_location TEXT").run();
  db.prepare("ALTER TABLE reports ADD COLUMN repair_date TEXT").run();
  db.prepare("ALTER TABLE reports ADD COLUMN repair_description TEXT").run();
} catch (e) {}

// Seed example data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number };
if (count.count === 0) {
  const seed = db.prepare(`
    INSERT INTO items (name, user_name, procurement_year, location, condition, specifications, photo_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  seed.run(
    "Dell UltraSharp 27 Monitor", 
    "John Doe",
    2023, 
    "Main Office - Desk 4", 
    "Good", 
    "Resolution: 4K UHD (3840 x 2160)\nPanel: IPS\nConnectivity: USB-C, HDMI 2.1", 
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000"
  );
  
  seed.run(
    "MacBook Pro 14\" (M3 Pro)", 
    "Jane Smith",
    2024, 
    "IT Storage - Shelf A", 
    "Good", 
    "Chip: Apple M3 Pro\nRAM: 18GB\nStorage: 512GB SSD", 
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000"
  );

  seed.run(
    "Cisco C9200L Switch", 
    "Admin",
    2022, 
    "Server Room - Rack 2", 
    "Fair", 
    "Ports: 24 x 1G PoE+\nUplinks: 4 x 10G SFP+\nStackable: Yes", 
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=1000"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Username atau password salah" });
    }
  });

  // API Routes
  app.get("/api/items", (req, res) => {
    const items = db.prepare("SELECT * FROM items ORDER BY created_at DESC").all();
    res.json(items);
  });

  app.get("/api/items/:id", (req, res) => {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: "Item not found" });
    }
  });

  app.post("/api/items", (req, res) => {
    const { name, user_name, procurement_year, location, condition, specifications, photo_url } = req.body;
    const info = db.prepare(`
      INSERT INTO items (name, user_name, procurement_year, location, condition, specifications, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, user_name, procurement_year, location, condition, specifications, photo_url);
    
    const newItem = db.prepare("SELECT * FROM items WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newItem);
  });

  app.put("/api/items/:id", (req, res) => {
    const { name, user_name, procurement_year, location, condition, specifications, photo_url } = req.body;
    db.prepare(`
      UPDATE items 
      SET name = ?, user_name = ?, procurement_year = ?, location = ?, condition = ?, specifications = ?, photo_url = ?
      WHERE id = ?
    `).run(name, user_name, procurement_year, location, condition, specifications, photo_url, req.params.id);
    
    const updatedItem = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
    res.json(updatedItem);
  });

  app.delete("/api/items/:id", (req, res) => {
    db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
    res.status(204).send();
  });

  // Report Routes
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { item_name, user_name, location, report_date, description } = req.body;
    const info = db.prepare(`
      INSERT INTO reports (item_name, user_name, location, report_date, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(item_name, user_name, location, report_date, description);
    
    const newReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newReport);
  });

  app.put("/api/reports/:id/status", (req, res) => {
    const { status, repair_location, repair_date, repair_description } = req.body;
    db.prepare(`
      UPDATE reports 
      SET status = ?, 
          repair_location = ?, 
          repair_date = ?, 
          repair_description = ? 
      WHERE id = ?
    `).run(status, repair_location, repair_date, repair_description, req.params.id);
    const updatedReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
    res.json(updatedReport);
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
