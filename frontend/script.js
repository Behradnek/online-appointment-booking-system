const API_BASE_URL = 'http://localhost:3000/api';

const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  services: []
};

const elements = {
  message: document.getElementById('message'),
  userPanel: document.getElementById('userPanel'),
  currentUser: document.getElementById('currentUser'),
  logoutButton: document.getElementById('logoutButton'),
  authSection: document.getElementById('authSection'),
  registerForm: document.getElementById('registerForm'),
  loginForm: document.getElementById('loginForm'),
  servicesList: document.getElementById('servicesList'),
  refreshServicesButton: document.getElementById('refreshServicesButton'),
  bookingSection: document.getElementById('bookingSection'),
  appointmentForm: document.getElementById('appointmentForm'),
  serviceSelect: document.getElementById('serviceSelect'),
  appointmentsSection: document.getElementById('appointmentsSection'),
  appointmentsList: document.getElementById('appointmentsList'),
  refreshAppointmentsButton: document.getElementById('refreshAppointmentsButton'),
  adminSection: document.getElementById('adminSection'),
  adminAppointmentsList: document.getElementById('adminAppointmentsList'),
  refreshAdminButton: document.getElementById('refreshAdminButton')
};

function showMessage(text, type = 'success') {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
  elements.message.classList.remove('hidden');
}

function hideMessage() {
  elements.message.classList.add('hidden');
}

async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }

  return data;
}

function saveSession(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  renderAuthState();
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  renderAuthState();
}

function formatPrice(price) {
  return Number(price).toLocaleString('en-US');
}

function renderAuthState() {
  const isLoggedIn = Boolean(state.token && state.user);
  const isAdmin = state.user?.role === 'admin';

  elements.userPanel.classList.toggle('hidden', !isLoggedIn);
  elements.authSection.classList.toggle('hidden', isLoggedIn);
  elements.bookingSection.classList.toggle('hidden', !isLoggedIn);
  elements.appointmentsSection.classList.toggle('hidden', !isLoggedIn);
  elements.adminSection.classList.toggle('hidden', !isAdmin);

  if (isLoggedIn) {
    elements.currentUser.textContent = `${state.user.name} (${state.user.role})`;
    loadAppointments();
  } else {
    elements.appointmentsList.innerHTML = '';
    elements.adminAppointmentsList.innerHTML = '';
  }

  if (isAdmin) {
    loadAdminAppointments();
  }
}

function renderServices() {
  if (state.services.length === 0) {
    elements.servicesList.innerHTML = '<p class="empty-state">No services available.</p>';
    elements.serviceSelect.innerHTML = '';
    return;
  }

  elements.servicesList.innerHTML = state.services.map((service) => `
    <div class="service-item">
      <strong>${service.name}</strong>
      <span>${service.duration} minutes · ${formatPrice(service.price)}</span>
    </div>
  `).join('');

  elements.serviceSelect.innerHTML = state.services.map((service) => `
    <option value="${service.id}">${service.name} - ${service.duration} min - ${formatPrice(service.price)}</option>
  `).join('');
}

function renderAppointments(appointments) {
  if (appointments.length === 0) {
    elements.appointmentsList.innerHTML = '<p class="empty-state">You do not have any appointments yet.</p>';
    return;
  }

  elements.appointmentsList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${appointments.map((appointment) => `
          <tr>
            <td>${appointment.service_name}<br><small>${appointment.duration} min · ${formatPrice(appointment.price)}</small></td>
            <td>${appointment.appointment_date}</td>
            <td>${appointment.appointment_time}</td>
            <td><span class="status">${appointment.status}</span></td>
            <td>
              ${['pending', 'confirmed'].includes(appointment.status)
                ? `<button class="danger small" type="button" onclick="cancelAppointment(${appointment.id})">Cancel</button>`
                : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderAdminAppointments(appointments) {
  if (appointments.length === 0) {
    elements.adminAppointmentsList.innerHTML = '<p class="empty-state">No appointments found.</p>';
    return;
  }

  elements.adminAppointmentsList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Service</th>
          <th>Date</th>
          <th>Time</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${appointments.map((appointment) => `
          <tr>
            <td>${appointment.user_name}<br><small>${appointment.user_email}</small></td>
            <td>${appointment.service_name}<br><small>${appointment.duration} min · ${formatPrice(appointment.price)}</small></td>
            <td>${appointment.appointment_date}</td>
            <td>${appointment.appointment_time}</td>
            <td><span class="status">${appointment.status}</span></td>
            <td>
              <div class="actions">
                <button class="small" type="button" onclick="confirmAppointment(${appointment.id})">Confirm</button>
                <button class="danger small" type="button" onclick="adminCancelAppointment(${appointment.id})">Cancel</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadServices() {
  try {
    state.services = await apiRequest('/services');
    renderServices();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function loadAppointments() {
  if (!state.token) {
    return;
  }

  try {
    const appointments = await apiRequest('/appointments');
    renderAppointments(appointments);
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function loadAdminAppointments() {
  if (state.user?.role !== 'admin') {
    return;
  }

  try {
    const appointments = await apiRequest('/admin/appointments');
    renderAdminAppointments(appointments);
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function cancelAppointment(id) {
  try {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
    showMessage('Appointment canceled.');
    await loadAppointments();
    await loadAdminAppointments();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function confirmAppointment(id) {
  try {
    await apiRequest(`/admin/appointments/${id}/confirm`, { method: 'PUT' });
    showMessage('Appointment confirmed.');
    await loadAdminAppointments();
    await loadAppointments();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

async function adminCancelAppointment(id) {
  try {
    await apiRequest(`/admin/appointments/${id}/cancel`, { method: 'PUT' });
    showMessage('Appointment canceled by admin.');
    await loadAdminAppointments();
    await loadAppointments();
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

elements.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage();

  const formData = new FormData(elements.registerForm);

  try {
    const data = await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData))
    });

    saveSession(data);
    elements.registerForm.reset();
    showMessage('Registration successful.');
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage();

  const formData = new FormData(elements.loginForm);

  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData))
    });

    saveSession(data);
    elements.loginForm.reset();
    showMessage('Login successful.');
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

elements.appointmentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideMessage();

  const formData = new FormData(elements.appointmentForm);
  const payload = Object.fromEntries(formData);

  try {
    await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    elements.appointmentForm.reset();
    showMessage('Appointment booked successfully.');
    await loadAppointments();
    await loadAdminAppointments();
  } catch (error) {
    showMessage(error.message, 'error');
  }
});

elements.logoutButton.addEventListener('click', () => {
  clearSession();
  showMessage('Logged out.');
});

elements.refreshServicesButton.addEventListener('click', loadServices);
elements.refreshAppointmentsButton.addEventListener('click', loadAppointments);
elements.refreshAdminButton.addEventListener('click', loadAdminAppointments);

window.cancelAppointment = cancelAppointment;
window.confirmAppointment = confirmAppointment;
window.adminCancelAppointment = adminCancelAppointment;

loadServices();
renderAuthState();
