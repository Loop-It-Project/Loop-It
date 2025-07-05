import AuthInterceptor from '../utils/authInterceptor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class BaseService {
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    if (AuthInterceptor.isTokenExpired(token)) {
      console.warn('🔒 Token ist abgelaufen - initiiere Logout');
      AuthInterceptor.handleLogout?.();
      throw new Error('Session abgelaufen');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async fetchWithAuth(url, options = {}) {
    try {
      let token = localStorage.getItem('token');
      
      if (AuthInterceptor.isTokenExpired(token)) {
        console.log('🔄 Token läuft bald ab - erneuere präventiv...');
        try {
          token = await AuthInterceptor.refreshTokens();
        } catch (refreshError) {
          console.error('Preventive token refresh failed:', refreshError);
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });

      return await AuthInterceptor.handleResponse(response, { url, options });
      
    } catch (error) {
      throw error;
    }
  }

  static getApiUrl() {
    return API_URL;
  }
}

export default BaseService;