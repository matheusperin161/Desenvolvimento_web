/* ===== CARONA UNIVERSITÁRIA — SHARED APP ===== */

const API_BASE = '/api';

// ── Auth helpers ──────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  save: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ── API helper ────────────────────────────────────────────────
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

async function apiForm(path, formData) {
  const headers = {};
  if (Auth.isLoggedIn()) headers['Authorization'] = `Bearer ${Auth.getToken()}`;
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'default', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', warning: '⚠' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Date / time formatters ────────────────────────────────────
function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price) {
  if (price == null) return '—';
  if (price === 0) return 'Gratuito';
  return `R$ ${Number(price).toFixed(2).replace('.', ',')}`;
}

// ── Avatar helper ─────────────────────────────────────────────
function makeAvatar(name, photo, size = 40, cls = '') {
  if (photo) {
    return `<img src="${photo}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" class="${cls}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:white;display:none;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;">${initials(name)}</div>`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.4)}px;" class="${cls}">${initials(name)}</div>`;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ── Status badge ──────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    active: ['badge-success', 'Ativa'],
    cancelled: ['badge-danger', 'Cancelada'],
    confirmed: ['badge-success', 'Confirmada'],
    pending: ['badge-warning', 'Pendente']
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Ride card HTML ────────────────────────────────────────────
function rideCardHTML(ride, clickable = true) {
  const seatsClass = ride.available_seats <= 1 ? 'seats-badge low' : 'seats-badge';
  const price = formatPrice(ride.price);
  const dt = formatDateTime(ride.departure_time);

  const card = `
    <div class="ride-card" onclick="${clickable ? `window.location='/ride-detail.html?id=${ride.id}'` : ''}">
      <div class="ride-route">
        <span class="from">${ride.origin}</span>
        <span class="arrow">→</span>
        <span class="to">${ride.destination}</span>
      </div>
      <div class="ride-meta">
        <div class="ride-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${dt}
        </div>
        <div class="ride-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
          ${ride.vehicle_model || ''} ${ride.vehicle_color ? '· ' + ride.vehicle_color : ''}
        </div>
      </div>
      ${ride.notes ? `<p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;">"${ride.notes}"</p>` : ''}
      <div class="ride-footer">
        <div class="driver-info">
          ${makeAvatar(ride.driver_name, ride.driver_photo, 28)}
          <span>${ride.driver_name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="${seatsClass}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${ride.available_seats} vaga${ride.available_seats !== 1 ? 's' : ''}
          </div>
          <span class="ride-price">${price}</span>
        </div>
      </div>
    </div>`;
  return card;
}

// ── Navbar setup ──────────────────────────────────────────────
function setupNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  hamburger?.addEventListener('click', () => navLinks?.classList.toggle('open'));

  userMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu?.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdownMenu?.classList.remove('open'));

  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clear();
    window.location.href = '/';
  });

  const user = Auth.getUser();
  if (user) {
    const navLoggedOut = document.getElementById('navLoggedOut');
    const navLoggedOut2 = document.getElementById('navLoggedOut2');
    const navLoggedIn = document.getElementById('navLoggedIn');
    if (navLoggedOut) navLoggedOut.style.display = 'none';
    if (navLoggedOut2) navLoggedOut2.style.display = 'none';
    if (navLoggedIn) navLoggedIn.style.display = '';

    const navUserName = document.getElementById('navUserName');
    if (navUserName) navUserName.textContent = user.name.split(' ')[0];

    const navAvatarWrap = document.getElementById('navAvatarWrap');
    if (navAvatarWrap) navAvatarWrap.innerHTML = makeAvatar(user.name, user.profile_photo, 34);
  }
}

// ── Guard: require login ──────────────────────────────────────
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// Initialize navbar on every page
document.addEventListener('DOMContentLoaded', setupNavbar);
