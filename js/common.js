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

  // Check if we already have the user badge
  let badge = nav.querySelector(".user-badge");
  if (!badge) {
    // Remove login/register links if any
    const loginLink = nav.querySelector("a[href='login.html']");
    const regLink = nav.querySelector("a[href^='registration.html']");
    if (loginLink) loginLink.remove();
    if (regLink) regLink.remove();

    badge = document.createElement("div");
    badge.className = "user-badge";
    badge.innerHTML = `
      <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
      <span>${user.name}</span>
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

checkServer();
loadAuthUser();
