// ==========================================
// ALMS HOMEPAGE LOGIC & LIVE WORKFLOW FEED
// ==========================================

const slides = [...document.querySelectorAll(".slide")];
const dots = document.querySelector(".dots");
if (dots) {
  slides.forEach((_, i) => dots.insertAdjacentHTML("beforeend", `<i class="dot ${i ? "" : "active"}"></i>`));
  let slide = 0;
  setInterval(() => {
    slides[slide]?.classList.remove("active");
    if (dots.children[slide]) dots.children[slide].classList.remove("active");
    slide = (slide + 1) % slides.length;
    slides[slide]?.classList.add("active");
    if (dots.children[slide]) dots.children[slide].classList.add("active");
  }, 4000);
}

document.querySelectorAll("[data-scroll]").forEach((b) => {
  b.onclick = () => document.querySelector("#" + b.dataset.scroll)?.scrollIntoView({ behavior: "smooth" });
});

// Render Dynamic Smart Donation Form
function renderDonation(mode = "regular") {
  const extra = {
    regular: "",
    collab: `
      <label>Collaboration Group / Partner 
        <input required name="partner" placeholder="Partner organization name">
      </label>
      <label>Number of Contributors 
        <input required name="contributors" type="number" min="1" placeholder="e.g. 5">
      </label>`,
    bulk: `
      <label>Bulk Source
        <select required name="bulk_source">
          <option value="">Select source</option>
          <option>Wedding / Banquet</option>
          <option>Corporate Cafeteria</option>
          <option>Restaurant / Hotel</option>
          <option>Community Gathering</option>
        </select>
      </label>
      <label>Event / Organization Name 
        <input required name="organisation" placeholder="e.g. Grand Banquet Hall">
      </label>`,
  };

  const formContainer = document.querySelector("#donationForm");
  if (!formContainer) return;

  formContainer.innerHTML = `
    <form class="form-grid" style="margin-top: 14px;">
      ${extra[mode]}
      <label>Food Item / Title
        <input required name="food_name" placeholder="e.g. Banquet Veg Biryani & Paneer">
      </label>
      <label>Food Category
        <select required name="category">
          <option value="Cooked Meals">Cooked Meals (Hot/Fresh)</option>
          <option value="Bakery">Bakery & Breads</option>
          <option value="Raw / Grains">Raw Grains & Dry Ration</option>
          <option value="Packaged Food">Packaged & Canned Goods</option>
          <option value="Fruits & Veg">Fresh Fruits & Vegetables</option>
        </select>
      </label>
      <label>Dietary Category
        <select required name="dietary">
          <option value="Vegetarian">🟢 Vegetarian</option>
          <option value="Non-Vegetarian">🔴 Non-Vegetarian</option>
          <option value="Vegan">🌱 Vegan</option>
        </select>
      </label>
      <label>People to Feed / Portions
        <input required name="people_to_feed" type="number" min="1" placeholder="e.g. 50">
      </label>
      <label>Remaining Shelf Life (Hours)
        <input required name="expiry_hours" type="number" min="1" max="72" value="6" placeholder="e.g. 4 for urgent hot food">
      </label>
      <label>Storage / Handling
        <input name="storage_instructions" placeholder="e.g. Keep in sealed containers">
      </label>
      <label class="full">Pickup Location & Landmark
        <div style="display: flex; gap: 8px;">
          <input required name="pickup_location" id="donationLocInput" placeholder="Street, Building, Landmark">
          <button type="button" class="btn btn-secondary" id="autoLocBtn" style="white-space: nowrap; font-size: 0.8rem;">📍 Detect GPS</button>
        </div>
      </label>
      <input type="hidden" name="latitude" id="donationLat">
      <input type="hidden" name="longitude" id="donationLng">
      <input type="hidden" name="food_type" value="Surplus Meal">
      <button type="submit" class="btn btn-primary full">Post ${mode.toUpperCase()} Donation</button>
    </form>
    <div class="note"></div>`;

  const form = formContainer.querySelector("form");
  const note = form.nextElementSibling;

  form.querySelector("#autoLocBtn")?.addEventListener("click", () => {
    if (!navigator.geolocation) return showToast("Geolocation is not supported by your browser.", "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.querySelector("#donationLat").value = pos.coords.latitude;
        form.querySelector("#donationLng").value = pos.coords.longitude;
        showToast("✓ GPS Location attached to donation!", "success");
        form.querySelector("#autoLocBtn").textContent = "✓ GPS Attached";
        form.querySelector("#autoLocBtn").style.background = "#dcfce7";
      },
      () => showToast("Please allow location permissions.", "error")
    );
  });

  form.onsubmit = async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Analyzing shelf life & posting...";

    const body = Object.fromEntries(new FormData(form).entries());
    body.mode = mode;
    body.food_type = body.food_name;

    try {
      const res = await api("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      showToast(`✓ Donation posted! Urgency: ${res.urgency}`, "success");
      setNote(note, `✓ Donation saved! Verification code: ${res.pickup_code}`);
      form.reset();
      loadStats();
      loadWorkflowFeed();
    } catch (err) {
      setNote(note, err.message, true);
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = `Post ${mode.toUpperCase()} Donation`;
    }
  };

  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
}
renderDonation();
document.querySelectorAll("[data-mode]").forEach((b) => {
  b.onclick = () => renderDonation(b.dataset.mode);
});

