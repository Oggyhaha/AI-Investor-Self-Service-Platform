import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor — handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth Endpoints ────────────────────────────────────────────────
export const authAPI = {
  sendOTP: (phone: string) =>
    api.post('/auth/login', { phone }),

  verifyOTP: (phone: string, otp: string) =>
    api.post<{ access_token: string; token_type: string; role: string; user_id: string }>(
      '/auth/verify-otp',
      { phone, otp }
    ),

  advisorLogin: (email: string, password: string) =>
    api.post<{ access_token: string; token_type: string; role: string; user_id: string }>(
      '/auth/advisor/login',
      { email, password }
    ),

  signup: (data: { full_name: string; email: string; phone: string; pan: string; date_of_birth: string }) =>
    api.post('/auth/signup', data),
};

// ─── Dashboard ─────────────────────────────────────────────────────
export const dashboardAPI = {
  getInvestorDashboard: () => api.get('/investors/dashboard'),
  getAdvisorDashboard: () => api.get('/tickets/queue'), // Advisor queue
  getAdminDashboard: () => api.get('/analytics/dashboard'), // Admin analytics
};

// ─── Portfolio ─────────────────────────────────────────────────────
export const portfolioAPI = {
  getSummary: () => api.get('/portfolio/summary'),
  getHoldings: () => api.get('/portfolio/holdings'),
  getHolding: (id: string) => api.get(`/portfolio/${id}`),
};

// ─── SIPs ──────────────────────────────────────────────────────────
export const sipAPI = {
  getAll: () => api.get('/sips'),
  getById: (id: string) => api.get(`/sips/${id}`),
  getFailed: () => api.get('/sips/failed'),
  getMandate: (id: string) => api.get(`/sips/${id}/mandate`),
};

// ─── Chat / Conversations ──────────────────────────────────────────
export const chatAPI = {
  getConversations: () => api.get('/conversations'),
  getConversation: (id: string) => api.get(`/conversations/${id}`),
  createConversation: () => api.post('/conversations'),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/conversations/${conversationId}/messages`, { content }),
  closeConversation: (conversationId: string) =>
    api.post(`/conversations/${conversationId}/close`),
  rateConversation: (conversationId: string, rating: number) =>
    api.post(`/conversations/${conversationId}/rate`, { rating }),
};

// ─── Statements ────────────────────────────────────────────────────
export const statementAPI = {
  generate: (statement_type: string, period_from: string, period_to: string) =>
    api.post('/statements/generate', { statement_type, period_from, period_to }),
  getAll: () => api.get('/statements'),
  download: (id: string) =>
    api.get(`/statements/${id}/download`, { responseType: 'blob' }),
};

// ─── KYC ───────────────────────────────────────────────────────────
export const kycAPI = {
  getStatus: () => api.get('/kyc'),
  requestReVerification: (data: { full_name: string; dob: string; pan_number: string; aadhaar_number: string }) =>
    api.post('/kyc/update-request', data),
};

// ─── Nominees ──────────────────────────────────────────────────────
export const nomineeAPI = {
  getAll: () => api.get('/nominees'),
  requestUpdate: (data: {
    nominee_name: string;
    relationship: string;
    date_of_birth: string;
    allocation_pct: number;
    guardian_name?: string;
  }) => api.post('/nominees/update-request', data),
};

// ─── Notifications ─────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
};


// ─── Profile ───────────────────────────────────────────────────────
export const profileAPI = {
  get: () => api.get('/investors/profile'),
  update: (data: { email?: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string }) =>
    api.put('/investors/profile/contact', data),
};

// ─── Transactions ──────────────────────────────────────────────────
export const transactionAPI = {
  getTransactions: (params?: { transaction_type?: string; fund_id?: number; limit?: number }) =>
    api.get('/transactions', { params }),
};


// ─── Tickets / Service Requests ────────────────────────────────────
export const ticketAPI = {
  getAll: (params?: any) => api.get('/tickets', { params }),
  getQueue: (advisorId?: number) => api.get('/tickets/queue', { params: advisorId ? { advisor_id: advisorId } : {} }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  update: (id: string, data: { status?: string; priority?: string; resolution?: string; advisor_id?: number }) =>
    api.put(`/tickets/${id}`, data),
  addNote: (id: string, content: string) =>
    api.post(`/tickets/${id}/notes`, { content }),
};

// ─── Admin / Analytics ─────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/analytics/dashboard'),
};
