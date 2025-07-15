import AuthInterceptor from '../utils/authInterceptor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class BaseService {
  static getAuthHeaders() {
    const token = BaseService.getToken();
    
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
      let token = BaseService.getToken();

    // ERWEITERTE DEBUG-INFO
    console.log('🔍 BaseService.fetchWithAuth called:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenExpired: AuthInterceptor.isTokenExpired(token)
    });
    
    if (AuthInterceptor.isTokenExpired(token)) {
      console.log('🔄 Token läuft bald ab - erneuere präventiv...');
      try {
        token = await AuthInterceptor.refreshTokens();
      } catch (refreshError) {
        console.error('Preventive token refresh failed:', refreshError);
      }
    }

      const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });

      return await AuthInterceptor.handleResponse(response, { url: fullUrl, options });
    } catch (error) {
      console.error('BaseService request error:', error);
      throw error;
    }
  }

  static getApiUrl() {
    return API_URL;
  }

  static getToken() {
    return localStorage.getItem('token');
  }
}

export default BaseService;