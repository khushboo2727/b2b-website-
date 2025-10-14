import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Lead API functions
export const leadAPI = {
  // Get all leads (for buyers)
  getAllLeads: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/leads?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new lead (for buyers)
  createLead: async (leadData) => {
    try {
      const response = await api.post('/api/lead', leadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get leads for seller (distributed leads)
  getSellerLeads: async (page = 1, limit = 10, category = '') => {
    try {
      const response = await api.get(`/api/leads/all?page=${page}&limit=${limit}&category=${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Purchase lead access
  purchaseLead: async (leadId, amount = 100) => {
    try {
      const response = await api.post(`/api/lead/${leadId}/purchase`, { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // View lead (marks as viewed and checks 5-view limit)
  viewLead: async (leadId) => {
    try {
      const response = await api.post(`/api/lead/${leadId}/view`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get purchased leads for seller
  getPurchasedLeads: async (page = 1, limit = 10, category = '') => {
    try {
      const response = await api.get(`/api/leads/purchased?page=${page}&limit=${limit}&category=${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update lead status
  updateLeadStatus: async (leadId, status) => {
    try {
      const response = await api.patch(`/api/lead/${leadId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark lead as read
  markAsRead: async (leadId) => {
    try {
      const response = await api.patch(`/api/lead/${leadId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default leadAPI;