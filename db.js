const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "alms.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    latitude REAL,
    longitude REAL,
    proof_file TEXT,
    status TEXT NOT NULL DEFAULT 'verified',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mode TEXT NOT NULL,
    people_to_feed INTEGER NOT NULL,
    food_type TEXT NOT NULL,
    pickup_location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    partner TEXT,
    contributors INTEGER,
    bulk_source TEXT,
    organisation TEXT,
    status TEXT NOT NULL DEFAULT 'posted',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id)
  );

  CREATE TABLE IF NOT EXISTS food_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    place TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    meals INTEGER NOT NULL,
    contact TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id)
  );

  CREATE TABLE IF NOT EXISTS emergency_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    proof_file TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_verification',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    locality TEXT NOT NULL,
    target_meals INTEGER NOT NULL,
    collected_meals INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS pool_joins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id INTEGER NOT NULL,
    user_id INTEGER,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    contact TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (pool_id) REFERENCES community_pools(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Simple migrations for existing databases
try { db.exec("ALTER TABLE registrations ADD COLUMN password_hash TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE registrations ADD COLUMN status TEXT NOT NULL DEFAULT 'verified'"); } catch (e) {}
try { db.exec("ALTER TABLE donations ADD COLUMN latitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE donations ADD COLUMN longitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE donations ADD COLUMN user_id INTEGER"); } catch (e) {}
try { db.exec("ALTER TABLE food_requests ADD COLUMN latitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE food_requests ADD COLUMN longitude REAL"); } catch (e) {}
try { db.exec("ALTER TABLE food_requests ADD COLUMN user_id INTEGER"); } catch (e) {}

const poolCount = db.prepare("SELECT COUNT(*) AS n FROM community_pools").get();
if (poolCount.n === 0) {
  db.prepare(
    "INSERT INTO community_pools (name, locality, target_meals, collected_meals) VALUES (?, ?, ?, ?)"
  ).run("Green Park community pool", "Green Park", 250, 163);
}

function nowStats() {
  const donations = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(people_to_feed), 0) AS meals FROM donations").get();
  const requests = db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(meals), 0) AS meals FROM food_requests").get();
  const volunteers = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE role = 'volunteer'").get();
  const ngos = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE role = 'ngo'").get();
  const pool = db.prepare("SELECT * FROM community_pools WHERE id = 1").get();
  const carbonKg = Math.round((donations.meals || 0) * 0.56);
  return {
    donations: donations.n,
    donationMeals: donations.meals,
    requests: requests.n,
    requestMeals: requests.meals,
    volunteers: volunteers.n,
    ngos: ngos.n,
    carbonKg,
    pool,
  };
}

module.exports = { db, nowStats };
