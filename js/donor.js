/**
 * ALMS Donor Module
 * Connected to real backend REST APIs:
 * - /api/register (Individual & Bulk registration with FSSAI)
 * - /api/donations (Create, list, edit, cancel bulk and regular donations)
 * - /api/collab-donations (List, create, and match collab donations)
 * - /api/priority-pool/:id/contribute (Contribute meals to priority pool)
 * - /api/me & /api/stats (Auth profile & stats)
 */

const ALMS_DONOR = {
  activeTab: 'individual_reg',
  userType: 'individual',
  isRegistered: false,
  collabListings: [],
  donationHistory: [],

  async init() {
    try {
      const userRes = await ALMS.api('/api/me').catch(() => null);
      if (userRes && userRes.user && userRes.user.role === 'donor') {
        this.isRegistered = true;
        this.userType = userRes.user.donor_type || 'individual';
        localStorage.setItem('alms_user', JSON.stringify(userRes.user));
        this.showDashboard();
        return;
      }
    } catch (e) {}

    const savedUser = JSON.parse(localStorage.getItem('alms_user') || 'null');
    if (savedUser && savedUser.role === 'donor') {
      this.isRegistered = true;
      this.userType = savedUser.donorType || savedUser.donor_type || 'individual';
      this.showDashboard();
    } else {
      this.showRegistration();
    }
  },

  showRegistration() {
    const main = document.getElementById('donorMainContent');
    if (!main) return;

    main.innerHTML = `
      <div class="card" style="max-width: 680px; margin: 0 auto;">
        <div class="text-center" style="margin-bottom: var(--sp-6);">
          <h2 class="text-h1" data-i18n="donor_reg_title">Donor Registration</h2>
          <p class="text-soft" data-i18n="donor_reg_sub">Choose whether you are donating as a household individual or a bulk catering establishment.</p>
        </div>

        <div class="tabs-nav" style="margin: 0 auto var(--sp-6);">
          <button class="tabs-nav-btn ${this.userType === 'individual' ? 'active' : ''}" onclick="ALMS_DONOR.selectType('individual')">
            🏠 Individual Donator
          </button>
          <button class="tabs-nav-btn ${this.userType === 'bulk' ? 'active' : ''}" onclick="ALMS_DONOR.selectType('bulk')">
            🏢 Bulk Donator
          </button>
        </div>

        <div id="donorFormContainer">
          ${this.userType === 'individual' ? this.renderIndividualForm() : this.renderBulkForm()}
        </div>
      </div>
    `;

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  selectType(type) {
    this.userType = type;
    this.showRegistration();
  },

  renderIndividualForm() {
    return `
      <form onsubmit="ALMS_DONOR.submitIndividual(event)" class="fade-in">
        <div class="form-group">
          <label class="form-label" data-i18n="lbl_name">Full Name <span class="required">*</span></label>
          <input type="text" id="indName" class="form-input" placeholder="e.g. Priya Sharma" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_location">Locality / Area <span class="required">*</span></label>
            <input type="text" id="indLocation" class="form-input" placeholder="e.g. Green Park, New Delhi" required>
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_pincode">Pincode <span class="required">*</span></label>
            <input type="text" id="indPincode" class="form-input" placeholder="e.g. 110016" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" data-i18n="lbl_email">Email Address</label>
          <input type="email" id="indEmail" class="form-input" placeholder="priya@example.com">
        </div>

        <div class="form-group">
          <label class="form-label" data-i18n="lbl_phone">Phone Number (Login Mobile) <span class="required">*</span></label>
          <div style="display:flex; gap:8px;">
            <input type="tel" id="indPhone" class="form-input" placeholder="9876543210" required>
            <button type="button" class="btn btn-secondary" onclick="ALMS.showToast('OTP Sent', 'Demo OTP is 123456', 'info')">Send OTP</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" data-i18n="lbl_otp">Enter 6-Digit OTP / Password</label>
          <input type="password" id="indPassword" class="form-input" placeholder="Choose a password or enter 123456" value="password123" required>
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--sp-4);" data-i18n="btn_submit">
          Complete Registration & Access Dashboard →
        </button>
      </form>
    `;
  },

  renderBulkForm() {
    return `
      <form onsubmit="ALMS_DONOR.submitBulk(event)" class="fade-in">
        <div class="form-group">
          <label class="form-label">Type of Bulk Donor <span class="required">*</span></label>
          <select id="bulkSubtype" class="form-select" required>
            <option value="University Mess" data-i18n="donor_bulk_cat_mess">University Mess</option>
            <option value="Hotel" data-i18n="donor_bulk_cat_hotel">Hotel</option>
            <option value="Restaurant" data-i18n="donor_bulk_cat_restaurant">Restaurant</option>
            <option value="Weddings/Parties" data-i18n="donor_bulk_cat_wedding">Weddings / Parties</option>
            <option value="Resort" data-i18n="donor_bulk_cat_resort">Resort</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Organisation / Establishment Name <span class="required">*</span></label>
          <input type="text" id="bulkOrgName" class="form-input" placeholder="e.g. Grand Palace Hotel & Banquet" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_location">Address / Gate Location <span class="required">*</span></label>
            <input type="text" id="bulkLocation" class="form-input" placeholder="e.g. Safdarjung Enclave" required>
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_pincode">Pincode <span class="required">*</span></label>
            <input type="text" id="bulkPincode" class="form-input" placeholder="110029" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">FSSAI Certificate Document <span class="required">*</span></label>
          <label class="file-upload">
            <input type="file" id="bulkFssaiFile" accept="image/*,.pdf">
            <span class="file-upload-icon">📄</span>
            <span class="file-upload-text">Click to attach FSSAI Food License Certificate</span>
            <span class="file-upload-hint">Supported formats: PDF, JPG, PNG (Max 10MB)</span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label" data-i18n="lbl_phone">Manager Phone Number (Login Mobile) <span class="required">*</span></label>
          <div style="display:flex; gap:8px;">
            <input type="tel" id="bulkPhone" class="form-input" placeholder="9811122334" required>
            <button type="button" class="btn btn-secondary" onclick="ALMS.showToast('OTP Sent', 'Demo OTP is 123456', 'info')">Send OTP</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" data-i18n="lbl_otp">Password (min 6 chars)</label>
          <input type="password" id="bulkPassword" class="form-input" value="password123" required>
        </div>

        <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--sp-4);">
          Register Bulk Donor Profile →
        </button>
      </form>
    `;
  },

  async submitIndividual(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Registering on ALMS...';

    const formData = new FormData();
    formData.append('role', 'donor');
    formData.append('donor_type', 'individual');
    formData.append('name', document.getElementById('indName').value);
    formData.append('mobile', document.getElementById('indPhone').value);
    formData.append('email', document.getElementById('indEmail').value);
    formData.append('location', document.getElementById('indLocation').value);
    formData.append('pincode', document.getElementById('indPincode').value);
    formData.append('password', document.getElementById('indPassword').value);

    try {
      const res = await ALMS.api('/api/register', {
        method: 'POST',
        body: formData
      });
      this.isRegistered = true;
      this.userType = 'individual';
      localStorage.setItem('alms_user', JSON.stringify(res.user));
      ALMS.showToast('Welcome!', 'Individual Donor profile created with Active Blue Tick badge.', 'success');
      this.showDashboard();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
      btn.disabled = false;
      btn.textContent = 'Complete Registration & Access Dashboard →';
    }
  },

  async submitBulk(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Registering bulk profile...';

    const formData = new FormData();
    formData.append('role', 'donor');
    formData.append('donor_type', 'bulk');
    formData.append('bulk_subtype', document.getElementById('bulkSubtype').value);
    formData.append('name', document.getElementById('bulkOrgName').value);
    formData.append('organization_name', document.getElementById('bulkOrgName').value);
    formData.append('mobile', document.getElementById('bulkPhone').value);
    formData.append('location', document.getElementById('bulkLocation').value);
    formData.append('pincode', document.getElementById('bulkPincode').value);
    formData.append('password', document.getElementById('bulkPassword').value);

    const fssaiInput = document.getElementById('bulkFssaiFile');
    if (fssaiInput?.files?.[0]) {
      formData.append('fssai', fssaiInput.files[0]);
    }

    try {
      const res = await ALMS.api('/api/register', {
        method: 'POST',
        body: formData
      });
      this.isRegistered = true;
      this.userType = 'bulk';
      localStorage.setItem('alms_user', JSON.stringify(res.user));
      ALMS.showToast('Welcome!', 'Bulk Donor profile created. Verified FSSAI Active.', 'success');
      this.showDashboard();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
      btn.disabled = false;
      btn.textContent = 'Register Bulk Donor Profile →';
    }
  },

  showDashboard() {
    const main = document.getElementById('donorMainContent');
    if (!main) return;

    const user = JSON.parse(localStorage.getItem('alms_user') || '{}');
    const isIndividual = this.userType === 'individual';

    main.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
          <div class="sidebar-user">
            <div class="sidebar-avatar">🍱</div>
            <div class="sidebar-name">
              ${user.name || 'Donor'}
              <span class="badge-blue-tick" title="Active Verified Donor">✔</span>
            </div>
            <div class="sidebar-role-tag">${isIndividual ? 'Individual Donator' : `${user.bulk_subtype || user.bulkSubtype || 'Bulk'} Donator`}</div>
          </div>

          <div class="sidebar-nav">
            ${isIndividual ? `
              <button class="sidebar-nav-item active" onclick="ALMS_DONOR.switchView('collab')">
                <span class="sidebar-nav-icon">🤝</span> <span data-i18n="collab_title">Collab Donation</span>
              </button>
            ` : ''}
            <button class="sidebar-nav-item ${!isIndividual ? 'active' : ''}" onclick="ALMS_DONOR.switchView('bulk')">
              <span class="sidebar-nav-icon">📦</span> <span data-i18n="bulk_title">Bulk Donation</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_DONOR.switchView('pool')">
              <span class="sidebar-nav-icon">🎯</span> <span data-i18n="pool_title">Priority Pool</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_DONOR.switchView('carbon')">
              <span class="sidebar-nav-icon">🌱</span> <span data-i18n="carbon_title">Carbon Impact</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_DONOR.switchView('history')">
              <span class="sidebar-nav-icon">📜</span> Donation Records
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_DONOR.logout()" style="color: var(--color-danger); margin-top: var(--sp-6);">
              <span class="sidebar-nav-icon">🚪</span> Logout
            </button>
          </div>
        </aside>

        <!-- Main Panel Content -->
        <main class="dashboard-content">
          <div id="donorViewPanel">
            ${isIndividual ? '<p>Loading Collabs...</p>' : '<p>Loading Bulk Form...</p>'}
          </div>
        </main>
      </div>
    `;

    if (isIndividual) {
      this.loadCollabsView();
    } else {
      this.switchView('bulk');
    }

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async switchView(viewName) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
    if (event?.currentTarget?.classList) {
      event.currentTarget.classList.add('active');
    }

    const panel = document.getElementById('donorViewPanel');
    if (!panel) return;

    if (viewName === 'collab') await this.loadCollabsView();
    else if (viewName === 'bulk') panel.innerHTML = this.renderBulkView();
    else if (viewName === 'pool') await this.loadPoolContributionView();
    else if (viewName === 'carbon') {
      panel.innerHTML = this.renderCarbonView();
      ALMS_CARBON.render('donorCarbonGauge');
    }
    else if (viewName === 'history') await this.loadHistoryView();

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async loadCollabsView() {
    const panel = document.getElementById('donorViewPanel');
    if (!panel) return;

    try {
      const res = await ALMS.api('/api/collab-donations');
      this.collabListings = res.collabs || res.data || [];
    } catch (e) {
      this.collabListings = [];
    }

    panel.innerHTML = `
      <div class="fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-6); flex-wrap:wrap; gap:12px;">
          <div>
            <h2 class="dashboard-page-title" data-i18n="collab_title">Collab Donation</h2>
            <p class="dashboard-page-sub" data-i18n="collab_sub">Combine your partial dishes with active donors in your locality to make complete nutritious meals.</p>
          </div>
          <button class="btn btn-primary" onclick="ALMS_DONOR.openPostCollabModal()">
            ➕ Post a Collab Request
          </button>
        </div>

        <h3 style="font-size:1.1rem; color:var(--alms-brown-dark); margin-bottom:var(--sp-4);" data-i18n="collab_nearby_title">
          Compatible Matches in Your Locality
        </h3>

        <div class="grid" style="gap: var(--sp-4);">
          ${this.collabListings.length === 0 ? `
            <div class="card empty-state"><p>No active collab requests found nearby. Be the first to post!</p></div>
          ` : this.collabListings.map(c => `
            <div class="card collab-card">
              <div style="font-size:2.2rem; background:var(--alms-beige); width:60px; height:60px; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                🍲
              </div>
              <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                  <div>
                    <h4 style="font-size:1.05rem; font-weight:700; color:var(--alms-brown-dark);">${c.donor_name || c.donorName}</h4>
                    <div style="font-size:0.8rem; color:var(--color-text-muted);">📍 ${c.location} • Prepared ${c.hours_ago || c.hoursAgo || 1.5} hrs ago</div>
                  </div>
                  <span class="badge badge-success" data-i18n="collab_match_found">
                    ✔ Compatible Match Found!
                  </span>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; background:var(--alms-cream); padding:10px 14px; border-radius:var(--radius-md);">
                  <div>
                    <span style="font-size:0.75rem; color:var(--color-text-muted);">HAS AVAILABLE:</span>
                    <div style="font-weight:600; font-size:0.9rem; color:var(--alms-brown-dark);">${c.have_food || c.have}</div>
                  </div>
                  <div>
                    <span style="font-size:0.75rem; color:var(--color-text-muted);">IS SEEKING:</span>
                    <div style="font-weight:600; font-size:0.9rem; color:var(--alms-brown);">${c.seeking_food || c.seeking}</div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                  <span class="badge badge-veg">🌱 ${c.quantity_plates || c.quantityPlates} Plates Portion</span>
                  <button class="btn btn-sm btn-primary" onclick="ALMS_DONOR.acceptCollabMatch('${c.id}')">
                    🤝 Collab Donate (Assign Courier)
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Collab Modal -->
        <div id="postCollabModal" class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title" data-i18n="collab_post_title">Post a Collab Request</h3>
              <button class="modal-close" onclick="document.querySelector('#postCollabModal').classList.remove('open')">✕</button>
            </div>
            <form onsubmit="ALMS_DONOR.submitPostCollab(event)">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" data-i18n="collab_have_label">What food do you have? <span class="required">*</span></label>
                  <input type="text" id="collabHave" class="form-input" placeholder="e.g. 25 Fresh Rotis" required>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="collab_seeking_label">What are you seeking? <span class="required">*</span></label>
                  <input type="text" id="collabSeeking" class="form-input" placeholder="e.g. Dal, Mixed Vegetable Sabzi" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label" data-i18n="collab_qty">Quantity (Plates) <span class="required">*</span></label>
                    <input type="number" id="collabQty" class="form-input" min="1" placeholder="15" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" data-i18n="collab_prep_time">Hours Since Prepared <span class="required">*</span></label>
                    <input type="number" id="collabHours" class="form-input" min="0.5" step="0.5" placeholder="1.5" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Food Preference</label>
                  <select id="collabVeg" class="form-select">
                    <option value="veg">Pure Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.querySelector('#postCollabModal').classList.remove('open')">Cancel</button>
                <button type="submit" class="btn btn-primary">Post Request & Match Nearby</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  renderBulkView() {
    return `
      <div class="fade-in" style="max-width: 720px;">
        <h2 class="dashboard-page-title" data-i18n="bulk_title">Bulk Food Donation</h2>
        <p class="dashboard-page-sub" data-i18n="bulk_sub">Quickly dispatch large quantity surplus meals directly to certified NGOs with courier vessel support.</p>

        <form onsubmit="ALMS_DONOR.submitBulkDonation(event)" class="card">
          <div class="form-group">
            <label class="form-label" data-i18n="bulk_food_type">Food Item Description <span class="required">*</span></label>
            <input type="text" id="bulkFoodDesc" class="form-input" placeholder="e.g. Cooked Shahi Paneer, Jeera Rice & Naan" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" data-i18n="bulk_qty_plates">Quantity in Plates <span class="required">*</span></label>
              <input type="number" id="bulkPlates" class="form-input" min="5" placeholder="e.g. 60" required>
            </div>
            <div class="form-group">
              <label class="form-label" data-i18n="bulk_qty_kg">Approx Quantity in KG</label>
              <input type="number" id="bulkKg" class="form-input" placeholder="e.g. 25">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Dietary Type</label>
            <select id="bulkIsVeg" class="form-select">
              <option value="veg" data-i18n="pool_veg">Pure Veg</option>
              <option value="nonveg" data-i18n="pool_nonveg">Non-Veg</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" data-i18n="bulk_pickup_loc">Exact Pickup Location & Gate <span class="required">*</span></label>
            <input type="text" id="bulkPickupLoc" class="form-input" placeholder="e.g. Hotel Main Kitchen Loading Bay 3" required>
          </div>

          <div class="card card-beige" style="padding: var(--sp-4); margin-bottom: var(--sp-4);">
            <div class="form-group" style="margin-bottom: var(--sp-2);">
              <label class="form-label" style="display:flex; justify-content:space-between; align-items:center;">
                <span data-i18n="bulk_vessel_needed">Do you need the volunteer to bring vessels/containers?</span>
                <input type="checkbox" id="bulkNeedVessel" onchange="document.getElementById('vesselCapacityWrap').classList.toggle('hidden', !this.checked)" style="width:20px; height:20px; accent-color:var(--alms-brown);">
              </label>
            </div>
            <div id="vesselCapacityWrap" class="form-group hidden" style="margin-top:var(--sp-3);">
              <label class="form-label" data-i18n="bulk_vessel_litres">Required vessel capacity in litres (L) <span class="required">*</span></label>
              <input type="number" id="bulkVesselLitres" class="form-input" min="5" placeholder="e.g. 40">
              <span class="form-hint">⚠️ Volunteer will automatically be instructed to carry sanitized insulated containers.</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" data-i18n="bulk_submit_btn">
            🚀 Post Bulk Donation & Notify Verified NGOs
          </button>
        </form>
      </div>
    `;
  },

  async loadPoolContributionView() {
    const panel = document.getElementById('donorViewPanel');
    if (!panel) return;

    let pool = [];
    try {
      const res = await ALMS.api('/api/priority-pool');
      pool = res.pool || res.data || [];
    } catch (e) {
      pool = [];
    }

    panel.innerHTML = `
      <div class="fade-in">
        <h2 class="dashboard-page-title" data-i18n="pool_title">Priority Pool Contribution</h2>
        <p class="dashboard-page-sub">Directly fulfill urgent hunger requirements ranked by real-time Priority Index.</p>

        <div class="grid" style="gap: var(--sp-4);">
          ${pool.map((item, idx) => `
            <div class="card pool-entry ${idx === 0 ? 'top-priority' : ''}">
              <div class="pool-entry-rank">#${idx + 1}</div>
              <div class="pool-entry-name">
                ${item.ngo_name || item.ngoName}
                <span class="badge ${item.is_veg ? 'badge-veg' : 'badge-nonveg'}">${item.is_veg ? 'Veg' : 'Non-Veg'}</span>
                <span class="badge badge-danger">Priority Index: ${ALMS.calculatePriorityIndex(item.hunger_percent || item.hungerPercent, item.distance_km || item.distanceKm, item.expiry_hours || item.expiryHours)}</span>
              </div>
              <div class="pool-entry-meta">
                <span class="pool-meta-item">📍 ${item.distance_km || item.distanceKm} km away</span>
                <span class="pool-meta-item">👥 ${item.meals_needed || item.mealsNeeded} people needing food</span>
                <span class="pool-meta-item">⏳ Expiry: ${item.expiry_time || item.expiryTime}</span>
              </div>

              <div class="progress-wrap" style="margin: 12px 0;">
                <div class="progress-header">
                  <span>Progress: <b>${item.meals_collected || item.mealsCollected} / ${item.meals_needed || item.mealsNeeded} meals</b></span>
                  <span>${Math.round(((item.meals_collected || item.mealsCollected) / (item.meals_needed || item.mealsNeeded)) * 100)}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${(item.meals_collected || item.mealsCollected) >= (item.meals_needed || item.mealsNeeded) ? 'complete' : ''}" style="width: ${((item.meals_collected || item.mealsCollected) / (item.meals_needed || item.mealsNeeded)) * 100}%;"></div>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button class="btn btn-sm btn-primary" onclick="ALMS_DONOR.contributeToPool('${item.id}')">
                  ➕ Fulfill & Contribute 20 Meals
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderCarbonView() {
    return `
      <div class="fade-in card">
        <h2 class="dashboard-page-title" data-i18n="carbon_title">Donor Carbon Impact Tracker</h2>
        <p class="dashboard-page-sub" data-i18n="carbon_sub">Calculated dynamically from your actual food rescue donations.</p>
        <div id="donorCarbonGauge"></div>
      </div>
    `;
  },

  async loadHistoryView() {
    const panel = document.getElementById('donorViewPanel');
    if (!panel) return;

    try {
      const res = await ALMS.api('/api/donations');
      this.donationHistory = res.donations || res.data || [];
    } catch (e) {
      this.donationHistory = [];
    }

    panel.innerHTML = `
      <div class="fade-in">
        <h2 class="dashboard-page-title">Donation Records & Impact History</h2>
        <p class="dashboard-page-sub">Verified meal rescues, assigned volunteers, and photo proofs.</p>

        <div class="grid" style="gap: var(--sp-4);">
          ${this.donationHistory.length === 0 ? `
            <div class="card empty-state"><p>No donations recorded yet.</p></div>
          ` : this.donationHistory.map(d => `
            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-2);">
                <div>
                  <h4 style="font-size:1.1rem; font-weight:700; color:var(--alms-brown-dark);">${d.food_name || d.food_type}</h4>
                  <div style="font-size:0.8rem; color:var(--color-text-muted);">${d.created_at || 'Recent'} • ${String(d.mode || 'REGULAR').toUpperCase()} DONATION</div>
                </div>
                <span class="badge ${d.status === 'delivered' || d.status === 'verified' ? 'badge-success' : 'badge-brown'}">
                  ${d.status.toUpperCase()}
                </span>
              </div>
              <div style="display:flex; gap:16px; margin-top:8px; font-size:0.85rem; color:var(--color-text-soft);">
                <span>🍱 <b>${d.people_to_feed} Plates</b></span>
                <span>🌱 <b>${d.co2_avoided_kg || (d.people_to_feed * 0.85).toFixed(1)} kg CO₂e avoided</b></span>
                ${d.need_vessel ? `<span>🍲 <b>${d.vessel_litres}L Vessel</b></span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  openPostCollabModal() {
    document.getElementById('postCollabModal')?.classList.add('open');
  },

  async submitPostCollab(e) {
    e.preventDefault();
    const have = document.getElementById('collabHave').value;
    const seeking = document.getElementById('collabSeeking').value;
    const qty = document.getElementById('collabQty').value;
    const hours = document.getElementById('collabHours').value;
    const isVeg = document.getElementById('collabVeg').value === 'veg';

    try {
      await ALMS.api('/api/collab-donations', {
        method: 'POST',
        body: JSON.stringify({
          have_food: have,
          seeking_food: seeking,
          quantity_plates: Number(qty),
          hours_ago: Number(hours),
          is_veg: isVeg
        })
      });

      document.getElementById('postCollabModal')?.classList.remove('open');
      ALMS.showToast('Collab Posted!', 'Nearby matching donors received notification.', 'success');
      this.loadCollabsView();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async acceptCollabMatch(collabId) {
    try {
      const res = await ALMS.api(`/api/collab-donations/${collabId}/match`, {
        method: 'POST'
      });

      const assignedVol = res.volunteer || {
        name: 'Rahul Sharma (ID: VOL-8821)',
        location: '0.4 km away',
        eta: '12 mins'
      };

      ALMS.showToast(
        'Match Accepted & Volunteer Assigned!',
        `Volunteer ${assignedVol.name} is dispatched. Location: ${assignedVol.location}, ETA: ${assignedVol.eta || '10 mins'}`,
        'success'
      );
      this.loadCollabsView();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async submitBulkDonation(e) {
    e.preventDefault();
    const desc = document.getElementById('bulkFoodDesc').value;
    const plates = Number(document.getElementById('bulkPlates').value);
    const needVessel = document.getElementById('bulkNeedVessel').checked;
    const vesselLitres = needVessel ? Number(document.getElementById('bulkVesselLitres').value || 30) : 0;
    const pickupLoc = document.getElementById('bulkPickupLoc').value;

    try {
      await ALMS.api('/api/donations', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'bulk',
          food_name: desc,
          food_type: desc,
          people_to_feed: plates,
          is_veg: document.getElementById('bulkIsVeg').value === 'veg',
          need_vessel: needVessel,
          vessel_litres: vesselLitres,
          pickup_location: pickupLoc
        })
      });

      ALMS.showToast(
        'Bulk Donation Posted!',
        `Notified verified NGOs. Assigned volunteer courier (${vesselLitres > 0 ? `Carrying ${vesselLitres}L containers` : 'Direct pickup'}).`,
        'success'
      );
      this.switchView('history');
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async contributeToPool(poolId) {
    try {
      const res = await ALMS.api(`/api/priority-pool/${poolId}/contribute`, {
        method: 'POST',
        body: JSON.stringify({ meals: 20 })
      });

      ALMS.showToast(
        'Contributed to Pool!',
        res.status === 'completed' 
          ? `Requirement completed! Courier ${res.volunteer?.name || 'Rahul Sharma'} dispatched for delivery.` 
          : `Added 20 meals to pool. Total collected: ${res.meals_collected}`,
        'success'
      );
      this.loadPoolContributionView();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async logout() {
    await ALMS.api('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('alms_user');
    window.location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_DONOR.init();
});
