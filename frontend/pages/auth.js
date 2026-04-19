import { post } from '../utils/api.js';
import { toast } from '../components/toast.js';

export function renderAuth(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo">
          <div style="display:inline-flex;align-items:center;gap:10px;font-size:1.4rem;font-weight:800;letter-spacing:-1px">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#00e5ff,#a78bfa);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">⚡</div>
            Electro<span style="color:var(--accent)">Maintain</span>
          </div>
          <p style="color:var(--muted);font-size:.82rem;margin-top:6px">Smart Maintenance Reminder System</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login">Login</button>
          <button class="auth-tab" id="tab-register">Register</button>
        </div>

        <!-- LOGIN FORM -->
        <div id="form-login">
          <div style="display:flex;flex-direction:column;gap:.85rem">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="login-email" type="email" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" id="login-password" type="password" placeholder="••••••••" />
            </div>
            <div id="login-error" style="color:var(--red);font-size:.8rem;display:none"></div>
            <button class="btn btn-primary w-full" id="login-btn" style="margin-top:.25rem;justify-content:center">
              Login
            </button>
          </div>
        </div>

        <!-- REGISTER FORM -->
        <div id="form-register" style="display:none">
          <div style="display:flex;flex-direction:column;gap:.85rem">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" id="reg-name" type="text" placeholder="Your Name" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="reg-email" type="email" placeholder="you@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-input" id="reg-password" type="password" placeholder="Min 6 characters" />
            </div>
            <div id="reg-error" style="color:var(--red);font-size:.8rem;display:none"></div>
            <button class="btn btn-primary w-full" id="reg-btn" style="margin-top:.25rem;justify-content:center">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  document.getElementById('tab-login').addEventListener('click', () => {
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('form-login').style.display = '';
    document.getElementById('form-register').style.display = 'none';
  });

  document.getElementById('tab-register').addEventListener('click', () => {
    document.getElementById('tab-register').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('form-register').style.display = '';
    document.getElementById('form-login').style.display = 'none';
  });

  // Login
  document.getElementById('login-btn').addEventListener('click', async () => {
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    btn.innerHTML = '<span class="spinner"></span> Logging in...';
    btn.disabled = true;
    try {
      const { token, user } = await post('/auth/login', {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      });
      localStorage.setItem('em_token', token);
      localStorage.setItem('em_user', JSON.stringify(user));
      window.location.reload();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.innerHTML = 'Login';
      btn.disabled = false;
    }
  });

  // Register
  document.getElementById('reg-btn').addEventListener('click', async () => {
    const btn = document.getElementById('reg-btn');
    const errEl = document.getElementById('reg-error');
    errEl.style.display = 'none';
    btn.innerHTML = '<span class="spinner"></span> Creating...';
    btn.disabled = true;
    try {
      const { token, user } = await post('/auth/register', {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
      });
      localStorage.setItem('em_token', token);
      localStorage.setItem('em_user', JSON.stringify(user));
      window.location.reload();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.style.display = 'block';
      btn.innerHTML = 'Create Account';
      btn.disabled = false;
    }
  });

  // Enter key support
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    });
  });
}
