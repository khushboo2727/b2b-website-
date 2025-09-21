import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Product API functions
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  // NEW
  getReviews: (id) => api.get(`/products/${id}/reviews`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
};

// Lead API functions
export const leadAPI = {
  create: (leadData) => api.post('/leads', leadData),
  getForSeller: (params) => api.get('/leads', { params }),
  updateStatus: (leadId, status) => api.patch(`/leads/${leadId}/status`, { status }),
  markAsRead: (leadId, isRead) => api.patch(`/leads/${leadId}/read`, { isRead }),
};

// Seller API functions
export const sellerAPI = {
  getProfile: (userId) => api.get(`/seller/${userId}`),
  updateProfile: (profileData) => api.post('/seller/profile', profileData),
};

// Membership API functions
export const membershipAPI = {
  getPlans: () => api.get('/membership/plans'),
  subscribe: (planId) => api.post(`/membership/subscribe/${planId}`),
  getCurrentPlan: () => api.get('/auth/me'), // Gets user with membership plan
};

// RFQ API
export const rfqAPI = {
  // Submit new RFQ
  submit: (rfqData) => api.post('/rfq', rfqData),
  
  // Get buyer's RFQs
  getBuyerRFQs: () => api.get('/rfq/buyer'),
  
  // Get seller's RFQs
  getSellerRFQs: () => api.get('/rfq/seller'),
  
  // Get RFQ by ID
  getById: (id) => api.get(`/rfq/${id}`),
  
  // Submit quote (seller)
  submitQuote: (id, quoteData) => api.put(`/rfq/${id}/quote`, quoteData),
  
  // Update RFQ status
  updateStatus: (id, status) => api.put(`/rfq/${id}/status`, { status }),
  
  // Add communication
  addCommunication: (id, message) => api.post(`/rfq/${id}/communication`, { message })
};
// Message API
export const messageAPI = {
  // Send message (buyer to seller)
  send: (messageData) => api.post('/messages', messageData),
  
  // Get received messages (for sellers)
  getReceived: (params = {}) => api.get('/messages/received', { params }),
  
  // Get sent messages (for buyers)
  getSent: (params = {}) => api.get('/messages/sent', { params }),
  
  // Mark message as read
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`)
};
// Notification API
export const notificationAPI = {
  // Get notifications
  getAll: (params = {}) => api.get('/notifications', { params }),
  
  // Get unread count
  getUnreadCount: () => api.get('/notifications/unread-count'),
  
  // Mark as read
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.patch('/notifications/mark-all-read')
};
export default api;