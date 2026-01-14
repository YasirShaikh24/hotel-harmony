const API_BASE_URL = 'http://localhost:5000/api';

// Generic API function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Dashboard API
export const dashboardApi = {
  getStats: () => apiCall('/dashboard/stats'),
};

// Rooms API
export const roomsApi = {
  getAll: () => apiCall('/rooms'),
  getById: (id: string) => apiCall(`/rooms/${id}`),
  update: (id: string, data: any) => apiCall(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Bookings API
export const bookingsApi = {
  getAll: (status?: string) => apiCall(`/bookings${status ? `?status=${status}` : ''}`),
  create: (data: any) => apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Invoices API
export const invoicesApi = {
  getAll: (status?: string) => apiCall(`/invoices${status ? `?status=${status}` : ''}`),
  getById: (id: string) => apiCall(`/invoices/${id}`),
  update: (id: string, data: any) => apiCall(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  generatePdf: (id: string) => apiCall(`/invoices/${id}/pdf`, {
    method: 'POST',
  }),
  downloadPdf: (id: string) => `${API_BASE_URL}/invoices/${id}/download`,
  shareWhatsApp: (id: string) => apiCall(`/invoices/${id}/share`, {
    method: 'POST',
  }),
};

// Expenses API
export const expensesApi = {
  getAll: () => apiCall('/expenses'),
  create: (data: any) => apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/expenses/${id}`, {
    method: 'DELETE',
  }),
};

// Income API
export const incomeApi = {
  getAll: (period?: string) => apiCall(`/income${period ? `?period=${period}` : ''}`),
  create: (data: any) => apiCall('/income', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/income/${id}`, {
    method: 'DELETE',
  }),
};

// Financial API
export const financialApi = {
  getSummary: (period?: string) => apiCall(`/financial-summary${period ? `?period=${period}` : ''}`),
};