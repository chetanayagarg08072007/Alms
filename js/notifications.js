/**
 * ALMS Universal Notification Center
 * Connected to real backend REST APIs:
 * - /api/notifications?filter=...
 * - /api/notifications/:id/read
 * - /api/notifications/read-all
 * - /api/notifications/:id (DELETE)
 * - /api/notifications/simulate
 */

const ALMS_NOTIFICATIONS = {
  currentFilter: 'all',
  notifications: [],

  async init() {
    await this.loadNotifications();
    this.render();
  },

  async loadNotifications() {
    try {
      const res = await ALMS.api(`/api/notifications?filter=${this.currentFilter}`);
      this.notifications = res.notifications || res.data || [];
      ALMS.updateNotificationBadge();
    } catch (e) {
      this.notifications = [];
    }
  },

  filter(f) {
    this.currentFilter = f;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
    this.loadNotifications().then(() => this.render());
  },

  render() {
    const list = document.getElementById('notifCenterList') || document.getElementById('notifFullList');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = `
        <div class="card empty-state" style="padding:var(--sp-8);">
          <div style="font-size:3rem; margin-bottom:8px;">🔕</div>
          <h4 style="color:var(--alms-brown-dark);">No Notifications in this filter</h4>
          <p style="font-size:0.85rem; color:var(--color-text-muted);">Try switching categories or use the Demo Event Simulator below.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="card notif-center-card ${!n.is_read ? 'unread' : ''}">
        <div class="notif-center-icon">
          ${n.type === 'mission' ? '🚨' : n.type === 'donation' ? '🍱' : n.type === 'request' ? '🧡' : '🌱'}
        </div>
        <div class="notif-center-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <h4 style="font-size:1.05rem; font-weight:700; color:var(--alms-brown-dark); margin:0;">${n.title}</h4>
            <span style="font-size:0.75rem; color:var(--color-text-muted);">${n.created_at || 'Recently'}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--color-text-soft); margin:6px 0 10px;">${n.message}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div>
              ${n.action_text ? `
                <a href="${n.link ? (n.link.startsWith('http') || n.link.startsWith('pages/') ? n.link : '../' + n.link) : '#'}" class="btn btn-sm btn-primary">
                  ${n.action_text}
                </a>
              ` : ''}
            </div>
            <div style="display:flex; gap:8px;">
              ${!n.is_read ? `
                <button class="btn btn-sm btn-outline" onclick="ALMS_NOTIFICATIONS.markRead('${n.id}')">
                  Mark as Read
                </button>
              ` : ''}
              <button class="btn btn-sm btn-ghost" onclick="ALMS_NOTIFICATIONS.deleteNotif('${n.id}')" style="color:var(--color-danger);">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    if (window.ALMS_I18N) ALMS_I18N.setLanguage(ALMS_I18N.currentLang, false);
  },

  async markRead(id) {
    try {
      await ALMS.api(`/api/notifications/${id}/read`, { method: 'POST' });
      await this.loadNotifications();
      this.render();
    } catch (e) {}
  },

  async markAllRead() {
    try {
      await ALMS.api('/api/notifications/read-all', { method: 'POST' });
      ALMS.showToast('Marked all notifications as read', '', 'info');
      await this.loadNotifications();
      this.render();
    } catch (e) {}
  },

  async deleteNotif(id) {
    try {
      await ALMS.api(`/api/notifications/${id}`, { method: 'DELETE' });
      await this.loadNotifications();
      this.render();
    } catch (e) {}
  },

  async simulateNotification(role) {
    try {
      await ALMS.api('/api/notifications/simulate', {
        method: 'POST',
        body: JSON.stringify({ role })
      });
      ALMS.showToast('Simulated Real-time Alert', `New event notification triggered for ${role.toUpperCase()}.`, 'info');
      await this.loadNotifications();
      this.render();
    } catch (e) {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS_NOTIFICATIONS.init();
});

// ─── ALMS_NOTIF_PAGE alias (for notifications.html inline onclick handlers) ───
const ALMS_NOTIF_PAGE = {
  setFilter(f) {
    ALMS_NOTIFICATIONS.currentFilter = f;
    document.querySelectorAll('.notif-filter-btn').forEach(b => b.classList.remove('active'));
    if (event?.currentTarget) event.currentTarget.classList.add('active');
    ALMS_NOTIFICATIONS.loadNotifications().then(() => ALMS_NOTIFICATIONS.render());

    // Also update count summary
    const summary = document.getElementById('notifCountSummary');
    if (summary) summary.textContent = `Showing ${f === 'all' ? 'all' : f} notifications...`;
  },

  async markAllRead() {
    await ALMS_NOTIFICATIONS.markAllRead();
  },

  async clearAll() {
    try {
      // Delete all notifications one by one from loaded list
      const ids = ALMS_NOTIFICATIONS.notifications.map(n => n.id);
      for (const id of ids) {
        await ALMS.api(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      ALMS.showToast('Cleared', 'All notifications removed.', 'info');
      await ALMS_NOTIFICATIONS.loadNotifications();
      ALMS_NOTIFICATIONS.render();
    } catch (e) {}
  },

  async simulateNewAlert(role) {
    await ALMS_NOTIFICATIONS.simulateNotification(role);
  }
};
