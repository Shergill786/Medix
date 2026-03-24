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
  /* Signup flow */
  signup(email, username, password, fullname) {
    const registeredUsers = Storage.get(STORAGE_KEYS.REGISTERED_USERS) || [];
    
    // Check if user already exists by email or username
    if (registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Email already registered. Please login or use a different email.' };
    }
    if (registeredUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: 'Username already taken. Choose a different username.' };
    }

    // Create new user
    const newUser = {
      id: Utils.generateId(),
      email: email,
      username: username,
      password: password,
      name: fullname,
      role: 'Patient',
      createdAt: Date.now(),
    };

    registeredUsers.push(newUser);
    Storage.set(STORAGE_KEYS.REGISTERED_USERS, registeredUsers);

    return { ok: true, user: newUser };
  },

  /* Login flow */
  login(email, password, remember) {
    // Check registered users first
    const registeredUsers = Storage.get(STORAGE_KEYS.REGISTERED_USERS) || [];
    
    // Support login by email or username
    const user = registeredUsers.find(u =>
      (u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase()) 
      && u.password === password
    );

    if (!user) {
      // Fallback to demo users for testing
      const demoUser = DEMO_USERS.find(u =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (!demoUser) {
        return { ok: false, error: 'Invalid email/username or password. Please check and try again.' };
      }

      const session = {
        user:      { name: demoUser.name, email: demoUser.email, role: demoUser.role },
        token:     Utils.generateId(),
        expiresAt: remember
          ? Date.now() + 30 * 24 * 60 * 60 * 1000   // 30 days
          : Date.now() + 24 * 60 * 60 * 1000,        // 1 day
      };

      Storage.set(STORAGE_KEYS.AUTH, session);
      Storage.set(STORAGE_KEYS.USER, session.user);
      if (remember) Storage.set(STORAGE_KEYS.REMEMBER, email);

      return { ok: true, user: session.user };
    }

    const session = {
      user:      { name: user.name, email: user.email, role: user.role, username: user.username },
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

/* ══════════════════════════════════════════
   SIGNUP PAGE LOGIC
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const fullnameInput = document.getElementById('fullname');
  const emailInput = document.getElementById('email');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsInput = document.getElementById('terms');
  const submitBtn = document.getElementById('submitBtn');
  const togglePwd = document.getElementById('togglePassword');
  const toggleConfirmPwd = document.getElementById('toggleConfirmPassword');
  const passwordStrengthDiv = document.getElementById('passwordStrength');
  const strengthText = document.getElementById('strengthText');

  /* Toggle password visibility */
  if (togglePwd) {
    togglePwd.addEventListener('click', () => {
      const isText = passwordInput.type === 'text';
      passwordInput.type = isText ? 'password' : 'text';
      togglePwd.textContent = isText ? '👁️' : '🙈';
    });
  }

  if (toggleConfirmPwd) {
    toggleConfirmPwd.addEventListener('click', () => {
      const isText = confirmPasswordInput.type === 'text';
      confirmPasswordInput.type = isText ? 'password' : 'text';
      toggleConfirmPwd.textContent = isText ? '👁️' : '🙈';
    });
  }

  /* Password strength checker */
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      clearError(passwordInput);
      const strength = checkPasswordStrength(passwordInput.value);
      
      if (passwordInput.value) {
        passwordStrengthDiv.style.display = 'block';
        passwordStrengthDiv.className = `password-strength ${strength}`;
        
        const strengthMap = {
          weak: '⚠️ Weak password',
          fair: '👌 Fair password',
          good: '✅ Good password',
          strong: '🔥 Strong password',
        };
        strengthText.textContent = strengthMap[strength];
        strengthText.classList.add('show');
      } else {
        passwordStrengthDiv.style.display = 'none';
        strengthText.classList.remove('show');
      }
    });
  }

  /* Real-time validation */
  [fullnameInput, emailInput, usernameInput, passwordInput, confirmPasswordInput].forEach(input => {
    input?.addEventListener('input', () => clearError(input));
    input?.addEventListener('blur', () => {
      if (input === fullnameInput && input.value) validateFullname(input);
      if (input === emailInput) validateEmail(input);
      if (input === usernameInput && input.value) validateUsername(input);
      if (input === passwordInput && input.value) validatePassword(input);
      if (input === confirmPasswordInput && input.value) validateConfirmPassword(input);
    });
  });

  /* Form submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullnameValid = validateFullname(fullnameInput);
    const emailValid = validateEmail(emailInput);
    const usernameValid = validateUsername(usernameInput);
    const pwdValid = validatePassword(passwordInput);
    const confirmValid = validateConfirmPassword(confirmPasswordInput);
    const termsValid = validateTerms(termsInput);

    if (!fullnameValid || !emailValid || !usernameValid || !pwdValid || !confirmValid || !termsValid) return;

    // Loading state
    setLoading(true);

    // Simulate network delay
    await delay(900);

    const result = Auth.signup(
      emailInput.value.trim(),
      usernameInput.value.trim(),
      passwordInput.value,
      fullnameInput.value.trim()
    );

    setLoading(false);

    if (result.ok) {
      showFormSuccess('Account created successfully! Redirecting to login…');
      await delay(1200);
      window.location.href = 'login.html';
    } else {
      showFormError(result.error);
    }
  });

  /* ── Helpers ── */
  function validateFullname(input) {
    const val = input.value.trim();
    if (!val) return showError(input, 'Full name is required');
    if (val.length < 3) return showError(input, 'Full name must be at least 3 characters');
    if (!/^[a-zA-Z\s]+$/.test(val)) return showError(input, 'Full name can only contain letters and spaces');
    clearError(input);
    return true;
  }

  function validateEmail(input) {
    const val = input.value.trim();
    if (!val) return showError(input, 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return showError(input, 'Enter a valid email address');
    clearError(input);
    return true;
  }

  function validateUsername(input) {
    const val = input.value.trim();
    if (!val) return showError(input, 'Username is required');
    if (val.length < 3) return showError(input, 'Username must be at least 3 characters');
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return showError(input, 'Username can only contain letters, numbers, and underscores');
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

  function validateConfirmPassword(input) {
    const val = input.value;
    if (!val) return showError(input, 'Please confirm your password');
    if (val !== passwordInput.value) return showError(input, 'Passwords do not match');
    clearError(input);
    return true;
  }

  function validateTerms(input) {
    if (!input.checked) return showError(input, 'You must agree to the terms');
    clearError(input);
    return true;
  }

  function checkPasswordStrength(password) {
    let strength = 'weak';
    if (password.length >= 6) strength = 'fair';
    if (password.length >= 8 && /[A-Z]/.test(password)) strength = 'good';
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength = 'strong';
    return strength;
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
      ? '<span class="btn-spinner"></span> Creating account…'
      : '✨ Create Account';
    submitBtn.style.opacity = loading ? '0.8' : '1';
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
});

/* ── Expose ── */
window.Auth = Auth;
