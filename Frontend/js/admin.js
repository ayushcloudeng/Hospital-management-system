// Check authentication
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
}

// Get current user
let currentUser = API.getCurrentUser();

// Verify admin role
if (currentUser.role !== 'admin') {
  alert('Access denied. Admin only.');
  API.auth.logout();
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

    // Load data for the section
    if (targetSection === 'patients') loadPatients();
    if (targetSection === 'doctors') loadDoctors();
    if (targetSection === 'appointments') loadAppointments();
  });
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    API.auth.logout();
  }
});

// ==================== PATIENTS ====================

async function loadPatients() {
  try {
    const patients = await API.users.getAll('patient');
    displayPatients(patients);
    updateStats();
  } catch (error) {
    console.error('Error loading patients:', error);
    alert('Failed to load patients: ' + error.message);
  }
}

function displayPatients(patients) {
  const tbody = document.querySelector('#patientsTable tbody');
  tbody.innerHTML = '';

  patients.forEach(patient => {
    const row = `
      <tr>
        <td>${patient.name}</td>
        <td>${patient.email}</td>
        <td>${patient.age || 'N/A'}</td>
        <td>${patient.gender || 'N/A'}</td>
        <td>${patient.contact || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editPatient('${patient._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deletePatient('${patient._id}')">Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// Add Patient
document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const patientData = {
    name: document.getElementById('patientName').value,
    email: document.getElementById('patientEmail').value,
    password: document.getElementById('patientPassword').value || 'password123',
    role: 'patient',
    age: parseInt(document.getElementById('patientAge').value),
    gender: document.getElementById('patientGender').value,
    contact: document.getElementById('patientContact').value,
  };

  try {
    await API.auth.register(patientData);
    alert('Patient added successfully!');
    document.getElementById('addPatientModal').style.display = 'none';
    e.target.reset();
    loadPatients();
  } catch (error) {
    alert('Failed to add patient: ' + error.message);
  }
});

// Delete Patient
async function deletePatient(id) {
  if (!confirm('Are you sure you want to delete this patient?')) return;

  try {
    await API.users.delete(id);
    alert('Patient deleted successfully!');
    loadPatients();
  } catch (error) {
    alert('Failed to delete patient: ' + error.message);
  }
}

// ==================== DOCTORS ====================

async function loadDoctors() {
  try {
    const doctors = await API.users.getAll('doctor');
    displayDoctors(doctors);
    updateStats();
  } catch (error) {
    console.error('Error loading doctors:', error);
    alert('Failed to load doctors: ' + error.message);
  }
}

function displayDoctors(doctors) {
  const tbody = document.querySelector('#doctorsTable tbody');
  tbody.innerHTML = '';

  doctors.forEach(doctor => {
    const row = `
      <tr>
        <td>${doctor.name}</td>
        <td>${doctor.email}</td>
        <td>${doctor.specialization || 'N/A'}</td>
        <td>${doctor.contact || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editDoctor('${doctor._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDoctor('${doctor._id}')">Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// Add Doctor
document.getElementById('doctorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const doctorData = {
    name: document.getElementById('doctorName').value,
    email: document.getElementById('doctorEmail').value,
    password: document.getElementById('doctorPassword').value || 'password123',
    role: 'doctor',
    specialization: document.getElementById('doctorSpecialization').value,
    contact: document.getElementById('doctorContact').value,
  };

  try {
    await API.auth.register(doctorData);
    alert('Doctor added successfully!');
    document.getElementById('addDoctorModal').style.display = 'none';
    e.target.reset();
    loadDoctors();
  } catch (error) {
    alert('Failed to add doctor: ' + error.message);
  }
});

// Delete Doctor
async function deleteDoctor(id) {
  if (!confirm('Are you sure you want to delete this doctor?')) return;

  try {
    await API.users.delete(id);
    alert('Doctor deleted successfully!');
    loadDoctors();
  } catch (error) {
    alert('Failed to delete doctor: ' + error.message);
  }
}

// ==================== APPOINTMENTS ====================

async function loadAppointments() {
  try {
    const appointments = await API.appointments.getAll();
    displayAppointments(appointments);
    updateStats();
  } catch (error) {
    console.error('Error loading appointments:', error);
    alert('Failed to load appointments: ' + error.message);
  }
}

function displayAppointments(appointments) {
  const tbody = document.querySelector('#appointmentsTable tbody');
  tbody.innerHTML = '';

  appointments.forEach(appointment => {
    const row = `
      <tr>
        <td>${appointment.patientName || 'N/A'}</td>
        <td>${appointment.doctorName || 'Unassigned'}</td>
        <td>${new Date(appointment.date).toLocaleDateString()}</td>
        <td>${appointment.time}</td>
        <td><span class="status-badge status-${appointment.status.toLowerCase()}">${appointment.status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editAppointment('${appointment._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAppointment('${appointment._id}')">Delete</button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

// Delete Appointment
async function deleteAppointment(id) {
  if (!confirm('Are you sure you want to delete this appointment?')) return;

  try {
    await API.appointments.delete(id);
    alert('Appointment deleted successfully!');
    loadAppointments();
  } catch (error) {
    alert('Failed to delete appointment: ' + error.message);
  }
}

// ==================== STATISTICS ====================

async function updateStats() {
  try {
    const [patients, doctors, appointments] = await Promise.all([
      API.users.getAll('patient'),
      API.users.getAll('doctor'),
      API.appointments.getAll()
    ]);

    document.getElementById('totalPatients').textContent = patients.length;
    document.getElementById('totalDoctors').textContent = doctors.length;
    document.getElementById('totalAppointments').textContent = appointments.length;

    const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
    document.getElementById('pendingAppointments').textContent = pendingAppointments;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// ==================== MODALS ====================

// Open Add Patient Modal
document.getElementById('addPatientBtn')?.addEventListener('click', () => {
  document.getElementById('addPatientModal').style.display = 'flex';
});

// Open Add Doctor Modal
document.getElementById('addDoctorBtn')?.addEventListener('click', () => {
  document.getElementById('addDoctorModal').style.display = 'flex';
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

// ==================== SEARCH ====================

document.getElementById('searchPatients')?.addEventListener('input', async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const patients = await API.users.getAll('patient');
  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.email.toLowerCase().includes(searchTerm)
  );
  displayPatients(filtered);
});

document.getElementById('searchDoctors')?.addEventListener('input', async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const doctors = await API.users.getAll('doctor');
  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(searchTerm) ||
    d.specialization?.toLowerCase().includes(searchTerm)
  );
  displayDoctors(filtered);
});

// ==================== INITIALIZATION ====================

// Load initial data
updateStats();
loadPatients();
