// baseService.js
import AuthInterceptor from '../utils/authInterceptor';

class BaseService {
  static getApiUrl() {
    // Base URL from environment (should be http://localhost:3000 without /api)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Add /api suffix here
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    
    console.log('BaseService API URL:', apiUrl);
    return apiUrl;
  }

  // Auth Headers für Legacy-Services die noch direct fetch verwenden
  static getAuthHeaders() {
    const token = localStorage.getItem('token'); // KORRIGIERT: 'token' statt 'accessToken'
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Token Helper
  static getToken() {
    return localStorage.getItem('token'); // KORRIGIERT: 'token' statt 'accessToken'
  }

  // Fix Media URLs vom Backend
  static fixMediaUrl(url) {
    if (!url) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  }

  // Process Media Object
  static processMediaObject(mediaItem) {
    if (!mediaItem) return null;
    
    return {
      ...mediaItem,
      url: this.fixMediaUrl(mediaItem.url),
      thumbnailUrl: mediaItem.thumbnailUrl ? this.fixMediaUrl(mediaItem.thumbnailUrl) : null
    };
  }

  // KORRIGIERTE fetchWithAuth Methode
  static async fetchWithAuth(endpoint, options = {}) {
    const apiUrl = this.getApiUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
    
    // Token aus localStorage holen
    let token = localStorage.getItem('token');
    
    // Prüfe ob Token existiert
    if (!token) {
      console.error('❌ Kein Token gefunden - User muss eingeloggt sein');
      throw new Error('Authentication required');
    }

    // Prüfe Token-Ablauf
    try {
      if (AuthInterceptor.isTokenExpired(token)) {
        console.log('🔄 Token abgelaufen - versuche Refresh...');
        token = await AuthInterceptor.refreshTokens();
      }
    } catch (refreshError) {
      console.error('❌ Token refresh fehlgeschlagen:', refreshError);
      // Logout triggern
      if (AuthInterceptor.handleLogout) {
        AuthInterceptor.handleLogout();
      }
      throw new Error('Authentication failed');
    }

    // Request mit Token
    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    console.log('🚀 BaseService Request:', {
      url,
      method: requestOptions.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'None'
    });

    try {
      const response = await fetch(url, requestOptions);
      
      // AuthInterceptor für Response-Handling verwenden
      return await AuthInterceptor.handleResponse(response, { url, options: requestOptions });
    } catch (error) {
      console.error('❌ BaseService Request Error:', error);
      throw error;
    }
  }

  static async fetch(endpoint, options = {}) {
    const apiUrl = this.getApiUrl();
    const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
    
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    return fetch(url, requestOptions);
  }
}

export default BaseService;