import BaseService from './baseService';

class AuthService {
  static async register(userData) {
    try {
      console.log('🔐 Attempting registration with data:', userData);
      
      // ✅ CORRECT: endpoint WITHOUT /api prefix
      const response = await BaseService.fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      console.log('📧 Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Registration successful:', data);
        return { success: true, data };
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
      
      // ✅ CORRECT: endpoint WITHOUT /api prefix
      const response = await BaseService.fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('📧 Login response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('✅ Login successful');
        return { success: true, data };
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
      await BaseService.fetchWithAuth('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
