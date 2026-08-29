// Toast notification system
function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function checkServer() {
  try {
    await api("/api/health");
    return true;
  } catch {
    document.querySelectorAll(".offline").forEach((el) => el.classList.add("show"));
    return false;
  }
}

function setNote(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

// Global In-App Notifications Manager
async function initNotifications() {
  const nav = document.querySelector("nav.links");
  if (!nav || document.querySelector(".notif-wrap")) return;

  const notifWrap = document.createElement("div");
  notifWrap.className = "notif-wrap";
  notifWrap.style.position = "relative";
  notifWrap.innerHTML = `
    <button class="notif-btn" id="notifBellBtn" title="Rescue Alerts & Notifications">
      🔔
      <span class="notif-badge" style="display:none;">0</span>
    </button>
    <div class="notif-dropdown hidden" id="notifDropdown">
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 0.9rem;">Rescue Alerts</strong>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="markAllReadBtn" style="background:none;border:none;color:var(--primary);font-size:0.75rem;cursor:pointer;font-weight:600;padding:0;">Mark all read</button>
          <button class="notif-close-btn" id="notifCloseBtn" title="Close notifications">✕</button>
        </div>
      </div>
      <div id="notifList">
        <p style="padding: 16px; color: var(--text-muted); font-size: 0.8rem;">Loading notifications...</p>
      </div>
    </div>
  `;
  nav.prepend(notifWrap);

  const bellBtn = document.querySelector("#notifBellBtn");
  const dropdown = document.querySelector("#notifDropdown");
  const closeBtn = document.querySelector("#notifCloseBtn");
  const badge = document.querySelector(".notif-badge");
  const list = document.querySelector("#notifList");
  const markAllBtn = document.querySelector("#markAllReadBtn");

  const closeDropdown = () => {
    dropdown.classList.add("hidden");
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  };

  bellBtn?.addEventListener("click", toggleDropdown);
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== bellBtn) {
      closeDropdown();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });

  markAllBtn?.addEventListener("click", async () => {
    await api("/api/notifications/read-all", { method: "POST" });
    badge.style.display = "none";
    document.querySelectorAll(".notif-item.unread").forEach((el) => el.classList.remove("unread"));
  });

  try {
    const res = await api("/api/notifications");
    if (res.unreadCount > 0) {
      badge.textContent = res.unreadCount;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    if (res.notifications.length === 0) {
      list.innerHTML = `<p style="padding: 16px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">No notifications yet.</p>`;
    } else {
      list.innerHTML = res.notifications.map((n) => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}" data-link="${n.link || ''}">
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main); margin-bottom: 2px;">${n.title}</div>
          <div style="color: var(--text-muted); font-size: 0.775rem;">${n.message}</div>
          <small style="color: var(--text-light); font-size: 0.7rem; display: block; margin-top: 4px;">${n.created_at}</small>
        </div>
      `).join("");

      list.querySelectorAll(".notif-item").forEach((item) => {
        item.addEventListener("click", () => {
          const link = item.dataset.link;
          closeDropdown();
          if (link && link.startsWith("#")) {
            const target = document.querySelector(link);
            if (target) target.scrollIntoView({ behavior: "smooth" });
          }
        });
      });
    }
  } catch (e) {}
}


// Global QR Modal Helper (View QR Code or Verify Code)
window.openQRModal = async function(donationId, type = "pickup") {
  let modal = document.querySelector("#globalQRModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "globalQRModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 id="qrModalTitle" style="font-size: 1.15rem; margin:0;">Secure QR Verification</h3>
          <button class="icon-btn" onclick="document.querySelector('#globalQRModal').classList.add('hidden')">✕</button>
        </div>
        <div id="qrModalBody" style="text-align: center; padding: 12px 0;">
          <p>Generating secure QR code...</p>
        </div>
        <div style="margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; display: flex; gap: 8px;">
          <input type="text" id="manualVerifyInput" placeholder="Or enter 6-digit Code" style="text-transform: uppercase; font-weight: 700; text-align: center; letter-spacing: 2px;">
          <button class="btn btn-primary btn-sm" id="manualVerifyBtn">Verify</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.classList.remove("hidden");
  const title = document.querySelector("#qrModalTitle");
  const body = document.querySelector("#qrModalBody");
  title.textContent = type === "delivery" ? "Delivery Verification QR" : "Pickup Verification QR";

  try {
    const res = await api(`/api/donations/${donationId}/qr?type=${type}`);
    body.innerHTML = `
      <img src="${res.qr}" alt="Verification QR" style="width: 200px; height: 200px; margin: 0 auto; border: 1px solid var(--border); border-radius: 8px;">
      <div style="margin-top: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-main);">
        Security Token: <span style="font-family: monospace; font-size: 1.1rem; color: var(--primary); letter-spacing: 2px;">${res.code}</span>
      </div>
      <p style="font-size: 0.775rem; color: var(--text-muted); margin-top: 4px;">
        ${type === 'delivery' ? 'Recipient or NGO scans/inputs this code upon delivery arrival.' : 'Volunteer scans/inputs this code at pickup location.'}
      </p>
    `;

    document.querySelector("#manualVerifyBtn").onclick = async () => {
      const code = document.querySelector("#manualVerifyInput").value.trim();
      if (!code) return showToast("Please enter verification code", "error");
      try {
        const verifyRes = await api(`/api/donations/${donationId}/verify-qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, stage: type })
        });
        showToast(verifyRes.message, "success");
        modal.classList.add("hidden");
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showToast(err.message, "error");
      }
    };
  } catch (err) {
    body.innerHTML = `<p style="color: var(--danger);">${err.message}</p>`;
  }
};

