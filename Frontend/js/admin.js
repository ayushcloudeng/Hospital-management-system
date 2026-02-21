// ==================== AUTH GUARD ====================
if (!API.isAuthenticated()) {
  window.location.href = 'index.html';
  throw new Error('Not authenticated');
}

let currentUser = API.getCurrentUser();

if (!currentUser || currentUser.role !== 'admin') {
  alert('Access denied. Admin only.');
  API.clearAuth();
  window.location.href = 'index.html';
  throw new Error('Not an admin');
}

// ==================== INIT ====================

// Show admin name in header
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) adminNameEl.textContent = currentUser.name;

// ==================== NAVIGATION ====================

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.getAttribute('data-section');

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    sections.forEach(s => s.classList.remove('active'));
    // admin.html uses IDs like 'dashboard-section', 'patients-section', etc.
    const el = document.getElementById(target + '-section') || document.getElementById(target);
    if (el) el.classList.add('active');

    // Update page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
      const titles = { dashboard: 'Admin Dashboard', patients: 'Patient Management', doctors: 'Doctor Management', appointments: 'Appointment Management' };
      titleEl.textContent = titles[target] || 'Admin Dashboard';
    }

    if (target === 'patients') loadPatients();
    if (target === 'doctors') loadDoctors();
    if (target === 'appointments') loadAppointments();
  });
});

// Logout — clear localStorage and redirect
document.querySelector('.logout-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Are you sure you want to logout?')) {
    API.clearAuth();
    window.location.href = 'index.html';
  }
});

// Fallback: also intercept the <a href="index.html"> logout link
document.querySelector('a[href="index.html"].logout-btn')?.addEventListener('click', (e) => {
  e.preventDefault();
  API.clearAuth();
  window.location.href = 'index.html';
});

// ==================== MODAL HELPERS ====================

function openPatientModal(patient = null) {
  document.getElementById('patientModalTitle').textContent = patient ? 'Edit Patient' : 'Add Patient';
  document.getElementById('patientId').value = patient ? patient._id : '';
  document.getElementById('patientName').value = patient ? patient.name : '';
  document.getElementById('patientAge').value = patient ? patient.age || '' : '';
  document.getElementById('patientGender').value = patient ? patient.gender || '' : '';
  document.getElementById('patientContact').value = patient ? patient.contact || '' : '';
  document.getElementById('patientEmail').value = patient ? patient.email : '';
  document.getElementById('patientModal').style.display = 'flex';
}

function closePatientModal() {
  document.getElementById('patientModal').style.display = 'none';
  document.getElementById('patientForm').reset();
}

function openDoctorModal(doctor = null) {
  document.getElementById('doctorModalTitle').textContent = doctor ? 'Edit Doctor' : 'Add Doctor';
  document.getElementById('doctorId').value = doctor ? doctor._id : '';
  document.getElementById('doctorName').value = doctor ? doctor.name : '';
  document.getElementById('doctorSpecialization').value = doctor ? doctor.specialization || '' : '';
  document.getElementById('doctorContact').value = doctor ? doctor.contact || '' : '';
  document.getElementById('doctorEmail').value = doctor ? doctor.email : '';
  document.getElementById('doctorModal').style.display = 'flex';
}

function closeDoctorModal() {
  document.getElementById('doctorModal').style.display = 'none';
  document.getElementById('doctorForm').reset();
}

async function openAppointmentModal(appointment = null) {
  document.getElementById('appointmentModalTitle').textContent = appointment ? 'Edit Appointment' : 'Add Appointment';
  document.getElementById('appointmentId').value = appointment ? appointment._id : '';
  document.getElementById('appointmentPatient').value = appointment ? appointment.patientName || '' : '';
  document.getElementById('appointmentDate').value = appointment ? appointment.date?.substring(0, 10) : '';
  document.getElementById('appointmentTime').value = appointment ? appointment.time || '' : '';
  document.getElementById('appointmentStatus').value = appointment ? appointment.status || 'Pending' : 'Pending';

  // Load doctors for the dropdown
  await loadDoctorsForSelect(appointment?.doctor?._id);
  document.getElementById('appointmentModal').style.display = 'flex';
}

function closeAppointmentModal() {
  document.getElementById('appointmentModal').style.display = 'none';
  document.getElementById('appointmentForm').reset();
}

