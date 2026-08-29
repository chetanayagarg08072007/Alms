require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, nowStats } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "alms_default_secret_key_for_dev";

const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = (file.originalname || "file").replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDir));



function required(body, keys) {
  for (const key of keys) {
    if (body[key] == null || String(body[key]).trim() === "") {
      return `Missing field: ${key}`;
    }
  }
  return null;
}

function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized. Please log in." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token. Please log in again." });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ALMS" });
});

app.get("/api/stats", (_req, res) => {
  res.json(nowStats());
});

app.get("/api/pool", (_req, res) => {
  const pool = db.prepare("SELECT * FROM community_pools WHERE id = 1").get();
  const joins = db.prepare("SELECT * FROM pool_joins WHERE pool_id = 1 ORDER BY id DESC LIMIT 20").all();
  res.json({ pool, joins });
});

app.get("/api/dashboard", (_req, res) => {
  res.json({
    stats: nowStats(),
    registrations: db.prepare("SELECT * FROM registrations ORDER BY id DESC LIMIT 50").all(),
    donations: db.prepare("SELECT * FROM donations ORDER BY id DESC LIMIT 50").all(),
    requests: db.prepare("SELECT * FROM food_requests ORDER BY id DESC LIMIT 50").all(),
    emergencies: db.prepare("SELECT * FROM emergency_posts ORDER BY id DESC LIMIT 50").all(),
    poolJoins: db.prepare("SELECT * FROM pool_joins ORDER BY id DESC LIMIT 50").all(),
    alerts: db.prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT 50").all(),
  });
});

app.post("/api/register", upload.single("proof"), async (req, res) => {
  const err = required(req.body, ["role", "name", "mobile", "password"]);
  if (err) return res.status(400).json({ error: err });
  if (!req.file) return res.status(400).json({ error: "Identity proof is required" });
  if (req.body.password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = db.prepare("SELECT id FROM registrations WHERE mobile = ?").get(String(req.body.mobile).trim());
  if (existing) {
    return res.status(400).json({ error: "Mobile number is already registered" });
  }

  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const info = db.prepare(
      `INSERT INTO registrations (role, name, mobile, password_hash, latitude, longitude, proof_file)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      String(req.body.role).trim(),
      String(req.body.name).trim(),
      String(req.body.mobile).trim(),
      hash,
      req.body.latitude ? Number(req.body.latitude) : null,
      req.body.longitude ? Number(req.body.longitude) : null,
      req.file.filename
    );

    const token = jwt.sign({ id: info.lastInsertRowid, role: req.body.role, name: req.body.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/login", async (req, res) => {
  const err = required(req.body, ["mobile", "password"]);
  if (err) return res.status(400).json({ error: err });

  const user = db.prepare("SELECT * FROM registrations WHERE mobile = ?").get(String(req.body.mobile).trim());
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "Invalid mobile number or password" });
  }

  const match = await bcrypt.compare(req.body.password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Invalid mobile number or password" });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
});

app.post("/api/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, name, role, mobile, latitude, longitude, status FROM registrations WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// Custom optional auth to capture user_id if logged in
function optionalAuth(req, res, next) {
  const token = req.cookies.token;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (e) {}
  }
  next();
}

app.post("/api/donations", optionalAuth, (req, res) => {
  const err = required(req.body, ["mode", "people_to_feed", "food_type", "pickup_location"]);
  if (err) return res.status(400).json({ error: err });
  const people = Number(req.body.people_to_feed);
  if (!Number.isFinite(people) || people < 1) {
    return res.status(400).json({ error: "People to feed must be at least 1" });
  }
  const info = db.prepare(
    `INSERT INTO donations (user_id, mode, people_to_feed, food_type, pickup_location, latitude, longitude, partner, contributors, bulk_source, organisation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user ? req.user.id : null,
    String(req.body.mode).trim(),
    people,
    String(req.body.food_type).trim(),
    String(req.body.pickup_location).trim(),
    req.body.latitude ? Number(req.body.latitude) : null,
    req.body.longitude ? Number(req.body.longitude) : null,
    req.body.partner ? String(req.body.partner).trim() : null,
    req.body.contributors ? Number(req.body.contributors) : null,
    req.body.bulk_source ? String(req.body.bulk_source).trim() : null,
    req.body.organisation ? String(req.body.organisation).trim() : null
  );
  db.prepare("UPDATE community_pools SET collected_meals = collected_meals + ? WHERE id = 1").run(people);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, stats: nowStats() });
});

app.post("/api/requests", optionalAuth, (req, res) => {
  const err = required(req.body, ["name", "place", "meals", "contact"]);
  if (err) return res.status(400).json({ error: err });
  const meals = Number(req.body.meals);
  if (!Number.isFinite(meals) || meals < 1) {
    return res.status(400).json({ error: "Meals needed must be at least 1" });
  }
  const info = db.prepare(
    "INSERT INTO food_requests (user_id, name, place, latitude, longitude, meals, contact) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    req.user ? req.user.id : null,
    String(req.body.name).trim(),
    String(req.body.place).trim(),
    req.body.latitude ? Number(req.body.latitude) : null,
    req.body.longitude ? Number(req.body.longitude) : null,
    meals,
    String(req.body.contact).trim()
  );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.post("/api/emergency", optionalAuth, upload.single("proof"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Proof is required" });
  const info = db.prepare("INSERT INTO emergency_posts (user_id, proof_file) VALUES (?, ?)").run(
    req.user ? req.user.id : null,
    req.file.filename
  );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.post("/api/pool/join", optionalAuth, (req, res) => {
  const err = required(req.body, ["name", "role"]);
  if (err) return res.status(400).json({ error: err });
  const info = db.prepare(
    "INSERT INTO pool_joins (pool_id, user_id, name, role, contact) VALUES (1, ?, ?, ?, ?)"
  ).run(
    req.user ? req.user.id : null,
    String(req.body.name).trim(),
    String(req.body.role).trim(),
    req.body.contact ? String(req.body.contact).trim() : null
  );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});


app.get("/api/map", (_req, res) => {
  const donations = db.prepare("SELECT latitude, longitude FROM donations WHERE latitude IS NOT NULL").all();
  const requests = db.prepare("SELECT latitude, longitude FROM food_requests WHERE latitude IS NOT NULL").all();
  const volunteers = db.prepare("SELECT latitude, longitude FROM registrations WHERE role = 'volunteer' AND latitude IS NOT NULL").all();
  res.json({ donations, requests, volunteers });
});

app.post("/api/alerts", (req, res) => {
  const type = req.body.type === "reminder" ? "reminder" : "demand";
  const info = db.prepare("INSERT INTO alerts (type) VALUES (?)").run(type);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, type });
});

// Static files served after API routes
app.use(express.static(__dirname));

// Global API 404 Handler
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Internal Error:", err);
  res.status(500).json({ error: "An unexpected internal server error occurred." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`ALMS running at http://localhost:${port}`);
});

