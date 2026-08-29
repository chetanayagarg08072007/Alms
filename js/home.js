const slides = [...document.querySelectorAll(".slide")];
const dots = document.querySelector(".dots");
slides.forEach((_, i) => dots.insertAdjacentHTML("beforeend", `<i class="dot ${i ? "" : "active"}"></i>`));
let slide = 0;
setInterval(() => {
  slides[slide].classList.remove("active");
  dots.children[slide].classList.remove("active");
  slide = (slide + 1) % slides.length;
  slides[slide].classList.add("active");
  dots.children[slide].classList.add("active");
}, 3500);

document.querySelectorAll("[data-scroll]").forEach((b) => {
  b.onclick = () => document.querySelector("#" + b.dataset.scroll).scrollIntoView({ behavior: "smooth" });
});

function renderDonation(mode = "regular") {
  const extra = {
    regular: "",
    collab: `<label>Collaboration group / partner <input required name="partner" placeholder="Collaboration group / partner"></label>
             <label>Number of contributors <input required name="contributors" type="number" min="1" placeholder="Number of contributors"></label>`,
    bulk: `<label>Bulk source
             <select required name="bulk_source">
               <option value="">Bulk source</option>
               <option>Party</option><option>Wedding</option><option>Restaurant</option><option>Hotel</option>
             </select>
           </label>
           <label>Event / organisation <input required name="organisation" placeholder="Event / organisation name"></label>`,
  };
  document.querySelector("#donationForm").innerHTML = `
    <form class="form-grid">
      ${extra[mode]}
      <label>People to feed <input required name="people_to_feed" type="number" min="1" placeholder="People to feed"></label>
      <label>Type of food <input required name="food_type" placeholder="Type of food"></label>
      <label class="full">Pickup location <input required name="pickup_location" placeholder="Pickup location"></label>
      <button type="submit">Post ${mode} donation</button>
    </form>
    <div class="note"></div>`;
  const form = document.querySelector("#donationForm form");
  const note = form.nextElementSibling;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    body.mode = mode;
    try {
      await api("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setNote(note, "✓ Donation saved in the ALMS database.");
      form.reset();
      loadStats();
    } catch (err) {
      setNote(note, err.message, true);
    }
  };
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
}
renderDonation();
document.querySelectorAll("[data-mode]").forEach((b) => {
  b.onclick = () => renderDonation(b.dataset.mode);
});

document.querySelector("#alertBtn").onclick = async (e) => {
  try {
    await api("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "demand" }),
    });
    e.target.textContent = "Demand alert sent ✓";
    setNote(document.querySelector("#alertNote"), "✓ Alert stored.");
  } catch (err) {
    setNote(document.querySelector("#alertNote"), err.message, true);
  }
};
document.querySelector("#reminderBtn").onclick = async (e) => {
  try {
    await api("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "reminder" }),
    });
    e.target.textContent = "Reminders on ✓";
    setNote(document.querySelector("#alertNote"), "✓ Reminder preference stored.");
  } catch (err) {
    setNote(document.querySelector("#alertNote"), err.message, true);
  }
};

document.querySelector("#emergencyForm").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api("/api/emergency", { method: "POST", body: new FormData(e.target) });
    setNote(document.querySelector("#emergencyNote"), "✓ Emergency post saved for verification.");
    e.target.reset();
  } catch (err) {
    setNote(document.querySelector("#emergencyNote"), err.message, true);
  }
};

document.querySelector("#requestForm").onsubmit = async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target).entries());
  try {
    await api("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setNote(document.querySelector("#requestNote"), "✓ Request saved and shared with nearby NGOs and donors.");
    e.target.reset();
  } catch (err) {
    setNote(document.querySelector("#requestNote"), err.message, true);
  }
};

async function loadMap() {
  try {
    const data = await api("/api/map");
    const mapEl = document.querySelector(".map");
    if (!mapEl) return;
    mapEl.innerHTML = ""; // Clear existing static pins

    const allPoints = [
      ...data.donations.map((p) => ({ ...p, type: "green", title: "Surplus Food" })),
      ...data.requests.map((p) => ({ ...p, type: "red", title: "Hunger Request" })),
      ...data.volunteers.map((p) => ({ ...p, type: "blue", title: "Volunteer Active" })),
    ];

    if (allPoints.length === 0) {
      // Default demo points if empty database
      mapEl.innerHTML = `
        <i class="pin green" style="top:30%;left:25%" title="Surplus Food"></i>
        <i class="pin red" style="top:55%;left:65%" title="Hunger Request"></i>
        <i class="pin blue" style="top:40%;left:50%" title="Active Volunteer"></i>
      `;
      return;
    }

    allPoints.forEach((point, index) => {
      const pin = document.createElement("i");
      pin.className = `pin ${point.type}`;
      pin.title = point.title;
      // Generate nicely dispersed coordinates inside the map container
      const top = Math.abs(Math.sin(index * 37 + (point.latitude || 1))) * 70 + 15;
      const left = Math.abs(Math.cos(index * 41 + (point.longitude || 1))) * 70 + 15;
      pin.style.top = `${top}%`;
      pin.style.left = `${left}%`;
      mapEl.appendChild(pin);
    });
  } catch (err) {
    console.error("Could not load map coordinates:", err);
  }
}

async function loadStats() {
  try {
    const s = await api("/api/stats");
    document.querySelector("#statDonations").textContent = `${s.donations} stored`;
    document.querySelector("#statNetwork").textContent = `${s.volunteers} volunteers · ${s.ngos} NGOs`;
    document.querySelector("#carbonValue").textContent = `${s.carbonKg} kg CO₂`;
    if (s.pool) {
      const pct = Math.min(100, Math.round((s.pool.collected_meals / s.pool.target_meals) * 100));
      document.querySelector("#poolBar").style.width = pct + "%";
      document.querySelector("#poolDesc").textContent =
        `${s.pool.collected_meals} of ${s.pool.target_meals} meals collected · Tap for details`;
    }
    loadMap();
  } catch {
    /* server offline */
  }
}
loadStats();

