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
    const city = this.getCurrentCity();
    let data = getHospitals();
    if (city) {
      data = data.filter(h => h.city === city);
    }
    this.renderHospitals(data);
    this.setupSearch();
    this.setupFilters();
  },

  getCurrentCity() {
    const path = window.location.pathname;
    if (path.includes('delhi')) return 'Delhi';
    if (path.includes('kolkata')) return 'Kolkata';
    if (path.includes('ambala')) return 'Ambala';
    if (path.includes('bengaluru')) return 'Bengaluru';
    if (path.includes('chandigarh')) return 'Chandigarh';
    if (path.includes('chennai')) return 'Chennai';
    if (path.includes('mumbai')) return 'Mumbai';
    if (path.includes('pune')) return 'Pune';
    return null;
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
            <a href="../appointments.html" class="btn btn-primary btn-sm">Book Appointment →</a>
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
    // Delhi Doctors - 6
    { id: 'd1', name: 'Dr. Sarah Chen', specialty: 'Cardiology', hospital: 'Apollo Hospitals', city: 'Delhi', rating: 4.9, fee: 800, exp: 12, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }, { time: '15:00', booked: true }] },
    { id: 'd2', name: 'Dr. Raj Kumar', specialty: 'Dermatology', hospital: 'Fortis Healthcare', city: 'Delhi', rating: 4.7, fee: 600, exp: 8, emoji: '👨‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '11:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'd3', name: 'Dr. Priya Nair', specialty: 'Orthopedics', hospital: 'Max Hospital', city: 'Delhi', rating: 4.8, fee: 900, exp: 15, emoji: '👩‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: true }, { time: '16:00', booked: false }] },
    { id: 'd4', name: 'Dr. Arjun Singh', specialty: 'Neurology', hospital: 'AIIMS Delhi', city: 'Delhi', rating: 4.9, fee: 1200, exp: 20, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'd5', name: 'Dr. Meena Iyer', specialty: 'Pediatrics', hospital: 'Manipal Hospitals', city: 'Delhi', rating: 4.6, fee: 500, exp: 10, emoji: '👩‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: false }, { time: '16:30', booked: true }] },
    { id: 'd6', name: 'Dr. Vikram Patel', specialty: 'General Medicine', hospital: 'Apollo Hospitals', city: 'Delhi', rating: 4.5, fee: 400, exp: 6, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }, { time: '16:00', booked: false }] },
    
    // Kolkata Doctors - 6
    { id: 'kd1', name: 'Dr. Amitava Das', specialty: 'Cardiology', hospital: 'Apollo Gleneagles Hospital', city: 'Kolkata', rating: 4.8, fee: 750, exp: 14, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:00', booked: true }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'kd2', name: 'Dr. Diya Sen', specialty: 'Orthopedics', hospital: 'Medica Superspeciality Hospital', city: 'Kolkata', rating: 4.7, fee: 850, exp: 11, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'kd3', name: 'Dr. Ravi Mitra', specialty: 'Neurology', hospital: 'Ruby General Hospital', city: 'Kolkata', rating: 4.6, fee: 900, exp: 16, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: false }, { time: '16:00', booked: true }] },
    { id: 'kd4', name: 'Dr. Asha Gupta', specialty: 'Pediatrics', hospital: 'SSKM Hospital', city: 'Kolkata', rating: 4.7, fee: 550, exp: 9, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'kd5', name: 'Dr. Sanjay Roy', specialty: 'General Medicine', hospital: 'Peerless Hospital', city: 'Kolkata', rating: 4.5, fee: 450, exp: 7, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'kd6', name: 'Dr. Neha Chatterjee', specialty: 'Dermatology', hospital: 'Apollo Gleneagles Hospital', city: 'Kolkata', rating: 4.6, fee: 600, exp: 8, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Ambala Doctors - 6
    { id: 'ad1', name: 'Dr. Harpreet Singh', specialty: 'Cardiology', hospital: 'Apollo Ambala Hospital', city: 'Ambala', rating: 4.7, fee: 700, exp: 10, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:00', booked: true }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'ad2', name: 'Dr. Pooja Sharma', specialty: 'Orthopedics', hospital: 'Fortis Hospital Ambala', city: 'Ambala', rating: 4.6, fee: 650, exp: 9, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: false }, { time: '15:00', booked: true }] },
    { id: 'ad3', name: 'Dr. Arun Verma', specialty: 'General Medicine', hospital: 'Civil Hospital Ambala', city: 'Ambala', rating: 4.5, fee: 400, exp: 6, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: true }, { time: '14:30', booked: false }, { time: '16:00', booked: false }] },
    { id: 'ad4', name: 'Dr. Sunita Malhotra', specialty: 'Pediatrics', hospital: 'Max Hospital Ambala', city: 'Ambala', rating: 4.6, fee: 500, exp: 8, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'ad5', name: 'Dr. Rajesh Goyal', specialty: 'Surgery', hospital: 'Shivalik Hospital', city: 'Ambala', rating: 4.4, fee: 800, exp: 12, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'ad6', name: 'Dr. Kavya Garg', specialty: 'Neurology', hospital: 'Eternal Hospital', city: 'Ambala', rating: 4.5, fee: 750, exp: 11, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Bengaluru Doctors - 6
    { id: 'bd1', name: 'Dr. Vishwanath Kumar', specialty: 'Cardiology', hospital: 'Apollo Hospitals Bangalore', city: 'Bengaluru', rating: 4.8, fee: 900, exp: 16, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'bd2', name: 'Dr. Anjali Reddy', specialty: 'Orthopedics', hospital: 'Manipal Hospital Bangalore', city: 'Bengaluru', rating: 4.7, fee: 800, exp: 13, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'bd3', name: 'Dr. Suresh Murthy', specialty: 'Neurology', hospital: 'BGS Gleneagles Global Hospital', city: 'Bengaluru', rating: 4.8, fee: 950, exp: 18, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: false }, { time: '16:00', booked: true }] },
    { id: 'bd4', name: 'Dr. Priya Sinha', specialty: 'Pediatrics', hospital: 'St. John\'s Medical College Hospital', city: 'Bengaluru', rating: 4.6, fee: 600, exp: 10, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:30', booked: true }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'bd5', name: 'Dr. Ramesh Naidu', specialty: 'General Medicine', hospital: 'Indraprastha Apollo Hospital Bangalore', city: 'Bengaluru', rating: 4.5, fee: 500, exp: 8, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'bd6', name: 'Dr. Deepika Joshi', specialty: 'Oncology', hospital: 'Apollo Hospitals Bangalore', city: 'Bengaluru', rating: 4.7, fee: 1000, exp: 15, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Chandigarh Doctors - 6
    { id: 'cd1', name: 'Dr. Gautam Sharma', specialty: 'Cardiology', hospital: 'Fortis Hospital Chandigarh', city: 'Chandigarh', rating: 4.7, fee: 750, exp: 12, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:00', booked: true }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'cd2', name: 'Dr. Nitisha Bhat', specialty: 'Orthopedics', hospital: 'Max Hospital Chandigarh', city: 'Chandigarh', rating: 4.6, fee: 700, exp: 10, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: false }, { time: '15:00', booked: true }] },
    { id: 'cd3', name: 'Dr. Ashok Kapoor', specialty: 'Neurology', hospital: 'PGIMER Chandigarh', city: 'Chandigarh', rating: 4.8, fee: 1100, exp: 19, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: true }, { time: '14:30', booked: false }, { time: '16:00', booked: false }] },
    { id: 'cd4', name: 'Dr. Simran Kaur', specialty: 'Pediatrics', hospital: 'Apollo Chandigarh Hospital', city: 'Chandigarh', rating: 4.5, fee: 520, exp: 7, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'cd5', name: 'Dr. Mukesh Bansal', specialty: 'General Medicine', hospital: 'Stellar Hospital', city: 'Chandigarh', rating: 4.4, fee: 450, exp: 6, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'cd6', name: 'Dr. Hema Anand', specialty: 'Oncology', hospital: 'HCG Hospital Chandigarh', city: 'Chandigarh', rating: 4.6, fee: 900, exp: 14, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Chennai Doctors - 6
    { id: 'cnd1', name: 'Dr. Balaji Iyer', specialty: 'Cardiology', hospital: 'Apollo Hospital Chennai', city: 'Chennai', rating: 4.9, fee: 1000, exp: 18, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'cnd2', name: 'Dr. Meera Krishnan', specialty: 'Orthopedics', hospital: 'Fortis Malar Hospital', city: 'Chennai', rating: 4.7, fee: 850, exp: 13, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'cnd3', name: 'Dr. Raghavan Chari', specialty: 'Neurology', hospital: 'Gleneagles Global Hospital Chennai', city: 'Chennai', rating: 4.8, fee: 920, exp: 17, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: false }, { time: '16:00', booked: true }] },
    { id: 'cnd4', name: 'Dr. Shruti Menon', specialty: 'Pediatrics', hospital: 'Kauvery Hospital', city: 'Chennai', rating: 4.6, fee: 600, exp: 9, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:30', booked: true }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'cnd5', name: 'Dr. Arjun Srinath', specialty: 'General Medicine', hospital: 'Government General Hospital', city: 'Chennai', rating: 4.5, fee: 400, exp: 7, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'cnd6', name: 'Dr. Divya Sharma', specialty: 'Oncology', hospital: 'Sri Ramakrishna Hospital', city: 'Chennai', rating: 4.6, fee: 950, exp: 15, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Mumbai Doctors - 6
    { id: 'md1', name: 'Dr. Rajesh Desai', specialty: 'Cardiology', hospital: 'Lilavati Hospital', city: 'Mumbai', rating: 4.9, fee: 1100, exp: 19, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'md2', name: 'Dr. Aisha Khan', specialty: 'Orthopedics', hospital: 'Fortis Hospital Mumbai', city: 'Mumbai', rating: 4.7, fee: 900, exp: 14, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: true }, { time: '15:00', booked: false }] },
    { id: 'md3', name: 'Dr. Nitin Vora', specialty: 'Neurology', hospital: 'Breach Candy Hospital', city: 'Mumbai', rating: 4.8, fee: 1000, exp: 17, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: false }, { time: '14:30', booked: false }, { time: '16:00', booked: true }] },
    { id: 'md4', name: 'Dr. Priya Oak', specialty: 'Pediatrics', hospital: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', rating: 4.6, fee: 700, exp: 11, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:30', booked: true }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'md5', name: 'Dr. Sanjay Mehta', specialty: 'General Medicine', hospital: 'Sir H.N. Reliance Foundation Hospital', city: 'Mumbai', rating: 4.5, fee: 550, exp: 9, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'md6', name: 'Dr. Zara Kapadia', specialty: 'Oncology', hospital: 'Bombay Hospital Institute of Medical Sciences', city: 'Mumbai', rating: 4.7, fee: 1050, exp: 16, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
    
    // Pune Doctors - 6
    { id: 'pd1', name: 'Dr. Atul Kulkarni', specialty: 'Cardiology', hospital: 'Lilavati Hospital Pune', city: 'Pune', rating: 4.8, fee: 850, exp: 14, emoji: '👨‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '10:00', booked: true }, { time: '11:00', booked: false }, { time: '14:00', booked: false }] },
    { id: 'pd2', name: 'Dr. Neha Patni', specialty: 'Orthopedics', hospital: 'Fortis Hospital Pune', city: 'Pune', rating: 4.6, fee: 750, exp: 11, emoji: '👩‍⚕️', slots: [{ time: '08:00', booked: false }, { time: '09:30', booked: false }, { time: '12:00', booked: false }, { time: '15:00', booked: true }] },
    { id: 'pd3', name: 'Dr. Vikram Kesari', specialty: 'Neurology', hospital: 'Ruby Hall Clinic', city: 'Pune', rating: 4.7, fee: 900, exp: 15, emoji: '👨‍⚕️', slots: [{ time: '10:00', booked: false }, { time: '11:30', booked: true }, { time: '14:30', booked: false }, { time: '16:00', booked: false }] },
    { id: 'pd4', name: 'Dr. Anjali More', specialty: 'Pediatrics', hospital: 'Noble Hospital', city: 'Pune', rating: 4.5, fee: 550, exp: 8, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: true }, { time: '10:30', booked: false }, { time: '12:00', booked: false }, { time: '15:30', booked: false }] },
    { id: 'pd5', name: 'Dr. Raghu Deshmukh', specialty: 'General Medicine', hospital: 'Sahyadri Hospital', city: 'Pune', rating: 4.4, fee: 450, exp: 6, emoji: '👨‍⚕️', slots: [{ time: '08:30', booked: false }, { time: '10:00', booked: false }, { time: '13:00', booked: true }, { time: '16:30', booked: false }] },
    { id: 'pd6', name: 'Dr. Kavya Joshi', specialty: 'Oncology', hospital: 'Continental Hospital', city: 'Pune', rating: 4.6, fee: 900, exp: 13, emoji: '👩‍⚕️', slots: [{ time: '09:00', booked: false }, { time: '11:00', booked: false }, { time: '14:00', booked: true }, { time: '16:00', booked: false }] },
  ];
}

