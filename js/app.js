/**
 * ALMS Core Application State & Storage Engine
 * Connects frontend UI to real persistent backend REST APIs.
 */

const ALMS = {
  getApiBase() {
    if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
      return 'http://localhost:3000';
    }
    return '';
  },

  // Unified API caller with cookie/token credentials support
  async api(endpoint, options = {}) {
    const defaultHeaders = {
      'Accept': 'application/json'
    };
    if (options.body && !(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('alms_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      },
      credentials: 'include'
    };

    const base = this.getApiBase();
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP Error ${res.status}`);
      }
      if (data.token) {
        localStorage.setItem('alms_token', data.token);
      }
      return data;
    } catch (err) {
      console.warn(`API call failed for ${url}:`, err.message);
      throw err;
    }
  },

  // Priority Index Formula: (Hunger % / Distance) * Urgency Factor
  calculatePriorityIndex(hungerPercent, distanceKm, expiryHours) {
    const dist = Math.max(0.5, Number(distanceKm) || 1.0);
    const urgencyFactor = expiryHours <= 2 ? 2.5 : expiryHours <= 4 ? 1.8 : 1.0;
    const rawScore = (hungerPercent / dist) * urgencyFactor;
    return Math.round(rawScore);
  },

  // Notification Helpers
  async getNotifications(filter = 'all') {
    try {
      const res = await this.api(`/api/notifications?filter=${filter}`);
      return res.notifications || res.data || [];
    } catch (e) {
      return [];
    }
  },

  async getUnreadCount() {
    try {
      const res = await this.api('/api/notifications');
      return res.unreadCount || 0;
    } catch (e) {
      return 0;
    }
  },

  async markAllNotificationsRead() {
    try {
      await this.api('/api/notifications/read-all', { method: 'POST' });
      this.updateNotificationBadge();
      this.renderNotifPanel();
    } catch (e) {}
  },

  async addNotification(notif) {
    try {
      await this.api('/api/notifications/simulate', {
        method: 'POST',
        body: JSON.stringify(notif)
      });
      this.updateNotificationBadge();
      this.showToast(notif.title, notif.message, 'info');
    } catch (e) {}
  },

  async updateNotificationBadge() {
    try {
      const count = await this.getUnreadCount();
      document.querySelectorAll('.notif-badge').forEach(badge => {
        badge.textContent = count;
        if (count > 0) {
          badge.classList.remove('hidden');
          badge.style.display = 'flex';
        } else {
          badge.classList.add('hidden');
          badge.style.display = 'none';
        }
      });
    } catch (e) {}
  },

  // Toast Notification System
  showToast(title, message = '', type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔔';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div style="flex:1;">
        <strong style="display:block; font-size:0.85rem; margin-bottom:2px;">${title}</strong>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  },

  // Header Scroll & Dropdowns
  initHeader() {
    const header = document.querySelector('.site-header');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
          header.classList.add('scrolled');
          header.classList.remove('transparent');
        } else {
          header.classList.remove('scrolled');
          header.classList.add('transparent');
        }
      });
    }

    // Toggle Notifications Dropdown Panel
    const bellBtn = document.querySelector('#headerNotifBell');
    const panel = document.querySelector('#notifPanel');
    if (bellBtn && panel) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
        this.renderNotifPanel();
      });

      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !bellBtn.contains(e.target)) {
          panel.classList.remove('open');
        }
      });
    }

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.header-nav');
    if (mobileBtn && nav) {
      mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('open');
      });
    }
  },

  async renderNotifPanel(filter = 'all') {
    const listEl = document.querySelector('#notifPanelList');
    if (!listEl) return;

    listEl.innerHTML = `<p style="padding: 16px; color: var(--text-muted); font-size: 0.8rem; text-align:center;">Loading notifications...</p>`;

    const notifs = await this.getNotifications(filter);
    if (!notifs || notifs.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding: var(--sp-6);">
          <div style="font-size: 2rem;">🔕</div>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">No notifications yet.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div class="notif-item ${!n.is_read ? 'unread' : ''}" onclick="window.location.href='${n.link || '#'}'">
        <div class="notif-item-icon">
          ${n.type === 'mission' ? '🚨' : n.type === 'donation' ? '🍱' : n.type === 'request' ? '🧡' : '🌱'}
        </div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${n.created_at || 'Just now'}</div>
          ${n.action_text ? `<a href="${n.link || '#'}" class="btn btn-sm btn-outline notif-item-action">${n.action_text}</a>` : ''}
        </div>
        ${!n.is_read ? '<div class="notif-dot"></div>' : ''}
      </div>
    `).join('');
  },

  async checkAuth() {
    try {
      const res = await this.api('/api/me');
      if (res.user) {
        localStorage.setItem('alms_user', JSON.stringify(res.user));
        this.updateHeaderAuth(res.user);
        return res.user;
      }
    } catch (e) {
      // Session not active
    }
    const savedUser = JSON.parse(localStorage.getItem('alms_user') || 'null');
    this.updateHeaderAuth(savedUser);
    return savedUser;
  },

  updateHeaderAuth(user) {
    const isSubPage = window.location.pathname.includes('/pages/');
    const loginPath = isSubPage ? '../login.html' : 'login.html';
    const donorPath = isSubPage ? 'donor.html' : 'pages/donor.html';
    const volPath = isSubPage ? 'volunteer.html' : 'pages/volunteer.html';
    const ngoPath = isSubPage ? 'ngo.html' : 'pages/ngo.html';

    const headerRight = document.querySelector('.site-header .container > div:last-child');
    if (!headerRight) return;

    let authPill = document.querySelector('#headerAuthPill');
    if (!authPill) {
      authPill = document.createElement('div');
      authPill.id = 'headerAuthPill';
      authPill.style.display = 'flex';
      authPill.style.alignItems = 'center';
      authPill.style.gap = '8px';
      headerRight.prepend(authPill);
    }

    if (user && user.name) {
      const targetDashboard = user.role === 'volunteer' ? volPath : user.role === 'ngo' ? ngoPath : donorPath;
      authPill.innerHTML = `
        <a href="${targetDashboard}" class="btn btn-sm btn-secondary" style="display:flex; align-items:center; gap:6px; text-decoration:none; font-size:0.8rem; font-weight:600; padding:6px 12px; border-radius:999px;">
          <span>👤 ${user.name.split(' ')[0]}</span>
          <span style="font-size:0.7rem; background:var(--alms-brown); color:#fff; padding:1px 6px; border-radius:999px;">${user.role.toUpperCase()}</span>
        </a>
      `;
    } else {
      authPill.innerHTML = `
        <a href="${loginPath}" class="btn btn-sm btn-outline" style="text-decoration:none; font-size:0.8rem; font-weight:600; padding:5px 12px; border-radius:999px;">
          🔑 Login
        </a>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ALMS.initHeader();
  ALMS.updateNotificationBadge();
  ALMS.checkAuth();
});
