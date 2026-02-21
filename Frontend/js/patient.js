// ==================== AUTH GUARD ====================
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
  throw new Error('Not authenticated');
}

// Get current user from localStorage (no network call needed)
let currentUser = API.getCurrentUser();

if (!currentUser || currentUser.role !== 'patient') {
  alert('Access denied. Patient only.');
  API.clearAuth();
  window.location.href = 'index.html';
  throw new Error('Not a patient');
}

// ==================== INIT ====================

async function initPatient() {
  // Try to get fresh user data from backend (ensures age/gender/contact are populated)
  try {
    const freshUser = await API.auth.getMe();
    if (freshUser && freshUser._id) {
      // Merge fresh data with token from localStorage
      currentUser = { ...currentUser, ...freshUser };
      // Update localStorage with full profile
      const token = localStorage.getItem('token');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, token }));
    }
  } catch (e) {
    console.warn('Could not refresh user from backend, using cached data:', e.message);
  }

  // Display patient profile info
  const nameEl = document.getElementById('patientName');
  const profileNameEl = document.getElementById('profileName');
  const profileDetailsEl = document.getElementById('profileDetails');
  const profileContactEl = document.getElementById('profileContact');

  if (nameEl) nameEl.textContent = currentUser.name || 'User';
  if (profileNameEl) profileNameEl.textContent = currentUser.name || 'User';
  if (profileDetailsEl) {
    const agePart = currentUser.age ? `Age: ${currentUser.age}` : 'Age: N/A';
    const genderPart = currentUser.gender ? ` | Gender: ${currentUser.gender}` : '';
    profileDetailsEl.textContent = agePart + genderPart;
  }
  if (profileContactEl) {
    const contactPart = currentUser.contact ? `📞 ${currentUser.contact} | ` : '';
    profileContactEl.textContent = `${contactPart}✉️ ${currentUser.email}`;
  }

  // Load data from backend
  loadDoctors();
  loadAppointments();
  loadMedicalRecords();
}

// ==================== NAVIGATION ====================

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = link.getAttribute('data-section');

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(s => s.classList.remove('active'));
    // patient.html uses IDs like 'dashboard-section', 'book-section', etc.
    const sectionEl = document.getElementById(targetSection + '-section') || document.getElementById(targetSection);
    if (sectionEl) sectionEl.classList.add('active');
  });
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    API.clearAuth();
    window.location.href = 'index.html';
  }
});

// ==================== BOOK APPOINTMENT ====================

async function loadDoctors() {
  try {
    const doctors = await API.users.getAll('doctor');
    // patient.html uses 'bookDoctor' for the book appointment select
    const select = document.getElementById('bookDoctor') || document.getElementById('appointmentDoctor');
    if (!select) return;
    select.innerHTML = '<option value="">Choose a doctor...</option>';
    doctors.forEach(doctor => {
      select.innerHTML += `<option value="${doctor._id}">${doctor.name} - ${doctor.specialization || 'General'}</option>`;
    });
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const appointmentData = {
    doctor: document.getElementById('bookDoctor').value,
    date: document.getElementById('bookDate').value,
    time: document.getElementById('bookTime').value,
    reason: document.getElementById('bookReason').value,
  };

  try {
    await API.appointments.create(appointmentData);
    alert('Appointment booked successfully!');
    e.target.reset();
    await loadAppointments();
  } catch (error) {
    alert('Failed to book appointment: ' + error.message);
  }
});

// ==================== MY APPOINTMENTS ====================

async function loadAppointments() {
  try {
    const appointments = await API.appointments.getAll();
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.date) >= now);

    displayUpcomingAppointments(upcoming);
    displayAllAppointments(appointments);

    // patient.html uses 'upcomingCount' and 'totalAppointments'
    const upcomingEl = document.getElementById('upcomingCount') || document.getElementById('upcomingAppointmentsCount');
    const totalEl = document.getElementById('totalAppointments') || document.getElementById('totalAppointmentsCount');
    if (upcomingEl) upcomingEl.textContent = upcoming.length;
    if (totalEl) totalEl.textContent = appointments.length;
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

