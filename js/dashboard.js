/**
 * MEDIX Healthcare App
 * dashboard.js — Dashboard stats, appointments, reminders
 */

'use strict';

/* ── Sample Data ── */
const SAMPLE_APPOINTMENTS = [
  {
    id: 'appt_001',
    doctor: 'Dr. Sarah Chen',
    specialty: 'Cardiology',
    hospital: 'Apollo Hospitals',
    date: '2025-08-10',
    time: '10:30',
    status: 'upcoming',
    icon: '❤️',
  },
  {
    id: 'appt_002',
    doctor: 'Dr. Raj Kumar',
    specialty: 'Dermatology',
    hospital: 'Fortis Healthcare',
    date: '2025-08-14',
    time: '14:00',
    status: 'upcoming',
    icon: '🩺',
  },
  {
    id: 'appt_003',
    doctor: 'Dr. Priya Nair',
    specialty: 'Orthopedics',
    hospital: 'Max Hospital',
    date: '2025-08-05',
    time: '09:00',
    status: 'completed',
    icon: '🦴',
  },
];

/* ══════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════ */
const Dashboard = {
  init() {
    this.loadStats();
    this.loadAppointments();
    this.loadNotifications();
    this.initSidebarMobile();
  },

  loadStats() {
    const appointments = getAppointments();
    const upcoming = appointments.filter(a => a.status === 'upcoming').length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const reminders = getReminders().length;

    const statMap = {
      '#statAppointments': upcoming,
      '#statCompleted':    completed,
      '#statReminders':    reminders,
      '#statHospitals':    4,
    };

    Object.entries(statMap).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el) this.animateCount(el, val);
    });
  },

  animateCount(el, target) {
    let current = 0;
    const step  = Math.ceil(target / 30);
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  },

  loadAppointments() {
    const container = document.querySelector('#upcomingAppointments');
    if (!container) return;

    const all       = getAppointments();
    const upcoming  = all.filter(a => a.status === 'upcoming').slice(0, 5);

    if (!upcoming.length) {
      container.innerHTML = '<p class="text-secondary text-sm" style="text-align:center;padding:24px">No upcoming appointments</p>';
      return;
    }

    container.innerHTML = upcoming.map(a => `
      <div class="appointment-row">
        <div class="appt-mini-date">
          <span class="day">${new Date(a.date).getDate()}</span>
          <span class="month">${new Date(a.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:0.875rem">${a.doctor}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary)">${a.specialty} · ${Utils.formatTime(a.time)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${a.hospital}</div>
        </div>
        <div>
          <span class="badge badge-blue">${a.icon} Upcoming</span>
        </div>
      </div>
    `).join('');
  },

  loadNotifications() {
    const container = document.querySelector('#notificationsList');
    if (!container) return;

    const notifications = [
      { icon: '💊', type: 'blue',  title: 'Medicine Reminder',     body: 'Metformin 500mg due at 8:00 AM',         time: '5m ago' },
      { icon: '📅', type: 'green', title: 'Appointment Tomorrow',   body: 'Dr. Sarah Chen – Cardiology, 10:30 AM', time: '1h ago' },
      { icon: '🏥', type: 'red',   title: 'Lab Results Ready',      body: 'Your blood test results are available',  time: '3h ago' },
      { icon: '✅', type: 'green', title: 'Appointment Completed',  body: 'Visit with Dr. Priya Nair confirmed',    time: '1d ago' },
    ];

    container.innerHTML = notifications.map(n => `
      <div class="notification-item">
        <div class="notif-icon ${n.type}">${n.icon}</div>
        <div class="notif-content" style="flex:1">
          <h5>${n.title}</h5>
          <p>${n.body}</p>
        </div>
        <span class="notif-time">${n.time}</span>
      </div>
    `).join('');
  },

  initSidebarMobile() {
    const toggle  = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');

    overlay.style.cssText = `
      display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);
      z-index:899;backdrop-filter:blur(2px);transition:opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);

    const close = () => {
      sidebar?.classList.remove('open');
      overlay.style.display = 'none';
    };

    toggle?.addEventListener('click', () => {
      const isOpen = sidebar?.classList.toggle('open');
      overlay.style.display = isOpen ? 'block' : 'none';
    });

    overlay.addEventListener('click', close);
  },
};

/* ══════════════════════════════════════════
   REMINDERS PAGE
══════════════════════════════════════════ */
const Reminders = {
  init() {
    this.render();
    this.setupForm();
    this.setupSearch();
  },

  render(filter = '') {
    const container = document.querySelector('#remindersList');
    if (!container) return;

    let reminders = getReminders();
    if (filter) {
      const q = filter.toLowerCase();
      reminders = reminders.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.dosage?.toLowerCase().includes(q)
      );
    }

    if (!reminders.length) {
      container.innerHTML = `
        <div class="reminders-empty">
          <div class="empty-icon">💊</div>
          <h4 style="color:var(--text-secondary);margin-bottom:8px">No reminders yet</h4>
          <p class="text-sm text-muted">Add your first medicine reminder using the form</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reminders.map((r, i) => this.renderItem(r, i)).join('');
    this.attachItemEvents();
  },

  renderItem(r, i) {
    return `
      <div class="reminder-item" data-id="${r.id}" style="animation-delay:${i * 0.05}s">
        <div class="reminder-icon ${r.taken ? 'taken' : ''}">
          ${r.taken ? '✅' : '💊'}
        </div>
        <div class="reminder-info">
          <h4 style="${r.taken ? 'text-decoration:line-through;opacity:0.6' : ''}">${r.name}</h4>
          <p>${r.dosage || 'No dosage specified'} · ${r.frequency || 'Daily'}</p>
          <div class="reminder-time">🕐 ${Utils.formatTime(r.time)}</div>
        </div>
        <div class="reminder-actions">
          <button class="btn btn-sm btn-ghost take-btn" data-id="${r.id}" title="${r.taken ? 'Mark untaken' : 'Mark taken'}">
            ${r.taken ? '↩️' : '✓'}
          </button>
          <button class="btn btn-sm btn-ghost delete-btn" data-id="${r.id}" title="Delete" style="color:var(--danger)">
            🗑️
          </button>
        </div>
      </div>
    `;
  },

  attachItemEvents() {
    document.querySelectorAll('.take-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTaken(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.delete(btn.dataset.id));
    });
  },

  setupForm() {
    const form = document.getElementById('reminderForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name      = document.getElementById('medName')?.value.trim();
      const time      = document.getElementById('medTime')?.value;
      const dosage    = document.getElementById('medDosage')?.value.trim();
      const frequency = document.getElementById('medFrequency')?.value;
      const notes     = document.getElementById('medNotes')?.value.trim();

      if (!name) return Utils.showToast('Medicine name is required', 'error');
      if (!time) return Utils.showToast('Time is required', 'error');

      const reminder = {
        id: Utils.generateId(),
        name,
        time,
        dosage,
        frequency,
        notes,
        taken: false,
        createdAt: Date.now(),
      };

      const reminders = getReminders();
      reminders.unshift(reminder);
      Storage.set(STORAGE_KEYS.REMINDERS, reminders);

      form.reset();
      this.render();
      Utils.showToast(`"${name}" reminder added!`, 'success');

      // Update dashboard badge if present
      this.updateCount();
    });
  },

  setupSearch() {
    const input = document.getElementById('reminderSearch');
    if (!input) return;
    input.addEventListener('input', Utils.debounce(() => this.render(input.value), 250));
  },

  toggleTaken(id) {
    const reminders = getReminders();
    const idx = reminders.findIndex(r => r.id === id);
    if (idx === -1) return;
    reminders[idx].taken = !reminders[idx].taken;
    Storage.set(STORAGE_KEYS.REMINDERS, reminders);
    this.render();
    Utils.showToast(reminders[idx].taken ? 'Marked as taken ✅' : 'Marked as untaken', 'info');
  },

  delete(id) {
    if (!confirm('Delete this reminder?')) return;
    const reminders = getReminders().filter(r => r.id !== id);
    Storage.set(STORAGE_KEYS.REMINDERS, reminders);
    this.render();
    this.updateCount();
    Utils.showToast('Reminder deleted', 'info');
  },

  updateCount() {
    const el = document.querySelector('#reminderCount');
    if (el) el.textContent = getReminders().length;
  },
};