async function loadDoctorsForSelect(selectedId = null) {
  try {
    const doctors = await API.users.getAll('doctor');
    const select = document.getElementById('appointmentDoctor');
    select.innerHTML = '<option value="">Not Assigned</option>';
    doctors.forEach(d => {
      const opt = `<option value="${d._id}" ${selectedId === d._id ? 'selected' : ''}>${d.name} - ${d.specialization || 'General'}</option>`;
      select.innerHTML += opt;
    });
  } catch (e) {
    console.error('Error loading doctors for select:', e);
  }
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// ==================== PATIENTS ====================

let allPatients = [];

async function loadPatients() {
  try {
    allPatients = await API.users.getAll('patient');
    renderPatients(allPatients);
    updateStats();
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

function renderPatients(patients) {
  const tbody = document.getElementById('patientTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">No patients found</td></tr>';
    return;
  }

  patients.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td title="${p._id}">${p._id.toString().slice(-6)}</td>
        <td>${p.name}</td>
        <td>${p.age || 'N/A'}</td>
        <td>${p.gender || 'N/A'}</td>
        <td>${p.contact || 'N/A'}</td>
        <td>${p.email}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick='openPatientModal(${JSON.stringify(p)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deletePatient('${p._id}')">Delete</button>
        </td>
      </tr>`;
  });
}

document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('patientId').value;
  const data = {
    name: document.getElementById('patientName').value,
    age: parseInt(document.getElementById('patientAge').value) || undefined,
    gender: document.getElementById('patientGender').value || undefined,
    contact: document.getElementById('patientContact').value || undefined,
    email: document.getElementById('patientEmail').value,
    role: 'patient',
    password: 'password123', // default for admin-created accounts
  };

  try {
    if (id) {
      await API.users.update(id, data);
      alert('Patient updated!');
    } else {
      await API.auth.register(data);
      alert('Patient added!');
    }
    closePatientModal();
    loadPatients();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
});

async function deletePatient(id) {
  if (!confirm('Delete this patient?')) return;
  try {
    await API.users.delete(id);
    alert('Patient deleted!');
    loadPatients();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

function searchPatients() {
  const term = document.getElementById('patientSearch').value.toLowerCase();
  const filtered = allPatients.filter(p =>
    p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
  );
  renderPatients(filtered);
}

// ==================== DOCTORS ====================

let allDoctors = [];

async function loadDoctors() {
  try {
    allDoctors = await API.users.getAll('doctor');
    renderDoctors(allDoctors);
    updateStats();
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

function renderDoctors(doctors) {
  const tbody = document.getElementById('doctorTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (doctors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">No doctors found</td></tr>';
    return;
  }

  doctors.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td title="${d._id}">${d._id.toString().slice(-6)}</td>
        <td>${d.name}</td>
        <td>${d.specialization || 'N/A'}</td>
        <td>${d.contact || 'N/A'}</td>
        <td>${d.email}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick='openDoctorModal(${JSON.stringify(d)})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDoctor('${d._id}')">Delete</button>
        </td>
      </tr>`;
  });
}

document.getElementById('doctorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('doctorId').value;
  const data = {
    name: document.getElementById('doctorName').value,
    specialization: document.getElementById('doctorSpecialization').value,
    contact: document.getElementById('doctorContact').value || undefined,
    email: document.getElementById('doctorEmail').value,
    role: 'doctor',
    password: 'password123',
  };

  try {
    if (id) {
      await API.users.update(id, data);
      alert('Doctor updated!');
    } else {
      await API.auth.register(data);
      alert('Doctor added!');
    }
    closeDoctorModal();
    loadDoctors();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
});

async function deleteDoctor(id) {
  if (!confirm('Delete this doctor?')) return;
  try {
    await API.users.delete(id);
    alert('Doctor deleted!');
    loadDoctors();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

// ==================== APPOINTMENTS ====================

async function loadAppointments() {
  try {
    const appointments = await API.appointments.getAll();
    renderAppointments(appointments);
    updateStats(null, null, appointments);
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

function renderAppointments(appointments) {
  const tbody = document.getElementById('appointmentTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">No appointments found</td></tr>';
    return;
  }

  appointments.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td title="${a._id}">${a._id.toString().slice(-6)}</td>
        <td>${a.patientName || 'N/A'}</td>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${a.time || 'N/A'}</td>
        <td>${a.doctorName || 'Unassigned'}</td>
        <td><span class="status-badge status-${(a.status || '').toLowerCase()}">${a.status || 'N/A'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick='openAppointmentModal(${JSON.stringify(a).replace(/'/g, "\\'")})'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAppointment('${a._id}')">Delete</button>
        </td>
      </tr>`;
  });
}

document.getElementById('appointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('appointmentId').value;
  const data = {
    patientName: document.getElementById('appointmentPatient').value,
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value,
    doctor: document.getElementById('appointmentDoctor').value || undefined,
    status: document.getElementById('appointmentStatus').value,
  };

  try {
    if (id) {
      await API.appointments.update(id, data);
      alert('Appointment updated!');
    } else {
      await API.appointments.create(data);
      alert('Appointment added!');
    }
    closeAppointmentModal();
    loadAppointments();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
});

async function deleteAppointment(id) {
  if (!confirm('Delete this appointment?')) return;
  try {
    await API.appointments.delete(id);
    alert('Appointment deleted!');
    loadAppointments();
  } catch (err) {
    alert('Failed: ' + err.message);
  }
}

// ==================== STATS ====================

async function updateStats(patients, doctors, appointments) {
  try {
    const [p, d, a] = await Promise.all([
      patients ? Promise.resolve(patients) : API.users.getAll('patient'),
      doctors ? Promise.resolve(doctors) : API.users.getAll('doctor'),
      appointments ? Promise.resolve(appointments) : API.appointments.getAll(),
    ]);
    const totalPatientsEl = document.getElementById('totalPatients');
    const totalDoctorsEl = document.getElementById('totalDoctors');
    const totalAppointmentsEl = document.getElementById('totalAppointments');
    if (totalPatientsEl) totalPatientsEl.textContent = p.length;
    if (totalDoctorsEl) totalDoctorsEl.textContent = d.length;
    if (totalAppointmentsEl) totalAppointmentsEl.textContent = a.length;
  } catch (err) {
    console.error('Error updating stats:', err);
  }
}

// ==================== START ====================
updateStats();
loadPatients();
