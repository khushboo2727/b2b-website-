import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if available to fix 401s on protected endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions (restored)
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  requestOtp: (data) => api.post('/auth/request-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  getStatusByEmail: (email) => api.get('/auth/user-status', { params: { email } }),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  getCategories: () => api.get('/products/categories'),
  getReviews: (id) => api.get(`/products/${id}/reviews`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  getSearchSuggestions: (q) => api.get('/products/search-suggestions', { params: { q } }),
};

export const leadAPI = {
  create: (leadData) => api.post('/leads', leadData),
  getForSeller: (params) => api.get('/leads', { params }),
  getAllLeads: (params) => api.get('/leads/all', { params }),
  updateStatus: (leadId, status) => api.patch(`/leads/${leadId}/status`, { status }),
  markAsRead: (leadId, isRead) => api.patch(`/leads/${leadId}/read`, { isRead }),
  getBuyerLeads: (params) => api.get('/leads/buyer', { params }),
  purchase: (leadId, amount) => api.post(`/leads/${leadId}/purchase`, { amount }),
  view: (leadId) => api.post(`/leads/${leadId}/view`),
  getPurchasedLeads: (params) => api.get('/leads/purchased', { params })
};

export const rfqAPI = {
  submit: (rfqData) => api.post('/rfq', rfqData),
  getBuyerRFQs: () => api.get('/rfq/buyer'),
  getSellerRFQs: () => api.get('/rfq/seller'),
  getById: (id) => api.get(`/rfq/${id}`),
  submitQuote: (id, quoteData) => api.put(`/rfq/${id}/quote`, quoteData),
  updateStatus: (id, status) => api.put(`/rfq/${id}/status`, { status }),
  addCommunication: (id, message) => api.post(`/rfq/${id}/communication`, { message }),
  markAsOpened: (id) => api.post(`/rfq/${id}/open`),
};

export const messageAPI = {
  send: (messageData) => api.post('/messages', messageData),
  getReceived: (params = {}) => api.get('/messages/received', { params }),
  getSent: (params = {}) => api.get('/messages/sent', { params }),
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  sendToAdmin: (messageData) => api.post('/messages/admin', messageData),
  getAdminMessages: () => api.get('/admin/messages'),
  getAdminConversationWith: (sellerId) => api.get(`/admin/messages/${sellerId}`),
  sendAdminReply: (sellerId, messageData) => api.post(`/admin/messages/${sellerId}/reply`, messageData),
  getAdminConversation: () => api.get('/messages/admin'),
};

export const notificationAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
};

export const sellerAPI = {
  getProfile: (userId) => api.get(`/seller/${userId}`),
  updateProfile: (profileData) => api.post('/seller/profile', profileData),
};

export const membershipAPI = {
  getPlans: () => api.get('/membership/plans'),
  subscribe: (planId, data = {}) => api.post(`/membership/subscribe/${planId}`, data),
  getCurrentPlan: () => api.get('/auth/me'),
};

// Admin API (restored)
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getBuyers: (params) => api.get('/admin/buyers', { params }),
  getSellers: (params) => api.get('/admin/sellers', { params }),
  getInquiries: (params) => api.get('/admin/inquiries', { params }),
  getPendingSellers: () => api.get('/admin/pending-sellers'),
  getSellerDetail: (id) => api.get(`/admin/seller/${id}`),
  approveSeller: (id) => api.put(`/admin/approve-seller/${id}`),
  rejectSeller: (id, reason) => api.put(`/admin/reject-seller/${id}`, { reason }),
  blockUser: (id) => api.put(`/admin/block-user/${id}`),
  unblockUser: (id) => api.put(`/admin/unblock-user/${id}`),
};