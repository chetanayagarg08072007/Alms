const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "alms.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

// ==========================================
// DATABASE SCHEMA DEFINITION
// ==========================================
db.exec(`
  -- 1. Users / Registrations Table (Donors, NGOs, Volunteers, Admins)
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL, -- 'donor', 'ngo', 'volunteer', 'admin', 'religious'
    name TEXT NOT NULL,
    mobile TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    organization_name TEXT,
    donor_type TEXT DEFAULT 'individual', -- 'individual', 'bulk'
    bulk_subtype TEXT, -- 'University Mess', 'Hotel', 'Restaurant', 'Weddings/Parties', 'Resort'
    capacity_meals INTEGER DEFAULT 100,
    service_area TEXT DEFAULT 'All City',
    address TEXT,
    pincode TEXT,
    latitude REAL,
    longitude REAL,
    proof_file TEXT,
    fssai_file TEXT,
    status TEXT NOT NULL DEFAULT 'verified', -- 'verified', 'pending', 'suspended'
    has_blue_tick INTEGER DEFAULT 1,
    has_80g INTEGER DEFAULT 1,
    is_available INTEGER DEFAULT 1, -- For volunteers (1: Available, 0: Busy / Offline)
    volunteer_status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline'
    vehicle_type TEXT DEFAULT 'Two-Wheeler',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- 2. Donations Table
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mode TEXT NOT NULL DEFAULT 'regular', -- 'regular', 'bulk', 'collab'
    food_name TEXT NOT NULL DEFAULT 'Surplus Meal Pack',
    food_type TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Cooked Meals',
    dietary TEXT NOT NULL DEFAULT 'Vegetarian', -- 'Vegetarian', 'Non-Vegetarian', 'Vegan'
    is_veg INTEGER DEFAULT 1,
    quantity TEXT,
    people_to_feed INTEGER NOT NULL,
    prepared_time TEXT,
    expiry_hours REAL NOT NULL DEFAULT 8,
    expiry_time TEXT,
    urgency TEXT NOT NULL DEFAULT 'NORMAL', -- 'URGENT', 'EXPIRING_SOON', 'NORMAL'
    pickup_location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    need_vessel INTEGER DEFAULT 0,
    vessel_litres INTEGER DEFAULT 0,
    storage_instructions TEXT,
    allergens TEXT,
    image_file TEXT,
    status TEXT NOT NULL DEFAULT 'posted', -- 'posted', 'matched', 'accepted', 'assigned', 'picked_up', 'in_transit', 'delivered', 'verified', 'cancelled'
    assigned_ngo_id INTEGER,
    assigned_volunteer_id INTEGER,
    pickup_code TEXT,
    delivery_code TEXT,
    pickup_time TEXT,
    delivery_time TEXT,
    verified_at TEXT,
    received_photo TEXT,
    partner TEXT,
    contributors INTEGER,
    bulk_source TEXT,
    organisation TEXT,
    co2_avoided_kg REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id),
    FOREIGN KEY (assigned_ngo_id) REFERENCES registrations(id),
    FOREIGN KEY (assigned_volunteer_id) REFERENCES registrations(id)
  );

  -- 3. Deliveries Table
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donation_id INTEGER NOT NULL,
    ngo_id INTEGER,
    volunteer_id INTEGER,
    pickup_location TEXT NOT NULL,
    delivery_location TEXT,
    status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'verified'
    special_instruction TEXT,
    pickup_time TEXT,
    delivery_time TEXT,
    verified_at TEXT,
    verification_status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (donation_id) REFERENCES donations(id),
    FOREIGN KEY (ngo_id) REFERENCES registrations(id),
    FOREIGN KEY (volunteer_id) REFERENCES registrations(id)
  );

  -- 4. Priority Pool Table (NGO Requests)
  CREATE TABLE IF NOT EXISTS priority_pool (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ngo_id INTEGER,
    ngo_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    distance_km REAL DEFAULT 1.5,
    meals_needed INTEGER NOT NULL,
    meals_collected INTEGER NOT NULL DEFAULT 0,
    hunger_percent INTEGER NOT NULL DEFAULT 85,
    expiry_hours REAL NOT NULL DEFAULT 3.5,
    expiry_time TEXT NOT NULL,
    is_veg INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'delivered'
    volunteer_id INTEGER,
    volunteer_name TEXT,
    volunteer_phone TEXT,
    volunteer_location TEXT,
    volunteer_status TEXT,
    received_photo TEXT,
    volunteer_rating INTEGER,
    donor_rating INTEGER,
    review_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ngo_id) REFERENCES registrations(id),
    FOREIGN KEY (volunteer_id) REFERENCES registrations(id)
  );

  -- 5. Collab Donations Table
  CREATE TABLE IF NOT EXISTS collab_donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    donor_name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    distance_km REAL DEFAULT 0.8,
    have_food TEXT NOT NULL,
    seeking_food TEXT NOT NULL,
    quantity_plates INTEGER NOT NULL,
    hours_ago REAL NOT NULL DEFAULT 1.5,
    is_veg INTEGER NOT NULL DEFAULT 1,
    is_matched INTEGER NOT NULL DEFAULT 0,
    matched_with_id INTEGER,
    assigned_volunteer_id INTEGER,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'matched', 'completed'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id)
  );

  -- 6. CareMe Requests Table
  CREATE TABLE IF NOT EXISTS careme_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    needy_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    distance TEXT DEFAULT '0.8 km',
    meal_type TEXT NOT NULL DEFAULT 'Dinner', -- 'Breakfast', 'Lunch', 'Dinner'
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'matched', 'completed'
    matched_donor_id INTEGER,
    matched_donor_name TEXT,
    matched_donor_phone TEXT,
    meetup_spot TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id),
    FOREIGN KEY (matched_donor_id) REFERENCES registrations(id)
  );

  -- 7. CareMe Chat Messages Table
  CREATE TABLE IF NOT EXISTS careme_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    sender_role TEXT NOT NULL, -- 'donor', 'needy'
    sender_name TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES careme_requests(id)
  );

  -- 8. Celebration Organizations & Requests
  CREATE TABLE IF NOT EXISTS celebration_orgs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL, -- 'orphanage', 'oldage', 'ngo'
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    distance TEXT DEFAULT '1.5 km away',
    residents_count INTEGER NOT NULL,
    accepting_celebrations INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS celebration_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    org_id INTEGER NOT NULL,
    org_name TEXT NOT NULL,
    org_category TEXT,
    reason TEXT NOT NULL, -- 'Birthday', 'Wedding Anniversary', 'Achievement', 'Special Occasion'
    items_to_bring TEXT NOT NULL,
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 2,
    priority TEXT DEFAULT 'Normal',
    personal_message TEXT,
    status TEXT NOT NULL DEFAULT 'accepted', -- 'pending', 'accepted', 'declined'
    response_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id),
    FOREIGN KEY (org_id) REFERENCES celebration_orgs(id)
  );

  -- 9. Charity Food Announcements (Community Kitchens & Langars)
  CREATE TABLE IF NOT EXISTS charity_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL DEFAULT 'temple', -- 'individual', 'temple'
    reason TEXT NOT NULL,
    location TEXT NOT NULL,
    gathering_headcount INTEGER NOT NULL,
    date TEXT NOT NULL,
    time_window TEXT NOT NULL,
    food_description TEXT NOT NULL,
    head_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id)
  );

  -- 10. Emergency Crises & Contributions
  CREATE TABLE IF NOT EXISTS emergency_crises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cause TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    proof_file TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'resolved'
    target_meals INTEGER NOT NULL DEFAULT 1500,
    collected_meals INTEGER NOT NULL DEFAULT 640,
    funds_rupees INTEGER NOT NULL DEFAULT 84500,
    relief_packs INTEGER NOT NULL DEFAULT 190,
    collection_point_address TEXT,
    collection_point_time TEXT,
    collection_volunteer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS emergency_contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crisis_id INTEGER NOT NULL,
    donor_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    mode TEXT NOT NULL, -- 'point', 'home'
    contribution_type TEXT NOT NULL,
    address TEXT,
    items_summary TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (crisis_id) REFERENCES emergency_crises(id)
  );

  -- 11. Notifications Table
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT NOT NULL DEFAULT 'all', -- 'all', 'donor', 'ngo', 'volunteer'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'request', 'mission', 'donation', 'update', 'info', 'warning', 'success'
    link TEXT,
    action_text TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- 12. Volunteer Reviews & Ratings
  CREATE TABLE IF NOT EXISTS volunteer_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (volunteer_id) REFERENCES registrations(id)
  );

  -- 13. System Alerts (Demand Alerts, Closing Reminders)
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'demand', 'reminder'
    target_area TEXT,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- 14. Food Requests
  CREATE TABLE IF NOT EXISTS food_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    place TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    meals INTEGER NOT NULL,
    contact TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'NORMAL',
    status TEXT NOT NULL DEFAULT 'open',
    fulfilled_meals INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES registrations(id)
  );

  -- 15. Community Pools (Legacy Support)
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
`);

