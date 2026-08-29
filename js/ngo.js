/**
 * ALMS NGO Module
 * Connected to real backend REST APIs:
 * - /api/register (NGO registration + 80G certificate upload)
 * - /api/priority-pool (Fetch, dynamic ranking, and post requests)
 * - /api/priority-pool/:id/received (Acknowledge food received with photo proof)
 * - /api/alerts (Restaurant demand broadcast & closing alerts)
 */

const ALMS_NGO = {
  isRegistered: false,
  priorityPool: [],

  async init() {
    try {
      const userRes = await ALMS.api('/api/me').catch(() => null);
      if (userRes && userRes.user && userRes.user.role === 'ngo') {
        this.isRegistered = true;
        localStorage.setItem('alms_user', JSON.stringify(userRes.user));
        this.showDashboard();
        return;
      }
    } catch (e) {}

    const savedUser = JSON.parse(localStorage.getItem('alms_user') || 'null');
    if (savedUser && savedUser.role === 'ngo') {
      this.isRegistered = true;
      this.showDashboard();
    } else {
      this.showRegistration();
    }
  },

  showRegistration() {
    const main = document.getElementById('ngoMainContent');
    if (!main) return;

    main.innerHTML = `
      <div class="card" style="max-width: 680px; margin: 0 auto;">
        <div class="text-center" style="margin-bottom: var(--sp-6);">
          <div style="font-size:3rem; margin-bottom:8px;">🏢</div>
          <h2 class="text-h1" data-i18n="ngo_reg_title">NGO Registration</h2>
          <p class="text-soft" data-i18n="ngo_reg_sub">Register your humanitarian organization to access the Priority Pool and receive surplus food consignments.</p>
        </div>

        <form onsubmit="ALMS_NGO.submitRegistration(event)" class="fade-in">
          <div class="form-group">
            <label class="form-label">Organization Name <span class="required">*</span></label>
            <input type="text" id="ngoName" class="form-input" placeholder="e.g. Asha Deep Shelter & Welfare Society" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Coordinator Name <span class="required">*</span></label>
              <input type="text" id="ngoCoord" class="form-input" placeholder="e.g. Suresh Verma" required>
            </div>
            <div class="form-group">
              <label class="form-label">Head of Organization <span class="required">*</span></label>
              <input type="text" id="ngoHead" class="form-input" placeholder="e.g. Dr. Ananya Sen" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" data-i18n="lbl_location">Shelter Address / Locality <span class="required">*</span></label>
              <input type="text" id="ngoLocation" class="form-input" placeholder="Safdarjung Enclave, New Delhi" required>
            </div>
            <div class="form-group">
              <label class="form-label" data-i18n="lbl_phone">Mobile Number (Login) <span class="required">*</span></label>
              <input type="tel" id="ngoPhone" class="form-input" placeholder="9876543211" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">80G Certificate / Registration Proof <span class="required">*</span></label>
            <label class="file-upload">
              <input type="file" id="ngo80gFile" accept="image/*,.pdf">
              <span class="file-upload-icon">📜</span>
              <span class="file-upload-text">Attach 80G Certificate / NGO Darpan Document</span>
              <span class="file-upload-hint">Supported formats: PDF, JPG, PNG (Max 10MB)</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="ngoPassword" class="form-input" value="password123" required>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--sp-4);">
            Complete NGO Registration & Access Priority Pool →
          </button>
        </form>
      </div>
    `;

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async submitRegistration(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Registering NGO on ALMS...';

    const formData = new FormData();
    formData.append('role', 'ngo');
    formData.append('name', document.getElementById('ngoName').value);
    formData.append('organization_name', document.getElementById('ngoName').value);
    formData.append('mobile', document.getElementById('ngoPhone').value);
    formData.append('location', document.getElementById('ngoLocation').value);
    formData.append('password', document.getElementById('ngoPassword').value);

    const fileInput = document.getElementById('ngo80gFile');
    if (fileInput?.files?.[0]) {
      formData.append('proof', fileInput.files[0]);
    }

    try {
      const res = await ALMS.api('/api/register', {
        method: 'POST',
        body: formData
      });
      this.isRegistered = true;
      localStorage.setItem('alms_user', JSON.stringify(res.user));
      ALMS.showToast('NGO Verified!', 'Your 80G verified NGO profile is now active on the Priority Pool.', 'success');
      this.showDashboard();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
      btn.disabled = false;
      btn.textContent = 'Complete NGO Registration & Access Priority Pool →';
    }
  },

  showDashboard() {
    const main = document.getElementById('ngoMainContent');
    if (!main) return;

    const user = JSON.parse(localStorage.getItem('alms_user') || '{}');

    main.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
          <div class="sidebar-user">
            <div class="sidebar-avatar">🏢</div>
            <div class="sidebar-name">
              ${user.name || 'Asha Deep Shelter'}
              <span class="badge-blue-tick" title="80G Verified NGO">✔</span>
            </div>
            <div class="sidebar-role-tag">80G Verified NGO</div>
          </div>

          <div class="sidebar-nav">
            <button class="sidebar-nav-item active" onclick="ALMS_NGO.switchTab('pool')">
              <span class="sidebar-nav-icon">🎯</span> <span data-i18n="pool_title">Priority Pool</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_NGO.switchTab('demand')">
              <span class="sidebar-nav-icon">📢</span> Restaurant Alerts
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_NGO.switchTab('received')">
              <span class="sidebar-nav-icon">📸</span> Food Received Proof
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_NGO.logout()" style="color: var(--color-danger); margin-top: var(--sp-6);">
              <span class="sidebar-nav-icon">🚪</span> Logout
            </button>
          </div>
        </aside>

        <!-- Main Panel Content -->
        <main class="dashboard-content">
          <div id="ngoViewPanel">
            <p>Loading Priority Pool...</p>
          </div>
        </main>
      </div>
    `;

    this.loadPoolView();
    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  switchTab(tab) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
    if (event?.currentTarget?.classList) {
      event.currentTarget.classList.add('active');
    }
    if (tab === 'pool') this.loadPoolView();
    else if (tab === 'demand') this.renderDemandView();
    else if (tab === 'received') this.renderReceivedProofView();
  },

  async loadPoolView() {
    const panel = document.getElementById('ngoViewPanel');
    if (!panel) return;

    try {
      const res = await ALMS.api('/api/priority-pool');
      this.priorityPool = res.pool || res.data || [];
    } catch (e) {
      this.priorityPool = [];
    }

    panel.innerHTML = `
      <div class="fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-6); flex-wrap:wrap; gap:12px;">
          <div>
            <h2 class="dashboard-page-title" data-i18n="pool_title">Priority Pool</h2>
            <p class="dashboard-page-sub" data-i18n="pool_sub">Dynamic urgency ranking formula: (Hunger Need % / Distance) × Remaining Shelf Life Multiplier.</p>
          </div>
          <button class="btn btn-primary" onclick="ALMS_NGO.openAddRequestModal()">
            ➕ Post Urgent Food Demand
          </button>
        </div>

        <div class="grid" style="gap: var(--sp-4);">
          ${this.priorityPool.map((item, idx) => {
            const pIndex = ALMS.calculatePriorityIndex(item.hunger_percent || item.hungerPercent, item.distance_km || item.distanceKm, item.expiry_hours || item.expiryHours);
            const isCompleted = (item.meals_collected || item.mealsCollected) >= (item.meals_needed || item.mealsNeeded);

            return `
              <div class="card pool-entry ${idx === 0 ? 'top-priority' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div class="pool-entry-rank">#${idx + 1}</div>
                    <div>
                      <h4 class="pool-entry-name">${item.ngo_name || item.ngoName}</h4>
                      <div style="font-size:0.8rem; color:var(--color-text-muted);">
                        📍 ${item.location} • 📞 ${item.phone}
                      </div>
                    </div>
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <span class="badge ${item.is_veg ? 'badge-veg' : 'badge-nonveg'}">${item.is_veg ? 'Veg' : 'Non-Veg'}</span>
                    <span class="badge badge-danger">Priority Index: ${pIndex}</span>
                  </div>
                </div>

                <div class="pool-entry-meta" style="margin: 12px 0;">
                  <span class="pool-meta-item">📍 ${item.distance_km || item.distanceKm} km away</span>
                  <span class="pool-meta-item">👥 ${item.meals_needed || item.mealsNeeded} Meals Needed</span>
                  <span class="pool-meta-item">⏳ Expiry Deadline: ${item.expiry_time || item.expiryTime}</span>
                </div>

                <!-- Progress Bar -->
                <div class="progress-wrap">
                  <div class="progress-header">
                    <span>Progress: <b>${item.meals_collected || item.mealsCollected} / ${item.meals_needed || item.mealsNeeded} meals</b></span>
                    <span>${Math.round(((item.meals_collected || item.mealsCollected) / (item.meals_needed || item.mealsNeeded)) * 100)}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill ${isCompleted ? 'complete' : ''}" style="width: ${((item.meals_collected || item.mealsCollected) / (item.meals_needed || item.mealsNeeded)) * 100}%;"></div>
                  </div>
                </div>

                <!-- Assigned Volunteer Info -->
                ${item.volunteer_name || item.volunteerName ? `
                  <div class="volunteer-assigned-card" style="margin-top:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                      <div>
                        <div style="font-size:0.75rem; font-weight:700; color:var(--color-text-muted);" data-i18n="pool_vol_assigned">ASSIGNED VOLUNTEER COURIER:</div>
                        <div style="font-weight:700; font-size:0.95rem; color:var(--alms-brown-dark);">
                          🚴 ${item.volunteer_name || item.volunteerName} (${item.volunteer_phone || item.volunteerPhone})
                        </div>
                        <div style="font-size:0.8rem; color:var(--color-text-soft);">
                          📍 ${item.volunteer_location || item.volunteerLocation || '0.6 km away'} • Status: <b style="color:var(--color-success);">${item.volunteer_status || 'En route to shelter'}</b>
                        </div>
                      </div>
                      ${isCompleted ? `
                        <button class="btn btn-sm btn-primary" onclick="ALMS_NGO.openFoodReceivedModal('${item.id}')" data-i18n="pool_received_btn">
                          📸 Food Received (Photo Proof)
                        </button>
                      ` : ''}
                    </div>
                  </div>
                ` : `
                  <div style="margin-top:10px; font-size:0.8rem; color:var(--color-text-muted);">
                    Waiting for nearby donations to reach pool target.
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add Request Modal -->
        <div id="addRequestModal" class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title">Post Urgent Food Requirement</h3>
              <button class="modal-close" onclick="document.querySelector('#addRequestModal').classList.remove('open')">✕</button>
            </div>
            <form onsubmit="ALMS_NGO.submitNewDemand(event)">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Meals Needed (Headcount) <span class="required">*</span></label>
                  <input type="number" id="demandMeals" class="form-input" min="10" placeholder="e.g. 80" required>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Hunger Urgency % <span class="required">*</span></label>
                    <input type="number" id="demandHunger" class="form-input" min="1" max="100" placeholder="90" value="90" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Required Delivery By <span class="required">*</span></label>
                    <input type="text" id="demandTime" class="form-input" placeholder="e.g. 9:00 PM Tonight" required>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Dietary Preference</label>
                  <select id="demandVeg" class="form-select">
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.querySelector('#addRequestModal').classList.remove('open')">Cancel</button>
                <button type="submit" class="btn btn-primary">Publish to Priority Pool</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Food Received Modal -->
        <div id="receivedModal" class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h3 class="modal-title" data-i18n="pool_received_btn">Food Received & Verification</h3>
              <button class="modal-close" onclick="document.querySelector('#receivedModal').classList.remove('open')">✕</button>
            </div>
            <form onsubmit="ALMS_NGO.submitFoodReceived(event)">
              <input type="hidden" id="receivedItemId">
              <div class="modal-body">
                <p style="font-size:0.85rem; color:var(--color-text-soft); margin-bottom:var(--sp-4);">
                  Upload photo proof of food receipt. This photo will be permanently visible on the Donor’s profile!
                </p>
                <div class="form-group">
                  <label class="form-label">Upload Food Received Photo <span class="required">*</span></label>
                  <label class="file-upload">
                    <input type="file" id="receivedPhotoFile" accept="image/*" required>
                    <span class="file-upload-icon">📷</span>
                    <span class="file-upload-text">Click to capture or attach food distribution photo</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="form-label">Rate Volunteer Courier Delivery</label>
                  <select id="receivedVolRating" class="form-select">
                    <option value="5">⭐⭐⭐⭐⭐ Excellent & Safe</option>
                    <option value="4">⭐⭐⭐⭐ Good</option>
                    <option value="3">⭐⭐⭐ Average</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Feedback Review Comment</label>
                  <textarea id="receivedComment" class="form-textarea" rows="2" placeholder="Food arrived hot in clean vessels. Thank you!"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.querySelector('#receivedModal').classList.remove('open')">Cancel</button>
                <button type="submit" class="btn btn-success">Confirm Receipt & Post Proof</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  openAddRequestModal() {
    document.getElementById('addRequestModal')?.classList.add('open');
  },

  async submitNewDemand(e) {
    e.preventDefault();
    const meals = document.getElementById('demandMeals').value;
    const hunger = document.getElementById('demandHunger').value;
    const time = document.getElementById('demandTime').value;
    const isVeg = document.getElementById('demandVeg').value === 'veg';

    try {
      await ALMS.api('/api/priority-pool/request', {
        method: 'POST',
        body: JSON.stringify({
          meals_needed: Number(meals),
          hunger_percent: Number(hunger),
          expiry_time: time,
          is_veg: isVeg
        })
      });

      document.getElementById('addRequestModal')?.classList.remove('open');
      ALMS.showToast('Priority Need Published!', 'Ranked dynamically according to Priority Index.', 'success');
      this.loadPoolView();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  openFoodReceivedModal(itemId) {
    const input = document.getElementById('receivedItemId');
    if (input) input.value = itemId;
    document.getElementById('receivedModal')?.classList.add('open');
  },

  async submitFoodReceived(e) {
    e.preventDefault();
    const itemId = document.getElementById('receivedItemId').value;
    const rating = document.getElementById('receivedVolRating').value;
    const comment = document.getElementById('receivedComment').value;
    const fileInput = document.getElementById('receivedPhotoFile');

    const formData = new FormData();
    formData.append('volunteer_rating', rating);
    formData.append('review_text', comment);
    if (fileInput?.files?.[0]) {
      formData.append('photo', fileInput.files[0]);
    }

    try {
      await ALMS.api(`/api/priority-pool/${itemId}/received`, {
        method: 'POST',
        body: formData
      });

      document.getElementById('receivedModal')?.classList.remove('open');
      ALMS.showToast('Food Received Confirmed!', 'Photo proof attached to donor profile and review logged for volunteer.', 'success');
      this.loadPoolView();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  renderDemandView() {
    const panel = document.getElementById('ngoViewPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="fade-in card" style="max-width:680px;">
        <h2 class="dashboard-page-title">Restaurant Demand & Closing Alerts</h2>
        <p class="dashboard-page-sub">Trigger immediate demand broadcasts to commercial kitchens or schedule automated 30-min closing-time reminders.</p>

        <div class="card card-cream" style="margin: var(--sp-4) 0; padding:16px;">
          <h4 style="color:var(--alms-brown-dark);">📢 Live Restaurant Demand Broadcast</h4>
          <p style="font-size:0.85rem; color:var(--color-text-soft); margin:6px 0 12px;">
            Send an instant high-priority notification to all registered hotel and restaurant kitchens within a 5 km radius.
          </p>
          <button class="btn btn-primary" onclick="ALMS_NGO.sendDemandAlert()">
            Trigger Demand Notification to Nearby Kitchens
          </button>
        </div>

        <div class="card card-beige" style="padding:16px;">
          <h4 style="color:var(--alms-brown-dark);">⏰ Automatic Closing Reminder Alert</h4>
          <p style="font-size:0.85rem; color:var(--color-text-soft); margin:6px 0 12px;">
            Automated system alert dispatched 30 minutes before restaurant closing time (typically 10:30 PM) reminding chefs to donate end-of-day surplus.
          </p>
          <button class="btn btn-secondary" onclick="ALMS_NGO.sendReminderAlert()">
            Simulate 30-Min Closing Time Reminder
          </button>
        </div>
      </div>
    `;
  },

  async sendDemandAlert() {
    try {
      await ALMS.api('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ type: 'demand', message: 'Urgent demand broadcast sent to 14 commercial kitchens.' })
      });
      ALMS.showToast('Demand Broadcast Sent!', 'Notified 14 commercial kitchens in South Delhi.', 'success');
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async sendReminderAlert() {
    try {
      await ALMS.api('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ type: 'reminder', message: 'Closing time reminder sent.' })
      });
      ALMS.showToast('Closing Reminder Sent!', '30-minute reminder dispatched to active restaurant profiles.', 'info');
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  renderReceivedProofView() {
    const panel = document.getElementById('ngoViewPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="fade-in card">
        <h2 class="dashboard-page-title">Received Food Photo Proof Gallery</h2>
        <p class="dashboard-page-sub">Public transparent proofs of food rescued and distributed.</p>
        <div class="grid grid-3" style="gap:16px; margin-top:var(--sp-4);">
          <div class="card" style="padding:10px;">
            <img src="../images/meal-distribution.jpeg" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-md);" alt="Proof">
            <div style="font-size:0.85rem; font-weight:700; margin-top:8px;">Grand Palace Banquets → Asha Deep</div>
            <div style="font-size:0.75rem; color:var(--color-text-muted);">60 Meals distributed • Verified with photo</div>
          </div>
          <div class="card" style="padding:10px;">
            <img src="../images/children-meal.jpeg" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-md);" alt="Proof">
            <div style="font-size:0.85rem; font-weight:700; margin-top:8px;">Spice Garden → Robin Care</div>
            <div style="font-size:0.75rem; color:var(--color-text-muted);">45 Meals distributed • Verified with photo</div>
          </div>
        </div>
      </div>
    `;
  },

  async logout() {
    await ALMS.api('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('alms_user');
    window.location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_NGO.init();
});
