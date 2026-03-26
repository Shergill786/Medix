/**
 * MEDIX Healthcare App
 * app.js — Core utilities, navigation, shared logic
 */

'use strict';

/* ── Constants ── */
const APP_NAME   = 'Medix';
const STORAGE_KEYS = {
  USER:             'medix_user',
  AUTH:             'medix_auth',
  APPOINTMENTS:     'medix_appointments',
  REMINDERS:        'medix_reminders',
  REMEMBER:         'medix_remember',
  REGISTERED_USERS: 'medix_registered_users',
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
  /**
   * Setup navbar scroll effects
   * Adds shadow to navbar when page is scrolled down
   */
  setupNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Add scroll shadow class when page scrolls down more than 10px
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  },

  /**
   * Highlight the currently active navigation link
   * Compares current page URL with navigation links to mark active state
   */
  setActiveNav() {
    // Extract filename from current path (e.g., 'dashboard.html')
    const current = window.location.pathname.split('/').pop() || 'index.html';
    
    // Check all navbar and sidebar links
    document.querySelectorAll('.navbar-nav a, .sidebar-link').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop() || '';
      // Add 'active' class if link matches current page
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  },

  /**
   * Initialize mobile hamburger menu
   * Handles menu toggle, animations, and closing on link/outside click
   */
  setupMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav    = document.querySelector('.navbar-nav');
    if (!toggle || !nav) return;

    // Handle hamburger menu toggle click
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.classList.toggle('open');
      
      // Animate hamburger icon lines (create X shape when open)
      const spans = toggle.querySelectorAll('span');
      if (toggle.classList.contains('open')) {
        // Cross animation: rotate top and bottom lines, hide middle
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        // Reset to hamburger icon
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close menu when a navigation link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });

    // Close menu when clicking outside the menu area
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      }
    });
  },

  /* ── User Info ── */
  /**
   * Populate user information throughout the page
   * Displays user name, avatar initials, and email in various UI locations
   */
  populateUserInfo() {
    const user = Storage.get(STORAGE_KEYS.USER);
    if (!user) return;  // Exit if no user is logged in

    // Set avatar initials (e.g., 'AJ' for 'Alex Johnson')
    document.querySelectorAll('.avatar, .sidebar-avatar').forEach(el => {
      if (el.dataset.initial !== 'false') {
        el.textContent = Utils.initials(user.name || 'User');
      }
    });

    // Set personalized greeting with user's first name
    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = user.name?.split(' ')[0] || 'there';
    });

    // Display full user info in sidebar
    const sidebarName  = document.querySelector('.sidebar-user-info h4');
    const sidebarEmail = document.querySelector('.sidebar-user-info p');
    if (sidebarName)  sidebarName.textContent  = user.name  || 'User';
    if (sidebarEmail) sidebarEmail.textContent = user.email || '';
  },

  /* ── Scroll Animations ── */
  /**
   * Trigger fade-in-up animations when elements come into view
   * Uses Intersection Observer API for efficient lazy animation triggering
   */
  animateOnScroll() {
    const items = document.querySelectorAll('.animate-on-scroll');
    if (!items.length) return;

    // Set up intersection observer to detect when elements enter viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add animation class when element becomes visible
          entry.target.classList.add('animate-fade-in-up');
          // Stop observing after animation is triggered once
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });  // Trigger when 10% of element is visible

    // Start observing all animation-eligible elements
    items.forEach(el => observer.observe(el));
  },

  /* ── Auth Guard ── */
  /**
   * Check if user is authenticated and redirect to login if not
   * @returns {boolean} true if user is authenticated, false otherwise
   */
  requireAuth() {
    const auth = Storage.get(STORAGE_KEYS.AUTH);
    if (!auth) {
      // Redirect to login page if no authentication token found
      window.location.href = '../pages/login.html';
      return false;
    }
    return true;
  },
};

/* ─────────────────────────────────────────────
   STORAGE HELPER
   ───────────────────────────────────────────── */
/**
 * Wrapper for localStorage with automatic JSON serialization
 * Handles errors gracefully to prevent app crashes
 */
const Storage = {
  /**
   * Retrieve and parse JSON value from localStorage
   * @param {string} key - Storage key
   * @returns {any|null} Parsed value or null if not found/invalid
   */
  get(key) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }  // Silently return null on parse error
  },

  /**
   * Stringify and store value in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} true if successful, false if error occurred
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }  // Return false on quota exceeded or other errors
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key to remove
   */
  remove(key) {
    try { localStorage.removeItem(key); } catch {}  // Silently ignore errors
  },
};

/* ─────────────────────────────────────────────
   UTILITIES HELPER
   ───────────────────────────────────────────── */
/**
 * Utility functions for common operations
 * Includes formatting, ID generation, and event handling helpers
 */
const Utils = {
  /**
   * Extract initials from a name
   * @param {string} name - Full name
   * @returns {string} Up to 2 uppercase initials (e.g., 'AJ')
   */
  initials(name) {
    return name.trim().split(' ')
      .slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  },

  /**
   * Format date in Indian locale (DD MMM YYYY)
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  },

  /**
   * Convert 24-hour time to 12-hour AM/PM format
   * @param {string} time - Time in HH:MM format
   * @returns {string} Time in 12-hour format (e.g., '2:30 PM')
   */
  formatTime(time) {
    const [h, m] = time.split(':');
    const hr  = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  },

  /**
   * Generate a unique ID using timestamp and random string
   * @returns {string} Unique ID (e.g., 'abc123def456')
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  /**
   * Debounce function to limit execution frequency
   * Useful for search input, resize handlers, etc.
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Milliseconds to wait before executing (default: 300)
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);  // Cancel previous execution
      timer = setTimeout(() => fn(...args), delay);  // Schedule new execution
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
