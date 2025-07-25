import BaseService from './baseService';
import WebSocketService from './websocketService';

class AuthService {
  static async register(userData) {
    try {
      console.log('🔐 Attempting registration with data:', userData);
      
      const response = await BaseService.fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('📧 Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();

        // Extract data correctly from MSW response
        const responseData = data.data || data;
        
        // Store tokens
        if (responseData?.accessToken) {
          localStorage.setItem('accessToken', responseData.accessToken);
          localStorage.setItem('refreshToken', responseData.refreshToken);
          
          // Connect WebSocket
          WebSocketService.connect(responseData.accessToken, responseData.user);
          
          // Request notification permission
          WebSocketService.requestNotificationPermission();
        }

        console.log('✅ Registration successful:', data);
        // Return the extracted data, not nested structure
        return { success: true, data: responseData };
      } else {
        const errorData = await response.json();
        console.error('❌ Registration failed:', errorData);
        return { success: false, error: errorData.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async login(credentials) {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      
      const response = await BaseService.fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('📧 Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();

        // Extract data correctly from MSW response
        const responseData = data.data || data;
        
        // Store tokens
        if (responseData?.accessToken) {
          localStorage.setItem('accessToken', responseData.accessToken);
          localStorage.setItem('refreshToken', responseData.refreshToken);
          
          // Connect WebSocket
          WebSocketService.connect(responseData.accessToken, responseData.user);
        }

        console.log('✅ Login successful');
        // Return the extracted data, not nested structure
        return { success: true, data: responseData };
      } else {
        const errorData = await response.json();
        console.error('❌ Login failed:', errorData);
        return { success: false, error: errorData.error || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static async logout() {
    try {
      // Optional: call backend logout endpoint
      const response = await BaseService.fetchWithAuth('/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: 'Logout failed' };
      }
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Network error' };
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      WebSocketService.disconnect();
    }
  }

  // Refresh tokens
  static async refreshTokens() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      const response = await BaseService.fetchWithAuth('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const responseData = data.data || data;
        
        // Store new tokens
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('refreshToken', responseData.refreshToken);
        
        return { success: true, accessToken: responseData.accessToken };
      } else {
        const errorData = await response.json();
        
        // Clear tokens on refresh failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        return { success: false, error: errorData.error || 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const response = await BaseService.fetchWithAuth('/auth/me');
      const data = await response.json();
      const responseData = data.data || data;
      
      return response.ok ? { success: true, data: responseData } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Forgot password
  static async forgotPassword(email) {
    try {
      const response = await BaseService.fetchWithAuth('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reset password
  static async resetPassword(resetData) {
    try {
      const response = await BaseService.fetchWithAuth('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  static isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }

  static getToken() {
    return localStorage.getItem('accessToken');
  }
}

export default AuthService;
