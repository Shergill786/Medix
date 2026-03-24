/**
 * Settings Page JavaScript
 * Handles navigation, form submissions, toggles, and localStorage
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize settings
  initNavigation();
  initToggles();
  initFormHandlers();
  initAppearanceSettings();
  loadSettingsFromStorage();
});

// ─────────────────────────────────────
// Navigation / Section Switching
// ─────────────────────────────────────
function initNavigation() {
  const navItems = document.querySelectorAll('.settings-nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the section to show
      const sectionId = this.getAttribute('data-section');
      
      // Remove active from all items and sections
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
      });
      
      // Add active to clicked item and corresponding section
      this.classList.add('active');
      document.getElementById(sectionId).classList.add('active');
    });
  });
}

// ─────────────────────────────────────
// Toggle Switches
// ─────────────────────────────────────
function initToggles() {
  const toggleInputs = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
  
  toggleInputs.forEach(toggle => {
    // Load from storage
    const savedState = localStorage.getItem('setting_' + toggle.id);
    if (savedState !== null) {
      toggle.checked = JSON.parse(savedState);
    }
    
    // Save on change
    toggle.addEventListener('change', function() {
      localStorage.setItem('setting_' + this.id, this.checked);
      
      // Show feedback
      showNotification(
        this.checked 
          ? '✓ Setting enabled' 
          : '✗ Setting disabled',
        'info'
      );
    });
  });
}

// ─────────────────────────────────────
// Form Handlers
// ─────────────────────────────────────
function initFormHandlers() {
  // Account section
  const accountInputs = [
    'fullname', 'email', 'phone', 'dob',
    'blood-type', 'allergies', 'emergency-name', 'emergency-phone', 'emergency-relation'
  ];
  
  accountInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      // Load from storage
      const savedValue = localStorage.getItem('account_' + id);
      if (savedValue) {
        input.value = savedValue;
      }
      
      // Save on blur
      input.addEventListener('blur', function() {
        localStorage.setItem('account_' + id, this.value);
      });
    }
  });
}

// Form submission handler
function saveChanges(section) {
  // Collect all form data from the section
  const sectionElement = document.getElementById(section);
  const inputs = sectionElement.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], input[type="date"], textarea, select, input[type="checkbox"]');
  
  let hasErrors = false;
  const errors = [];
  
  // Validation
  if (section === 'account') {
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!fullname) {
      errors.push('Full name is required');
      hasErrors = true;
    }
    
    if (email && !isValidEmail(email)) {
      errors.push('Please enter a valid email address');
      hasErrors = true;
    }
    
    if (!phone) {
      errors.push('Phone number is required');
      hasErrors = true;
    }
    
    // Password change validation
    const currentPwd = document.getElementById('current-pwd').value;
    const newPwd = document.getElementById('new-pwd').value;
    const confirmPwd = document.getElementById('confirm-pwd').value;
    
    if ((newPwd || confirmPwd) && !currentPwd) {
      errors.push('Current password required to change password');
      hasErrors = true;
    }
    
    if (newPwd && newPwd.length < 8) {
      errors.push('New password must be at least 8 characters');
      hasErrors = true;
    }
    
    if (newPwd !== confirmPwd) {
      errors.push('Passwords do not match');
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    errors.forEach(error => showNotification('✗ ' + error, 'error'));
    return;
  }
  
  // Save all inputs
  inputs.forEach(input => {
    if (input.type === 'checkbox') {
      localStorage.setItem('setting_' + input.id, input.checked);
    } else if (input.id) {
      localStorage.setItem('account_' + input.id, input.value);
    }
  });
  
  // Show success message
  showNotification('✓ Changes saved successfully!', 'success');
  
  // Clear password fields after successful change
  if (section === 'account') {
    document.getElementById('current-pwd').value = '';
    document.getElementById('new-pwd').value = '';
    document.getElementById('confirm-pwd').value = '';
  }
}

// ─────────────────────────────────────
// Appearance Settings
// ─────────────────────────────────────
function initAppearanceSettings() {
  const themeInputs = document.querySelectorAll('input[name="theme"]');
  const fontSizeInput = document.getElementById('font-size');
  
  // Theme selection
  themeInputs.forEach(input => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && input.value === savedTheme) {
      input.checked = true;
    }
    
    input.addEventListener('change', function() {
      localStorage.setItem('theme', this.value);
      applyTheme(this.value);
      showNotification('✓ Theme updated', 'info');
    });
  });
  
  // Font size
  if (fontSizeInput) {
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
      fontSizeInput.value = savedFontSize;
      applyFontSize(savedFontSize);
    }
    
    fontSizeInput.addEventListener('input', function() {
      applyFontSize(this.value);
      document.getElementById('font-size-value').textContent = this.value + 'px';
    });
    
    fontSizeInput.addEventListener('change', function() {
      localStorage.setItem('font-size', this.value);
    });
  }
  
  // Apply saved theme on load
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    // Dark mode - could add dark mode CSS variables
    root.style.colorScheme = 'dark';
    document.body.style.backgroundColor = '#1a1a1a';
    document.body.style.color = '#ffffff';
  } else if (theme === 'auto') {
    // Auto - use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.style.colorScheme = prefersDark ? 'dark' : 'light';
  } else {
    // Light mode (default)
    root.style.colorScheme = 'light';
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
}

function applyFontSize(size) {
  const root = document.documentElement;
  const ratio = size / 14; // 14px is base
  root.style.fontSize = ratio * 100 + '%';
}

// ─────────────────────────────────────
// Notification System
// ─────────────────────────────────────
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification notification-' + type;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 14px 20px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(10px);
  `;
  
  // Set colors based on type
  const colorMap = {
    success: { bg: 'rgba(0, 200, 150, 0.9)', color: 'white' },
    error: { bg: 'rgba(255, 71, 87, 0.9)', color: 'white' },
    info: { bg: 'rgba(26, 111, 255, 0.9)', color: 'white' }
  };
  
  const colors = colorMap[type] || colorMap.info;
  notification.style.backgroundColor = colors.bg;
  notification.style.color = colors.color;
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ─────────────────────────────────────
// Utilities
// ─────────────────────────────────────
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Load all settings from storage on page load
function loadSettingsFromStorage() {
  // This is called in initFormHandlers and initToggles
  // Consolidated here for clarity
  
  // Restore all toggle states
  const toggleInputs = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
  toggleInputs.forEach(toggle => {
    const savedState = localStorage.getItem('setting_' + toggle.id);
    if (savedState !== null) {
      toggle.checked = JSON.parse(savedState);
    }
  });
  
  // Restore all form values
  const allInputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], input[type="date"], textarea, select');
  allInputs.forEach(input => {
    if (input.id) {
      const savedValue = localStorage.getItem('account_' + input.id);
      if (savedValue) {
        input.value = savedValue;
      }
    }
  });
}

// Export data for backup
function exportSettings() {
  const settings = { ...localStorage };
  const dataStr = JSON.stringify(settings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'medix-settings-backup.json';
  link.click();
  showNotification('✓ Settings exported', 'success');
}

// Import settings from file
function importSettings(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const settings = JSON.parse(e.target.result);
      Object.keys(settings).forEach(key => {
        localStorage.setItem(key, settings[key]);
      });
      showNotification('✓ Settings imported successfully', 'success');
      location.reload();
    } catch (error) {
      showNotification('✗ Failed to import settings', 'error');
    }
  };
  reader.readAsText(file);
}
