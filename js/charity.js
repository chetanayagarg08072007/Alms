/**
 * ALMS Charity Food & Community Kitchens Module
 * Connected to real backend REST APIs:
 * - /api/charity/announcements (List and post temple/individual langars)
 */

const ALMS_CHARITY = {
  announcements: [],

  async init() {
    this.injectScaffold();
    await this.loadAnnouncements();
    this.render();
  },

  injectScaffold() {
    const main = document.getElementById('charityMainContent');
    if (!main || document.getElementById('charityList')) return;

    main.innerHTML = `
      <div style="text-align:center; padding: var(--sp-8) 0 var(--sp-6);">
        <div style="font-size:3rem; margin-bottom:8px;">🛕</div>
        <h1 class="text-h1" data-i18n="charity_title">Charity Food & Community Kitchens</h1>
        <p class="text-soft" style="max-width:560px;margin:0 auto;" data-i18n="charity_sub">
          Temple langars, gurudwara prasad, and individual charity kitchens serving thousands daily. Broadcast your free community meal here.
        </p>
      </div>

      <div class="grid" style="gap:var(--sp-6);">
        <!-- Announcements column -->
        <div>
          <h2 style="font-size:1.2rem; font-weight:700; color:var(--alms-brown-dark); margin-bottom:var(--sp-4);" data-i18n="charity_active_title">
            🍲 Active Charity Kitchens Today
          </h2>
          <div id="charityList" class="grid" style="gap:var(--sp-4);">
            <p style="color:var(--color-text-muted);">Loading charity kitchens...</p>
          </div>
        </div>

        <!-- Post new announcement -->
        <div>
          <div class="card" style="max-width:600px;">
            <h2 style="font-size:1.2rem; font-weight:700; color:var(--alms-brown-dark); margin-bottom:var(--sp-5);" data-i18n="charity_post_title">
              📢 Broadcast a Free Food Event
            </h2>
            <form onsubmit="ALMS_CHARITY.submitAnnouncement(event)">
              <div class="form-group">
                <label class="form-label">Event Type <span class="required">*</span></label>
                <select id="charityType" class="form-select" required>
                  <option value="temple">🛕 Temple / Gurudwara Langar</option>
                  <option value="individual">🙏 Individual Charity</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="charity_reason_label">Occasion / Reason <span class="required">*</span></label>
                <input type="text" id="charityReason" class="form-input" placeholder="e.g. Ramadan Iftar, Guru Nanak Jayanti, Birthday Donation" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" data-i18n="lbl_location">Location / Temple Name <span class="required">*</span></label>
                  <input type="text" id="charityLocation" class="form-input" placeholder="e.g. ISKCON Temple, Green Park" required>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="charity_headcount">Meal Capacity (People) <span class="required">*</span></label>
                  <input type="number" id="charityHeadcount" class="form-input" min="10" placeholder="e.g. 500" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Date <span class="required">*</span></label>
                  <input type="date" id="charityDate" class="form-input" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Serving Time Window <span class="required">*</span></label>
                  <input type="text" id="charityTime" class="form-input" placeholder="e.g. 12:00 PM – 3:00 PM" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Food Menu <span class="required">*</span></label>
                <input type="text" id="charityFood" class="form-input" placeholder="e.g. Khichdi, Dal, Chapati, Kheer" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Organizer / Trust Head Name <span class="required">*</span></label>
                  <input type="text" id="charityHead" class="form-input" placeholder="e.g. Swami Prakashan" required>
                </div>
                <div class="form-group">
                  <label class="form-label" data-i18n="lbl_phone">Contact Phone <span class="required">*</span></label>
                  <input type="tel" id="charityPhone" class="form-input" placeholder="9888777666" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top:var(--sp-4);" data-i18n="charity_submit_btn">
                📢 Broadcast Free Food Event
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  async loadAnnouncements() {
    try {
      const res = await ALMS.api('/api/charity/announcements');
      this.announcements = res.announcements || res.data || [];
    } catch (e) {
      this.announcements = [];
    }
  },

  render() {
    const list = document.getElementById('charityList');
    if (!list) return;

    if (this.announcements.length === 0) {
      list.innerHTML = `
        <div class="card empty-state" style="grid-column:1/-1;">
          <div style="font-size:3rem; margin-bottom:8px;">🛕</div>
          <p>No active mass charity kitchens scheduled for today. Be the first to broadcast!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.announcements.map(a => `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div>
            <span class="badge ${a.type === 'temple' ? 'badge-brown' : 'badge-beige'}">${a.type === 'temple' ? '🛕 TEMPLE / GURDWARA LANGAR' : 'INDIVIDUAL CHARITY'}</span>
            <h3 style="font-size:1.15rem; font-weight:700; color:var(--alms-brown-dark); margin:8px 0 2px;">${a.reason}</h3>
            <div style="font-size:0.8rem; color:var(--color-text-muted);">📍 ${a.location} • 📅 ${a.date} (${a.time_window || a.timeWindow})</div>
          </div>
          <div style="text-align:right;">
            <span class="badge badge-success" style="font-size:0.9rem;">👥 ${a.gathering_headcount || a.gatheringHeadcount} Meals Capacity</span>
          </div>
        </div>

        <div style="margin:12px 0; background:var(--alms-cream); padding:10px 14px; border-radius:var(--radius-md); font-size:0.85rem; color:var(--color-text-soft);">
          🍲 <b>Menu:</b> ${a.food_description || a.foodDescription}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:0.8rem; color:var(--color-text-muted);">
          <span>Trust Head: <b>${a.head_name || a.headName}</b></span>
          <span>📞 ${a.contact_phone || a.contactPhone}</span>
        </div>
      </div>
    `).join('');

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async submitAnnouncement(e) {
    e.preventDefault();
    const type = document.getElementById('charityType').value;
    const reason = document.getElementById('charityReason').value;
    const loc = document.getElementById('charityLocation').value;
    const count = document.getElementById('charityHeadcount').value;
    const date = document.getElementById('charityDate').value;
    const time = document.getElementById('charityTime').value;
    const food = document.getElementById('charityFood').value;
    const head = document.getElementById('charityHead').value;
    const phone = document.getElementById('charityPhone').value;

    try {
      await ALMS.api('/api/charity/announcements', {
        method: 'POST',
        body: JSON.stringify({
          type,
          reason,
          location: loc,
          gathering_headcount: Number(count),
          date,
          time_window: time,
          food_description: food,
          head_name: head,
          contact_phone: phone
        })
      });

      ALMS.showToast('Charity Food Announced!', `Broadcasted ${count} meals community kitchen notification.`, 'success');
      e.target.reset();
      await this.loadAnnouncements();
      this.render();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_CHARITY.init();
});
