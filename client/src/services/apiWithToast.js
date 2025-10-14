import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store toast and loading contexts (will be set by the hook)
let toastContext = null;
let loadingContext = null;

export const setApiContexts = (toast, loading) => {
  toastContext = toast;
  loadingContext = loading;
};

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

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data.msg || data.message || 'Bad request';
          break;
        case 401:
          errorMessage = 'Unauthorized access';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = data.msg || data.message || `Error ${status}`;
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.';
    }
    
    // Show error toast if context is available
    if (toastContext) {
      toastContext.showError(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to make API calls with loading and success toast
const makeApiCall = async (apiCall, loadingKey, successMessage = null) => {
  try {
    if (loadingContext && loadingKey) {
      loadingContext.setLoading(loadingKey, true);
    }
    
    const response = await apiCall();
    
    if (successMessage && toastContext) {
      toastContext.showSuccess(successMessage);
    }
    
    return response;
  } catch (error) {
    throw error;
  } finally {
    if (loadingContext && loadingKey) {
      loadingContext.setLoading(loadingKey, false);
    }
  }
};

// Auth API functions
export const authAPI = {
  register: (userData) => 
    makeApiCall(
      () => api.post('/auth/register', userData),
      'register',
      'Registration successful!'
    ),
  login: (credentials) => 
    makeApiCall(
      () => api.post('/auth/login', credentials),
      'login',
      'Logged in successfully!'
    ),
  getCurrentUser: () => 
    makeApiCall(
      () => api.get('/auth/me'),
      'get-current-user'
    ),
  // Status by email (public) - for PendingApproval page
  getStatusByEmail: (email) =>
    makeApiCall(
      () => api.get('/auth/status-by-email', { params: { email } }),
      `status-by-email-${email}`
    ),
  // NEW: OTP request & verify
  requestOtp: (payload) =>
    makeApiCall(
      () => api.post('/auth/otp/request', payload),
      'auth-otp-request'
    ),
  verifyOtp: ({ otpId, code }) =>
    makeApiCall(
      () => api.post('/auth/otp/verify', { otpId, code }),
      'auth-otp-verify'
    ),
};

// Product API functions
export const productAPI = {
  getAll: (params) => 
    makeApiCall(
      () => api.get('/products', { params }),
      'products-fetch'
    ),
  getById: (id) => 
    makeApiCall(
      () => api.get(`/products/${id}`),
      `product-${id}`
    ),
  create: (productData) => 
    makeApiCall(
      () => api.post('/products', productData),
      'product-create',
      'Product created successfully!'
    ),
  update: (id, productData) => 
    makeApiCall(
      () => api.put(`/products/${id}`, productData),
      `product-update-${id}`,
      'Product updated successfully!'
    ),
  delete: (id) => 
    makeApiCall(
      () => api.delete(`/products/${id}`),
      `product-delete-${id}`,
      'Product deleted successfully!'
    ),
  getCategories: () =>
    makeApiCall(
      () => api.get('/products/categories'),
      'products-categories'
    ),
};

// Lead API functions
export const leadAPI = {
  create: (leadData) => 
    makeApiCall(
      () => api.post('/lead', leadData),
      'lead-create',
      'Inquiry sent successfully!'
    ),
  getForSeller: () => 
    makeApiCall(
      () => api.get('/leads'),
      'leads-fetch'
    ),
  updateStatus: (leadId, status) => 
    makeApiCall(
      () => api.patch(`/lead/${leadId}/status`, { status }),
      `lead-update-${leadId}`,
      'Lead status updated successfully!'
    ),
};

// Seller API functions
export const sellerAPI = {
  getProfile: (userId) => 
    makeApiCall(
      () => api.get(`/seller/${userId}`),
      `seller-profile-${userId}`
    ),
  updateProfile: (profileData) => 
    makeApiCall(
      () => api.post('/seller/profile', profileData),
      'seller-profile-update',
      'Profile updated successfully!'
    ),
  // NEW: GST verification (server stub validates format)
  verifyGST: ({ gstNumber, businessName }) =>
    makeApiCall(
      () => api.post('/seller/verify-gst', { gstNumber, businessName }),
      'seller-verify-gst'
    ),
};

// Membership API functions
export const membershipAPI = {
  getPlans: () => 
    makeApiCall(
      () => api.get('/membership/plans'),
      'membership-plans'
    ),
  subscribe: (planId) => 
    makeApiCall(
      () => api.post(`/membership/subscribe/${planId}`),
      `membership-subscribe-${planId}`,
      'Successfully subscribed to plan!'
    ),
};

// Admin API functions
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getPendingSellers: () => api.get('/admin/pending-sellers'),
  approveSeller: (sellerId) => api.put(`/admin/approve-seller/${sellerId}`),
  rejectSeller: (sellerId, reason) => api.put(`/admin/reject-seller/${sellerId}`, { reason }),
  getBuyers: (params) => api.get('/admin/buyers', { params }),
  getSellers: (params) => api.get('/admin/sellers', { params }),
  blockUser: (userId) => api.put(`/admin/block-user/${userId}`),
  unblockUser: (userId) => api.put(`/admin/unblock-user/${userId}`),
  getInquiries: (params) => api.get('/admin/inquiries', { params }),
  getSellerDetail: (sellerId) => api.get(`/admin/seller/${sellerId}`)
};
export default api;