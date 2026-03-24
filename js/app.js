/**
 * MEDIX Healthcare App
 * app.js — Core utilities, navigation, shared logic
 */

'use strict';

/* ── Constants ── */
const APP_NAME   = 'Medix';
const STORAGE_KEYS = {
  USER:         'medix_user',
  AUTH:         'medix_auth',
  APPOINTMENTS: 'medix_appointments',
  REMINDERS:    'medix_reminders',
  REMEMBER:     'medix_remember',
};

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

/* ── Main App Object ── */
const App = {
  init() {
    this.setupNavbar();
    this.setActiveNav();
    this.animateOnScroll();
    this.setupMobileMenu();
    this.populateUserInfo();
    console.log(`${APP_NAME} app initialized ✓`);
  },

  /* ── Navbar ── */
  setupNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Scroll shadow
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  },

  setActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav a, .sidebar-link').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop() || '';
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  },

  setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav    = document.querySelector('.navbar-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('open');
      // Animate hamburger lines
      const spans = toggle.querySelectorAll('span');
      if (toggle.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      }
    });
  },

  /* ── User Info ── */
  populateUserInfo() {
    const user = Storage.get(STORAGE_KEYS.USER);
    if (!user) return;

    // Avatar initials
    document.querySelectorAll('.avatar, .sidebar-avatar').forEach(el => {
      if (el.dataset.initial !== 'false') {
        el.textContent = Utils.initials(user.name || 'User');
      }
    });

    // Greeting
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = user.name?.split(' ')[0] || 'there';
    });

    // Sidebar info
    const sidebarName  = document.querySelector('.sidebar-user-info h4');
    const sidebarEmail = document.querySelector('.sidebar-user-info p');
    if (sidebarName)  sidebarName.textContent  = user.name  || 'User';
    if (sidebarEmail) sidebarEmail.textContent = user.email || '';
  },

  /* ── Scroll Animations ── */
  animateOnScroll() {
    const items = document.querySelectorAll('.animate-on-scroll');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(el => observer.observe(el));
  },

  /* ── Auth Guard ── */
  requireAuth() {
    const auth = Storage.get(STORAGE_KEYS.AUTH);
    if (!auth) {
      window.location.href = '../pages/login.html';
      return false;
    }
    return true;
  },
};

/* ── Storage Helper ── */
const Storage = {
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },
};

/* ── Utils ── */
const Utils = {
  initials(name) {
    return name.trim().split(' ')
      .slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  },

  formatTime(time) {
    const [h, m] = time.split(':');
    const hr  = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${icons[type]}</span> ${msg}`;

    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '14px 20px',
      background: type === 'error' ? '#ff4757' : type === 'warning' ? '#ffa502' : '#0d1b3e',
      color: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(13,27,62,0.2)',
      zIndex: '9999',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '0.9rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      maxWidth: '360px',
      animation: 'slideInRight 0.3s ease',
    });

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  stars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  },
};

/* ── Sidebar Toggle (Dashboard) ── */
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar       = document.querySelector('.sidebar');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

/* ── Expose globals ── */
window.App     = App;
window.Storage = Storage;
window.Utils   = Utils;
window.STORAGE_KEYS = STORAGE_KEYS;