function displayUpcomingAppointments(appointments) {
  // patient.html uses 'upcomingAppointmentsTable' tbody
  const container = document.getElementById('upcomingAppointmentsTable') || document.getElementById('upcomingAppointmentsContainer');
  if (!container) return;

  // If it's a tbody, insert rows; otherwise insert cards
  if (container.tagName === 'TBODY') {
    container.innerHTML = '';
    if (appointments.length === 0) {
      container.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">No upcoming appointments</td></tr>';
      return;
    }
    appointments.forEach(a => {
      container.innerHTML += `
        <tr>
          <td>${new Date(a.date).toLocaleDateString()}</td>
          <td>${a.time || 'N/A'}</td>
          <td>${a.doctorName || 'Unassigned'}</td>
          <td><span class="status-badge status-${(a.status || '').toLowerCase()}">${a.status || 'N/A'}</span></td>
        </tr>`;
    });
  } else {
    container.innerHTML = '';
    if (appointments.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No upcoming appointments</p>';
      return;
    }
    appointments.forEach(a => {
      container.innerHTML += `
        <div style="background:#fff;border-radius:10px;padding:15px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <strong>${a.doctorName || 'Doctor'}</strong>
          <span style="float:right;" class="status-badge status-${(a.status || '').toLowerCase()}">${a.status}</span>
          <p style="margin:5px 0 0;">📅 ${new Date(a.date).toLocaleDateString()} at ${a.time || 'N/A'}</p>
          ${a.reason ? `<p style="color:#666;">Reason: ${a.reason}</p>` : ''}
        </div>`;
    });
  }
}

function displayAllAppointments(appointments) {
  // patient.html uses 'appointmentsTable' tbody
  const el = document.getElementById('appointmentsTable') || document.getElementById('allAppointmentsTable');
  const tbody = el ? (el.tagName === 'TBODY' ? el : el.querySelector('tbody')) : null;
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No appointments found</td></tr>';
    return;
  }

  appointments.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${a._id ? a._id.toString().slice(-6) : 'N/A'}</td>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${a.time || 'N/A'}</td>
        <td>${a.doctorName || 'Unassigned'}</td>
        <td><span class="status-badge status-${(a.status || '').toLowerCase()}">${a.status || 'N/A'}</span></td>
      </tr>`;
  });
}

// ==================== MEDICAL RECORDS ====================

async function loadMedicalRecords() {
  try {
    const records = await API.medicalRecords.getAll();
    displayMedicalRecords(records);

    const countEl = document.getElementById('medicalRecordsCount');
    if (countEl) countEl.textContent = records.length;
  } catch (error) {
    console.error('Error loading medical records:', error);
  }
}

function displayMedicalRecords(records) {
  // patient.html uses 'medicalRecordsList'
  const container = document.getElementById('medicalRecordsList') || document.getElementById('medicalRecordsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (records.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No medical records found</p>';
    return;
  }

  records.forEach(record => {
    container.innerHTML += `
      <div style="background:#fff;border-radius:10px;padding:20px;margin-bottom:15px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <h4 style="margin:0;">Dr. ${record.doctorName || 'Unknown'}</h4>
          <span style="color:#888;font-size:0.9em;">${new Date(record.visitDate || record.createdAt).toLocaleDateString()}</span>
        </div>
        <p><strong>Diagnosis:</strong> ${record.diagnosis || 'N/A'}</p>
        <p><strong>Prescription:</strong> ${record.prescription || 'N/A'}</p>
        ${record.notes ? `<p><strong>Doctor's Notes:</strong> ${record.notes}</p>` : ''}
      </div>`;
  });
}

// ==================== START ====================
initPatient();
