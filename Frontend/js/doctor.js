// Check authentication
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Get current user
let currentUser = null;

async function initDoctor() {
  try {
    currentUser = await API.auth.getMe();

    // Verify doctor role
    if (currentUser.role !== 'doctor') {
      alert('Access denied. Doctor only.');
      API.auth.logout();
      return;
    }

    // Display doctor info
    document.getElementById('doctorName').textContent = currentUser.name;
    document.getElementById('doctorSpecialization').textContent = currentUser.specialization || 'General';
    document.getElementById('doctorEmail').textContent = currentUser.email;

    // Load data
    await loadAppointments();
    await loadPatientRecords();
  } catch (error) {
    console.error('Error initializing doctor dashboard:', error);
    alert('Failed to load dashboard. Please try again.');
    API.auth.logout();
  }
}

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = link.getAttribute('data-section');

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(targetSection).classList.add('active');
  });
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    API.auth.logout();
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
    const todayAppointments = myAppointments.filter(a =>
      new Date(a.date).toDateString() === today
    );

    displayTodayAppointments(todayAppointments);
    displayAllAppointments(myAppointments);

    // Update stats
    document.getElementById('todayAppointmentsCount').textContent = todayAppointments.length;
    document.getElementById('totalAppointmentsCount').textContent = myAppointments.length;
  } catch (error) {
    console.error('Error loading appointments:', error);
    alert('Failed to load appointments');
  }
}

function displayTodayAppointments(appointments) {
  const tbody = document.querySelector('#todayAppointmentsTable tbody');
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No appointments today</td></tr>';
    return;
  }

  appointments.forEach(appointment => {
    const row = `
      <tr>
        <td>${appointment.patientName}</td>
        <td>${appointment.time}</td>
        <td>${appointment.reason || 'N/A'}</td>
        <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function displayAllAppointments(appointments) {
  const tbody = document.querySelector('#allAppointmentsTable tbody');
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No appointments found</td></tr>';
    return;
  }

  appointments.forEach(appointment => {
    const row = `
      <tr>
        <td>${appointment.patientName}</td>
        <td>${new Date(appointment.date).toLocaleDateString()}</td>
        <td>${appointment.time}</td>
        <td>${appointment.reason || 'N/A'}</td>
        <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
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
    const uniquePatients = new Set(records.map(r => r.patient._id)).size;
    document.getElementById('patientsSeenCount').textContent = uniquePatients;
  } catch (error) {
    console.error('Error loading patient records:', error);
  }
}

function displayPatientRecords(records) {
  const container = document.getElementById('medicalRecordsContainer');
  container.innerHTML = '';

  if (records.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#666;">No medical records found</p>';
    return;
  }

  records.forEach(record => {
    const card = `
      <div class="record-card">
        <div class="record-header">
          <h4>${record.patient.name}</h4>
          <span class="record-date">${new Date(record.visitDate).toLocaleDateString()}</span>
        </div>
        <div class="record-body">
          <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
          <p><strong>Prescription:</strong> ${record.prescription}</p>
          ${record.notes ? `<p><strong>Notes:</strong> ${record.notes}</p>` : ''}
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// ==================== ADD MEDICAL RECORD ====================

// Get all patients for the dropdown
async function loadPatientsForRecord() {
  try {
    const patients = await API.users.getAll('patient');
    const select = document.getElementById('recordPatient');
    select.innerHTML = '<option value="">Select Patient</option>';

    patients.forEach(patient => {
      select.innerHTML += `<option value="${patient._id}">${patient.name} - ${patient.email}</option>`;
    });
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

// Open add record modal
document.getElementById('addRecordBtn')?.addEventListener('click', () => {
  document.getElementById('addRecordModal').style.display = 'flex';
  loadPatientsForRecord();
});

// Add Medical Record
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

// Close modal on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// ==================== INITIALIZATION ====================

initDoctor();
