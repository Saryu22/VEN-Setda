BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nibar TEXT,
    register_code TEXT,
    item_code TEXT,
    specifications TEXT,
    brand_type TEXT,
    procurement_year INTEGER,
    user_name TEXT,
    user_status TEXT,
    user_position TEXT,
    location TEXT,
    condition TEXT,
    photo_url TEXT,
    notes TEXT,
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
    repair_location TEXT,
    repair_date TEXT,
    repair_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    department TEXT NOT NULL,
    request_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );
INSERT INTO "items" ("id","name","nibar","register_code","item_code","specifications","brand_type","procurement_year","user_name","user_status","user_position","location","condition","photo_url","notes","created_at") VALUES (1,'Dell UltraSharp 27 Monitor',NULL,NULL,NULL,'Resolution: 4K UHD (3840 x 2160)
Panel: IPS
Connectivity: USB-C, HDMI 2.1',NULL,2023,'John Doe',NULL,NULL,'Main Office - Desk 4','Good','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000',NULL,'2026-03-11 07:24:54'),
 (2,'MacBook Pro 14" (M3 Pro)',NULL,NULL,NULL,'Chip: Apple M3 Pro
RAM: 18GB
Storage: 512GB SSD',NULL,2024,'Jane Smith',NULL,NULL,'IT Storage - Shelf A','Good','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',NULL,'2026-03-11 07:24:54'),
 (3,'Cisco C9200L Switch',NULL,NULL,NULL,'Ports: 24 x 1G PoE+
Uplinks: 4 x 10G SFP+
Stackable: Yes',NULL,2022,'Admin',NULL,NULL,'Server Room - Rack 2','Fair','https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=1000',NULL,'2026-03-11 07:24:54');
INSERT INTO "users" ("id","username","password","role") VALUES (1,'admin','admin123','admin'),
 (2,'user','user123','user');
COMMIT;