// ==========================================
// HELPER CALCULATIONS & ALGORITHMS
// ==========================================

// Haversine distance calculator in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate Priority Index Formula: (Hunger % / Distance) * Urgency Factor
function calculatePriorityIndex(hungerPercent, distanceKm, expiryHours) {
  const dist = Math.max(0.5, Number(distanceKm) || 1.0);
  const urgencyFactor = expiryHours <= 2 ? 2.5 : expiryHours <= 4 ? 1.8 : 1.0;
  const rawScore = (hungerPercent / dist) * urgencyFactor;
  return Math.round(rawScore);
}

// Dynamic Urgency Category based on Remaining Shelf Life
function calculateUrgency(createdAtIso, expiryHours) {
  try {
    const created = new Date(createdAtIso).getTime();
    const now = Date.now();
    const hoursElapsed = (now - created) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, Number(expiryHours) - hoursElapsed);

    if (hoursRemaining < 4) return "URGENT";
    if (hoursRemaining < 12) return "EXPIRING_SOON";
    return "NORMAL";
  } catch (e) {
    return "NORMAL";
  }
}

// Generate Secure Cryptographic Alphanumeric Token
function generateSecureCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Aggregated Live Platform Statistics
function nowStats() {
  const totalDonations = db.prepare("SELECT COUNT(*) as count FROM donations").get().count;
  const totalMeals = db.prepare("SELECT COALESCE(SUM(people_to_feed), 0) as total FROM donations").get().total;
  const completedDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status IN ('delivered', 'verified')").get().count;
  const activeDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE status NOT IN ('delivered', 'verified', 'cancelled')").get().count;
  const urgentDonations = db.prepare("SELECT COUNT(*) as count FROM donations WHERE urgency = 'URGENT' AND status NOT IN ('delivered', 'verified', 'cancelled')").get().count;

  const volunteersCount = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE role = 'volunteer'").get().count;
  const ngosCount = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE role = 'ngo'").get().count;
  const donorsCount = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE role = 'donor'").get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM registrations").get().count;

  const totalPoolMeals = db.prepare("SELECT COALESCE(SUM(meals_collected), 0) as total FROM priority_pool").get().total;
  const carbonKg = Math.round((Number(totalMeals) + Number(totalPoolMeals)) * 0.85 * 10) / 10;
  const foodRescuedKg = Math.round((Number(totalMeals) + Number(totalPoolMeals)) * 0.42 * 10) / 10;

  const pool = db.prepare("SELECT * FROM community_pools WHERE id = 1").get() || { target_meals: 250, collected_meals: 163 };

  return {
    donationsCount: totalDonations,
    donationMeals: totalMeals,
    completedDonations,
    activeDonations,
    urgentDonations,
    volunteers: volunteersCount,
    ngos: ngosCount,
    donors: donorsCount,
    totalUsers,
    carbonKg,
    foodRescuedKg,
    pool
  };
}

