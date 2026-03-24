/**
 * MEDIX Healthcare App
 * auth.js — Authentication (login, session, guard)
 */

'use strict';

/* ── Demo Credentials ── */
const DEMO_USERS = [
  { email: 'demo@medix.com',    password: 'Demo@1234', name: 'Alex Johnson',    role: 'Patient' },
  { email: 'doctor@medix.com',  password: 'Doc@1234',  name: 'Dr. Sarah Chen',  role: 'Doctor' },
];

/* ── Auth Manager ── */
const Auth = {
  /* Login flow */
  login(email, password, remember) {
    const user = DEMO_USERS.find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) return { ok: false, error: 'Invalid email or password. Try demo@medix.com / Demo@1234' };

    const session = {
      user:      { name: user.name, email: user.email, role: user.role },
      token:     Utils.generateId(),
      expiresAt: remember
        ? Date.now() + 30 * 24 * 60 * 60 * 1000   // 30 days
        : Date.now() + 24 * 60 * 60 * 1000,        // 1 day
    };

    Storage.set(STORAGE_KEYS.AUTH, session);
    Storage.set(STORAGE_KEYS.USER, session.user);
    if (remember) Storage.set(STORAGE_KEYS.REMEMBER, email);

    return { ok: true, user: session.user };
  },

  /* Logout */
  logout() {
    Storage.remove(STORAGE_KEYS.AUTH);
    Storage.remove(STORAGE_KEYS.USER);
    window.location.href = '../pages/login.html';
  },

  /* Check session validity */
  isLoggedIn() {
    const session = Storage.get(STORAGE_KEYS.AUTH);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.logout();
      return false;
    }
    return true;
  },

  /* Redirect if not authenticated */
  guard() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  /* Current user */
  currentUser() {
    return Storage.get(STORAGE_KEYS.USER);
  },
};

/* ══════════════════════════════════════════
   LOGIN PAGE LOGIC
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput    = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberInput = document.getElementById('remember');
  const submitBtn     = document.getElementById('submitBtn');
  const togglePwd     = document.getElementById('togglePassword');

  /* Pre-fill remembered email */
  const remembered = Storage.get(STORAGE_KEYS.REMEMBER);
  if (remembered && emailInput) {
    emailInput.value = remembered;
    if (rememberInput) rememberInput.checked = true;
  }

  /* Toggle password visibility */
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const isText = passwordInput.type === 'text';
      passwordInput.type = isText ? 'password' : 'text';
      togglePwd.textContent = isText ? '👁️' : '🙈';
    });
  }

  /* Real-time validation */
  [emailInput, passwordInput].forEach(input => {
    input?.addEventListener('input', () => {
      clearError(input);
      if (input === emailInput) validateEmail(input);
    });
    input?.addEventListener('blur',  () => {
      if (input === emailInput) validateEmail(input);
      if (input === passwordInput && input.value) validatePassword(input);
    });
  });

  /* Form submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValid = validateEmail(emailInput);
    const pwdValid   = validatePassword(passwordInput);
    if (!emailValid || !pwdValid) return;

    // Loading state
    setLoading(true);

    // Simulate network delay
    await delay(900);

    const result = Auth.login(
      emailInput.value.trim(),
      passwordInput.value,
      rememberInput?.checked || false
    );

    setLoading(false);

    if (result.ok) {
      showFormSuccess('Login successful! Redirecting…');
      await delay(800);
      window.location.href = 'home.html';
    } else {
      showFormError(result.error);
    }
  });

  /* Demo login fill */
  const demoBtn = document.getElementById('demoLoginBtn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      emailInput.value    = 'demo@medix.com';
      passwordInput.value = 'Demo@1234';
      clearError(emailInput);
      clearError(passwordInput);
      Utils.showToast('Demo credentials filled in!', 'info');
    });
  }

  /* ── Helpers ── */
  function validateEmail(input) {
    const val = input.value.trim();
    if (!val) return showError(input, 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return showError(input, 'Enter a valid email address');
    clearError(input);
    return true;
  }

  function validatePassword(input) {
    const val = input.value;
    if (!val) return showError(input, 'Password is required');
    if (val.length < 6) return showError(input, 'Password must be at least 6 characters');
    clearError(input);
    return true;
  }

  function showError(input, msg) {
    input.classList.add('error');
    const errEl = document.getElementById(input.id + 'Error');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'flex'; }
    return false;
  }

  function clearError(input) {
    input.classList.remove('error');
    const errEl = document.getElementById(input.id + 'Error');
    if (errEl) errEl.style.display = 'none';
  }

  function showFormError(msg) {
    const alertEl = document.getElementById('formAlert');
    if (alertEl) {
      alertEl.className = 'alert alert-error';
      alertEl.innerHTML = `⚠️ ${msg}`;
      alertEl.style.display = 'flex';
      alertEl.style.animation = 'fadeIn 0.3s ease';
    }
  }

  function showFormSuccess(msg) {
    const alertEl = document.getElementById('formAlert');
    if (alertEl) {
      alertEl.className = 'alert alert-success';
      alertEl.innerHTML = `✅ ${msg}`;
      alertEl.style.display = 'flex';
    }
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<span class="btn-spinner"></span> Signing in…'
      : '🔐 Sign In';
    submitBtn.style.opacity = loading ? '0.8' : '1';
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
});

/* ── Expose ── */
window.Auth = Auth;
