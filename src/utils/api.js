// API utility functions for BirdScope Mobile App
import { Alert } from 'react-native';

// Get backend URL from environment or use default
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Helper function to create headers with auth token
const createHeaders = (token = null, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Authentication API
export const authAPI = {
  async login(email, password) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async register(email, password, full_name) {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password, full_name }),
    });
    return handleResponse(response);
  },

  async googleLogin(googleToken) {
    const formData = new FormData();
    formData.append('google_token', googleToken);
    
    const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: 'POST',
      headers: createHeaders(null, true),
      body: formData,
    });
    return handleResponse(response);
  },
};

// Bird identification and data API
export const birdAPI = {
  async identifyBird(imageFormData, token) {
    const response = await fetch(`${BACKEND_URL}/api/identify-bird`, {
      method: 'POST',
      headers: createHeaders(token, true),
      body: imageFormData,
    });
    return handleResponse(response);
  },

  async getBirdDetail(birdId) {
    const response = await fetch(`${BACKEND_URL}/api/bird/${birdId}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async getMySightings(token) {
    const response = await fetch(`${BACKEND_URL}/api/my-sightings`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  async deleteSighting(sightingId, token) {
    const response = await fetch(`${BACKEND_URL}/api/my-sightings/${sightingId}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  async getCommunityFeed(limit = 20, offset = 0) {
    const response = await fetch(
      `${BACKEND_URL}/api/community-feed?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse(response);
  },

  async createCommunityPost(formData, token) {
    const response = await fetch(`${BACKEND_URL}/api/community-feed`, {
      method: 'POST',
      headers: createHeaders(token, true),
      body: formData,
    });
    return handleResponse(response);
  },

  async likePost(postId, token) {
    const response = await fetch(`${BACKEND_URL}/api/community-feed/${postId}/like`, {
      method: 'POST',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  async getNearbyBirds(latitude, longitude, radius = 25) {
    const response = await fetch(
      `${BACKEND_URL}/api/nearby-birds?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse(response);
  },

  async searchBirds(query) {
    const response = await fetch(
      `${BACKEND_URL}/api/birds/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
    return handleResponse(response);
  },

  async getPopularBirds() {
    const response = await fetch(`${BACKEND_URL}/api/analytics/popular-birds`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async getUserStats(token) {
    const response = await fetch(`${BACKEND_URL}/api/analytics/user-stats`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },
};

// Subscription and payment API
export const subscriptionAPI = {
  async getPlans() {
    const response = await fetch(`${BACKEND_URL}/api/subscription/plans`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async subscribe(planId, paymentMethodId, token) {
    const formData = new FormData();
    formData.append('plan_id', planId);
    formData.append('payment_method_id', paymentMethodId);
    
    const response = await fetch(`${BACKEND_URL}/api/subscription/subscribe`, {
      method: 'POST',
      headers: createHeaders(token, true),
      body: formData,
    });
    return handleResponse(response);
  },

  async getSubscriptionStatus(token) {
    const response = await fetch(`${BACKEND_URL}/api/subscription/status`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },
};

// Notification API
export const notificationAPI = {
  async registerDevice(deviceToken, token) {
    const formData = new FormData();
    formData.append('device_token', deviceToken);
    
    const response = await fetch(`${BACKEND_URL}/api/notifications/register-device`, {
      method: 'POST',
      headers: createHeaders(token, true),
      body: formData,
    });
    return handleResponse(response);
  },
};

// Utility functions
export const utils = {
  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Format bird name for display
  formatBirdName(commonName, scientificName) {
    return `${commonName}\n(${scientificName})`;
  },

  // Calculate confidence percentage
  formatConfidence(confidence) {
    return `${Math.round(confidence * 100)}%`;
  },

  // Format subscription plan name
  formatPlanName(planId) {
    switch (planId) {
      case 'free':
        return 'Free Plan';
      case 'premium_monthly':
        return 'Premium Monthly';
      case 'premium_yearly':
        return 'Premium Yearly';
      default:
        return 'Unknown Plan';
    }
  },

  // Get rarity color
  getRarityColor(rarity) {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '#22c55e'; // Green
      case 'uncommon':
        return '#eab308'; // Yellow
      case 'rare':
        return '#f97316'; // Orange
      case 'very_rare':
        return '#ef4444'; // Red
      case 'endangered':
        return '#dc2626'; // Dark red
      default:
        return '#6b7280'; // Gray
    }
  },

  // Get rarity icon
  getRarityIcon(rarity) {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'circle';
      case 'uncommon':
        return 'circle-outline';
      case 'rare':
        return 'star-outline';
      case 'very_rare':
        return 'star';
      case 'endangered':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  },

  // Show error alert
  showError(message, title = 'Error') {
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  // Show success alert
  showSuccess(message, title = 'Success') {
    Alert.alert(title, message, [{ text: 'OK' }]);
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Debounce function for search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Export all APIs as default
export default {
  auth: authAPI,
  bird: birdAPI,
  subscription: subscriptionAPI,
  notification: notificationAPI,
  utils,
};