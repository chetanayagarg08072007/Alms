/**
 * ALMS Celebration Module (Celebrate With Us)
 * Connected to real backend REST APIs:
 * - /api/celebrations/orgs (Fetch orphanages, old age homes, shelters)
 * - /api/celebrations/request (Book celebration meal with organization)
 */

const ALMS_CELEBRATION = {
  currentCategory: 'all',
  orgs: [],

  async init() {
    this.createFestiveDecorations();
    this.injectScaffold();
    await this.loadOrgs();
    this.render();
  },

  injectScaffold() {
    const main = document.getElementById('celebMainContent');
    if (!main || document.getElementById('celebrationOrgList')) return;

    main.innerHTML = `
      <div class="celebrate-hero" style="text-align:center; padding: var(--sp-8) 0 var(--sp-6);">
        <div style="font-size:3rem; margin-bottom:8px;">🎉</div>
        <h1 class="text-h1" data-i18n="celeb_title">Celebrate With Purpose</h1>
        <p class="text-soft" style="max-width:560px;margin:0 auto;" data-i18n="celeb_sub">
          Transform your celebration into an act of giving. Sponsor meals for orphanages, old-age homes, and shelters on your special day.
        </p>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-bottom:var(--sp-6);">
        <button class="filter-chip active" onclick="ALMS_CELEBRATION.filterCategory('all')">🎉 All Organizations</button>
        <button class="filter-chip" onclick="ALMS_CELEBRATION.filterCategory('orphanage')">👶 Orphanages</button>
        <button class="filter-chip" onclick="ALMS_CELEBRATION.filterCategory('old-age')">🧓 Old Age Homes</button>
        <button class="filter-chip" onclick="ALMS_CELEBRATION.filterCategory('shelter')">🏠 Shelters</button>
      </div>

      <div id="celebrationOrgList" class="grid" style="gap: var(--sp-5); margin-bottom: var(--sp-8);">
        <p style="color:var(--color-text-muted); padding: var(--sp-6);">Loading partner organizations...</p>
      </div>

      <!-- Celebration Booking Modal -->
      <div id="celebrationModal" class="modal-backdrop">
        <div class="modal" style="max-width:560px;">
          <div class="modal-header">
            <h3 class="modal-title" data-i18n="celeb_modal_title">🎉 Plan Your Celebration</h3>
            <button class="modal-close" onclick="document.getElementById('celebrationModal').classList.remove('open')">✕</button>
          </div>
          <form onsubmit="ALMS_CELEBRATION.submitCelebrationRequest(event)">
            <div class="modal-body">
              <input type="hidden" id="celebOrgId">
              <p style="font-size:0.9rem; color:var(--alms-brown-dark); margin-bottom:var(--sp-4);">
                Celebrating with: <strong id="celebOrgNameDisplay"></strong>
              </p>
              <div class="form-group">
                <label class="form-label" data-i18n="celeb_occasion">Occasion <span class="required">*</span></label>
                <select id="celebOccasion" class="form-select" required>
                  <option value="Birthday">🎂 Birthday</option>
                  <option value="Anniversary">💍 Anniversary</option>
                  <option value="Festival">🪔 Festival</option>
                  <option value="Corporate">🏢 Corporate CSR</option>
                  <option value="Other">🎉 Other</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" data-i18n="celeb_date">Preferred Date <span class="required">*</span></label>
                  <input type="date" id="celebDate" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="celeb_time">Preferred Time <span class="required">*</span></label>
                  <input type="time" id="celebTime" class="form-input" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="celeb_items">Items You'll Bring <span class="required">*</span></label>
                <input type="text" id="celebItems" class="form-input" placeholder="e.g. Cake, Biryani, Soft Drinks" required>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="celeb_guests">Number of Guests Visiting <span class="required">*</span></label>
                <input type="number" id="celebGuests" class="form-input" min="1" placeholder="e.g. 8" required>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="celeb_message">Personal Message</label>
                <textarea id="celebMessage" class="form-input" rows="2" placeholder="Share a note of love for the residents..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('celebrationModal').classList.remove('open')">Cancel</button>
              <button type="submit" class="btn btn-primary" data-i18n="celeb_confirm_btn">🎉 Confirm Celebration →</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  createFestiveDecorations() {
    const hero = document.querySelector('.celebrate-hero');
    if (!hero || hero.querySelector('.balloon-container')) return;

    const balloonWrap = document.createElement('div');
    balloonWrap.className = 'balloon-container';
    balloonWrap.innerHTML = `
      <div class="balloon balloon-1">🎈</div>
      <div class="balloon balloon-2">🎈</div>
      <div class="balloon balloon-3">🎈</div>
      <div class="balloon balloon-4">🎈</div>
      <div class="confetti confetti-1">✨</div>
      <div class="confetti confetti-2">🎉</div>
      <div class="confetti confetti-3">✨</div>
    `;
    hero.appendChild(balloonWrap);
  },

  async loadOrgs() {
    try {
      const res = await ALMS.api('/api/celebrations/orgs');
      this.orgs = res.orgs || res.data || [];
    } catch (e) {
      this.orgs = [];
    }
  },

  filterCategory(cat) {
    this.currentCategory = cat;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
    this.render();
  },

  render() {
    const list = document.getElementById('celebrationOrgList');
    if (!list) return;

    const filtered = this.currentCategory === 'all'
      ? this.orgs
      : this.orgs.filter(o => o.category === this.currentCategory);

    list.innerHTML = filtered.map(o => `
      <div class="card celebration-card">
        <img src="../${o.image || 'images/community-meal.jpeg'}" class="celebration-card-img" alt="${o.name}">
        <div class="celebration-card-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span class="badge badge-brown">${o.category.toUpperCase()}</span>
            <span style="font-size:0.8rem; color:var(--color-text-muted);">📍 ${o.distance}</span>
          </div>
          <h3 style="font-size:1.15rem; font-weight:700; color:var(--alms-brown-dark); margin:8px 0 4px;">${o.name}</h3>
          <p style="font-size:0.85rem; color:var(--color-text-soft);">${o.description}</p>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid var(--border);">
            <span style="font-size:0.85rem; font-weight:600; color:var(--alms-brown-dark);">
              👥 <b>${o.residents_count || o.residentsCount} Residents</b>
            </span>
            <button class="btn btn-sm btn-primary" onclick="ALMS_CELEBRATION.openCelebrationModal('${o.id}', '${o.name}')" data-i18n="celeb_request_btn">
              🎉 Celebrate Here
            </button>
          </div>
        </div>
      </div>
    `).join('');

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  openCelebrationModal(orgId, orgName) {
    const modal = document.getElementById('celebrationModal');
    if (!modal) return;
    document.getElementById('celebOrgId').value = orgId;
    document.getElementById('celebOrgNameDisplay').textContent = orgName;
    modal.classList.add('open');
  },

  async submitCelebrationRequest(e) {
    e.preventDefault();
    const orgId = document.getElementById('celebOrgId').value;
    const occasion = document.getElementById('celebOccasion').value;
    const date = document.getElementById('celebDate').value;
    const time = document.getElementById('celebTime').value;
    const items = document.getElementById('celebItems').value;
    const guests = document.getElementById('celebGuests').value;
    const msg = document.getElementById('celebMessage').value;

    try {
      const res = await ALMS.api('/api/celebrations/request', {
        method: 'POST',
        body: JSON.stringify({
          org_id: orgId,
          reason: occasion,
          preferred_date: date,
          preferred_time: time,
          items_to_bring: items,
          guests_count: Number(guests),
          personal_message: msg
        })
      });

      document.getElementById('celebrationModal')?.classList.remove('open');
      ALMS.showToast(
        '🎉 Request Accepted!',
        res.confirmation || '“We’re ready to celebrate with you!” Organization confirmed.',
        'success'
      );
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_CELEBRATION.init();
});