// ==========================================
// SEED INITIAL DATABASE DATA
// ==========================================
function seedInitialData() {
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM registrations").get().count;
  if (usersCount > 0) return;

  const salt = bcrypt.genSaltSync(10);
  const defaultHash = bcrypt.hashSync("password123", salt);

  // 1. Seed Users (Donor, NGO, Volunteer, Admin)
  const insertUser = db.prepare(`
    INSERT INTO registrations (
      role, name, mobile, email, password_hash, organization_name, donor_type,
      bulk_subtype, capacity_meals, service_area, address, pincode,
      latitude, longitude, status, has_blue_tick, has_80g, is_available, vehicle_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'donor', 'Priya Sharma', '9876543210', 'donor@alms.org', defaultHash,
    'Sharma Family Kitchen', 'individual', null, 50, 'Green Park',
    'Green Park Block B, New Delhi', '110016', 28.5650, 77.1980,
    'verified', 1, 0, 1, 'Car'
  );

  insertUser.run(
    'donor', 'Grand Palace Hotel', '9811122334', 'grandpalace@alms.org', defaultHash,
    'Grand Palace Hotel & Banquets', 'bulk', 'Hotel', 500, 'South Delhi',
    'Gate 3 Kitchen Loading Bay, Safdarjung Enclave', '110029', 28.5620, 77.2150,
    'verified', 1, 0, 1, 'Van'
  );

  insertUser.run(
    'ngo', 'Asha Deep Shelter & Care', '9876543211', 'ngo@alms.org', defaultHash,
    'Asha Deep Welfare Society', 'individual', null, 150, 'Safdarjung Enclave',
    'Safdarjung Block B, Community Shelter Hall', '110029', 28.5684, 77.2065,
    'verified', 1, 1, 1, 'Auto'
  );

  insertUser.run(
    'ngo', 'Robin Care Children Home', '9822255667', 'robincare@alms.org', defaultHash,
    'Robin Care Foundation', 'individual', null, 120, 'Hauz Khas',
    'Hauz Khas Village Main Road', '110016', 28.5528, 77.2045,
    'verified', 1, 1, 1, 'Van'
  );

  insertUser.run(
    'volunteer', 'Rahul Sharma', '9876543212', 'volunteer@alms.org', defaultHash,
    null, 'individual', null, 50, 'South Delhi',
    'AIIMS Crossing, Ansari Nagar', '110029', 28.5645, 77.2090,
    'verified', 1, 0, 1, 'Motorcycle with 50L Box'
  );

  insertUser.run(
    'volunteer', 'Amit Patel', '9777788899', 'amit@alms.org', defaultHash,
    null, 'individual', null, 40, 'Green Park',
    'Green Park Extension', '110016', 28.5660, 77.2040,
    'verified', 1, 0, 1, 'Two-Wheeler'
  );

  insertUser.run(
    'admin', 'ALMS System Admin', '9876543213', 'admin@alms.org', defaultHash,
    'ALMS Humanitarian Network', 'individual', null, 1000, 'All City',
    'ALMS Central Operations Hub, New Delhi', '110001', 28.6139, 77.2090,
    'verified', 1, 1, 1, 'Four-Wheeler'
  );

  // 2. Seed Donations
  const insertDonation = db.prepare(`
    INSERT INTO donations (
      user_id, mode, food_name, food_type, category, dietary, is_veg, quantity,
      people_to_feed, prepared_time, expiry_hours, urgency, pickup_location,
      latitude, longitude, need_vessel, vessel_litres, status, assigned_ngo_id,
      assigned_volunteer_id, pickup_code, delivery_code, co2_avoided_kg
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDonation.run(
    2, 'bulk', 'Cooked Shahi Paneer, Jeera Rice & Naan', 'Paneer & Rice Meals', 'Cooked Meals', 'Vegetarian', 1, '60 meal boxes',
    60, '1 hour ago', 5.0, 'EXPIRING_SOON', 'Gate 3 Loading Bay, Grand Palace Hotel',
    28.5620, 77.2150, 1, 40, 'assigned', 3, 5, 'ALM901', 'ALM902', 51.0
  );

  insertDonation.run(
    1, 'collab', '30 Fresh Chapatis', 'Chapatis', 'Cooked Meals', 'Vegetarian', 1, '30 pieces',
    15, '2 hours ago', 6.0, 'NORMAL', 'Green Park Block B',
    28.5650, 77.1980, 0, 0, 'posted', null, null, 'ALM801', 'ALM802', 12.8
  );

  insertDonation.run(
    2, 'bulk', 'Cooked Vegetable Biryani & Raita', 'Veg Biryani', 'Cooked Meals', 'Vegetarian', 1, '45 plates',
    45, '30 mins ago', 3.0, 'URGENT', 'Spice Garden Kitchen, Hauz Khas',
    28.5580, 77.2020, 1, 25, 'delivered', 3, 5, 'ALM701', 'ALM702', 38.3
  );

  // 3. Seed Deliveries
  db.prepare(`
    INSERT INTO deliveries (
      donation_id, ngo_id, volunteer_id, pickup_location, delivery_location, status,
      special_instruction, pickup_time, delivery_time, verification_status
    ) VALUES (1, 3, 5, 'Gate 3 Loading Bay, Grand Palace Hotel', 'Safdarjung Block B, Community Shelter Hall', 'assigned', '⚠️ Please carry sanitized 40L insulated containers for this pickup.', datetime('now', '-30 minutes'), null, 'pending')
  `).run();

  // 4. Seed Priority Pool (NGO Requests)
  const insertPool = db.prepare(`
    INSERT INTO priority_pool (
      ngo_id, ngo_name, contact_person, phone, location, latitude, longitude,
      distance_km, meals_needed, meals_collected, hunger_percent, expiry_hours,
      expiry_time, is_veg, status, volunteer_id, volunteer_name, volunteer_phone,
      volunteer_location, volunteer_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPool.run(
    3, 'Asha Deep Shelter & Care', 'Suresh Verma', '+91 98765 43210', 'Safdarjung Enclave, New Delhi', 28.5684, 77.2065,
    1.2, 80, 58, 92, 2.5, '9:00 PM', 1, 'in_progress', 5, 'Rahul Sharma', '+91 98111 22334', '0.6 km away (AIIMS Crossing)', 'En route to pickup'
  );

  insertPool.run(
    4, 'Robin Care Children Home', 'Pooja Nair', '+91 98222 55667', 'Hauz Khas Village', 28.5528, 77.2045,
    2.8, 120, 35, 88, 4.0, '10:30 PM', 1, 'in_progress', null, null, null, null, null
  );

  insertPool.run(
    3, 'Seva Kutir Old Age Shelter', 'Dr. Anand Joshi', '+91 98333 77889', 'Green Park Extension', 28.5660, 77.2040,
    3.5, 50, 50, 75, 5.5, '11:00 PM', 1, 'completed', 6, 'Amit Patel', '+91 97777 88899', 'Delivered at Shelter Gate', 'Delivered Successfully ✅'
  );

  // 5. Seed Collab Donations
  const insertCollab = db.prepare(`
    INSERT INTO collab_donations (
      user_id, donor_name, location, latitude, longitude, distance_km,
      have_food, seeking_food, quantity_plates, hours_ago, is_veg, is_matched, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCollab.run(1, 'Priya Sharma', 'Green Park Block B', 28.5650, 77.1980, 0.6, '30 Fresh Chapatis', 'Dal / Sabzi / Curry', 15, 1.5, 1, 0, 'available');
  insertCollab.run(null, 'Aarav Gupta', 'Hauz Khas Enclave', 28.5550, 77.2010, 1.8, 'Steamed Basmati Rice (20 plates)', 'Rajma / Chole / Dal', 20, 2.0, 1, 0, 'available');
  insertCollab.run(null, 'Sunita Mehra', 'Malviya Nagar', 28.5350, 77.2100, 3.2, '12 Dry Vegetable Sandwiches', 'Fruit / Juice / Milk', 12, 3.0, 1, 0, 'available');

  // 6. Seed CareMe Requests & Messages
  const insertCareMe = db.prepare(`
    INSERT INTO careme_requests (
      user_id, needy_name, phone, location, latitude, longitude, distance,
      meal_type, reason, status, matched_donor_id, matched_donor_name, matched_donor_phone, meetup_spot
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCareMe.run(
    null, 'Kishan Lal (Daily Wage Worker)', '+91 98444 33221', 'Near Safdarjung Flyover', 28.5720, 77.2100, '0.8 km',
    'Dinner', 'Family of 3 stranded due to delayed wages, need warm nutritious dinner.', 'pending', null, null, null, null
  );

  insertCareMe.run(
    null, 'Meena Devi (Patient Attendant)', '+91 98555 66778', 'AIIMS Gate No. 2 Waiting Area', 28.5670, 77.2110, '1.5 km',
    'Lunch', 'Caring for sick mother in emergency ward, unable to afford canteen food.', 'matched', 1, 'Sunil Mehta (Food Hero)', '+91 98999 11223', 'Gate 2 Metro Exit'
  );

  db.prepare(`
    INSERT INTO careme_messages (request_id, sender_role, sender_name, message, created_at)
    VALUES
      (2, 'donor', 'Sunil Mehta', 'Hello Meena ji, I have packed 2 fresh thalis for you with rotis, dal and rice.', datetime('now', '-30 minutes')),
      (2, 'needy', 'Meena Devi', 'Thank you so much brother! I am standing near Metro Pillar 42.', datetime('now', '-25 minutes')),
      (2, 'donor', 'Sunil Mehta', 'On my way on scooter, reaching in 5 minutes.', datetime('now', '-20 minutes'))
  `).run();

  // 7. Seed Celebration Organizations
  const insertCelebOrg = db.prepare(`
    INSERT INTO celebration_orgs (category, name, location, distance, residents_count, accepting_celebrations, image, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCelebOrg.run('orphanage', 'Bal Sahyog Children Home', 'Connaught Place / Gole Market', '2.4 km away', 65, 1, 'images/children-meal.jpeg', 'Home to 65 energetic children aged 5-16. Love birthday cakes, drawing books, and festive meals.');
  insertCelebOrg.run('oldage', 'Sandhya Senior Citizen Home', 'Green Park Extension', '1.2 km away', 42, 1, 'images/elderly-meal.jpeg', 'Caring shelter for 42 senior residents. Gentle celebration with soothing music, soft sweets, and lunch.');
  insertCelebOrg.run('ngo', 'Asha Deep Community Shelter', 'Safdarjung Enclave', '1.5 km away', 85, 1, 'images/community-meal.jpeg', 'Community night shelter and day support center for transit families and destitute individuals.');

  // 8. Seed Emergency Crisis
  db.prepare(`
    INSERT INTO emergency_crises (
      title, cause, location, latitude, longitude, proof_file, status, target_meals, collected_meals, funds_rupees, relief_packs,
      collection_point_address, collection_point_time, collection_volunteer
    ) VALUES (
      '🚨 Yamuna Low-Lying Flood Relief Intervention',
      'Heavy monsoon breach displacing 1,400 families across riverbank transit camps.',
      'Yamuna Floodplain Relief Camp, Kashmiri Gate / ISBT',
      28.6670, 77.2280, 'emergency-proof-sample.jpg', 'active', 1500, 640, 84500, 190,
      'Community Center Hall, Kashmiri Gate ISBT',
      '1-Hour Rapid Collection Window: 4:00 PM – 5:00 PM Today',
      'Rahul Sharma (VOL-8821) • 📞 +91 98111 22334'
    )
  `).run();

  // 9. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, role, title, message, type, link, action_text, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(null, 'donor', '🍱 New Nearby Meal Request', 'An individual near Green Park (1.4 km) has requested an urgent meal via CareMe.', 'request', 'pages/careme.html', 'View Request →', 0, datetime('now', '-10 minutes'));
  insertNotif.run(null, 'volunteer', '🚨 New Urgent Rescue Mission!', '35 meals ready for rescue at Grand Hotel Banquet. You are the closest volunteer.', 'mission', 'pages/volunteer.html', 'Accept Mission →', 0, datetime('now', '-25 minutes'));
  insertNotif.run(null, 'ngo', '📦 Bulk Donation Available', 'Apex Tech University Mess posted 60 meals of cooked Dal & Rice with vessels.', 'donation', 'pages/ngo.html', 'Claim Food →', 0, datetime('now', '-1 hour'));
  insertNotif.run(null, 'all', '🌱 Environmental Milestone Reached', 'ALMS network has crossed 1,500 kg CO₂ emissions prevented this month!', 'update', '#impact', 'View Carbon Impact →', 1, datetime('now', '-2 hours'));

  // 10. Seed Community Pool
  db.prepare("INSERT OR IGNORE INTO community_pools (id, name, locality, target_meals, collected_meals) VALUES (1, 'Green Park Community Pool', 'Green Park, New Delhi', 250, 163)").run();

  // 11. Seed Volunteer Reviews
  db.prepare(`
    INSERT INTO volunteer_reviews (volunteer_id, reviewer_name, reviewer_role, rating, comment, created_at)
    VALUES
      (5, 'Asha Deep NGO', 'NGO Coordinator', 5, 'Always on time, handled vessels with utmost hygiene!', datetime('now', '-1 day')),
      (5, 'Grand Palace Hotel', 'Donor Manager', 5, 'Very polite nature and prompt pickup.', datetime('now', '-3 days'))
  `).run();
}

function datetime(nowStr, offsetStr = null) {
  if (!offsetStr) return new Date().toISOString();
  return new Date(Date.now() - 30 * 60 * 1000).toISOString();
}

// Auto seed on initial startup
try {
  seedInitialData();
} catch (e) {
  console.error("Database seed error:", e);
}

module.exports = {
  db,
  calculateDistance,
  calculatePriorityIndex,
  calculateUrgency,
  generateSecureCode,
  nowStats
};
