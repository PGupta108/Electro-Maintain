import { renderDashboard } from './dashboard.js';
import { renderDevices } from './devices.js';
import { renderReminders } from './reminders.js';
import { renderMLInsights } from './mlInsights.js';
import { renderAbout } from './about.js';
import { toast } from '../components/toast.js';

// UPGRADE 3: Apply saved theme on load
export function applyTheme() {
  const theme = localStorage.getItem('em_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

export function renderApp(container, page) {
  applyTheme();
  const user = JSON.parse(localStorage.getItem('em_user') || '{}');
  const initial = user.name?.[0]?.toUpperCase() || 'U';
  const theme = localStorage.getItem('em_theme') || 'dark';

  container.innerHTML = `
    <div class="page">
      <header class="header">
        <div class="header-inner">
          <a class="logo" href="#">
            <div class="logo-mark">⚡</div>
            Electro<em>Maintain</em>
          </a>
          <nav class="nav">
            <button class="nav-btn ${page==='dashboard'?'active':''}" data-page="dashboard">Dashboard</button>
            <button class="nav-btn ${page==='devices'?'active':''}" data-page="devices">Devices</button>
            <button class="nav-btn ${page==='reminders'?'active':''}" data-page="reminders">Reminders</button>
            <button class="nav-btn ${page==='ml'?'active':''}" data-page="ml">🤖 ML Insights</button>
            <button class="nav-btn ${page==='about'?'active':''}" data-page="about">About</button>
          </nav>
          <div class="header-right">
            <!-- UPGRADE 3: Dark/Light mode toggle -->
            <button class="theme-toggle" id="theme-toggle" title="Toggle theme">
              ${theme === 'dark' ? '☀' : '🌙'}
            </button>
            <div class="user-chip">
              <div class="user-avatar">${initial}</div>
              <span>${user.name || 'User'}</span>
            </div>
            <button class="btn btn-ghost btn-sm" id="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div id="page-content" style="padding:2rem 0;min-height:calc(100vh - 62px)">
        <div class="container">
          <div id="page-inner"></div>
        </div>
      </div>

      <div id="toast-root"></div>
    </div>
  `;

  // Nav routing
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window._currentPage = btn.dataset.page;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPage(btn.dataset.page);
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('em_token');
    localStorage.removeItem('em_user');
    toast('Logged out successfully', 'success');
    setTimeout(() => window.location.reload(), 500);
  });

  // UPGRADE 3: Theme toggle logic
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = localStorage.getItem('em_theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('em_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀' : '🌙';
    toast(next === 'dark' ? '🌙 Dark mode on' : '☀ Light mode on', 'success');
  });

  loadPage(page);
}

export function loadPage(page) {
  const inner = document.getElementById('page-inner');
  if (!inner) return;
  inner.innerHTML = `<div style="display:flex;justify-content:center;padding:4rem"><span class="spinner" style="width:32px;height:32px;border-width:3px"></span></div>`;
  window._currentPage = page;

  if      (page === 'dashboard')  renderDashboard(inner);
  else if (page === 'devices')    renderDevices(inner);
  else if (page === 'reminders')  renderReminders(inner);
  else if (page === 'ml')         renderMLInsights(inner);
  else if (page === 'about')      renderAbout(inner);
}