// Demand Alert Button
document.querySelector("#alertBtn")?.addEventListener("click", async (e) => {
  try {
    await api("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "demand" }),
    });
    e.target.textContent = "Demand Alert Sent ✓";
    setNote(document.querySelector("#alertNote"), "✓ Demand alert broadcast to network.");
    showToast("Demand alert sent to nearby donors", "success");
  } catch (err) {
    setNote(document.querySelector("#alertNote"), err.message, true);
  }
});

// Reminder Button
document.querySelector("#reminderBtn")?.addEventListener("click", async (e) => {
  try {
    await api("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reminder" }),
    });
    e.target.textContent = "Reminders Active ✓";
    setNote(document.querySelector("#alertNote"), "✓ Closing reminder preference saved.");
    showToast("Daily closing reminder enabled", "success");
  } catch (err) {
    setNote(document.querySelector("#alertNote"), err.message, true);
  }
});

// Emergency Form Submit
document.querySelector("#emergencyForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading proof...";
  try {
    await api("/api/emergency", { method: "POST", body: new FormData(e.target) });
    setNote(document.querySelector("#emergencyNote"), "✓ Emergency post saved for rapid verification.");
    showToast("Emergency request logged with high priority!", "warning");
    e.target.reset();
  } catch (err) {
    setNote(document.querySelector("#emergencyNote"), err.message, true);
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "🚨 Post Emergency Relief Request";
  }
});

// Request Form Submit
document.querySelector("#requestForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting request...";

  const body = Object.fromEntries(new FormData(e.target).entries());
  try {
    await api("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setNote(document.querySelector("#requestNote"), "✓ Food request posted to rescue network.");
    showToast("Food request submitted successfully!", "success");
    e.target.reset();
    loadStats();
  } catch (err) {
    setNote(document.querySelector("#requestNote"), err.message, true);
    showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "🧡 Submit Food Request";
  }
});

