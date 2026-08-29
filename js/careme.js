/**
 * ALMS CareMe Module (One meal, One person, One connection)
 * Connected to real backend REST APIs:
 * - /api/careme/request (Needy individual asks for a meal)
 * - /api/careme/requests (Donor views nearby requests feed)
 * - /api/careme/:id/accept (Donor matches with recipient)
 * - /api/careme/:id/messages (Direct meetup coordination chat)
 */

const ALMS_CAREME = {
  currentRole: 'donor', // 'donor' or 'needy'
  activeRequestId: 2,
  requests: [],

  async init() {
    this.render();
  },

  setRole(role) {
    this.currentRole = role;
    this.render();
  },

  async render() {
    const container = document.getElementById('caremeMainContent');
    if (!container) return;

    if (this.currentRole === 'needy') {
      container.innerHTML = this.renderNeedyForm();
    } else {
      await this.renderDonorFeed(container);
    }

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  renderNeedyForm() {
    return `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="text-center" style="margin-bottom: var(--sp-6);">
          <div style="font-size:3rem; margin-bottom:8px;">🍲</div>
          <h2 class="text-h1" data-i18n="careme_ask_title">Ask for a Meal</h2>
          <p class="text-soft">Tell us your location and meal requirement. A verified local Food Hero will connect to provide fresh food.</p>
        </div>

        <form onsubmit="ALMS_CAREME.submitNeedyRequest(event)" class="fade-in">
          <div class="form-group">
            <label class="form-label" data-i18n="lbl_name">Your Name / Identifier <span class="required">*</span></label>
            <input type="text" id="careNeedyName" class="form-input" placeholder="e.g. Kishan Lal" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" data-i18n="lbl_phone">Phone / Contact Number <span class="required">*</span></label>
              <input type="tel" id="careNeedyPhone" class="form-input" placeholder="9844433221" required>
            </div>
            <div class="form-group">
              <label class="form-label">Meal Type Needed <span class="required">*</span></label>
              <select id="careMealType" class="form-select">
                <option value="Dinner">Dinner</option>
                <option value="Lunch">Lunch</option>
                <option value="Breakfast">Breakfast</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" data-i18n="lbl_location">Current Location / Landmark <span class="required">*</span></label>
            <input type="text" id="careNeedyLocation" class="form-input" placeholder="e.g. Near Safdarjung Flyover, Bus Stop" required>
          </div>

          <div class="form-group">
            <label class="form-label">Reason / Situation <span class="required">*</span></label>
            <textarea id="careNeedyReason" class="form-textarea" rows="3" placeholder="e.g. Daily wage worker stranded with family, need warm dinner." required></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" style="margin-top: var(--sp-4);">
            Submit Meal Request to Nearby Food Heroes →
          </button>
        </form>
      </div>
    `;
  },

  async renderDonorFeed(container) {
    try {
      const res = await ALMS.api('/api/careme/requests');
      this.requests = res.requests || res.data || [];
    } catch (e) {
      this.requests = [];
    }

    container.innerHTML = `
      <div class="fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-6); flex-wrap:wrap; gap:12px;">
          <div>
            <h2 class="dashboard-page-title" data-i18n="careme_nearby_title">Nearby Individual Meal Requests</h2>
            <p class="dashboard-page-sub">Direct one-on-one connection. Accept a request and coordinate a safe public meetup to deliver food.</p>
          </div>
        </div>

        <div class="grid grid-2" style="gap: var(--sp-6);">
          <!-- Left: Feed of Requests -->
          <div>
            <h3 style="font-size:1.1rem; color:var(--alms-brown-dark); margin-bottom:var(--sp-4);">
              Pending Requests in Your Radius
            </h3>
            <div class="grid" style="gap:12px;">
              ${this.requests.map(r => `
                <div class="card ${r.id === this.activeRequestId ? 'card-beige' : ''}" style="border-left: 4px solid var(--alms-brown);">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      <h4 style="font-size:1rem; font-weight:700; color:var(--alms-brown-dark);">${r.needy_name || r.needyName}</h4>
                      <div style="font-size:0.8rem; color:var(--color-text-muted);">📍 ${r.location} (${r.distance || '0.8 km away'})</div>
                    </div>
                    <span class="badge ${r.status === 'matched' ? 'badge-success' : 'badge-brown'}">
                      ${r.status === 'matched' ? 'ACCEPTED' : r.meal_type || r.mealType}
                    </span>
                  </div>

                  <p style="font-size:0.85rem; color:var(--color-text-soft); margin:10px 0; background:var(--alms-cream); padding:8px 12px; border-radius:var(--radius-sm);">
                    "${r.reason}"
                  </p>

                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span style="font-size:0.75rem; color:var(--color-text-muted);">📞 ${r.phone}</span>
                    <div style="display:flex; gap:6px;">
                      ${r.status !== 'matched' ? `
                        <button class="btn btn-sm btn-primary" onclick="ALMS_CAREME.acceptRequest('${r.id}')" data-i18n="careme_accept_btn">
                          ✔ Accept & Connect
                        </button>
                      ` : `
                        <button class="btn btn-sm btn-outline" onclick="ALMS_CAREME.openChat('${r.id}')" data-i18n="careme_chat_title">
                          💬 Open Meetup Chat
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Meetup Coordination Chat Window -->
          <div>
            <div class="card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height:520px;">
              <div style="background:var(--alms-brown-dark); color:#fff; padding:14px 18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h4 style="margin:0; font-size:1rem; color:#fff;" data-i18n="careme_chat_title">Direct Meetup Coordination</h4>
                  <div style="font-size:0.75rem; opacity:0.85;">Recipient: Meena Devi • Safe Public Spot</div>
                </div>
                <span class="badge badge-success">Active</span>
              </div>

              <!-- Chat Message History -->
              <div id="caremeChatHistory" style="flex:1; padding:16px; overflow-y:auto; background:var(--alms-cream); display:flex; flex-direction:column; gap:10px;">
                <!-- Messages populated dynamically -->
              </div>

              <!-- Chat Input Form -->
              <form onsubmit="ALMS_CAREME.sendChatMessage(event)" style="padding:12px; border-top:1px solid var(--border); background:var(--surface); display:flex; gap:8px;">
                <input type="text" id="caremeMsgInput" class="form-input" placeholder="Type a message (e.g. Reaching in 5 mins at Pillar 42)..." required>
                <button type="submit" class="btn btn-primary">Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderChatMessages();
  },

  async openChat(requestId) {
    this.activeRequestId = Number(requestId);
    await this.renderChatMessages();
  },

  async renderChatMessages() {
    const box = document.getElementById('caremeChatHistory');
    if (!box) return;

    let messages = [];
    try {
      const res = await ALMS.api(`/api/careme/${this.activeRequestId}/messages`);
      messages = res.messages || [];
    } catch (e) {
      messages = [];
    }

    if (messages.length === 0) {
      box.innerHTML = `<p style="text-align:center; color:var(--color-text-muted); font-size:0.8rem; margin:auto;">No messages yet. Send a message to coordinate meetup location.</p>`;
      return;
    }

    box.innerHTML = messages.map(m => `
      <div style="align-self: ${m.sender_role === 'donor' ? 'flex-end' : 'flex-start'}; max-width: 80%;">
        <div style="font-size:0.7rem; color:var(--color-text-muted); margin-bottom:2px; text-align:${m.sender_role === 'donor' ? 'right' : 'left'};">
          ${m.sender_name || (m.sender_role === 'donor' ? 'You (Food Hero)' : 'Recipient')}
        </div>
        <div style="background: ${m.sender_role === 'donor' ? 'var(--alms-brown)' : '#fff'}; color: ${m.sender_role === 'donor' ? '#fff' : 'var(--color-text-main)'}; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.85rem; box-shadow: var(--shadow-sm);">
          ${m.message}
        </div>
      </div>
    `).join('');

    box.scrollTop = box.scrollHeight;
  },

  async submitNeedyRequest(e) {
    e.preventDefault();
    const name = document.getElementById('careNeedyName').value;
    const phone = document.getElementById('careNeedyPhone').value;
    const meal = document.getElementById('careMealType').value;
    const loc = document.getElementById('careNeedyLocation').value;
    const reason = document.getElementById('careNeedyReason').value;

    try {
      await ALMS.api('/api/careme/request', {
        method: 'POST',
        body: JSON.stringify({
          needy_name: name,
          phone,
          meal_type: meal,
          location: loc,
          reason
        })
      });

      ALMS.showToast('Request Broadcasted!', 'Nearby Food Heroes have been notified.', 'success');
      this.currentRole = 'donor';
      this.render();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async acceptRequest(requestId) {
    try {
      await ALMS.api(`/api/careme/${requestId}/accept`, {
        method: 'POST'
      });

      ALMS.showToast('Meal Request Accepted!', 'Opened direct in-platform chat to coordinate handover.', 'success');
      this.activeRequestId = Number(requestId);
      await this.render();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  },

  async sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('caremeMsgInput');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    try {
      await ALMS.api(`/api/careme/${this.activeRequestId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          sender_role: 'donor',
          sender_name: 'Sunil Mehta (Food Hero)',
          message: msg
        })
      });
      await this.renderChatMessages();
    } catch (err) {
      ALMS.showToast(err.message, '', 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_CAREME.init();
});
