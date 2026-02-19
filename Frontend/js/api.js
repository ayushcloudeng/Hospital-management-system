// API Configuration and Utility Functions
const API_BASE_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Get current user from localStorage
const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

// Save authentication data
const saveAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Clear authentication data
const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

// Check if user is authenticated
const isAuthenticated = () => {
    return !!getToken();
};

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Authentication API
const authAPI = {
    // Register new user
    register: async (userData) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        saveAuth(data.token, data);
        return data;
    },

    // Login user
    login: async (email, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        saveAuth(data.token, data);
        return data;
    },

    // Get current user
    getMe: async () => {
        return await apiRequest('/auth/me');
    },

    // Logout
    logout: () => {
        clearAuth();
        window.location.href = 'index.html';
    },
};

// Users API
const usersAPI = {
    // Get all users (with optional role filter)
    getAll: async (role = null) => {
        const endpoint = role ? `/users?role=${role}` : '/users';
        return await apiRequest(endpoint);
    },

    // Get user by ID
    getById: async (id) => {
        return await apiRequest(`/users/${id}`);
    },

    // Create user
    create: async (userData) => {
        return await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // Update user
    update: async (id, userData) => {
        return await apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    // Delete user
    delete: async (id) => {
        return await apiRequest(`/users/${id}`, {
            method: 'DELETE',
        });
    },
};

// Appointments API
const appointmentsAPI = {
    // Get all appointments
    getAll: async () => {
        return await apiRequest('/appointments');
    },

    // Get appointment by ID
    getById: async (id) => {
        return await apiRequest(`/appointments/${id}`);
    },

    // Create appointment
    create: async (appointmentData) => {
        return await apiRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData),
        });
    },

    // Update appointment
    update: async (id, appointmentData) => {
        return await apiRequest(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(appointmentData),
        });
    },

    // Delete appointment
    delete: async (id) => {
        return await apiRequest(`/appointments/${id}`, {
            method: 'DELETE',
        });
    },
};

// Medical Records API
const medicalRecordsAPI = {
    // Get all medical records
    getAll: async () => {
        return await apiRequest('/medical-records');
    },

    // Get medical record by ID
    getById: async (id) => {
        return await apiRequest(`/medical-records/${id}`);
    },

    // Create medical record
    create: async (recordData) => {
        return await apiRequest('/medical-records', {
            method: 'POST',
            body: JSON.stringify(recordData),
        });
    },
};

// Export API object
const API = {
    auth: authAPI,
    users: usersAPI,
    appointments: appointmentsAPI,
    medicalRecords: medicalRecordsAPI,
    getCurrentUser,
    isAuthenticated,
    clearAuth,
};