// ==========================================
// DYNAMIC LIVE WORKFLOW FEED LOADER
// ==========================================
async function loadWorkflowFeed() {
  const container = document.querySelector("#workflowCardsContainer");
  if (!container) return;

  const category = document.querySelector("#filterCategory")?.value || "";
  const urgency = document.querySelector("#filterUrgency")?.value || "";

  let url = `/api/donations?1=1`;
  if (category) url += `&category=${encodeURIComponent(category)}`;
  if (urgency) url += `&urgency=${encodeURIComponent(urgency)}`;

  try {
    const res = await api(url);
    const donations = res.donations;

    if (!donations || donations.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px; background: var(--surface-hover); border-radius: var(--radius-md);">
          <p style="color: var(--text-muted); font-size: 0.95rem;">No active donations match the selected filter.</p>
          <button class="btn btn-primary btn-sm" onclick="document.querySelector('#filterCategory').value=''; document.querySelector('#filterUrgency').value=''; loadWorkflowFeed();" style="margin-top: 10px;">Clear Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = donations.map((d) => {
      // Step indices: posted (0) -> accepted (1) -> assigned (2) -> picked_up (3) -> in_transit (4) -> delivered (5) -> verified (6)
      const stepOrder = ["posted", "accepted", "assigned", "picked_up", "in_transit", "delivered", "verified"];
      const currentIdx = stepOrder.indexOf(d.status) >= 0 ? stepOrder.indexOf(d.status) : 0;

      const isUrgent = d.urgency === "URGENT";
      const isExpiring = d.urgency === "EXPIRING_SOON";

      return `
        <div class="card" style="margin: 0; border-left: 5px solid ${isUrgent ? 'var(--danger)' : isExpiring ? 'var(--warning)' : 'var(--primary)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 style="margin: 0; font-size: 1.15rem;">${d.food_name || d.food_type}</h3>
                <span class="badge ${d.urgency}">${d.urgency}</span>
                <span class="tag" style="background: var(--border); color: var(--text-main); font-size: 0.75rem;">${d.dietary}</span>
                <span class="tag" style="background: var(--surface-hover); color: var(--text-muted); font-size: 0.75rem;">${d.category}</span>
              </div>
              <p style="margin-top: 4px; font-size: 0.85rem;">
                <b>🍱 ${d.people_to_feed} meals</b> · Pickup: <b>${d.pickup_location}</b> · Shelf Life: <b>${d.expiry_hours}h</b>
              </p>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn btn-secondary btn-sm" onclick="openQRModal(${d.id}, '${currentIdx >= 3 ? 'delivery' : 'pickup'}')">
                📱 ${currentIdx >= 3 ? 'Delivery QR' : 'Pickup QR'}
              </button>
            </div>
          </div>

          <!-- Step Progression Timeline -->
          <div class="timeline-tracker">
            <div class="timeline-step ${currentIdx >= 0 ? 'completed' : ''} ${currentIdx === 0 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 0 ? '✓' : '1'}</div>
              <span class="timeline-label">Posted</span>
            </div>
            <div class="timeline-step ${currentIdx >= 1 ? 'completed' : ''} ${currentIdx === 1 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 1 ? '✓' : '2'}</div>
              <span class="timeline-label">NGO Match</span>
            </div>
            <div class="timeline-step ${currentIdx >= 2 ? 'completed' : ''} ${currentIdx === 2 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 2 ? '✓' : '3'}</div>
              <span class="timeline-label">Assigned</span>
            </div>
            <div class="timeline-step ${currentIdx >= 3 ? 'completed' : ''} ${currentIdx === 3 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 3 ? '✓' : '4'}</div>
              <span class="timeline-label">Picked Up</span>
            </div>
            <div class="timeline-step ${currentIdx >= 4 ? 'completed' : ''} ${currentIdx === 4 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 4 ? '✓' : '5'}</div>
              <span class="timeline-label">In Transit</span>
            </div>
            <div class="timeline-step ${currentIdx >= 5 ? 'completed' : ''} ${currentIdx === 5 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx > 5 ? '✓' : '6'}</div>
              <span class="timeline-label">Delivered</span>
            </div>
            <div class="timeline-step ${currentIdx >= 6 ? 'completed' : ''} ${currentIdx === 6 ? 'active' : ''}">
              <div class="timeline-dot">${currentIdx >= 6 ? '✓' : '7'}</div>
              <span class="timeline-label">Verified</span>
            </div>
          </div>

          <!-- Smart Workflow Action Panel -->
          <div style="background: var(--surface-hover); border-radius: var(--radius-md); padding: 12px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="font-size: 0.825rem; color: var(--text-main);">
              ${d.status === 'posted' ? '⚡ <b>Status:</b> Looking for NGO Match' : ''}
              ${d.status === 'accepted' ? `🏠 <b>Accepted by NGO:</b> ${d.ngo_name || 'Aashray Foundation'} · Awaiting Volunteer Courier` : ''}
              ${d.status === 'assigned' ? `🙋 <b>Courier Assigned:</b> ${d.volunteer_name || 'Volunteer Courier'} (${d.volunteer_mobile || 'Active'})` : ''}
              ${d.status === 'picked_up' ? `📦 <b>Food Picked Up</b> at ${d.pickup_time || 'Just now'} · En route` : ''}
              ${d.status === 'in_transit' ? `🚚 <b>In Transit</b> to shelter distribution center` : ''}
              ${d.status === 'delivered' || d.status === 'verified' ? `🌟 <b>Delivered & Verified:</b> ${d.people_to_feed} meals distributed successfully!` : ''}
            </div>

            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${d.status === 'posted' ? `
                <button class="btn btn-primary btn-sm" onclick="acceptDonationDirect(${d.id})">🤝 NGO: Claim Donation</button>
              ` : ''}
              ${d.status === 'accepted' ? `
                <button class="btn btn-primary btn-sm" onclick="dispatchVolunteerDirect(${d.id})">🙋 Assign Volunteer</button>
              ` : ''}
              ${d.status === 'assigned' ? `
                <button class="btn btn-primary btn-sm" onclick="pickupDonationDirect(${d.id})">📦 Mark Picked Up</button>
              ` : ''}
              ${d.status === 'picked_up' ? `
                <button class="btn btn-primary btn-sm" onclick="inTransitDirect(${d.id})">🚚 Mark In-Transit</button>
              ` : ''}
              ${d.status === 'in_transit' ? `
                <button class="btn btn-primary btn-sm" onclick="deliverDonationDirect(${d.id})">🌟 Mark Delivered</button>
              ` : ''}
              <button class="btn btn-ghost btn-sm" onclick="viewSmartMatches(${d.id})">🔍 Smart Match Score</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    console.error("Failed to load live workflow:", e);
  }
}

// Quick Workflow Transition Handlers
window.acceptDonationDirect = async function(id) {
  try {
    await api(`/api/donations/${id}/accept`, { method: "POST" });
    showToast("✓ Donation accepted by NGO! Ready for courier dispatch.", "success");
    loadWorkflowFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.dispatchVolunteerDirect = async function(id) {
  try {
    const res = await api(`/api/donations/${id}/volunteers`);
    const topVol = res.volunteers[0];
    if (!topVol) return showToast("No available volunteers online right now.", "warning");

    await api(`/api/donations/${id}/assign-volunteer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteer_id: topVol.volunteer.id })
    });
    showToast(`✓ Volunteer ${topVol.volunteer.name} assigned! (${topVol.distanceKm} km away)`, "success");
    loadWorkflowFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.pickupDonationDirect = async function(id) {
  try {
    await api(`/api/donations/${id}/pickup`, { method: "POST" });
    showToast("✓ Food marked as Picked Up!", "success");
    loadWorkflowFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.inTransitDirect = async function(id) {
  try {
    await api(`/api/donations/${id}/in-transit`, { method: "POST" });
    showToast("✓ Food status updated: In Transit to shelter.", "success");
    loadWorkflowFeed();
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.deliverDonationDirect = async function(id) {
  try {
    await api(`/api/donations/${id}/deliver`, { method: "POST" });
    showToast("✓ Food delivered! Impact metrics updated.", "success");
    loadWorkflowFeed();
    loadStats();
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.viewSmartMatches = async function(id) {
  try {
    const res = await api(`/api/donations/${id}/matches`);
    let matchesModal = document.querySelector("#matchesModal");
    if (!matchesModal) {
      matchesModal = document.createElement("div");
      matchesModal.id = "matchesModal";
      matchesModal.className = "modal-backdrop";
      document.body.appendChild(matchesModal);
    }
    matchesModal.classList.remove("hidden");
    matchesModal.innerHTML = `
      <div class="modal-card" style="width: min(560px, calc(100vw - 32px));">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;font-size:1.15rem;">🎯 Smart NGO Match Engine</h3>
          <button class="icon-btn" onclick="document.querySelector('#matchesModal').classList.add('hidden')">✕</button>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Scored by geographic proximity (Haversine), capacity compatibility, and emergency response speed.
        </p>
        <div style="display:grid; gap: 10px; max-height: 380px; overflow-y: auto;">
          ${res.matches.map(m => `
            <div class="match-card">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-main);">${m.ngo.organization_name || m.ngo.name}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                  📍 ${m.distanceKm} km away · Capacity: ${m.ngo.capacity_meals} meals
                </div>
                <div style="font-size: 0.75rem; color: var(--success); margin-top: 4px;">
                  ${m.reasons.map(r => `✓ ${r}`).join(" · ")}
                </div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                <div class="match-score-badge">
                  ${m.score}%
                  <small>Match</small>
                </div>
                <button class="btn btn-primary btn-sm" onclick="acceptDonationDirect(${id}); document.querySelector('#matchesModal').classList.add('hidden');">
                  Select NGO
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  } catch (err) {
    showToast(err.message, "error");
  }
};

// Map Renderer
async function loadMap() {
  try {
    const data = await api("/api/map");
    const mapEl = document.querySelector(".map");
    if (!mapEl) return;
    mapEl.innerHTML = "";

    const allPoints = [
      ...data.donations.map((p) => ({ ...p, type: "green", title: `🍱 Surplus Food: ${p.food_name || p.food_type} (${p.people_to_feed} meals)` })),
      ...data.requests.map((p) => ({ ...p, type: "red", title: `🔴 Hunger Need: ${p.name} (${p.meals} meals)` })),
      ...data.volunteers.map((p) => ({ ...p, type: "blue", title: `🔵 Volunteer Courier: ${p.name} (${p.vehicle_type || 'Active'})` })),
    ];

    if (allPoints.length === 0) {
      mapEl.innerHTML = `
        <i class="pin green" style="top:30%;left:25%" title="Surplus Food (Banquet Biryani)"></i>
        <i class="pin red" style="top:55%;left:65%" title="Hunger Need (Shelter Request)"></i>
        <i class="pin blue" style="top:40%;left:50%" title="Active Volunteer Courier"></i>
      `;
      return;
    }

    allPoints.forEach((point, index) => {
      const pin = document.createElement("i");
      pin.className = `pin ${point.type}`;
      pin.title = point.title;
      const top = Math.abs(Math.sin(index * 37 + (point.latitude || 1))) * 70 + 15;
      const left = Math.abs(Math.cos(index * 41 + (point.longitude || 1))) * 70 + 15;
      pin.style.top = `${top}%`;
      pin.style.left = `${left}%`;
      mapEl.appendChild(pin);
    });
  } catch (err) {
    console.error("Map coordinates load note:", err);
  }
}

// Load Global Stats & Pool
async function loadStats() {
  try {
    const s = await api("/api/stats");
    const statDonations = document.querySelector("#statDonations");
    const statNetwork = document.querySelector("#statNetwork");
    const carbonValue = document.querySelector("#carbonValue");

    if (statDonations) statDonations.textContent = `${s.donations} donations (${s.donationMeals} meals)`;
    if (statNetwork) statNetwork.textContent = `${s.volunteers} Volunteers · ${s.ngos} NGOs · ${s.donors} Donors`;
    if (carbonValue) carbonValue.textContent = `${s.carbonKg} kg CO₂`;

    if (s.pool) {
      const pct = Math.min(100, Math.round((s.pool.collected_meals / s.pool.target_meals) * 100));
      const poolBar = document.querySelector("#poolBar");
      const poolDesc = document.querySelector("#poolDesc");
      if (poolBar) poolBar.style.width = pct + "%";
      if (poolDesc) {
        poolDesc.textContent = `${s.pool.collected_meals} of ${s.pool.target_meals} meals collected · Tap for details`;
      }
    }

    loadMap();
  } catch (e) {}
}

// Filter dropdown change events
document.querySelector("#filterCategory")?.addEventListener("change", () => loadWorkflowFeed());
document.querySelector("#filterUrgency")?.addEventListener("change", () => loadWorkflowFeed());

// Initialize Page Data
loadStats();
loadWorkflowFeed();

// Multilingual Dictionary
const words = {
  en: {
    tagline: "Smart food rescue & distribution",
    hero: "Food belongs on plates, not in landfills.",
    heroSub: "ALMS uses AI matching and real-time dispatching to connect food donors with nearby shelters, NGOs, and volunteer rescue couriers.",
    start: "Join the Rescue Ecosystem",
    startDesc: "Choose your role to donate surplus meals, coordinate hunger relief, or deliver food.",
    vol: "Volunteer Courier",
    volSub: "Deliver & verify QR",
    ngo: "NGO / Shelter",
    ngoSub: "Claim food for demand",
    donate: "Donate",
    donateSub: "Post surplus food",
    religious: "Religious Place",
    religiousSub: "Temple / Gurudwara",
    pool: "Community Pool",
    poolSub: "Meal pool targets",
    need: "Need Food",
    needSub: "Emergency request",
    donateTitle: "Donate Surplus Food",
    donateDesc: "Posts are analyzed for shelf-life urgency and matched with nearby verified NGOs.",
    regular: "Regular Donation",
    collab: "Collab Donation",
    bulk: "Bulk / Event Donation",
    ai: "Smart Priority & Urgency Engine",
    aiDesc: "Calculates remaining shelf life, transit radius, and matching score.",
    statDonations: "Total food donations logged",
    alerts: "Demand Alerts & Reminders",
    alertsDesc: "Broadcast hunger demand alerts to restaurants and banquet halls before daily closing.",
    sendAlert: "Send Demand Alert",
    reminder: "Turn on Reminders",
    emergency: "Emergency Relief Request",
    emergencyDesc: "Upload photo or document proof for high-priority crisis intervention.",
    proof: "🚨 Post Emergency Relief Request",
    request: "Request Food for Individuals or Shelters",
    requestDesc: "For hospital caregivers, patient families, elderly homes and community centers.",
    requestBtn: "🧡 Submit Food Request",
    map: "Live Rescue & Dispatch Map",
    green: "🟢 Surplus Food",
    red: "🔴 Hunger Hotspot",
    blue: "🔵 Active Volunteers",
    poolTitle: "Green Park Community Pool",
    poolDesc: "163 of 250 meals collected · Tap for details",
    carbon: "Environmental Carbon Offset",
    carbonDesc: "calculated greenhouse gas emissions avoided by diverting food waste",
    badge: "Rescue Network Strength",
    badgeDesc: "registered volunteers, NGOs, and community shelters active",
  },
  hi: {
    tagline: "स्मार्ट भोजन बचाव और वितरण नेटवर्क",
    hero: "भोजन प्लेटों तक पहुँचना चाहिए, कूड़ेदानों में नहीं।",
    heroSub: "ALMS अतिरिक्त भोजन को नजदीकी आश्रयों, एनजीओ और स्वयंसेवी कोरियर से जोड़ता है।",
    start: "सहायता नेटवर्क में शामिल हों",
    startDesc: "अतिरिक्त भोजन दान करने, मांग दर्ज करने या भोजन वितरित करने के लिए अपनी भूमिका चुनें।",
    vol: "स्वयंसेवक कोरियर",
    volSub: "डिलीवरी और QR सत्यापन",
    ngo: "एनजीओ / आश्रय",
    ngoSub: "मांग दर्ज करें व भोजन प्राप्त करें",
    donate: "दान करें",
    donateSub: "अतिरिक्त भोजन पोस्ट करें",
    religious: "धार्मिक स्थान",
    religiousSub: "मंदिर / गुरुद्वारा लंगर",
    pool: "सामुदायिक पूल",
    poolSub: "भोजन लक्ष्य",
    need: "भोजन चाहिए",
    needSub: "आपातकालीन अनुरोध",
    donateTitle: "अतिरिक्त भोजन दान करें",
    donateDesc: "समय-सीमा और तत्काल आवश्यकता का विश्लेषण करके नजदीकी एनजीओ से जोड़ा जाता है।",
    regular: "नियमित दान",
    collab: "सहयोगी दान",
    bulk: "थोक / पार्टी दान",
    ai: "स्मार्ट प्राथमिकता इंजन",
    aiDesc: "शेल्फ लाइफ, दूरी और अनुकूलता स्कोर की गणना।",
    statDonations: "कुल संग्रहित दान",
    alerts: "मांग अलर्ट और रिमाइंडर",
    alertsDesc: "रेस्तरां बंद होने से पहले अतिरिक्त भोजन रिमाइंडर भेजा जाता है।",
    sendAlert: "मांग अलर्ट भेजें",
    reminder: "रिमाइंडर चालू करें",
    emergency: "आपातकालीन राहत अनुरोध",
    emergencyDesc: "आपात संकट के लिए प्रमाण अपलोड करें।",
    proof: "🚨 आपातकालीन राहत पोस्ट करें",
    request: "भोजन का अनुरोध करें",
    requestDesc: "अस्पताल देखभालकर्ताओं, परिवारों और जरूरतमंदों के लिए।",
    requestBtn: "🧡 भोजन अनुरोध सबमिट करें",
    map: "लाइव रेस्क्यू व डिस्पैच मैप",
    green: "🟢 अतिरिक्त भोजन",
    red: "🔴 भूख हॉटस्पॉट",
    blue: "🔵 सक्रिय स्वयंसेवक",
    poolTitle: "ग्रीन पार्क सामुदायिक पूल",
    poolDesc: "250 में से 163 भोजन एकत्र · विवरण देखें",
    carbon: "पर्यावरण कार्बन बचत",
    carbonDesc: "भोजन बर्बादी रोककर बचाया गया कार्बन उत्सर्जन",
    badge: "नेटवर्क की शक्ति",
    badgeDesc: "पंजीकृत स्वयंसेवक, एनजीओ और आश्रय",
  },
};

document.querySelector("#language")?.addEventListener("change", (e) => {
  const w = words[e.target.value] || words.en;
  document.querySelectorAll("[data-t]").forEach((x) => {
    x.textContent = w[x.dataset.t] || words.en[x.dataset.t];
  });
});
