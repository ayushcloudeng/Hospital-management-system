// Check authentication
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Get current user
let currentUser = null;

async function initPatient() {
  try {
    currentUser = await API.auth.getMe();

    // Verify patient role
    if (currentUser.role !== 'patient') {
      alert('Access denied. Patient only.');
      API.auth.logout();
      return;
    }

    // Display patient info
    document.getElementById('patientName').textContent = currentUser.name;
    document.getElementById('patientEmail').textContent = currentUser.email;
    document.getElementById('patientAge').textContent = currentUser.age || 'N/A';
    document.getElementById('patientGender').textContent = currentUser.gender || 'N/A';

    // Load data
    await loadDoctors();
    await loadAppointments();
    await loadMedicalRecords();
  } catch (error) {
    console.error('Error initializing patient dashboard:', error);
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

// ==================== BOOK APPOINTMENT ====================

async function loadDoctors() {
  try {
    const doctors = await API.users.getAll('doctor');
    const select = document.getElementById('appointmentDoctor');
    select.innerHTML = '<option value="">Select Doctor</option>';

    doctors.forEach(doctor => {
      select.innerHTML += `<option value="${doctor._id}">${doctor.name} - ${doctor.specialization || 'General'}</option>`;
    });
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

document.getElementById('appointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const appointmentData = {
    doctor: document.getElementById('appointmentDoctor').value,
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value,
    reason: document.getElementById('appointmentReason').value,
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

    // Upcoming appointments
    const now = new Date();
    const upcoming = appointments.filter(a => new Date(a.date) >= now);

    displayUpcomingAppointments(upcoming);
    displayAllAppointments(appointments);

    // Update stats
    document.getElementById('upcomingAppointmentsCount').textContent = upcoming.length;
    document.getElementById('totalAppointmentsCount').textContent = appointments.length;
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

function displayUpcomingAppointments(appointments) {
  const container = document.getElementById('upcomingAppointmentsContainer');
  container.innerHTML = '';

  if (appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#666;">No upcoming appointments</p>';
    return;
  }

  appointments.forEach(appointment => {
    const card = `
      <div class="appointment-card">
        <div class="appointment-header">
          <h4>${appointment.doctorName || 'Doctor not assigned'}</h4>
          <span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span>
        </div>
        <div class="appointment-body">
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Reason:</strong> ${appointment.reason || 'N/A'}</p>
        </div>
      </div>
    `;
    container.innerHTML += card;
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
        <td>${appointment.doctorName || 'Unassigned'}</td>
        <td>${new Date(appointment.date).toLocaleDateString()}</td>
        <td>${appointment.time}</td>
        <td>${appointment.reason || 'N/A'}</td>
        <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// ==================== MEDICAL RECORDS ====================

async function loadMedicalRecords() {
  try {
    const records = await API.medicalRecords.getAll();
    displayMedicalRecords(records);

    // Update stats
    document.getElementById('medicalRecordsCount').textContent = records.length;
  } catch (error) {
    console.error('Error loading medical records:', error);
  }
}

function displayMedicalRecords(records) {
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
          <h4>Dr. ${record.doctorName}</h4>
          <span class="record-date">${new Date(record.visitDate).toLocaleDateString()}</span>
        </div>
        <div class="record-body">
          <p><strong>Diagnosis:</strong> ${record.diagnosis}</p>
          <p><strong>Prescription:</strong> ${record.prescription}</p>
          ${record.notes ? `<p><strong>Doctor's Notes:</strong> ${record.notes}</p>` : ''}
        </div>
        <div class="record-badge">Read Only</div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// ==================== INITIALIZATION ====================

initPatient();
