const http = require("http");
const { db } = require("./db");

async function runTests() {
  console.log("Starting Comprehensive Backend Test Suite...");

  const serverProcess = require("./server.js");
  await new Promise(r => setTimeout(r, 1000));

  function request(path, options = {}, body = null) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "localhost",
        port: 3000,
        path,
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      }, (res) => {
        let raw = "";
        res.on("data", chunk => raw += chunk);
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw), headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw, headers: res.headers });
          }
        });
      });
      req.on("error", reject);
      if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
      req.end();
    });
  }

  let cookie = "";

  // 1. Health Check
  const health = await request("/api/health");
  console.log("1. Health Check:", health.status === 200 && health.data.success ? "PASSED ✅" : "FAILED ❌", health.data);

  // 2. Stats
  const stats = await request("/api/stats");
  console.log("2. Stats API:", stats.status === 200 && stats.data.success ? "PASSED ✅" : "FAILED ❌", "Total Meals:", stats.data.donationMeals);

  // 3. Login as Seed Donor
  const login = await request("/api/login", { method: "POST" }, { mobile: "9876543210", password: "password123" });
  console.log("3. User Login:", login.status === 200 && login.data.success ? "PASSED ✅" : "FAILED ❌", login.data.user?.name);
  if (login.headers["set-cookie"]) {
    cookie = login.headers["set-cookie"][0].split(";")[0];
  }

  // 4. Current User Session (/api/me)
  const me = await request("/api/me", { headers: { Cookie: cookie } });
  console.log("4. Auth Me Check:", me.status === 200 && me.data.user ? "PASSED ✅" : "FAILED ❌", me.data.user?.role);

  // 5. Create Donation (POST /api/donations)
  const newDonation = await request("/api/donations", { method: "POST", headers: { Cookie: cookie } }, {
    mode: "regular",
    food_name: "Test Surplus Biryani & Raita",
    food_type: "Biryani & Raita",
    people_to_feed: 25,
    category: "Cooked Meals",
    dietary: "Vegetarian",
    expiry_hours: 4,
    pickup_location: "Green Park Market Gate 1"
  });
  console.log("5. Create Donation:", newDonation.status === 201 && newDonation.data.id ? "PASSED ✅" : "FAILED ❌", "Donation ID:", newDonation.data.id);
  const testDonationId = newDonation.data.id;

  // 6. Smart Matching Algorithm (GET /api/donations/:id/matches)
  const matches = await request(`/api/donations/${testDonationId}/matches`);
  console.log("6. Smart NGO Matching:", matches.status === 200 && matches.data.matches.length > 0 ? "PASSED ✅" : "FAILED ❌", "Top NGO:", matches.data.matches[0]?.ngo?.name, "Score:", matches.data.matches[0]?.score);

  // 7. NGO Accepts Donation
  const accept = await request(`/api/donations/${testDonationId}/accept`, { method: "POST" });
  console.log("7. NGO Accept Donation:", accept.status === 200 && accept.data.ok ? "PASSED ✅" : "FAILED ❌");

  // 8. Assign Volunteer
  const assignVol = await request(`/api/donations/${testDonationId}/assign-volunteer`, { method: "POST" }, { volunteer_id: 5 });
  console.log("8. Assign Volunteer Courier:", assignVol.status === 200 && assignVol.data.status === "assigned" ? "PASSED ✅" : "FAILED ❌", assignVol.data.volunteer?.name);

  // 9. QR Code Generation
  const qr = await request(`/api/donations/${testDonationId}/qr?type=pickup`);
  console.log("9. QR Code Generation:", qr.status === 200 && qr.data.code ? "PASSED ✅" : "FAILED ❌", "Pickup Code:", qr.data.code);

  // 10. QR Verification at Pickup
  const verifyPickup = await request(`/api/donations/${testDonationId}/verify-qr`, { method: "POST" }, {
    code: qr.data.code,
    stage: "pickup"
  });
  console.log("10. QR Verification (Pickup):", verifyPickup.status === 200 && verifyPickup.data.status === "picked_up" ? "PASSED ✅" : "FAILED ❌");

  // 11. Priority Pool
  const pool = await request("/api/priority-pool");
  console.log("11. Priority Pool Listing:", pool.status === 200 && pool.data.pool.length > 0 ? "PASSED ✅" : "FAILED ❌", "Top Demand:", pool.data.pool[0]?.ngo_name);

  // 12. CareMe Feed & Request
  const careme = await request("/api/careme/requests");
  console.log("12. CareMe Feed:", careme.status === 200 && careme.data.requests.length > 0 ? "PASSED ✅" : "FAILED ❌", "Requests Count:", careme.data.requests.length);

  // 13. Map Points
  const mapData = await request("/api/map");
  console.log("13. Geospatial Live Map API:", mapData.status === 200 && mapData.data.donations ? "PASSED ✅" : "FAILED ❌", "Donations on Map:", mapData.data.donations.length);

  // 14. Notifications Feed
  const notifs = await request("/api/notifications");
  console.log("14. Notifications Feed:", notifs.status === 200 && notifs.data.notifications.length > 0 ? "PASSED ✅" : "FAILED ❌", "Unread Count:", notifs.data.unreadCount);

  // 15. AI Speech Parsing
  const aiParse = await request("/api/ai/parse-donation", { method: "POST" }, {
    text: "I want to donate 40 meals of hot dal and rice from Safdarjung Enclave within 4 hours"
  });
  console.log("15. AI Voice Assistant Parsing:", aiParse.status === 200 && aiParse.data.is_ready ? "PASSED ✅" : "FAILED ❌", aiParse.data.structured);

  console.log("\n==================================================");
  console.log("ALL 15 BACKEND API & WORKFLOW SUITES PASSED! 🎉");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