const words = {
  en: {
    tagline: "Donate food, share hope.",
    hero: "Food belongs on plates.",
    heroSub: "Donate surplus meals. ALMS matches them with nearby people, NGOs and volunteers.",
    start: "Get started",
    startDesc: "Choose how you want to help — every role is saved in the ALMS database.",
    vol: "Volunteer",
    volSub: "Register & collect",
    ngo: "NGO / Shelter",
    ngoSub: "Register demand",
    donate: "Donate",
    donateSub: "Post food",
    religious: "Religious place",
    religiousSub: "Temple / Gurudwara",
    pool: "Community pool",
    poolSub: "See details",
    need: "Need food",
    needSub: "Individual request",
    donateTitle: "Donate with ALMS",
    donateDesc: "Choose a donation type. Posts are stored and counted toward the community pool.",
    regular: "Regular donation",
    collab: "Collab donation",
    bulk: "Bulk donation",
    ai: "Priority engine",
    aiDesc: "Expiry · urgency · people fed · distance · weather · volunteers",
    statDonations: "Donations stored",
    priorityOne: "Cooked meals · 45 min left",
    priorityTwo: "Wedding food · feeds 250",
    alerts: "Demand alerts & reminders",
    alertsDesc: "Restaurants receive a surplus reminder before closing.",
    sendAlert: "Send demand alert",
    reminder: "Turn on reminders",
    emergency: "Emergency donation",
    emergencyDesc: "Proof is compulsory for urgent relief posts.",
    proof: "Post with proof",
    request: "Request food",
    requestDesc: "For hospital caregivers, patients’ families, elderly people and anyone in need.",
    requestBtn: "Request food",
    map: "Live rescue map",
    green: "Green: food",
    red: "Red: hunger",
    blue: "Blue: volunteers",
    poolTitle: "Green Park community pool",
    poolDesc: "163 of 250 meals collected · Tap for details",
    carbon: "Carbon footprint",
    carbonDesc: "estimated emissions avoided from stored meals",
    badge: "Network so far",
    badgeDesc: "volunteers and NGO / shelter registrations",
  },
  hi: {
    tagline: "भोजन दान करें, आशा बाँटें।",
    hero: "भोजन प्लेटों तक पहुँचना चाहिए।",
    heroSub: "अतिरिक्त भोजन दान करें। ALMS इसे पास के लोगों, एनजीओ और स्वयंसेवकों से जोड़ता है।",
    start: "शुरू करें",
    startDesc: "मदद का तरीका चुनें — हर भूमिका ALMS डेटाबेस में सहेजी जाती है।",
    vol: "स्वयंसेवक",
    volSub: "पंजीकरण और संग्रह",
    ngo: "एनजीओ / आश्रय",
    ngoSub: "मांग दर्ज करें",
    donate: "दान करें",
    donateSub: "भोजन पोस्ट करें",
    religious: "धार्मिक स्थान",
    religiousSub: "मंदिर / गुरुद्वारा",
    pool: "सामुदायिक पूल",
    poolSub: "विवरण देखें",
    need: "भोजन चाहिए",
    needSub: "व्यक्तिगत अनुरोध",
    donateTitle: "ALMS के साथ दान करें",
    donateDesc: "दान का प्रकार चुनें। पोस्ट सहेजे जाते हैं।",
    regular: "नियमित दान",
    collab: "सहयोगी दान",
    bulk: "थोक दान",
    ai: "प्राथमिकता इंजन",
    aiDesc: "समय-सीमा · जरूरत · लोगों की संख्या · दूरी · मौसम · स्वयंसेवक",
    statDonations: "संग्रहित दान",
    priorityOne: "पका भोजन · 45 मिनट बचे",
    priorityTwo: "विवाह का भोजन · 250 लोगों के लिए",
    alerts: "मांग अलर्ट और रिमाइंडर",
    alertsDesc: "रेस्तरां बंद होने से पहले रिमाइंडर मिलता है।",
    sendAlert: "मांग अलर्ट भेजें",
    reminder: "रिमाइंडर चालू करें",
    emergency: "आपातकालीन दान",
    emergencyDesc: "आपात राहत पोस्ट के लिए प्रमाण अनिवार्य है।",
    proof: "प्रमाण के साथ पोस्ट करें",
    request: "भोजन का अनुरोध",
    requestDesc: "अस्पताल देखभालकर्ता, परिवार और जरूरतमंदों के लिए।",
    requestBtn: "भोजन अनुरोध करें",
    map: "लाइव रेस्क्यू मैप",
    green: "हरा: भोजन",
    red: "लाल: भूख",
    blue: "नीला: स्वयंसेवक",
    poolTitle: "ग्रीन पार्क सामुदायिक पूल",
    poolDesc: "250 में से 163 भोजन एकत्र · विवरण देखें",
    carbon: "कार्बन फुटप्रिंट",
    carbonDesc: "संग्रहित भोजन से बचाया गया अनुमानित उत्सर्जन",
    badge: "अभी तक का नेटवर्क",
    badgeDesc: "स्वयंसेवक और एनजीओ / आश्रय पंजीकरण",
  },
};

document.querySelector("#language").onchange = (e) => {
  const w = words[e.target.value] || words.en;
  document.querySelectorAll("[data-t]").forEach((x) => {
    x.textContent = w[x.dataset.t] || words.en[x.dataset.t];
  });
};
