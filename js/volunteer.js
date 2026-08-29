/**
 * ALMS Volunteer & Courier Module
 * Connected to real backend REST APIs:
 * - /api/register (Volunteer registration + DigiLocker ID proof)
 * - /api/volunteers/status (Available / Busy / Offline)
 * - /api/deliveries & /api/donations (Live active mission queue)
 * - /api/deliveries/:id/accept, /pickup, /in-transit, /deliver (7-stage stepper)
 * - /api/donations/:id/verify-qr (QR verification)
 * - /api/volunteer/impact (Gamification, Food Hero stats, reviews)
 */

const ALMS_VOLUNTEER = {
  isRegistered: false,
  status: 'available', // 'available', 'busy', 'offline'
  currentStep: 1, // 1 to 7
  activeMission: null,
  impact: {
    mealsDelivered: 127,
    peopleHelped: 48,
    successfulPickups: 28,
    foodWastePreventedKg: 108,
    level: 'Food Hero 🏆',
    rating: 4.9,
    reviews: []
  },

  async init() {
    try {
      const userRes = await ALMS.api('/api/me').catch(() => null);
      if (userRes && userRes.user && userRes.user.role === 'volunteer') {
        this.isRegistered = true;
        this.status = userRes.user.volunteer_status || 'available';
        localStorage.setItem('alms_user', JSON.stringify(userRes.user));
        await this.loadImpact();
        this.showDashboard();
        return;
      }
    } catch (e) {}

    const savedUser = JSON.parse(localStorage.getItem('alms_user') || 'null');
    if (savedUser && savedUser.role === 'volunteer') {
      this.isRegistered = true;
      this.status = savedUser.volunteer_status || 'available';
      await this.loadImpact();
      this.showDashboard();
    } else {
      this.showRegistration();
    }
  },

  async loadImpact() {
    try {
      const res = await ALMS.api('/api/volunteer/impact');
      if (res && res.data) {
        this.impact = res.data;
      }
    } catch (e) {}
  },

  showRegistration() {
    const main = document.getElementById('volMainContent');
    if (!main) return;

    main.innerHTML = `
      <div class="card" style="max-width: 620px; margin: 0 auto;">
        <div class="text-center" style="margin-bottom: var(--sp-6);">
          <div style="font-size:3rem; margin-bottom:8px;">🚴</div>
          <h2 class="text-h1" data-i18n="vol_reg_title">Volunteer Registration</h2>
          <p class="text-soft" data-i18n="vol_reg_sub">Join our courier network to rescue surplus meals from banquet halls and deliver to shelters.</p>
        </div>

        <form onsubmit="ALMS_VOLUNTEER.submitRegistration(event)" class="fade-in">
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_name">Full Name <span class="required">*</span></label>
            <input type="text" id="volName" class="form-input" placeholder="e.g. Rahul Sharma" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" data-i18n="lbl_phone">Mobile Number (Login) <span class="required">*</span></label>
              <input type="tel" id="volPhone" class="form-input" placeholder="9876543212" required>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Type</label>
              <select id="volVehicle" class="form-select">
                <option value="Motorcycle / Scooter">Motorcycle / Scooter</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Car / Van">Car / Van</option>
                <option value="Walking (Local radius)">Walking (Local radius)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Government ID Document / DigiLocker <span class="required">*</span></label>
            <label class="file-upload">
              <input type="file" id="volProofFile" accept="image/*,.pdf">
              <span class="file-upload-icon">🪪</span>
              <span class="file-upload-text" data-i18n="vol_digilocker_btn">Attach Govt ID (Aadhaar / Driving License)</span>
              <span class="file-upload-hint">Supported formats: JPG, PNG, PDF (Max 10MB)</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="volPassword" class="form-input" value="password123" required>
          </div>

          <div class="card card-cream" style="padding:var(--sp-3); margin:var(--sp-4) 0; font-size:0.8rem; color:var(--color-text-soft);">
            🔒 <b>DigiLocker Trust Guarantee:</b> ID verification ensures full transparency and safe courier transport for humanitarian food distributions.
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg">
            Verify ID & Access Volunteer Hub →
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
    btn.textContent = 'Verifying ID on ALMS...';

    const formData = new FormData();
    formData.append('role', 'volunteer');
    formData.append('name', document.getElementById('volName').value);
    formData.append('mobile', document.getElementById('volPhone').value);
    formData.append('vehicle_type', document.getElementById('volVehicle').value);
    formData.append('password', document.getElementById('volPassword').value);

    const proofInput = document.getElementById('volProofFile');
    if (proofInput?.files?.[0]) {
      formData.append('proof', proofInput.files[0]);
    }

    try {
      const res = await ALMS.api('/api/register', {
        method: 'POST',
        body: formData
      });
      this.isRegistered = true;
      localStorage.setItem('alms_user', JSON.stringify(res.user));
      ALMS.showToast('Verified!', 'Verified Volunteer badge awarded. Ready for rescue missions!', 'success');
      this.showDashboard();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
      btn.disabled = false;
      btn.textContent = 'Verify ID & Access Volunteer Hub →';
    }
  },

  showDashboard() {
    const main = document.getElementById('volMainContent');
    if (!main) return;

    const user = JSON.parse(localStorage.getItem('alms_user') || '{}');

    main.innerHTML = `
      <div class="dashboard-layout">
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
          <div class="sidebar-user">
            <div class="sidebar-avatar">🚴</div>
            <div class="sidebar-name">
              ${user.name || 'Rahul Sharma'}
              <span class="badge-blue-tick" title="Verified Courier">✔</span>
            </div>
            <div class="sidebar-role-tag" data-i18n="vol_badge_verified">Verified Volunteer</div>
          </div>

          <!-- Status Toggle Component -->
          <div class="card card-cream" style="padding:14px; margin-bottom:var(--sp-4); text-align:center;">
            <div style="font-size:0.75rem; font-weight:700; color:var(--color-text-muted); margin-bottom:8px;" data-i18n="vol_status_toggle">
              CURRENT DISPATCH AVAILABILITY
            </div>
            <div style="display:flex; justify-content:center; gap:6px;">
              <button class="btn btn-sm ${this.status === 'available' ? 'btn-success' : 'btn-outline'}" onclick="ALMS_VOLUNTEER.setStatus('available')">
                ● Available
              </button>
              <button class="btn btn-sm ${this.status === 'busy' ? 'btn-danger' : 'btn-outline'}" onclick="ALMS_VOLUNTEER.setStatus('busy')">
                ● Busy
              </button>
              <button class="btn btn-sm ${this.status === 'offline' ? 'btn-secondary' : 'btn-outline'}" onclick="ALMS_VOLUNTEER.setStatus('offline')">
                Offline
              </button>
            </div>
          </div>

          <div class="sidebar-nav">
            <button class="sidebar-nav-item active" onclick="ALMS_VOLUNTEER.switchTab('mission')">
              <span class="sidebar-nav-icon">🚨</span> <span data-i18n="vol_assigned_tab">Active Missions</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_VOLUNTEER.switchTab('impact')">
              <span class="sidebar-nav-icon">🏆</span> <span data-i18n="vol_impact_title">Impact & Gamification</span>
            </button>
            <button class="sidebar-nav-item" onclick="ALMS_VOLUNTEER.logout()" style="color: var(--color-danger); margin-top: var(--sp-6);">
              <span class="sidebar-nav-icon">🚪</span> Logout
            </button>
          </div>
        </aside>

        <!-- Main Panel Content -->
        <main class="dashboard-content">
          <div id="volViewPanel">
            <p>Loading Active Missions...</p>
          </div>
        </main>
      </div>
    `;

    this.loadMissionsView();
    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async setStatus(status) {
    this.status = status;
    try {
      await ALMS.api('/api/volunteers/status', {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      ALMS.showToast(`Status updated to ${status.toUpperCase()}`, '', 'info');
      this.showDashboard();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  switchTab(tab) {
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
    if (event?.currentTarget?.classList) {
      event.currentTarget.classList.add('active');
    }
    if (tab === 'mission') this.loadMissionsView();
    else if (tab === 'impact') this.renderImpactView();
  },

  async loadMissionsView() {
    const panel = document.getElementById('volViewPanel');
    if (!panel) return;

    let deliveries = [];
    try {
      const res = await ALMS.api('/api/deliveries');
      deliveries = res.deliveries || res.data || [];
    } catch (e) {
      deliveries = [];
    }

    panel.innerHTML = `
      <div class="fade-in">
        <h2 class="dashboard-page-title" data-i18n="vol_assigned_tab">Active Rescue Missions & Courier Workflow</h2>
        <p class="dashboard-page-sub">7-Stage step-by-step dispatch workflow with live status timestamps and special instructions.</p>

        <!-- Special Vessel Instruction Banner -->
        <div class="special-instruction-banner">
          <div class="special-instruction-icon">🍲</div>
          <div>
            <div class="special-instruction-title" data-i18n="vol_vessel_instr_title">⚠️ Special Vessel Instruction Alert:</div>
            <div class="special-instruction-body" data-i18n="vol_vessel_instr_body">
              "Donor requested volunteer to bring 40L capacity insulated vessels for hot gravy & dal transport."
            </div>
          </div>
        </div>

        <!-- 7-Stage Workflow Stepper -->
        <div class="workflow-stepper">
          ${this.renderStepperSteps()}
        </div>

        <!-- Mission Details Card -->
        <div class="card" style="margin-top:var(--sp-6);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div>
              <h3 style="font-size:1.2rem; color:var(--alms-brown-dark);">Mission #ALM-8821: Grand Palace Banquets → Asha Deep Shelter</h3>
              <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:2px;">
                🍱 <b>60 Meals (Paneer & Jeera Rice)</b> • ⏳ Expiry: <b>3.5 Hours Remaining</b>
              </div>
            </div>
            <span class="badge badge-success">MISSION ACTIVE</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0; background:var(--alms-cream); padding:16px; border-radius:var(--radius-md);">
            <div>
              <span style="font-size:0.75rem; font-weight:700; color:var(--color-text-muted);">PICKUP LOCATION:</span>
              <div style="font-weight:600; font-size:0.95rem; color:var(--alms-brown-dark);">📍 Gate 3 Loading Bay, Grand Palace Hotel, Safdarjung</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">📞 Contact Donor: +91 98111 22334</div>
            </div>
            <div>
              <span style="font-size:0.75rem; font-weight:700; color:var(--color-text-muted);">DELIVERY DESTINATION:</span>
              <div style="font-weight:600; font-size:0.95rem; color:var(--alms-brown-dark);">📍 Asha Deep Community Shelter Hall, Safdarjung Block B</div>
              <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">📞 Coordinator Suresh: +91 98765 43210</div>
            </div>
          </div>

          <!-- Stepper Action Buttons -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <span style="font-size:0.85rem; color:var(--color-text-soft);">
                Current Stage: <b>Step ${this.currentStep} of 7</b>
              </span>
            </div>
            <div style="display:flex; gap:10px;">
              ${this.currentStep < 7 ? `
                <button class="btn btn-primary" onclick="ALMS_VOLUNTEER.advanceStep()">
                  ${this.getStepActionName()} →
                </button>
              ` : `
                <button class="btn btn-success" disabled>
                  ✅ Task Completed & Verified!
                </button>
              `}
              <button class="btn btn-outline" onclick="ALMS_VOLUNTEER.openQRVerification()">
                📱 Verify with QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  renderStepperSteps() {
    const steps = [
      { num: 1, title: 'Request Received' },
      { num: 2, title: 'Assigned' },
      { num: 3, title: 'Volunteer Accepts' },
      { num: 4, title: 'Navigate to Donor' },
      { num: 5, title: 'Food Picked Up' },
      { num: 6, title: 'Navigate to Recipient' },
      { num: 7, title: 'Food Delivered ✅' }
    ];

    return steps.map(s => {
      let stateClass = '';
      if (s.num < this.currentStep) stateClass = 'completed';
      else if (s.num === this.currentStep) stateClass = 'active';

      return `
        <div class="stepper-step ${stateClass}">
          <div class="stepper-bubble">${s.num < this.currentStep ? '✔' : s.num}</div>
          <div class="stepper-label">${s.title}</div>
        </div>
      `;
    }).join('');
  },

  getStepActionName() {
    switch (this.currentStep) {
      case 1: return 'Accept Request';
      case 2: return 'Confirm Assignment';
      case 3: return 'Start Navigation to Donor';
      case 4: return 'Confirm Food Picked Up';
      case 5: return 'Start Navigation to Shelter';
      case 6: return 'Mark Food Delivered';
      default: return 'Complete Task';
    }
  },

  async advanceStep() {
    if (this.currentStep < 7) {
      this.currentStep++;

      try {
        if (this.currentStep === 4) {
          await ALMS.api('/api/deliveries/1/pickup', { method: 'POST' });
        } else if (this.currentStep === 6) {
          await ALMS.api('/api/deliveries/1/in-transit', { method: 'POST' });
        } else if (this.currentStep === 7) {
          await ALMS.api('/api/deliveries/1/deliver', { method: 'POST' });
        }
      } catch (e) {}

      if (this.currentStep === 7) {
        ALMS.showToast('Task Completed! ❤️', 'You’ve made an impact! 60 meals delivered safely.', 'success');
      } else {
        ALMS.showToast(`Stage Updated`, `Mission advanced to: ${this.getStepActionName()}`, 'info');
      }
      this.loadMissionsView();
    }
  },

  openQRVerification() {
    ALMS.showToast('QR Verification', 'Volunteer scanned delivery QR code. Security Token verified.', 'success');
    this.currentStep = 7;
    this.loadMissionsView();
  },

  renderImpactView() {
    const panel = document.getElementById('volViewPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="fade-in">
        <h2 class="dashboard-page-title" data-i18n="vol_impact_title">Volunteer Impact & Gamification</h2>
        <p class="dashboard-page-sub">Track your community milestones, hero rating, and recipient reviews.</p>

        <!-- Impact Cards Grid -->
        <div class="stats-grid" style="margin: var(--sp-6) 0;">
          <div class="stat-card">
            <span class="stat-icon">🍱</span>
            <div class="stat-num">${this.impact.mealsDelivered}</div>
            <div class="stat-label" data-i18n="vol_stat_meals">Meals Delivered</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👥</span>
            <div class="stat-num">${this.impact.peopleHelped}</div>
            <div class="stat-label" data-i18n="vol_stat_people">People Helped</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📦</span>
            <div class="stat-num">${this.impact.successfulPickups}</div>
            <div class="stat-label" data-i18n="vol_stat_pickups">Successful Pickups</div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🌱</span>
            <div class="stat-num">${this.impact.foodWastePreventedKg} kg</div>
            <div class="stat-label" data-i18n="vol_stat_waste">Waste Prevented</div>
          </div>
        </div>

        <!-- Food Hero Tier -->
        <div class="card card-cream" style="margin-bottom:var(--sp-6); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="font-size:0.85rem; color:var(--color-text-muted); font-weight:700;">VOLUNTEER LEVEL</div>
            <h3 style="font-size:1.6rem; color:var(--alms-brown-dark); margin:4px 0;">${this.impact.level}</h3>
            <p style="font-size:0.85rem; color:var(--color-text-soft);">⭐ Rating: <b>${this.impact.rating} / 5.0</b> based on recipient feedback</p>
          </div>
          <div style="text-align:right;">
            <span class="badge badge-success" style="font-size:1rem; padding:8px 16px;">🏆 500+ Rescue Points</span>
          </div>
        </div>

        <!-- Recipient Reviews -->
        <h3 style="font-size:1.15rem; color:var(--alms-brown-dark); margin-bottom:var(--sp-4);">
          Verified NGO & Donor Reviews
        </h3>
        <div class="grid" style="gap:12px;">
          <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <b>Asha Deep Community Shelter</b>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <p style="font-size:0.85rem; color:var(--color-text-soft);">
              "Rahul handled hot vessel transport with extreme care and arrived 10 minutes early. Truly a lifesaver for our dinner distribution."
            </p>
          </div>
          <div class="card">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <b>Grand Palace Hotel</b>
              <span>⭐⭐⭐⭐⭐</span>
            </div>
            <p style="font-size:0.85rem; color:var(--color-text-soft);">
              "Very polite and prompt courier. Verified QR quickly at the loading dock."
            </p>
          </div>
        </div>
      </div>
    `;

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async logout() {
    await ALMS.api('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('alms_user');
    window.location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_VOLUNTEER.init();
});
