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
      if (res.status === 405 || (res.status === 404 && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:'))) {
        return this.fallbackApi(endpoint, options);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP Error ${res.status}`);
      }
      if (data.token) {
        localStorage.setItem('alms_token', data.token);
      }
      return data;
    } catch (err) {
      if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
        return this.fallbackApi(endpoint, options);
      }
      console.warn(`API call failed for ${url}:`, err.message);
      throw err;
    }
  },

  // Fallback API Engine for static hosts (GitHub Pages)
  fallbackApi(endpoint, options = {}) {
    const cleanEndpoint = endpoint.replace('/api/', '').split('?')[0];
    let body = {};
    if (options.body) {
      if (options.body instanceof FormData) {
        for (let [k, v] of options.body.entries()) body[k] = v;
      } else if (typeof options.body === 'string') {
        try { body = JSON.parse(options.body); } catch (e) {}
      }
    }

    if (cleanEndpoint === 'login') {
      const mobile = body.mobile || '';
      let role = 'donor';
      let name = 'Priya Sharma';
      if (mobile === '9876543212' || mobile.includes('vol')) { role = 'volunteer'; name = 'Rahul Sharma'; }
      else if (mobile === '9876543211' || mobile.includes('ngo')) { role = 'ngo'; name = 'Asha Deep Shelter'; }
      const user = { id: 1, name, mobile, role, donorType: 'individual' };
      localStorage.setItem('alms_user', JSON.stringify(user));
      localStorage.setItem('alms_token', 'demo-token');
      return { success: true, user, token: 'demo-token' };
    }

    if (cleanEndpoint === 'register') {
      const role = body.role || 'donor';
      const name = body.name || 'User';
      const user = { id: Date.now(), name, mobile: body.mobile, role, donorType: body.donor_type || 'individual' };
      localStorage.setItem('alms_user', JSON.stringify(user));
      localStorage.setItem('alms_token', 'demo-token');
      return { success: true, user, token: 'demo-token' };
    }

    if (cleanEndpoint === 'me') {
      const saved = JSON.parse(localStorage.getItem('alms_user') || 'null');
      if (saved) return { success: true, user: saved };
      throw new Error('Not authenticated');
    }

    if (cleanEndpoint === 'logout') {
      localStorage.removeItem('alms_user');
      localStorage.removeItem('alms_token');
      return { success: true, ok: true };
    }

    if (cleanEndpoint === 'stats' || cleanEndpoint === 'impact') {
      return {
        success: true,
        total_meals: 1250,
        total_donations: 48,
        active_ngos: 24,
        active_volunteers: 82,
        co2_avoided_kg: 1062.5,
        water_saved_l: 175000
      };
    }

    if (cleanEndpoint === 'volunteer/impact') {
      return {
        success: true,
        data: {
          mealsDelivered: 127,
          peopleHelped: 48,
          successfulPickups: 28,
          foodWastePreventedKg: 108,
          level: 'Food Hero 🏆',
          rating: 4.9
        }
      };
    }

    if (cleanEndpoint === 'volunteers/status') {
      const u = JSON.parse(localStorage.getItem('alms_user') || '{}');
      u.volunteer_status = body.status || 'available';
      localStorage.setItem('alms_user', JSON.stringify(u));
      return { success: true };
    }

    if (cleanEndpoint === 'donations') {
      let donations = JSON.parse(localStorage.getItem('alms_donations') || '[]');
      if (options.method === 'POST') {
        const newD = {
          id: Date.now(),
          food_name: body.food_name || body.food_type,
          food_type: body.food_type,
          people_to_feed: Number(body.people_to_feed || 20),
          is_veg: body.is_veg,
          pickup_location: body.pickup_location || 'Local Area',
          status: 'posted',
          created_at: 'Just now'
        };
        donations.unshift(newD);
        localStorage.setItem('alms_donations', JSON.stringify(donations));
        return { success: true, donation: newD };
      }
      return { success: true, donations: donations.length ? donations : [
        { id: 1, food_name: 'Hot Paneer & Rice', food_type: 'Cooked Meals', people_to_feed: 40, status: 'delivered', created_at: '2 hours ago' },
        { id: 2, food_name: 'Mixed Veg Curry', food_type: 'Cooked Meals', people_to_feed: 25, status: 'posted', created_at: '30 mins ago' }
      ]};
    }

    if (cleanEndpoint === 'priority-pool') {
      return {
        success: true,
        pool: [
          { id: 1, ngo_name: 'Asha Deep Shelter & Care', hunger_percent: 92, distance_km: 1.2, expiry_hours: 2, is_veg: 1, meals_needed: 60, meals_collected: 40, expiry_time: '1.5 hrs remaining' },
          { id: 2, ngo_name: 'Robin Care Children Home', hunger_percent: 78, distance_km: 2.8, expiry_hours: 3.5, is_veg: 1, meals_needed: 45, meals_collected: 20, expiry_time: '3 hrs remaining' }
        ]
      };
    }

    if (cleanEndpoint.startsWith('priority-pool') && cleanEndpoint.includes('/contribute')) {
      return { success: true, meals_collected: 60, status: 'completed' };
    }

    if (cleanEndpoint === 'collab-donations') {
      let collabs = JSON.parse(localStorage.getItem('alms_collabs') || '[]');
      if (options.method === 'POST') {
        collabs.unshift(body);
        localStorage.setItem('alms_collabs', JSON.stringify(collabs));
        return { success: true };
      }
      return {
        success: true,
        collabs: collabs.length ? collabs : [
          { id: 1, donor_name: 'Priya Sharma', location: 'Green Park', hours_ago: 1, have_food: '30 Fresh Chapatis', seeking_food: 'Dal or Sabzi', quantity_plates: 20 }
        ]
      };
    }

    if (cleanEndpoint.startsWith('collab-donations') && cleanEndpoint.includes('/match')) {
      return { success: true, volunteer: { name: 'Rahul Sharma (VOL-8821)', location: '0.4 km away', eta: '10 mins' } };
    }

    if (cleanEndpoint === 'careme/requests') {
      return {
        success: true,
        requests: [
          { id: 1, needy_name: 'Ramesh Kumar (Elderly)', location: 'Block B, Green Park', distance: '0.5 km', meal_type: 'Dinner', reason: 'Need simple cooked meal for 2 people tonight.', phone: '9876543219', status: 'pending' },
          { id: 2, needy_name: 'Kishan Lal', location: 'Main Market Square', distance: '1.1 km', meal_type: 'Lunch', reason: 'Daily wage worker, seeking vegetarian meal.', phone: '9844433221', status: 'pending' }
        ]
      };
    }

    if (cleanEndpoint === 'celebrations/orgs') {
      return {
        success: true,
        orgs: [
          { id: 1, name: 'Asha Deep Children Care', category: 'orphanage', distance: '1.2 km', description: 'Home for 45 children with warm smile.', residents_count: 45, image: 'images/children-meal.jpeg' },
          { id: 2, name: 'Golden Years Elders Shelter', category: 'old-age', distance: '2.4 km', description: 'Providing nutritious meals to 30 elderly residents.', residents_count: 30, image: 'images/elderly-meal.jpeg' }
        ]
      };
    }

    if (cleanEndpoint === 'celebrations/request') {
      return { success: true, confirmation: '“We’re ready to celebrate with you!” Organization confirmed.' };
    }

    if (cleanEndpoint === 'charity/announcements') {
      return {
        success: true,
        announcements: [
          { id: 1, type: 'temple', reason: 'Community Mahaprasad Langar', location: 'Gurudwara Hall, Green Park', gathering_headcount: 500, date: 'Today', time_window: '12:00 PM – 3:00 PM', food_description: 'Dal Makhani, Rice, Rotis & Kheer', head_name: 'Trust Coordinator', contact_phone: '9888777666' }
        ]
      };
    }

    if (cleanEndpoint === 'emergency/active') {
      return {
        success: true,
        crisis: {
          id: 1,
          title: 'North Flood Relief Emergency Response',
          cause: 'Flooding in Yamuna Lowlands & Slum Displacement',
          location: 'Kashmiri Gate Relief Camp',
          collected_meals: 450,
          target_meals: 1000,
          collection_point_address: 'Community Center Hall, Kashmiri Gate ISBT',
          collection_point_time: '4:00 PM – 5:00 PM Today',
          collection_volunteer: 'Rahul Sharma (VOL-8821)'
        }
      };
    }

    if (cleanEndpoint === 'notifications') {
      return {
        success: true,
        unreadCount: 0,
        notifications: [
          { id: 1, title: 'Welcome to ALMS', message: 'Platform active. Connect with donors and NGOs.', type: 'mission', created_at: 'Just now', is_read: 1 }
        ]
      };
    }

    return { success: true };
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
