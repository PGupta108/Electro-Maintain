import './styles/global.css';
import { renderAuth } from './pages/auth.js';
import { renderApp, applyTheme } from './pages/app.js';

// Apply saved theme immediately (before any render, prevents flash)
applyTheme();

function getToken() { return localStorage.getItem('em_token'); }

export function navigate(page, data = {}) {
  window._navData = data;
  render(page);
}

function render(page) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (!getToken()) { renderAuth(app); return; }
  renderApp(app, page || window._currentPage || 'dashboard');
}

window._currentPage = 'dashboard';
render();