function getHospitals() {
  return [
    // Delhi - 6 hospitals
    { name: 'Apollo Hospitals', location: 'Sarita Vihar, New Delhi', city: 'Delhi', rating: 4.8, reviews: 2840, type: 'Private', beds: 550, departments: 52, doctorsAvailable: 28, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '🏥' },
    { name: 'AIIMS New Delhi', location: 'Ansari Nagar, New Delhi', city: 'Delhi', rating: 4.9, reviews: 5200, type: 'Government', beds: 1200, departments: 80, doctorsAvailable: 45, specialties: ['All Specialties', 'Research', 'Trauma'], emoji: '🏛️' },
    { name: 'Fortis Healthcare', location: 'Vasant Kunj, New Delhi', city: 'Delhi', rating: 4.6, reviews: 1980, type: 'Private', beds: 400, departments: 45, doctorsAvailable: 22, specialties: ['Cardiology', 'Orthopedics', 'Dermatology'], emoji: '🏥' },
    { name: 'Max Super Speciality', location: 'Saket, New Delhi', city: 'Delhi', rating: 4.7, reviews: 3100, type: 'Private', beds: 500, departments: 50, doctorsAvailable: 31, specialties: ['Neurology', 'Oncology', 'Pediatrics'], emoji: '⚕️' },
    { name: 'Manipal Hospitals', location: 'Dwarka, New Delhi', city: 'Delhi', rating: 4.5, reviews: 1540, type: 'Private', beds: 380, departments: 40, doctorsAvailable: 18, specialties: ['Pediatrics', 'Gynecology', 'Orthopedics'], emoji: '🏥' },
    { name: 'Safdarjung Hospital', location: 'Safdarjung, New Delhi', city: 'Delhi', rating: 4.3, reviews: 890, type: 'Government', beds: 1500, departments: 60, doctorsAvailable: 35, specialties: ['General Medicine', 'Surgery', 'Emergency'], emoji: '🏛️' },
    
    // Kolkata - 6 hospitals
    { name: 'Apollo Gleneagles Hospital', location: 'Alipore, Kolkata', city: 'Kolkata', rating: 4.7, reviews: 2100, type: 'Private', beds: 480, departments: 48, doctorsAvailable: 26, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '🏥' },
    { name: 'SSKM Hospital', location: 'Raja Rammohan Roy Sarani, Kolkata', city: 'Kolkata', rating: 4.6, reviews: 1800, type: 'Government', beds: 900, departments: 65, doctorsAvailable: 38, specialties: ['General Medicine', 'Surgery', 'Pediatrics'], emoji: '🏛️' },
    { name: 'Medica Superspeciality Hospital', location: 'Mukundapur, Kolkata', city: 'Kolkata', rating: 4.8, reviews: 2400, type: 'Private', beds: 520, departments: 52, doctorsAvailable: 32, specialties: ['Cardiology', 'Orthopedics', 'Neurology'], emoji: '⚕️' },
    { name: 'Ruby General Hospital', location: 'AJC Bose Road, Kolkata', city: 'Kolkata', rating: 4.5, reviews: 1600, type: 'Private', beds: 350, departments: 42, doctorsAvailable: 20, specialties: ['Dermatology', 'Pediatrics', 'Gynecology'], emoji: '🏥' },
    { name: 'Institute of Post Graduate Medical Education & Research', location: 'Kolkata', city: 'Kolkata', rating: 4.7, reviews: 1950, type: 'Government', beds: 750, departments: 55, doctorsAvailable: 40, specialties: ['All Specialties', 'Research', 'Teaching'], emoji: '🏛️' },
    { name: 'Peerless Hospital', location: 'Kolkata', city: 'Kolkata', rating: 4.6, reviews: 1700, type: 'Private', beds: 420, departments: 45, doctorsAvailable: 24, specialties: ['Cardiology', 'Neurology', 'Orthopedics'], emoji: '🏥' },
    
    // Ambala - 6 hospitals
    { name: 'Apollo Ambala Hospital', location: 'Sector 36, Ambala', city: 'Ambala', rating: 4.7, reviews: 1200, type: 'Private', beds: 300, departments: 35, doctorsAvailable: 18, specialties: ['Cardiology', 'Orthopedics', 'Neurology'], emoji: '🏥' },
    { name: 'Civil Hospital Ambala', location: 'Ambala City, Ambala', city: 'Ambala', rating: 4.4, reviews: 890, type: 'Government', beds: 600, departments: 45, doctorsAvailable: 25, specialties: ['General Medicine', 'Surgery', 'Pediatrics'], emoji: '🏛️' },
    { name: 'Fortis Hospital Ambala', location: 'Ambala', city: 'Ambala', rating: 4.6, reviews: 1100, type: 'Private', beds: 280, departments: 40, doctorsAvailable: 16, specialties: ['Cardiology', 'Dermatology', 'Orthopedics'], emoji: '⚕️' },
    { name: 'Shivalik Hospital', location: 'Ambala', city: 'Ambala', rating: 4.5, reviews: 950, type: 'Private', beds: 250, departments: 32, doctorsAvailable: 14, specialties: ['Pediatrics', 'Gynecology', 'General Medicine'], emoji: '🏥' },
    { name: 'Max Hospital Ambala', location: 'Ambala', city: 'Ambala', rating: 4.6, reviews: 1050, type: 'Private', beds: 320, departments: 38, doctorsAvailable: 19, specialties: ['Orthopedics', 'Neurology', 'Cardiology'], emoji: '🏥' },
    { name: 'Eternal Hospital', location: 'Ambala Cantonment, Ambala', city: 'Ambala', rating: 4.5, reviews: 880, type: 'Private', beds: 220, departments: 30, doctorsAvailable: 13, specialties: ['General Medicine', 'Surgery', 'ENT'], emoji: '🏥' },
    
    // Bengaluru - 6 hospitals
    { name: 'Apollo Hospitals Bangalore', location: 'Bannerghatta Road, Bengaluru', city: 'Bengaluru', rating: 4.8, reviews: 3200, type: 'Private', beds: 600, departments: 55, doctorsAvailable: 35, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '🏥' },
    { name: 'Manipal Hospital Bangalore', location: 'Old Airport Road, Bengaluru', city: 'Bengaluru', rating: 4.7, reviews: 2800, type: 'Private', beds: 550, departments: 50, doctorsAvailable: 32, specialties: ['Orthopedics', 'Cardiology', 'Pediatrics'], emoji: '⚕️' },
    { name: 'St. John\'s Medical College Hospital', location: 'Bangalore', city: 'Bengaluru', rating: 4.6, reviews: 1900, type: 'Private', beds: 420, departments: 45, doctorsAvailable: 25, specialties: ['Cardiology', 'Neurology', 'Pediatrics'], emoji: '🏥' },
    { name: 'Multispeciality Hospital', location: 'Whitefield, Bengaluru', city: 'Bengaluru', rating: 4.5, reviews: 1600, type: 'Private', beds: 380, departments: 40, doctorsAvailable: 22, specialties: ['General Medicine', 'Surgery', 'Orthopedics'], emoji: '🏥' },
    { name: 'BGS Gleneagles Global Hospital', location: 'Domlur, Bengaluru', city: 'Bengaluru', rating: 4.7, reviews: 2400, type: 'Private', beds: 480, departments: 48, doctorsAvailable: 28, specialties: ['Cardiology', 'Neurology', 'Oncology'], emoji: '⚕️' },
    { name: 'Indraprastha Apollo Hospital Bangalore', location: 'Bengaluru', city: 'Bengaluru', rating: 4.6, reviews: 2100, type: 'Private', beds: 500, departments: 52, doctorsAvailable: 30, specialties: ['All Specialties', 'Trauma', 'Emergency'], emoji: '🏥' },
    
    // Chandigarh - 6 hospitals
    { name: 'Fortis Hospital Chandigarh', location: 'Industrial Area, Chandigarh', city: 'Chandigarh', rating: 4.7, reviews: 1400, type: 'Private', beds: 350, departments: 42, doctorsAvailable: 22, specialties: ['Cardiology', 'Orthopedics', 'Neurology'], emoji: '🏥' },
    { name: 'PGIMER Chandigarh', location: 'Sector 12, Chandigarh', city: 'Chandigarh', rating: 4.8, reviews: 2200, type: 'Government', beds: 800, departments: 60, doctorsAvailable: 40, specialties: ['All Specialties', 'Research', 'Teaching'], emoji: '🏛️' },
    { name: 'Max Hospital Chandigarh', location: 'Chandigarh', city: 'Chandigarh', rating: 4.6, reviews: 1300, type: 'Private', beds: 320, departments: 40, doctorsAvailable: 20, specialties: ['Pediat­rics', 'Gynecology', 'General Medicine'], emoji: '⚕️' },
    { name: 'Apollo Chandigarh Hospital', location: 'Sector 25, Chandigarh', city: 'Chandigarh', rating: 4.6, reviews: 1250, type: 'Private', beds: 340, departments: 41, doctorsAvailable: 21, specialties: ['Cardiology', 'Dermatology', 'Orthopedics'], emoji: '🏥' },
    { name: 'Stellar Hospital', location: 'Chandigarh', city: 'Chandigarh', rating: 4.5, reviews: 980, type: 'Private', beds: 280, departments: 35, doctorsAvailable: 17, specialties: ['General Medicine', 'Surgery', 'Dermatology'], emoji: '🏥' },
    { name: 'HCG Hospital Chandigarh', location: 'Chandigarh', city: 'Chandigarh', rating: 4.6, reviews: 1100, type: 'Private', beds: 300, departments: 38, doctorsAvailable: 19, specialties: ['Oncology', 'Cardiology', 'Neurology'], emoji: '🏥' },
    
    // Chennai - 6 hospitals
    { name: 'Apollo Hospital Chennai', location: 'Greams Road, Chennai', city: 'Chennai', rating: 4.8, reviews: 3400, type: 'Private', beds: 650, departments: 58, doctorsAvailable: 38, specialties: ['Cardiology', 'Oncology', 'Orthopedics'], emoji: '🏥' },
    { name: 'Fortis Malar Hospital', location: 'Adyar, Chennai', city: 'Chennai', rating: 4.7, reviews: 2600, type: 'Private', beds: 520, departments: 50, doctorsAvailable: 30, specialties: ['Cardiology', 'Neurology', 'Pediatrics'], emoji: '⚕️' },
    { name: 'Government General Hospital', location: 'Parry\'s, Chennai', city: 'Chennai', rating: 4.5, reviews: 1800, type: 'Government', beds: 1000, departments: 65, doctorsAvailable: 42, specialties: ['All Specialties', 'Emergency', 'Trauma'], emoji: '🏛️' },
    { name: 'Gleneagles Global Hospital Chennai', location: 'Perumbakkam, Chennai', city: 'Chennai', rating: 4.7, reviews: 2300, type: 'Private', beds: 480, departments: 48, doctorsAvailable: 27, specialties: ['Cardiology', 'Orthopedics', 'Neurology'], emoji: '🏥' },
    { name: 'Kauvery Hospital', location: 'Neelankarai, Chennai', city: 'Chennai', rating: 4.6, reviews: 2000, type: 'Private', beds: 440, departments: 45, doctorsAvailable: 25, specialties: ['Cardiology', 'Neurology', 'Pediatrics'], emoji: '🏥' },
    { name: 'Sri Ramakrishna Hospital', location: 'Porur, Chennai', city: 'Chennai', rating: 4.5, reviews: 1700, type: 'Private', beds: 400, departments: 42, doctorsAvailable: 23, specialties: ['General Medicine', 'Surgery', 'Orthopedics'], emoji: '🏥' },
    
    // Mumbai - 6 hospitals
    { name: 'Lilavati Hospital', location: 'Bandra, Mumbai', city: 'Mumbai', rating: 4.8, reviews: 3600, type: 'Private', beds: 700, departments: 60, doctorsAvailable: 40, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '🏥' },
    { name: 'Fortis Hospital Mumbai', location: 'Mulund, Mumbai', city: 'Mumbai', rating: 4.7, reviews: 2900, type: 'Private', beds: 580, departments: 52, doctorsAvailable: 34, specialties: ['Cardiology', 'Orthopedics', 'Pediatrics'], emoji: '⚕️' },
    { name: 'Breach Candy Hospital', location: 'Cumballa Hill, Mumbai', city: 'Mumbai', rating: 4.7, reviews: 2700, type: 'Private', beds: 520, departments: 50, doctorsAvailable: 31, specialties: ['Cardiology', 'Neurology', 'Orthopedics'], emoji: '🏥' },
    { name: 'Sir H.N. Reliance Foundation Hospital', location: 'Girgaum, Mumbai', city: 'Mumbai', rating: 4.8, reviews: 3200, type: 'Private', beds: 600, departments: 55, doctorsAvailable: 36, specialties: ['All Specialties', 'Trauma', 'Emergency'], emoji: '🏥' },
    { name: 'Kokilaben Dhirubhai Ambani Hospital', location: 'Mumbai', city: 'Mumbai', rating: 4.8, reviews: 3100, type: 'Private', beds: 620, departments: 54, doctorsAvailable: 37, specialties: ['Cardiology', 'Oncology', 'Neurology'], emoji: '⚕️' },
    { name: 'Bombay Hospital Institute of Medical Sciences', location: 'Fort, Mumbai', city: 'Mumbai', rating: 4.6, reviews: 2200, type: 'Private', beds: 450, departments: 46, doctorsAvailable: 26, specialties: ['Cardiology', 'Pediatrics', 'General Medicine'], emoji: '🏥' },
    
    // Pune - 6 hospitals
    { name: 'Lilavati Hospital Pune', location: 'Kalyani Nagar, Pune', city: 'Pune', rating: 4.7, reviews: 2100, type: 'Private', beds: 480, departments: 48, doctorsAvailable: 28, specialties: ['Cardiology', 'Orthopedics', 'Neurology'], emoji: '🏥' },
    { name: 'Fortis Hospital Pune', location: 'Vishrambag, Pune', city: 'Pune', rating: 4.6, reviews: 1900, type: 'Private', beds: 420, departments: 44, doctorsAvailable: 24, specialties: ['Cardiology', 'Pediatrics', 'Neurology'], emoji: '⚕️' },
    { name: 'Ruby Hall Clinic', location: 'Pune', city: 'Pune', rating: 4.7, reviews: 2000, type: 'Private', beds: 500, departments: 50, doctorsAvailable: 29, specialties: ['All Specialties', 'Orthopedics', 'Cardiology'], emoji: '🏥' },
    { name: 'Noble Hospital', location: 'Pune', city: 'Pune', rating: 4.5, reviews: 1600, type: 'Private', beds: 380, departments: 40, doctorsAvailable: 21, specialties: ['Cardiology', 'General Medicine', 'Pediatrics'], emoji: '🏥' },
    { name: 'Sahyadri Hospital', location: 'Pune', city: 'Pune', rating: 4.6, reviews: 1750, type: 'Private', beds: 440, departments: 42, doctorsAvailable: 25, specialties: ['Neurology', 'Orthopedics', 'General Medicine'], emoji: '🏥' },
    { name: 'Continental Hospital', location: 'Pune', city: 'Pune', rating: 4.5, reviews: 1550, type: 'Private', beds: 400, departments: 41, doctorsAvailable: 23, specialties: ['Cardiology', 'Pediatrics', 'Gynecology'], emoji: '🏥' },
  ];
}

/* ── Page Initialization ── */
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html') Dashboard.init();
  if (page === 'reminders.html') Reminders.init();
  // Note: appointments.html calls Booking.init() explicitly
  if (page === 'hospitals.html') Hospitals.init();
});

/* ── Expose ── */
window.Dashboard = Dashboard;
window.Reminders = Reminders;
window.Booking   = Booking;
window.Hospitals = Hospitals;
