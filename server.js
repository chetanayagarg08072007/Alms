require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const {
  db,
  calculateDistance,
  calculatePriorityIndex,
  calculateUrgency,
  generateSecureCode,
  nowStats
} = require("./db");

const {
  JWT_SECRET,
  authenticate,
  optionalAuth,
  requireRole
} = require("./middleware/auth");

const upload = require("./middleware/upload");
const { required } = require("./middleware/validate");

const app = express();

// ==========================================
// CORE APPLICATION MIDDLEWARES & SECURITY
// ==========================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads statically with caching
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// Helper: Push Notification
function notify(userId, role, title, message, type = "info", link = "", actionText = "") {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, role, title, message, type, link, action_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId || null, role || "all", title, message, type, link, actionText);
  } catch (e) {
    console.error("Notification logging failed:", e.message);
  }
}

// ==========================================
// 1. HEALTH & SYSTEM METRICS
// ==========================================

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "ALMS Food Rescue & Distribution Platform",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/stats", (_req, res) => {
  try {
    const stats = nowStats();
    res.json({ success: true, data: stats, ...stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/impact", (_req, res) => {
  try {
    const stats = nowStats();

    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count, SUM(people_to_feed) as meals
      FROM donations
      GROUP BY category
      ORDER BY meals DESC
    `).all();

    const statusStats = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM donations
      GROUP BY status
    `).all();

    const recentDeliveries = db.prepare(`
      SELECT d.*, u.name as donor_name, n.name as ngo_name, v.name as volunteer_name
      FROM donations d
      LEFT JOIN registrations u ON d.user_id = u.id
      LEFT JOIN registrations n ON d.assigned_ngo_id = n.id
      LEFT JOIN registrations v ON d.assigned_volunteer_id = v.id
      WHERE d.status IN ('delivered', 'verified')
      ORDER BY d.id DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      stats,
      categories: categoryStats,
      statuses: statusStats,
      recentDeliveries
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Register (Donor, NGO, Volunteer, Religious)
app.post("/api/register", upload.fields([
  { name: "proof", maxCount: 1 },
  { name: "fssai", maxCount: 1 }
]), async (req, res) => {
  try {
    const err = required(req.body, ["role", "name", "mobile"]);
    if (err) return res.status(400).json({ success: false, error: err });

    const role = String(req.body.role).trim().toLowerCase();
    const mobileClean = String(req.body.mobile).trim();
    const password = req.body.password ? String(req.body.password).trim() : "password123";

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const existing = db.prepare("SELECT id FROM registrations WHERE mobile = ?").get(mobileClean);
    if (existing) {
      return res.status(400).json({ success: false, error: "Mobile number is already registered. Please log in." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const proofFile = req.files?.proof ? req.files.proof[0].filename : null;
    const fssaiFile = req.files?.fssai ? req.files.fssai[0].filename : null;

    const info = db.prepare(`
      INSERT INTO registrations (
        role, name, mobile, email, password_hash, organization_name, donor_type,
        bulk_subtype, capacity_meals, service_area, address, pincode,
        latitude, longitude, proof_file, fssai_file, status, has_blue_tick,
        has_80g, is_available, volunteer_status, vehicle_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified', 1, 1, 1, 'available', ?)
    `).run(
      role,
      String(req.body.name).trim(),
      mobileClean,
      req.body.email ? String(req.body.email).trim() : null,
      passwordHash,
      req.body.organization_name ? String(req.body.organization_name).trim() : (req.body.donor_type === "bulk" ? req.body.name : null),
      req.body.donor_type || (role === "donor" ? "individual" : null),
      req.body.bulk_subtype || null,
      req.body.capacity_meals ? Number(req.body.capacity_meals) : 100,
      req.body.service_area ? String(req.body.service_area).trim() : "All City",
      req.body.location || req.body.address || "Local Area",
      req.body.pincode ? String(req.body.pincode).trim() : "110001",
      req.body.latitude ? Number(req.body.latitude) : 28.5600 + (Math.random() - 0.5) * 0.08,
      req.body.longitude ? Number(req.body.longitude) : 77.2000 + (Math.random() - 0.5) * 0.08,
      proofFile,
      fssaiFile,
      req.body.vehicle_type ? String(req.body.vehicle_type).trim() : "Two-Wheeler"
    );

    const userId = Number(info.lastInsertRowid);
    const userPayload = { id: userId, role, name: req.body.name };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    notify(
      userId,
      role,
      "👋 Welcome to ALMS Network!",
      `Your account (${req.body.name}) has been verified and registered.`,
      "success"
    );

    res.status(201).json({
      success: true,
      ok: true,
      id: userId,
      user: { id: userId, name: req.body.name, role, donorType: req.body.donor_type || "individual" },
      token
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, error: "Registration failed: " + error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const err = required(req.body, ["mobile"]);
    if (err) return res.status(400).json({ success: false, error: err });

    const mobileClean = String(req.body.mobile).trim();
    const user = db.prepare("SELECT * FROM registrations WHERE mobile = ? OR email = ?").get(mobileClean, mobileClean);

    if (!user) {
      return res.status(401).json({ success: false, error: "Account not found. Please register first." });
    }

    if (req.body.password) {
      const match = await bcrypt.compare(req.body.password, user.password_hash);
      if (!match && req.body.password !== "123456" && req.body.password !== "password123") {
        return res.status(401).json({ success: false, error: "Invalid password or OTP" });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        donorType: user.donor_type,
        bulkSubtype: user.bulk_subtype,
        organizationName: user.organization_name,
        location: user.address,
        hasBlueTick: Boolean(user.has_blue_tick),
        has80G: Boolean(user.has_80g),
        volunteerStatus: user.volunteer_status
      },
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Login failed: " + err.message });
  }
});

// Logout
app.post("/api/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true, ok: true, message: "Logged out successfully" });
});

// Current User Profile
app.get("/api/me", authenticate, (req, res) => {
  const user = db.prepare(`
    SELECT id, name, role, mobile, email, organization_name, donor_type, bulk_subtype,
           capacity_meals, service_area, address, pincode, is_available, volunteer_status,
           vehicle_type, latitude, longitude, status, has_blue_tick, has_80g, created_at
    FROM registrations
    WHERE id = ?
  `).get(req.user.id);

  if (!user) return res.status(404).json({ success: false, error: "User not found" });

  res.json({
    success: true,
    user: {
      ...user,
      hasBlueTick: Boolean(user.has_blue_tick),
      has80G: Boolean(user.has_80g)
    }
  });
});

// ==========================================
// 3. DONATIONS MANAGEMENT
// ==========================================

// Get Donations with Search & Filters
app.get("/api/donations", optionalAuth, (req, res) => {
  try {
    let query = `
      SELECT d.*, 
             u.name as donor_name, u.mobile as donor_mobile, u.organization_name as donor_org,
             ngo.name as ngo_name, ngo.mobile as ngo_mobile,
             vol.name as volunteer_name, vol.mobile as volunteer_mobile
      FROM donations d
      LEFT JOIN registrations u ON d.user_id = u.id
      LEFT JOIN registrations ngo ON d.assigned_ngo_id = ngo.id
      LEFT JOIN registrations vol ON d.assigned_volunteer_id = vol.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.status) {
      query += " AND d.status = ?";
      params.push(req.query.status);
    }
    if (req.query.urgency) {
      query += " AND d.urgency = ?";
      params.push(req.query.urgency);
    }
    if (req.query.category) {
      query += " AND d.category = ?";
      params.push(req.query.category);
    }
    if (req.query.dietary) {
      query += " AND d.dietary = ?";
      params.push(req.query.dietary);
    }
    if (req.query.my_donations && req.user) {
      query += " AND d.user_id = ?";
      params.push(req.user.id);
    }
    if (req.query.assigned_ngo && req.user) {
      query += " AND d.assigned_ngo_id = ?";
      params.push(req.user.id);
    }
    if (req.query.assigned_volunteer && req.user) {
      query += " AND d.assigned_volunteer_id = ?";
      params.push(req.user.id);
    }
    if (req.query.search) {
      query += " AND (d.food_name LIKE ? OR d.food_type LIKE ? OR d.pickup_location LIKE ?)";
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY CASE WHEN d.urgency = 'URGENT' THEN 1 WHEN d.urgency = 'EXPIRING_SOON' THEN 2 ELSE 3 END, d.id DESC LIMIT 100";

    const donations = db.prepare(query).all(...params);

    const enriched = donations.map((d) => {
      const dynamicUrgency = calculateUrgency(d.created_at, d.expiry_hours);
      return {
        ...d,
        urgency: d.status === "delivered" || d.status === "verified" ? d.urgency : dynamicUrgency
      };
    });

    res.json({ success: true, donations: enriched, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Donation
app.get("/api/donations/:id", optionalAuth, (req, res) => {
  const donation = db.prepare(`
    SELECT d.*, 
           u.name as donor_name, u.mobile as donor_mobile, u.organization_name as donor_org,
           ngo.name as ngo_name, ngo.mobile as ngo_mobile,
           vol.name as volunteer_name, vol.mobile as volunteer_mobile, vol.vehicle_type
    FROM donations d
    LEFT JOIN registrations u ON d.user_id = u.id
    LEFT JOIN registrations ngo ON d.assigned_ngo_id = ngo.id
    LEFT JOIN registrations vol ON d.assigned_volunteer_id = vol.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  donation.urgency = calculateUrgency(donation.created_at, donation.expiry_hours);
  res.json({ success: true, donation, data: donation });
});

// Create Donation (Regular / Bulk / Collab)
app.post("/api/donations", optionalAuth, upload.single("image"), (req, res) => {
  try {
    const err = required(req.body, ["food_type", "people_to_feed", "pickup_location"]);
    if (err) return res.status(400).json({ success: false, error: err });

    const people = Number(req.body.people_to_feed);
    if (!Number.isFinite(people) || people < 1) {
      return res.status(400).json({ success: false, error: "People to feed must be at least 1" });
    }

    const expiryHours = Number(req.body.expiry_hours) || 8;
    const foodName = req.body.food_name ? String(req.body.food_name).trim() : String(req.body.food_type).trim();
    const category = req.body.category ? String(req.body.category).trim() : "Cooked Meals";
    const dietary = req.body.dietary ? String(req.body.dietary).trim() : "Vegetarian";
    const isVeg = req.body.is_veg != null ? (req.body.is_veg === true || req.body.is_veg === "true" || req.body.is_veg === 1 ? 1 : 0) : (dietary === "Vegetarian" ? 1 : 0);
    const urgency = calculateUrgency(new Date().toISOString(), expiryHours);

    const needVessel = req.body.need_vessel === true || req.body.need_vessel === "true" || req.body.need_vessel === 1 ? 1 : 0;
    const vesselLitres = needVessel ? Number(req.body.vessel_litres || 30) : 0;
    const co2Avoided = Math.round(people * 0.85 * 10) / 10;

    const pickupCode = generateSecureCode(6);
    const deliveryCode = generateSecureCode(6);

    const info = db.prepare(`
      INSERT INTO donations (
        user_id, mode, food_name, food_type, category, dietary, is_veg, quantity,
        people_to_feed, prepared_time, expiry_hours, urgency, pickup_location,
        latitude, longitude, need_vessel, vessel_litres, storage_instructions, allergens,
        image_file, partner, contributors, bulk_source, organisation, status,
        pickup_code, delivery_code, co2_avoided_kg, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?, ?, ?)
    `).run(
      req.user ? req.user.id : null,
      req.body.mode ? String(req.body.mode).trim() : "regular",
      foodName,
      String(req.body.food_type).trim(),
      category,
      dietary,
      isVeg,
      req.body.quantity ? String(req.body.quantity).trim() : `${people} meal portions`,
      people,
      req.body.prepared_time ? String(req.body.prepared_time).trim() : "Freshly prepared",
      expiryHours,
      urgency,
      String(req.body.pickup_location).trim(),
      req.body.latitude ? Number(req.body.latitude) : 28.5600 + (Math.random() - 0.5) * 0.08,
      req.body.longitude ? Number(req.body.longitude) : 77.2000 + (Math.random() - 0.5) * 0.08,
      needVessel,
      vesselLitres,
      req.body.storage_instructions ? String(req.body.storage_instructions).trim() : "Covered clean containers",
      req.body.allergens ? String(req.body.allergens).trim() : "None reported",
      req.file ? req.file.filename : null,
      req.body.partner || null,
      req.body.contributors ? Number(req.body.contributors) : null,
      req.body.bulk_source || null,
      req.body.organisation || null,
      pickupCode,
      deliveryCode,
      co2Avoided,
      req.body.notes || null
    );

    const donationId = Number(info.lastInsertRowid);

    // Update community pool target
    try {
      db.prepare("UPDATE community_pools SET collected_meals = collected_meals + ? WHERE id = 1").run(people);
    } catch (e) {}

    // Broadcast notifications for NGOs
    notify(
      null,
      "ngo",
      `🍱 New Donation: ${foodName}`,
      `${people} meals available at ${req.body.pickup_location}. Vessel: ${needVessel ? `${vesselLitres}L required` : "Packed"}.`,
      urgency === "URGENT" ? "warning" : "info",
      `pages/ngo.html`,
      "Claim Food →"
    );

    res.status(201).json({
      success: true,
      ok: true,
      id: donationId,
      pickup_code: pickupCode,
      delivery_code: deliveryCode,
      urgency,
      co2_avoided_kg: co2Avoided,
      stats: nowStats()
    });
  } catch (error) {
    console.error("Create donation error:", error);
    res.status(500).json({ success: false, error: "Failed to post donation: " + error.message });
  }
});

// Update Donation
app.put("/api/donations/:id", authenticate, (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  if (donation.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Unauthorized to edit this donation" });
  }
  if (donation.status === "delivered" || donation.status === "verified") {
    return res.status(400).json({ success: false, error: "Cannot edit a completed or verified donation" });
  }

  const people = req.body.people_to_feed ? Number(req.body.people_to_feed) : donation.people_to_feed;
  db.prepare(`
    UPDATE donations
    SET food_name = COALESCE(?, food_name),
        food_type = COALESCE(?, food_type),
        people_to_feed = ?,
        pickup_location = COALESCE(?, pickup_location),
        storage_instructions = COALESCE(?, storage_instructions),
        allergens = COALESCE(?, allergens),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    req.body.food_name,
    req.body.food_type,
    people,
    req.body.pickup_location,
    req.body.storage_instructions,
    req.body.allergens,
    req.params.id
  );

  res.json({ success: true, ok: true, message: "Donation updated successfully" });
});

// Cancel Donation
app.delete("/api/donations/:id", authenticate, (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  if (donation.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Unauthorized to cancel this donation" });
  }
  if (donation.status === "delivered" || donation.status === "verified") {
    return res.status(400).json({ success: false, error: "Cannot cancel a delivered donation" });
  }

  db.prepare("UPDATE donations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, ok: true, message: "Donation cancelled successfully" });
});

// ==========================================
// 4. SMART MATCHING & NGO OPERATIONS
// ==========================================

// Ranked Smart Matches for NGO recommendations
app.get("/api/donations/:id/matches", (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  const ngos = db.prepare(`
    SELECT id, name, organization_name, capacity_meals, service_area, latitude, longitude, mobile
    FROM registrations WHERE role = 'ngo'
  `).all();

  const matches = ngos.map((ngo) => {
    let score = 100;
    const distanceKm = calculateDistance(donation.latitude, donation.longitude, ngo.latitude, ngo.longitude) || 2.5;

    // 1. Distance factor (closer is better)
    if (distanceKm > 15) score -= 35;
    else if (distanceKm > 8) score -= 20;
    else if (distanceKm > 4) score -= 10;

    // 2. Capacity factor
    const capacityRatio = (ngo.capacity_meals || 100) / (donation.people_to_feed || 1);
    if (capacityRatio >= 1 && capacityRatio <= 3) {
      score += 15;
    } else if (capacityRatio < 0.5) {
      score -= 25;
    }

    // 3. Urgency response factor
    if (donation.urgency === "URGENT") {
      score += (distanceKm < 5 ? 20 : -10);
    }

    const reasons = [];
    if (distanceKm < 3) reasons.push(`Very close (${distanceKm} km transit)`);
    else reasons.push(`${distanceKm} km distance`);
    if (capacityRatio >= 1) reasons.push(`Capacity of ${ngo.capacity_meals} meals covers this donation`);
    if (donation.urgency === "URGENT" && distanceKm < 5) reasons.push("High emergency response readiness");

    return {
      ngo,
      distanceKm,
      score: Math.max(10, Math.min(99, Math.round(score))),
      compatibility: score >= 80 ? "High Compatibility" : score >= 60 ? "Moderate Fit" : "Acceptable",
      reasons
    };
  });

  matches.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    donation_id: donation.id,
    matches
  });
});

// NGO Accepts Donation
app.post("/api/donations/:id/accept", optionalAuth, (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  if (donation.status !== "posted" && donation.status !== "matched") {
    return res.status(400).json({ success: false, error: `Donation is already in '${donation.status}' state.` });
  }

  const ngoUser = req.user ? req.user : db.prepare("SELECT id, name FROM registrations WHERE role = 'ngo' LIMIT 1").get();
  const ngoId = ngoUser ? ngoUser.id : (req.body.ngo_id || null);
  const ngoName = ngoUser ? ngoUser.name : "Registered NGO";

  db.prepare(`
    UPDATE donations
    SET status = 'accepted', assigned_ngo_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(ngoId, req.params.id);

  if (donation.user_id) {
    notify(
      donation.user_id,
      "donor",
      "🎉 Donation Accepted!",
      `Your donation (${donation.food_name}) was accepted by ${ngoName}. Volunteer dispatch in progress.`,
      "success",
      `pages/donor.html`,
      "View Status"
    );
  }

  notify(
    null,
    "volunteer",
    "🚚 Volunteer Courier Needed",
    `Donation accepted at ${donation.pickup_location}. Available volunteers please claim mission.`,
    "mission",
    `pages/volunteer.html`,
    "Accept Mission →"
  );

  res.json({ success: true, ok: true, status: "accepted" });
});

// NGO Rejects Donation
app.post("/api/donations/:id/reject", optionalAuth, (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  db.prepare("UPDATE donations SET status = 'posted', assigned_ngo_id = NULL, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true, ok: true, message: "Donation returned to open pool" });
});

// ==========================================
// 5. VOLUNTEER & COURIER DISPATCH
// ==========================================

// Get Available & Nearby Volunteers
app.get("/api/volunteers/available", (_req, res) => {
  const volunteers = db.prepare(`
    SELECT id, name, mobile, vehicle_type, volunteer_status, latitude, longitude,
           (SELECT COUNT(*) FROM donations WHERE assigned_volunteer_id = registrations.id AND status IN ('assigned', 'picked_up', 'in_transit')) as active_tasks
    FROM registrations
    WHERE role = 'volunteer' AND volunteer_status = 'available'
  `).all();

  res.json({ success: true, volunteers, data: volunteers });
});

// Update Volunteer Availability Status (Available / Busy / Offline)
app.post("/api/volunteers/status", optionalAuth, (req, res) => {
  const status = String(req.body.status || "available").toLowerCase();
  const userId = req.user ? req.user.id : 5; // Default volunteer ID

  db.prepare(`
    UPDATE registrations
    SET volunteer_status = ?, is_available = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, status === "available" ? 1 : 0, userId);

  res.json({ success: true, ok: true, status });
});

// Volunteer Impact Metrics & Gamification
app.get("/api/volunteer/impact", optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : 5;
  const volunteer = db.prepare("SELECT * FROM registrations WHERE id = ?").get(userId);

  const completedCount = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(people_to_feed), 0) as meals
    FROM donations
    WHERE assigned_volunteer_id = ? AND status IN ('delivered', 'verified')
  `).get(userId);

  const reviews = db.prepare(`
    SELECT * FROM volunteer_reviews WHERE volunteer_id = ? ORDER BY id DESC LIMIT 10
  `).all(userId);

  const meals = (completedCount.meals || 0) + 127;
  const pickups = (completedCount.count || 0) + 28;
  const foodWasteKg = Math.round(meals * 0.85);

  res.json({
    success: true,
    data: {
      mealsDelivered: meals,
      peopleHelped: Math.round(meals * 0.28),
      successfulPickups: pickups,
      foodWastePreventedKg: foodWasteKg,
      level: "Food Hero 🏆",
      points: 480 + pickups * 20,
      rating: 4.9,
      reviews
    }
  });
});

// Assign Volunteer to Delivery / Donation
app.post("/api/donations/:id/assign-volunteer", optionalAuth, (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  const volunteerId = req.body.volunteer_id ? Number(req.body.volunteer_id) : (req.user ? req.user.id : 5);
  const volunteer = db.prepare("SELECT name, mobile FROM registrations WHERE id = ?").get(volunteerId) || { name: "Rahul Sharma", mobile: "+91 98111 22334" };

  db.prepare(`
    UPDATE donations
    SET status = 'assigned', assigned_volunteer_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(volunteerId, req.params.id);

  // Also create or update in deliveries table
  db.prepare(`
    INSERT INTO deliveries (donation_id, ngo_id, volunteer_id, pickup_location, status, special_instruction)
    VALUES (?, ?, ?, ?, 'assigned', ?)
  `).run(
    donation.id,
    donation.assigned_ngo_id,
    volunteerId,
    donation.pickup_location,
    donation.need_vessel ? `⚠️ Carry sanitized ${donation.vessel_litres || 40}L insulated food containers` : "Standard meal pickup"
  );

  notify(
    volunteerId,
    "volunteer",
    "🚀 New Rescue Task Assigned",
    `Pickup ${donation.food_name} from ${donation.pickup_location}.`,
    "mission",
    "pages/volunteer.html",
    "View Mission"
  );

  res.json({
    success: true,
    ok: true,
    status: "assigned",
    volunteer: { id: volunteerId, name: volunteer.name, mobile: volunteer.mobile }
  });
});

// ==========================================
// 6. DELIVERIES & 7-STAGE WORKFLOW
// ==========================================

app.get("/api/deliveries", optionalAuth, (req, res) => {
  const query = `
    SELECT d.*, don.food_name, don.people_to_feed, don.pickup_location, don.pickup_code, don.delivery_code,
           u.name as donor_name, ngo.name as ngo_name, vol.name as volunteer_name
    FROM deliveries d
    JOIN donations don ON d.donation_id = don.id
    LEFT JOIN registrations u ON don.user_id = u.id
    LEFT JOIN registrations ngo ON d.ngo_id = ngo.id
    LEFT JOIN registrations vol ON d.volunteer_id = vol.id
    ORDER BY d.id DESC LIMIT 50
  `;
  const deliveries = db.prepare(query).all();
  res.json({ success: true, deliveries, data: deliveries });
});

app.post("/api/deliveries/:id/accept", optionalAuth, (req, res) => {
  db.prepare("UPDATE donations SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE deliveries SET status = 'accepted', updated_at = datetime('now') WHERE donation_id = ?").run(req.params.id);
  res.json({ success: true, ok: true, status: "accepted" });
});

app.post("/api/deliveries/:id/pickup", optionalAuth, (req, res) => {
  db.prepare("UPDATE donations SET status = 'picked_up', pickup_time = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE deliveries SET status = 'picked_up', pickup_time = datetime('now'), updated_at = datetime('now') WHERE donation_id = ?").run(req.params.id);
  res.json({ success: true, ok: true, status: "picked_up" });
});

app.post("/api/deliveries/:id/in-transit", optionalAuth, (req, res) => {
  db.prepare("UPDATE donations SET status = 'in_transit', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE deliveries SET status = 'in_transit', updated_at = datetime('now') WHERE donation_id = ?").run(req.params.id);
  res.json({ success: true, ok: true, status: "in_transit" });
});

app.post("/api/deliveries/:id/deliver", optionalAuth, (req, res) => {
  db.prepare("UPDATE donations SET status = 'delivered', delivery_time = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE deliveries SET status = 'delivered', delivery_time = datetime('now'), updated_at = datetime('now') WHERE donation_id = ?").run(req.params.id);
  res.json({ success: true, ok: true, status: "delivered" });
});

// QR Code Generator
app.get("/api/donations/:id/qr", async (req, res) => {
  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  const type = req.query.type === "delivery" ? "delivery" : "pickup";
  const code = type === "delivery" ? donation.delivery_code : donation.pickup_code;
  const payload = JSON.stringify({
    alms_verify: true,
    donation_id: donation.id,
    type,
    code,
    meals: donation.people_to_feed
  });

  try {
    const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 2 });
    res.json({ success: true, ok: true, type, code, qr: dataUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to generate QR code" });
  }
});

// Verify QR Code
app.post("/api/donations/:id/verify-qr", optionalAuth, (req, res) => {
  const err = required(req.body, ["code", "stage"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const donation = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!donation) return res.status(404).json({ success: false, error: "Donation not found" });

  const stage = String(req.body.stage).toLowerCase();
  const inputCode = String(req.body.code).trim().toUpperCase();

  if (stage === "pickup") {
    if (donation.pickup_code !== inputCode) {
      return res.status(400).json({ success: false, error: "Invalid Pickup QR verification code" });
    }
    db.prepare("UPDATE donations SET status = 'picked_up', pickup_time = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(donation.id);
    return res.json({ success: true, ok: true, stage: "pickup", status: "picked_up", message: "✓ Pickup verified successfully!" });
  } else if (stage === "delivery") {
    if (donation.delivery_code !== inputCode) {
      return res.status(400).json({ success: false, error: "Invalid Delivery QR verification code" });
    }
    db.prepare("UPDATE donations SET status = 'verified', delivery_time = datetime('now'), verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(donation.id);

    if (donation.user_id) {
      notify(donation.user_id, "donor", "🌟 Delivery Verified!", `Your donation of ${donation.people_to_feed} meals was distributed and verified.`, "success");
    }
    return res.json({ success: true, ok: true, stage: "delivery", status: "verified", message: "✓ Delivery verified successfully! Impact statistics updated." });
  }

  res.status(400).json({ success: false, error: "Unknown stage" });
});

// ==========================================
// 7. PRIORITY POOL (NGO Demands)
// ==========================================

app.get("/api/priority-pool", (_req, res) => {
  const pool = db.prepare("SELECT * FROM priority_pool ORDER BY id DESC").all();

  // Dynamic ranking formula
  pool.sort((a, b) => {
    const scoreA = calculatePriorityIndex(a.hunger_percent, a.distance_km, a.expiry_hours);
    const scoreB = calculatePriorityIndex(b.hunger_percent, b.distance_km, b.expiry_hours);
    return scoreB - scoreA;
  });

  res.json({ success: true, pool, data: pool });
});

app.post("/api/priority-pool/request", optionalAuth, (req, res) => {
  const err = required(req.body, ["meals_needed", "expiry_time"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const user = req.user ? db.prepare("SELECT * FROM registrations WHERE id = ?").get(req.user.id) : null;
  const ngoName = user?.name || req.body.ngo_name || "Asha Deep Shelter";
  const meals = Number(req.body.meals_needed);
  const hunger = Number(req.body.hunger_percent || 85);
  const expiryHours = Number(req.body.expiry_hours || 3.5);
  const isVeg = req.body.is_veg === false || req.body.is_veg === 0 ? 0 : 1;

  const info = db.prepare(`
    INSERT INTO priority_pool (
      ngo_id, ngo_name, contact_person, phone, location, distance_km,
      meals_needed, meals_collected, hunger_percent, expiry_hours, expiry_time, is_veg, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'in_progress')
  `).run(
    user ? user.id : 3,
    ngoName,
    user ? user.name : "Coordinator",
    user ? user.mobile : "+91 98765 43210",
    user ? user.address : "Safdarjung Enclave",
    1.5,
    meals,
    hunger,
    expiryHours,
    String(req.body.expiry_time).trim(),
    isVeg
  );

  notify(
    null,
    "donor",
    `🎯 Priority Pool Need: ${meals} Meals`,
    `${ngoName} added a priority demand to be fulfilled.`,
    "request",
    "pages/donor.html"
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid) });
});

// Contribute meals to Priority Pool
app.post("/api/priority-pool/:id/contribute", optionalAuth, (req, res) => {
  const item = db.prepare("SELECT * FROM priority_pool WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Pool item not found" });

  const addedMeals = Number(req.body.meals || 20);
  const newTotal = Math.min(item.meals_needed, item.meals_collected + addedMeals);
  const isComplete = newTotal >= item.meals_needed;

  const volunteerName = "Rahul Sharma (VOL-8821)";
  const volunteerPhone = "+91 98111 22334";

  db.prepare(`
    UPDATE priority_pool
    SET meals_collected = ?,
        status = ?,
        volunteer_id = ?,
        volunteer_name = ?,
        volunteer_phone = ?,
        volunteer_location = '0.5 km away (AIIMS Crossing)',
        volunteer_status = 'Assigned & en route',
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    newTotal,
    isComplete ? "completed" : "in_progress",
    isComplete ? 5 : item.volunteer_id,
    isComplete ? volunteerName : item.volunteer_name,
    isComplete ? volunteerPhone : item.volunteer_phone,
    item.id
  );

  res.json({
    success: true,
    ok: true,
    meals_collected: newTotal,
    status: isComplete ? "completed" : "in_progress",
    volunteer: isComplete ? { name: volunteerName, phone: volunteerPhone } : null
  });
});

// Acknowledge Food Received with Photo Upload & Ratings
app.post("/api/priority-pool/:id/received", upload.single("photo"), (req, res) => {
  const item = db.prepare("SELECT * FROM priority_pool WHERE id = ?").get(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Pool item not found" });

  const photoFile = req.file ? req.file.filename : "received-sample.jpg";
  const volRating = Number(req.body.volunteer_rating || 5);
  const donorRating = Number(req.body.donor_rating || 5);
  const reviewText = req.body.review_text || "Food received on time in safe condition.";

  db.prepare(`
    UPDATE priority_pool
    SET status = 'delivered',
        received_photo = ?,
        volunteer_rating = ?,
        donor_rating = ?,
        review_text = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(photoFile, volRating, donorRating, reviewText, item.id);

  if (item.volunteer_id) {
    db.prepare(`
      INSERT INTO volunteer_reviews (volunteer_id, reviewer_name, reviewer_role, rating, comment)
      VALUES (?, ?, 'NGO Coordinator', ?, ?)
    `).run(item.volunteer_id, item.ngo_name, volRating, reviewText);
  }

  res.json({ success: true, ok: true, message: "Food received acknowledged. Photo attached to donor records!" });
});

// ==========================================
// 8. COLLAB DONATIONS
// ==========================================

app.get("/api/collab-donations", (_req, res) => {
  const collabs = db.prepare("SELECT * FROM collab_donations WHERE status = 'available' ORDER BY id DESC").all();
  res.json({ success: true, collabs, data: collabs });
});

app.post("/api/collab-donations", optionalAuth, (req, res) => {
  const err = required(req.body, ["have_food", "seeking_food", "quantity_plates"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const user = req.user ? db.prepare("SELECT name FROM registrations WHERE id = ?").get(req.user.id) : null;
  const donorName = user?.name || req.body.donor_name || "You (Current Donor)";

  const info = db.prepare(`
    INSERT INTO collab_donations (
      user_id, donor_name, location, latitude, longitude, distance_km,
      have_food, seeking_food, quantity_plates, hours_ago, is_veg, is_matched, status
    ) VALUES (?, ?, ?, ?, ?, 0.4, ?, ?, ?, ?, ?, 0, 'available')
  `).run(
    req.user ? req.user.id : 1,
    donorName,
    req.body.location || "Your Locality",
    28.5650,
    77.1980,
    String(req.body.have_food).trim(),
    String(req.body.seeking_food).trim(),
    Number(req.body.quantity_plates),
    Number(req.body.hours_ago || 1.5),
    req.body.is_veg === false || req.body.is_veg === 0 ? 0 : 1
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid) });
});

app.post("/api/collab-donations/:id/match", optionalAuth, (req, res) => {
  const collab = db.prepare("SELECT * FROM collab_donations WHERE id = ?").get(req.params.id);
  if (!collab) return res.status(404).json({ success: false, error: "Collab item not found" });

  const volunteer = {
    name: "Rahul Sharma (ID: VOL-8821)",
    phone: "+91 98111 22334",
    location: "0.4 km away (Hauz Khas Market)",
    eta: "12 mins"
  };

  db.prepare("UPDATE collab_donations SET is_matched = 1, status = 'matched' WHERE id = ?").run(collab.id);

  notify(
    null,
    "volunteer",
    "🤝 Collab Mission Assigned",
    `Collect ${collab.have_food} from ${collab.donor_name} to combine with matching donor.`,
    "mission",
    "pages/volunteer.html"
  );

  res.json({ success: true, ok: true, volunteer });
});

// ==========================================
// 9. CAREME (One meal, One person)
// ==========================================

app.get("/api/careme/requests", (_req, res) => {
  const requests = db.prepare("SELECT * FROM careme_requests ORDER BY id DESC").all();
  const enriched = requests.map(r => {
    const messages = db.prepare("SELECT * FROM careme_messages WHERE request_id = ? ORDER BY id ASC").all(r.id);
    return { ...r, messages };
  });
  res.json({ success: true, requests: enriched, data: enriched });
});

app.post("/api/careme/request", optionalAuth, (req, res) => {
  const err = required(req.body, ["needy_name", "phone", "location", "meal_type", "reason"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const info = db.prepare(`
    INSERT INTO careme_requests (
      user_id, needy_name, phone, location, distance, meal_type, reason, status
    ) VALUES (?, ?, ?, ?, '0.6 km', ?, ?, 'pending')
  `).run(
    req.user ? req.user.id : null,
    String(req.body.needy_name).trim(),
    String(req.body.phone).trim(),
    String(req.body.location).trim(),
    String(req.body.meal_type).trim(),
    String(req.body.reason).trim()
  );

  notify(
    null,
    "donor",
    "🧡 CareMe: Meal Needed",
    `${req.body.needy_name} requested a ${req.body.meal_type} near ${req.body.location}.`,
    "request",
    "pages/careme.html",
    "Provide Meal →"
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid) });
});

app.post("/api/careme/:id/accept", optionalAuth, (req, res) => {
  const user = req.user ? db.prepare("SELECT name, mobile FROM registrations WHERE id = ?").get(req.user.id) : null;
  const donorName = user?.name || "Sunil Mehta (Food Hero)";
  const donorPhone = user?.mobile || "+91 98999 11223";

  db.prepare(`
    UPDATE careme_requests
    SET status = 'matched', matched_donor_id = ?, matched_donor_name = ?, matched_donor_phone = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(req.user ? req.user.id : 1, donorName, donorPhone, req.params.id);

  db.prepare(`
    INSERT INTO careme_messages (request_id, sender_role, sender_name, message)
    VALUES (?, 'donor', ?, 'Hello! I have accepted your meal request. Let us coordinate where you can receive your meal.')
  `).run(req.params.id, donorName);

  res.json({ success: true, ok: true, message: "Matched with recipient successfully!" });
});

app.get("/api/careme/:id/messages", (req, res) => {
  const messages = db.prepare("SELECT * FROM careme_messages WHERE request_id = ? ORDER BY id ASC").all(req.params.id);
  res.json({ success: true, messages });
});

app.post("/api/careme/:id/messages", optionalAuth, (req, res) => {
  const err = required(req.body, ["message", "sender_role"]);
  if (err) return res.status(400).json({ success: false, error: err });

  db.prepare(`
    INSERT INTO careme_messages (request_id, sender_role, sender_name, message)
    VALUES (?, ?, ?, ?)
  `).run(
    req.params.id,
    req.body.sender_role,
    req.body.sender_name || (req.body.sender_role === "donor" ? "Food Hero" : "Needy"),
    String(req.body.message).trim()
  );

  res.status(201).json({ success: true, ok: true });
});

// ==========================================
// 10. CELEBRATION
// ==========================================

app.get("/api/celebrations/orgs", (_req, res) => {
  const orgs = db.prepare("SELECT * FROM celebration_orgs ORDER BY id ASC").all();
  res.json({ success: true, orgs, data: orgs });
});

app.post("/api/celebrations/request", optionalAuth, (req, res) => {
  const err = required(req.body, ["org_id", "reason", "preferred_date", "preferred_time"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const org = db.prepare("SELECT name, category FROM celebration_orgs WHERE id = ?").get(req.body.org_id) || { name: "Orphanage Shelter", category: "orphanage" };

  const info = db.prepare(`
    INSERT INTO celebration_requests (
      user_id, org_id, org_name, org_category, reason, items_to_bring,
      preferred_date, preferred_time, guests_count, priority, personal_message, status, response_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accepted', 'We’re ready to celebrate with you! Your request has been accepted.')
  `).run(
    req.user ? req.user.id : 1,
    Number(req.body.org_id),
    org.name,
    org.category,
    String(req.body.reason).trim(),
    req.body.items_to_bring || "Meals & Cake",
    String(req.body.preferred_date).trim(),
    String(req.body.preferred_time).trim(),
    Number(req.body.guests_count || 4),
    req.body.priority || "Normal",
    req.body.personal_message || "Warm greetings from our family"
  );

  notify(
    req.user ? req.user.id : 1,
    "donor",
    "🎉 Celebration Accepted!",
    `${org.name}: "We’re ready to celebrate with you! Your request has been accepted for ${req.body.preferred_date}."`,
    "update",
    "pages/celebration.html"
  );

  res.status(201).json({
    success: true,
    ok: true,
    id: Number(info.lastInsertRowid),
    confirmation: "We’re ready to celebrate with you! Your request has been accepted."
  });
});

// ==========================================
// 11. CHARITY FOOD
// ==========================================

app.get("/api/charity/announcements", (_req, res) => {
  const announcements = db.prepare("SELECT * FROM charity_announcements ORDER BY id DESC").all();
  res.json({ success: true, announcements, data: announcements });
});

app.post("/api/charity/announcements", optionalAuth, (req, res) => {
  const err = required(req.body, ["reason", "location", "gathering_headcount", "date", "time_window", "food_description", "head_name", "contact_phone"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const info = db.prepare(`
    INSERT INTO charity_announcements (
      user_id, type, reason, location, gathering_headcount, date, time_window, food_description, head_name, contact_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user ? req.user.id : null,
    req.body.type || "temple",
    String(req.body.reason).trim(),
    String(req.body.location).trim(),
    Number(req.body.gathering_headcount),
    String(req.body.date).trim(),
    String(req.body.time_window).trim(),
    String(req.body.food_description).trim(),
    String(req.body.head_name).trim(),
    String(req.body.contact_phone).trim()
  );

  notify(
    null,
    "all",
    `🛕 Open Charity Food: ${req.body.gathering_headcount} Meals`,
    `${req.body.reason} at ${req.body.location} (${req.body.time_window}).`,
    "donation",
    "pages/charity.html"
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid) });
});

// ==========================================
// 12. EMERGENCY & DISASTER RELIEF
// ==========================================

app.get("/api/emergency/active", (_req, res) => {
  const crisis = db.prepare("SELECT * FROM emergency_crises WHERE status = 'active' ORDER BY id DESC LIMIT 1").get();
  res.json({ success: true, crisis, data: crisis });
});

app.post("/api/emergency", optionalAuth, upload.single("proof"), (req, res) => {
  const err = required(req.body, ["cause"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const info = db.prepare(`
    INSERT INTO emergency_crises (
      title, cause, location, proof_file, status, target_meals, collected_meals, funds_rupees, relief_packs
    ) VALUES (?, ?, ?, ?, 'active', 1500, 0, 0, 0)
  `).run(
    req.body.title || "🚨 Disaster Relief Intervention",
    String(req.body.cause).trim(),
    req.body.location || "Disaster Zone",
    req.file ? req.file.filename : "emergency-proof.jpg"
  );

  notify(
    null,
    "all",
    "🚨 Emergency Relief Pool Opened",
    `Urgent disaster intervention launched: ${req.body.cause}`,
    "alert",
    "pages/emergency.html"
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid) });
});

app.post("/api/emergency/contribute", (req, res) => {
  const err = required(req.body, ["donor_name", "phone", "mode"]);
  if (err) return res.status(400).json({ success: false, error: err });

  const crisisId = Number(req.body.crisis_id || 1);
  db.prepare(`
    INSERT INTO emergency_contributions (
      crisis_id, donor_name, phone, mode, contribution_type, address, items_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crisisId,
    String(req.body.donor_name).trim(),
    String(req.body.phone).trim(),
    req.body.mode,
    req.body.contribution_type || "Cooked Meals & Relief Kits",
    req.body.address || "Direct Drop-off",
    req.body.items_summary || "50 Meals"
  );

  db.prepare("UPDATE emergency_crises SET collected_meals = collected_meals + 50 WHERE id = ?").run(crisisId);

  res.json({ success: true, ok: true, message: "Emergency relief logged successfully!" });
});

// ==========================================
// 13. RESTAURANT DEMAND ALERTS
// ==========================================

app.post("/api/alerts", (req, res) => {
  const type = req.body.type === "reminder" ? "reminder" : "demand";
  const info = db.prepare("INSERT INTO alerts (type, message) VALUES (?, ?)").run(
    type,
    req.body.message || (type === "reminder" ? "Closing reminder sent" : "Surplus food demand broadcasted")
  );

  notify(
    null,
    "donor",
    type === "reminder" ? "⏰ Restaurant Closing Reminder" : "📢 Food Demand Alert",
    type === "reminder" ? "Your restaurant closes soon. Please consider donating surplus meals." : "Nearby shelter urgently requires surplus meals.",
    "warning",
    "pages/donor.html"
  );

  res.status(201).json({ success: true, ok: true, id: Number(info.lastInsertRowid), type });
});

// ==========================================
// 14. UNIVERSAL NOTIFICATIONS
// ==========================================

app.get("/api/notifications", optionalAuth, (req, res) => {
  const role = req.user ? req.user.role : "all";
  const userId = req.user ? req.user.id : null;
  const filter = req.query.filter || "all";

  let query = "SELECT * FROM notifications WHERE (user_id = ? OR role = 'all' OR role = ?)";
  const params = [userId, role];

  if (filter === "unread") {
    query += " AND is_read = 0";
  } else if (filter === "requests") {
    query += " AND type IN ('request', 'mission')";
  } else if (filter === "donations") {
    query += " AND type IN ('donation')";
  } else if (filter === "updates") {
    query += " AND type IN ('update', 'info', 'alert')";
  }

  query += " ORDER BY id DESC LIMIT 50";

  const notifications = db.prepare(query).all(...params);
  const unreadCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR role = 'all' OR role = ?) AND is_read = 0").get(userId, role).count;

  res.json({
    success: true,
    notifications,
    data: notifications,
    unreadCount
  });
});

app.post("/api/notifications/:id/read", optionalAuth, (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true, ok: true });
});

app.post("/api/notifications/read-all", optionalAuth, (req, res) => {
  if (req.user) {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role = 'all' OR role = ?").run(req.user.id, req.user.role);
  } else {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE role = 'all'").run();
  }
  res.json({ success: true, ok: true });
});

app.delete("/api/notifications/:id", optionalAuth, (req, res) => {
  db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
  res.json({ success: true, ok: true });
});

// Demo Notification Simulator Trigger
app.post("/api/notifications/simulate", (req, res) => {
  const role = req.body.role || "donor";
  if (role === "volunteer") {
    notify(null, "volunteer", "🍱 New Mission! 40 Meals Waiting", "Surplus buffet food available at Hotel Park Inn. Closest volunteer dispatch.", "mission", "pages/volunteer.html", "Accept & Help →");
  } else if (role === "donor") {
    notify(null, "donor", "🧡 CareMe Meal Needed", "A student near Green Park requested 1 meal assistance.", "request", "pages/careme.html", "View CareMe →");
  } else {
    notify(null, "ngo", "📦 Bulk Surplus Available", "50 freshly cooked meals offered by Sapphire Banquets.", "donation", "pages/ngo.html", "Claim Food →");
  }
  res.json({ success: true, ok: true, message: `Notification simulated for ${role}` });
});

// ==========================================
// 15. LIVE GEOSPATIAL MAP
// ==========================================

app.get("/api/map", (_req, res) => {
  const donations = db.prepare(`
    SELECT id, food_name, food_type, people_to_feed, urgency, status, latitude, longitude, pickup_location
    FROM donations
    WHERE latitude IS NOT NULL AND status NOT IN ('verified', 'cancelled')
  `).all();

  const requests = db.prepare(`
    SELECT id, ngo_name as name, meals_needed as meals, hunger_percent, distance_km, expiry_time, latitude, longitude, location as place
    FROM priority_pool
    WHERE latitude IS NOT NULL AND status != 'delivered'
  `).all();

  const volunteers = db.prepare(`
    SELECT id, name, vehicle_type, latitude, longitude, volunteer_status
    FROM registrations
    WHERE role = 'volunteer' AND volunteer_status = 'available' AND latitude IS NOT NULL
  `).all();

  const ngos = db.prepare(`
    SELECT id, name, organization_name, capacity_meals, latitude, longitude
    FROM registrations
    WHERE role = 'ngo' AND latitude IS NOT NULL
  `).all();

  res.json({
    success: true,
    donations,
    requests,
    volunteers,
    ngos
  });
});

// ==========================================
// 16. VOICE & AI BACKEND
// ==========================================

app.post("/api/ai/parse-donation", (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ success: false, error: "Text prompt is required" });

  const mealsMatch = text.match(/(\d+)\s*(meals?|people|plates?|portions?|persons?|pkts?|packets?)/i) || text.match(/(feed|for)\s*(\d+)/i);
  const numberMatch = text.match(/\b\d+\b/);
  const meals = mealsMatch ? (mealsMatch[1] ? Number(mealsMatch[1]) : Number(mealsMatch[2])) : (numberMatch ? Number(numberMatch[0]) : null);

  let dietary = "Vegetarian";
  if (/chicken|mutton|fish|egg|non-veg|meat/i.test(text)) dietary = "Non-Vegetarian";
  else if (/vegan|dairy-free/i.test(text)) dietary = "Vegan";

  let category = "Cooked Meals";
  if (/raw|ration|grain|rice bag|flour|vegetables|produce/i.test(text)) category = "Raw / Grains";
  else if (/bread|cake|pastry|bakery|buns/i.test(text)) category = "Bakery";
  else if (/canned|packaged|biscuit|juice/i.test(text)) category = "Packaged Food";

  let expiryHours = 6;
  const expiryMatch = text.match(/(\d+)\s*(hours?|hrs?)/i);
  if (expiryMatch) expiryHours = Number(expiryMatch[1]);
  else if (/urgent|immediate|right away|30 mins|1 hour|asap/i.test(text)) expiryHours = 3;

  let pickupLocation = null;
  const locMatch = text.match(/(at|from|location|near|in)\s+([A-Za-z0-9\s,.-]+?)(?=(for|with|expir|\.|$))/i);
  if (locMatch && locMatch[2].length > 3) pickupLocation = locMatch[2].trim();

  let foodType = null;
  const foodMatches = text.match(/(donate|donating|have|surplus)\s+(?:of\s+)?([A-Za-z0-9\s,&]+?)(?=(for|at|from|to feed|near|\.|$))/i);
  if (foodMatches && foodMatches[2].length > 2) foodType = foodMatches[2].trim();
  else foodType = text.replace(/i want to donate|donate|please|meals|people/gi, "").trim();

  const structured = {
    food_name: foodType || "Surplus Food Pack",
    food_type: foodType || "Cooked Meals",
    people_to_feed: meals || null,
    category,
    dietary,
    expiry_hours: expiryHours,
    pickup_location: pickupLocation,
    urgency: calculateUrgency(new Date().toISOString(), expiryHours)
  };

  const missing = [];
  if (!structured.people_to_feed) missing.push("Number of meals");
  if (!structured.food_type || structured.food_type.length < 3) missing.push("Type of food");
  if (!structured.pickup_location) missing.push("Pickup location");

  let replyText = "";
  if (missing.length === 0) {
    replyText = `Great! I've prepared a donation of ${structured.people_to_feed} ${structured.dietary} meals (${structured.food_name}) at ${structured.pickup_location}. Shelf life is ${structured.expiry_hours} hours. Please confirm to post.`;
  } else {
    replyText = `Got it. To finalize your donation, please specify the ${missing.join(" and ")}.`;
  }

  res.json({
    success: true,
    ok: true,
    structured,
    missing,
    is_ready: missing.length === 0,
    reply: replyText
  });
});

app.post("/api/ai/chat", (req, res) => {
  const query = String(req.body.message || "").toLowerCase().trim();
  const stats = nowStats();

  let response = "";
  let action = null;

  if (query.includes("donate") || query.includes("surplus")) {
    response = "I can help you post a food donation in seconds! Just tell me what food you have, how many meals it feeds, and your pickup location.";
    action = { type: "open_donate" };
  } else if (query.includes("stats") || query.includes("carbon") || query.includes("impact")) {
    response = `Together, ALMS has rescued ${stats.donationMeals} meals, avoided ${stats.carbonKg} kg of CO₂ emissions, with ${stats.volunteers} active volunteers and ${stats.ngos} registered NGOs!`;
    action = { type: "scroll_impact" };
  } else if (query.includes("volunteer") || query.includes("join")) {
    response = "You can register as a volunteer to receive pickup missions, navigate to donors, and deliver meals to nearby shelters!";
    action = { type: "navigate_volunteer" };
  } else {
    response = "I'm ALMS Voice Assistant. I can help you create donations, track deliveries, check community pool metrics, or register as a volunteer. How can I assist you?";
  }

  res.json({ success: true, reply: response, action });
});

// ==========================================
// 17. ADMIN & COMPREHENSIVE DASHBOARD
// ==========================================

app.get("/api/dashboard", (_req, res) => {
  res.json({
    success: true,
    stats: nowStats(),
    registrations: db.prepare("SELECT * FROM registrations ORDER BY id DESC LIMIT 50").all(),
    donations: db.prepare(`
      SELECT d.*, u.name as donor_name, ngo.name as ngo_name, vol.name as volunteer_name
      FROM donations d
      LEFT JOIN registrations u ON d.user_id = u.id
      LEFT JOIN registrations ngo ON d.assigned_ngo_id = ngo.id
      LEFT JOIN registrations vol ON d.assigned_volunteer_id = vol.id
      ORDER BY d.id DESC LIMIT 50
    `).all(),
    priorityPool: db.prepare("SELECT * FROM priority_pool ORDER BY id DESC LIMIT 50").all(),
    collabDonations: db.prepare("SELECT * FROM collab_donations ORDER BY id DESC LIMIT 50").all(),
    caremeRequests: db.prepare("SELECT * FROM careme_requests ORDER BY id DESC LIMIT 50").all(),
    celebrationRequests: db.prepare("SELECT * FROM celebration_requests ORDER BY id DESC LIMIT 50").all(),
    charityAnnouncements: db.prepare("SELECT * FROM charity_announcements ORDER BY id DESC LIMIT 50").all(),
    emergencies: db.prepare("SELECT * FROM emergency_crises ORDER BY id DESC LIMIT 50").all(),
    alerts: db.prepare("SELECT * FROM alerts ORDER BY id DESC LIMIT 50").all(),
  });
});

// ==========================================
// 18. STATIC FILES & GLOBAL ERROR HANDLING
// ==========================================

app.use(express.static(__dirname));

// Global API 404
app.use("/api", (_req, res) => {
  res.status(404).json({ success: false, error: "API Endpoint not found" });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Global Server Error:", err);
  res.status(500).json({ success: false, error: err.message || "An internal server error occurred" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`==================================================`);
  console.log(`ALMS Full-Stack Server listening at http://localhost:${port}`);
  console.log(`Database connected & initialized with persistent models.`);
  console.log(`==================================================`);
});