// User state handling across pages
async function loadAuthUser() {
  try {
    const data = await api("/api/me");
    if (data.user) {
      updateNavWithUser(data.user);
      return data.user;
    }
  } catch (e) {
    updateNavLoggedOut();
  }
  return null;
}

function updateNavWithUser(user) {
  const nav = document.querySelector("nav.links");
  if (!nav) return;

  let badge = nav.querySelector(".user-badge");
  if (!badge) {
    const loginLink = nav.querySelector("a[href='login.html']");
    const regLink = nav.querySelector("a[href^='registration.html']");
    if (loginLink) loginLink.remove();
    if (regLink) regLink.remove();

    badge = document.createElement("div");
    badge.className = "user-badge";
    badge.innerHTML = `
      <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
      <span>${user.name} <small style="opacity:0.8; font-size:0.75rem;">(${user.role})</small></span>
      <button id="logoutBtn" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0;margin-left:4px;font-size:12px;" title="Logout">✕</button>
    `;
    nav.appendChild(badge);

    document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
      await api("/api/logout", { method: "POST" });
      showToast("Logged out successfully");
      setTimeout(() => window.location.reload(), 500);
    });
  }
}

function updateNavLoggedOut() {
  const nav = document.querySelector("nav.links");
  if (!nav) return;
  
  if (!nav.querySelector("a[href='login.html']")) {
    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.textContent = "Log In";
    nav.appendChild(loginLink);
  }
}

// Modal Backdrop CSS injected dynamically
const modalStyle = document.createElement("style");
modalStyle.textContent = `
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
    z-index: 1100; animation: fadeIn 0.2s ease;
  }
  .modal-backdrop.hidden { display: none !important; }
  .modal-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
    padding: 24px; width: min(440px, calc(100vw - 32px)); box-shadow: var(--shadow-lg);
  }
`;
document.head.appendChild(modalStyle);

// ======================================
// DARK / LIGHT MODE TOGGLE
// ======================================
function initThemeToggle() {
  // Apply saved preference immediately (before render)
  const saved = localStorage.getItem("alms-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);

  const nav = document.querySelector("nav.links");
  if (!nav || document.querySelector(".theme-toggle")) return;

  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  btn.title = "Toggle dark / light mode";
  btn.setAttribute("aria-label", "Toggle dark mode");
  btn.textContent = saved === "dark" ? "☀️" : "🌙";

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("alms-theme", next);
    btn.textContent = next === "dark" ? "☀️" : "🌙";
    btn.title = next === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  });

  // Insert as the very last item in nav (far right)
  nav.appendChild(btn);
}

// Apply theme instantly before page paint to avoid flash
(function applyThemeEarly() {
  const saved = localStorage.getItem("alms-theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();

checkServer();
loadAuthUser();
initNotifications();
initThemeToggle();

