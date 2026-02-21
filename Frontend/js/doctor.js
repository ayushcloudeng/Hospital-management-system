// ==================== AUTH GUARD ====================
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
  throw new Error('Not authenticated');
}

// Get current user from localStorage (no network call needed)
let currentUser = API.getCurrentUser();

if (!currentUser || currentUser.role !== 'doctor') {
  alert('Access denied. Doctor only.');
  API.clearAuth();
  window.location.href = 'index.html';
  throw new Error('Not a doctor');
}

// ==================== INIT ====================

async function initDoctor() {
  // Fetch fresh profile from backend to get specialization/contact
  try {
    const freshUser = await API.auth.getMe();
    if (freshUser && freshUser._id) {
      currentUser = { ...currentUser, ...freshUser };
      const token = localStorage.getItem('token');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, token }));
    }
  } catch (e) {
    console.warn('Could not refresh doctor profile, using cached data:', e.message);
  }

  // Display doctor info
  const nameEl = document.getElementById('doctorName');
  const profileNameEl = document.getElementById('profileName');
  const profileSpecEl = document.getElementById('profileSpecialization');
  const profileContactEl = document.getElementById('profileContact');

  if (nameEl) nameEl.textContent = currentUser.name || 'Doctor';
  if (profileNameEl) profileNameEl.textContent = currentUser.name || 'Doctor';
  if (profileSpecEl) profileSpecEl.textContent = currentUser.specialization || 'General Medicine';
  if (profileContactEl) profileContactEl.textContent = '✉️ ' + currentUser.email;

  // Load data from backend
  loadAppointments();
  loadPatientRecords();
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
    const sectionEl = document.getElementById(targetSection);
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

// ==================== APPOINTMENTS ====================

async function loadAppointments() {
  try {
    const appointments = await API.appointments.getAll();

    // Filter appointments for current doctor
    const myAppointments = appointments.filter(a => a.doctor && a.doctor._id === currentUser._id);

    // Today's appointments
    const today = new Date().toDateString();
    const todayAppts = myAppointments.filter(a =>
      new Date(a.date).toDateString() === today
    );

    displayTodayAppointments(todayAppts);
    displayAllAppointments(myAppointments);

    // Update stats
    const todayCountEl = document.getElementById('todayAppointmentsCount');
    const totalCountEl = document.getElementById('totalAppointmentsCount');
    if (todayCountEl) todayCountEl.textContent = todayAppts.length;
    if (totalCountEl) totalCountEl.textContent = myAppointments.length;
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

function displayTodayAppointments(appointments) {
  const container = document.getElementById('todayAppointmentsTable');
  const tbody = container ? container.querySelector('tbody') : null;
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">No appointments today</td></tr>';
    return;
  }

  appointments.forEach(appointment => {
    const row = `
      <tr>
        <td>${appointment.patientName || 'N/A'}</td>
        <td>${appointment.time || 'N/A'}</td>
        <td>${appointment.reason || 'N/A'}</td>
        <td><span class="status-badge status-${(appointment.status || '').toLowerCase()}">${appointment.status || 'N/A'}</span></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function displayAllAppointments(appointments) {
  const container = document.getElementById('allAppointmentsTable');
  const tbody = container ? container.querySelector('tbody') : null;
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">No appointments found</td></tr>';
    return;
  }

  appointments.forEach(appointment => {
    const row = `
      <tr>
        <td>${appointment.patientName || 'N/A'}</td>
        <td>${new Date(appointment.date).toLocaleDateString()}</td>
        <td>${appointment.time || 'N/A'}</td>
        <td>${appointment.reason || 'N/A'}</td>
        <td><span class="status-badge status-${(appointment.status || '').toLowerCase()}">${appointment.status || 'N/A'}</span></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// ==================== PATIENT RECORDS ====================

async function loadPatientRecords() {
  try {
    const records = await API.medicalRecords.getAll();
    displayPatientRecords(records);

    // Update stats
    const uniquePatients = new Set(records.filter(r => r.patient).map(r => r.patient._id)).size;
    const patientsSeenEl = document.getElementById('patientsSeenCount');
    if (patientsSeenEl) patientsSeenEl.textContent = uniquePatients;
  } catch (error) {
    console.error('Error loading patient records:', error);
  }
}

function displayPatientRecords(records) {
  const container = document.getElementById('medicalRecordsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (records.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No medical records found</p>';
    return;
  }

  records.forEach(record => {
    const card = `
      <div class="record-card" style="background:#fff;border-radius:10px;padding:20px;margin-bottom:15px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <h4 style="margin:0;">${record.patient ? record.patient.name : 'Unknown Patient'}</h4>
          <span style="color:#888;font-size:0.9em;">${new Date(record.visitDate || record.createdAt).toLocaleDateString()}</span>
        </div>
        <p><strong>Diagnosis:</strong> ${record.diagnosis || 'N/A'}</p>
        <p><strong>Prescription:</strong> ${record.prescription || 'N/A'}</p>
        ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
      </div>
    `;
    container.innerHTML += card;
  });
}

// ==================== ADD MEDICAL RECORD ====================

async function loadPatientsForRecord() {
  try {
    const patients = await API.users.getAll('patient');
    const select = document.getElementById('recordPatient');
    if (!select) return;
    select.innerHTML = '<option value="">Select Patient</option>';
    patients.forEach(patient => {
      select.innerHTML += `<option value="${patient._id}">${patient.name} - ${patient.email}</option>`;
    });
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

document.getElementById('addRecordBtn')?.addEventListener('click', () => {
  const modal = document.getElementById('addRecordModal');
  if (modal) modal.style.display = 'flex';
  loadPatientsForRecord();
});

document.getElementById('recordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const recordData = {
    patient: document.getElementById('recordPatient').value,
    diagnosis: document.getElementById('recordDiagnosis').value,
    prescription: document.getElementById('recordPrescription').value,
    notes: document.getElementById('recordNotes').value,
  };

  try {
    await API.medicalRecords.create(recordData);
    alert('Medical record added successfully!');
    document.getElementById('addRecordModal').style.display = 'none';
    e.target.reset();
    await loadPatientRecords();
  } catch (error) {
    alert('Failed to add medical record: ' + error.message);
  }
});

// Close Modals
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.target.closest('.modal').style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// ==================== START ====================
initDoctor();