/* ══════════════════════════════════════════
   APPOINTMENT BOOKING
══════════════════════════════════════════ */
const Booking = {
  selectedDoctor: null,
  selectedSlot: null,
  selectedDate: null,

  init() {
    this.renderDoctors();
    this.setupFilters();
    this.setupModal();
  },

  renderDoctors(filter = 'all') {
    const container = document.querySelector('#doctorsList');
    if (!container) return;

    const doctors = getDoctors();
    const filtered = filter === 'all' ? doctors : doctors.filter(d => d.specialty === filter);

    container.innerHTML = filtered.map(d => this.renderDoctor(d)).join('');
    this.attachDoctorEvents();
  },

  renderDoctor(d) {
    return `
      <div class="doctor-card animate-on-scroll">
        <div class="doctor-avatar">${d.emoji}</div>
        <div class="doctor-info">
          <h3>${d.name}</h3>
          <div class="doctor-spec">${d.specialty}</div>
          <div class="doctor-tags">
            <span class="badge badge-blue">⭐ ${d.rating}</span>
            <span class="badge badge-gray">💰 ₹${d.fee}</span>
            <span class="badge badge-gray">🎓 ${d.exp} yrs exp</span>
          </div>
          <div class="doctor-availability">
            <span class="avail-dot"></span>
            <span style="color:var(--accent-dark)">Available today</span>
          </div>
          <div class="time-slots" data-doc="${d.id}">
            ${d.slots.map(s => `
              <button class="time-slot ${s.booked ? 'booked' : ''}" 
                      data-slot="${s.time}" 
                      ${s.booked ? 'disabled' : ''}>
                ${Utils.formatTime(s.time)}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <span class="badge badge-green">🏥 ${d.hospital}</span>
          <button class="btn btn-primary btn-sm book-btn" data-doc-id="${d.id}">
            Book Now
          </button>
        </div>
      </div>
    `;
  },

  attachDoctorEvents() {
    // Time slot selection
    document.querySelectorAll('.time-slot:not(.booked)').forEach(slot => {
      slot.addEventListener('click', function () {
        const parentSlots = this.closest('.time-slots');
        parentSlots.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        Booking.selectedSlot = this.dataset.slot;
      });
    });

    // Book button
    document.querySelectorAll('.book-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const docId   = btn.dataset.docId;
        const docCard = btn.closest('.doctor-card');
        const slot    = docCard.querySelector('.time-slot.selected');

        if (!slot) {
          Utils.showToast('Please select a time slot first', 'warning');
          return;
        }

        const doctor = getDoctors().find(d => d.id === docId);
        Booking.selectedDoctor = doctor;
        Booking.selectedSlot   = slot.dataset.slot;
        Booking.openModal(doctor, slot.dataset.slot);
      });
    });

    App.animateOnScroll();
  },

  openModal(doctor, slot) {
    const overlay = document.getElementById('bookingModal');
    if (!overlay) return;

    document.getElementById('modalDoctorName')?.setAttribute('textContent', doctor.name);
    document.getElementById('modalDoctorName').textContent  = doctor.name;
    document.getElementById('modalSpecialty').textContent   = doctor.specialty;
    document.getElementById('modalTime').textContent        = Utils.formatTime(slot);
    document.getElementById('modalHospital').textContent    = doctor.hospital;

    // Set min date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.min   = today;
      dateInput.value = today;
    }

    overlay.classList.add('open');
  },

  setupModal() {
    const overlay  = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('modalClose');
    const confirmBtn = document.getElementById('confirmBooking');

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    closeBtn?.addEventListener('click', () => overlay?.classList.remove('open'));

    confirmBtn?.addEventListener('click', () => {
      const date    = document.getElementById('bookingDate')?.value;
      const reason  = document.getElementById('bookingReason')?.value.trim();

      if (!date) return Utils.showToast('Please select a date', 'warning');

      const appointment = {
        id:        Utils.generateId(),
        doctor:    Booking.selectedDoctor.name,
        specialty: Booking.selectedDoctor.specialty,
        hospital:  Booking.selectedDoctor.hospital,
        date,
        time:      Booking.selectedSlot,
        reason:    reason || 'General consultation',
        status:    'upcoming',
        icon:      Booking.selectedDoctor.emoji,
        createdAt: Date.now(),
      };

      const existing = getAppointments();
      existing.push(appointment);
      Storage.set(STORAGE_KEYS.APPOINTMENTS, existing);

      overlay.classList.remove('open');
      Utils.showToast(`Appointment booked with ${Booking.selectedDoctor.name}! 🎉`, 'success');
    });
  },

  setupFilters() {
    document.querySelectorAll('.specialty-filter').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.specialty-filter').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        Booking.renderDoctors(this.dataset.filter);
      });
    });
  },
};

/* ══════════════════════════════════════════
   HOSPITALS PAGE
══════════════════════════════════════════ */
const Hospitals = {
  init() {
    this.renderHospitals();
    this.setupSearch();
    this.setupFilters();
  },

  renderHospitals(data = getHospitals()) {
    const container = document.querySelector('#hospitalsGrid');
    if (!container) return;

    if (!data.length) {
      container.innerHTML = '<p class="text-secondary" style="text-align:center;padding:48px;grid-column:1/-1">No hospitals found matching your search.</p>';
      return;
    }

    container.innerHTML = data.map(h => `
      <div class="hospital-card animate-on-scroll">
        <div class="hospital-img">
          <span style="font-size:3.5rem">${h.emoji}</span>
          <div class="hospital-badge">
            <span class="badge ${h.type === 'Government' ? 'badge-blue' : 'badge-green'}">${h.type}</span>
          </div>
        </div>
        <div class="hospital-body">
          <div class="hospital-rating">
            <div class="stars">${Utils.stars(h.rating)}</div>
            <span class="score">${h.rating}</span>
            <span class="count">(${h.reviews} reviews)</span>
          </div>
          <h3 class="hospital-name">${h.name}</h3>
          <div class="hospital-meta">
            <span>📍 ${h.location}</span>
            <span>🏥 ${h.beds} beds · ${h.departments} departments</span>
            <span>🕐 Open 24/7</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${h.specialties.map(s => `<span class="badge badge-gray">${s}</span>`).join('')}
          </div>
          <div class="hospital-footer">
            <span style="font-size:0.8125rem;color:var(--accent-dark);font-weight:600">
              🟢 ${h.doctorsAvailable} doctors available
            </span>
            <a href="appointments.html" class="btn btn-primary btn-sm">View Doctors →</a>
          </div>
        </div>
      </div>
    `).join('');

    App.animateOnScroll();
  },

  setupSearch() {
    const input = document.getElementById('hospitalSearch');
    if (!input) return;

    input.addEventListener('input', Utils.debounce(() => {
      const q = input.value.toLowerCase();
      const filtered = getHospitals().filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.specialties.some(s => s.toLowerCase().includes(q))
      );
      this.renderHospitals(filtered);
    }, 300));
  },

  setupFilters() {
    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.addEventListener('click', function () {
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        const filtered = filter === 'all'
          ? getHospitals()
          : getHospitals().filter(h =>
              h.type === filter || h.specialties.includes(filter)
            );
        Hospitals.renderHospitals(filtered);
      });
    });
  },
};

/* ══════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════ */
function getAppointments() {
  return Storage.get(STORAGE_KEYS.APPOINTMENTS) || SAMPLE_APPOINTMENTS;
}

function getReminders() {
  return Storage.get(STORAGE_KEYS.REMINDERS) || [];
}

function getDoctors() {
  return [
    { id: 'd1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', hospital: 'Apollo Hospitals', rating: 4.9, fee: 800, exp: 12, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }, { time: '15:00', booked: true }] },
    { id: 'd2', name: 'Dr. Raj Kumar', specialty: 'Dermatology', hospital: 'Fortis Healthcare', rating: 4.7, fee: 600, exp: 8, emoji: '👨‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '11:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'd3', name: 'Dr. Priya Nair', specialty: 'Orthopedics', hospital: 'Max Hospital', rating: 4.8, fee: 900, exp: 15, emoji: '👩‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: true }, { time: '16:00', booked: false }] },
    { id: 'd4', name: 'Dr. Arjun Singh', specialty: 'Neurology', hospital: 'AIIMS Delhi', rating: 4.9, fee: 1200, exp: 20, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'd5', name: 'Dr. Meena Iyer', specialty: 'Pediatrics', hospital: 'Manipal Hospitals', rating: 4.6, fee: 500, exp: 10, emoji: '👩‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: false }, { time: '16:30', booked: true }] },
    { id: 'd6', name: 'Dr. Vikram Patel', specialty: 'General Medicine', hospital: 'Apollo Hospitals', rating: 4.5, fee: 400, exp: 6, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }, { time: '16:00', booked: false }] },
  ];
}

function getHospitals() {
  return [
    { name: 'Apollo Hospitals', location: 'Sarita Vihar, New Delhi', rating: 4.8, reviews: 2840, type: 'Private', beds: 550, departments: 52, doctorsAvailable: 28, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '🏥' },
    { name: 'AIIMS New Delhi', location: 'Ansari Nagar, New Delhi', rating: 4.9, reviews: 5200, type: 'Government', beds: 1200, departments: 80, doctorsAvailable: 45, specialties: ['All Specialties', 'Research', 'Trauma'], emoji: '🏛️' },
    { name: 'Fortis Healthcare', location: 'Vasant Kunj, New Delhi', rating: 4.6, reviews: 1980, type: 'Private', beds: 400, departments: 45, doctorsAvailable: 22, specialties: ['Cardiology', 'Orthopedics', 'Dermatology'], emoji: '🏥' },
    { name: 'Max Super Speciality', location: 'Saket, New Delhi', rating: 4.7, reviews: 3100, type: 'Private', beds: 500, departments: 50, doctorsAvailable: 31, specialties: ['Neurology', 'Oncology', 'Pediatrics'], emoji: '⚕️' },
    { name: 'Manipal Hospitals', location: 'Dwarka, New Delhi', rating: 4.5, reviews: 1540, type: 'Private', beds: 380, departments: 40, doctorsAvailable: 18, specialties: ['Pediatrics', 'Gynecology', 'Orthopedics'], emoji: '🏥' },
    { name: 'Safdarjung Hospital', location: 'Safdarjung, New Delhi', rating: 4.3, reviews: 890, type: 'Government', beds: 1500, departments: 60, doctorsAvailable: 35, specialties: ['General Medicine', 'Surgery', 'Emergency'], emoji: '🏛️' },
  ];
}

/* ── Page Initialization ── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html') Dashboard.init();
  if (page === 'reminders.html') Reminders.init();
  if (page === 'appointments.html') Booking.init();
  if (page === 'hospitals.html') Hospitals.init();
});

/* ── Expose ── */
window.Dashboard = Dashboard;
window.Reminders = Reminders;
window.Booking   = Booking;
window.Hospitals = Hospitals;
