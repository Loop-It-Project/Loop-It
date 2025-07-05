import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class AuthService {
  // Login
  static async login(credentials) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Register
  static async register(userData) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Logout
  static async logout() {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: BaseService.getAuthHeaders()
      });

      // Remove token regardless of response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return { success: true };
    }
  }

  // Token Refresh
  static async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        return { success: true, data };
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify Email
  static async verifyEmail(token) {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default AuthService;