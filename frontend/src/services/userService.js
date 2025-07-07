import BaseService from './baseService';
import AuthInterceptor from '../utils/authInterceptor';

const API_URL = BaseService.getApiUrl();

class UserService {
  
  // Auth Headers mit Token-Validation
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    // Prüfe Token vor jeder Request
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

  // Wrapper für fetch mit automatischem Token-Handling (wie im FeedService)
  static async fetchWithAuth(url, options = {}) {
    try {
      let token = localStorage.getItem('token');
      
      // Prüfe ob Token erneuert werden muss
      if (AuthInterceptor.isTokenExpired(token)) {
        console.log('🔄 Token läuft bald ab - erneuere präventiv...');
        try {
          token = await AuthInterceptor.refreshTokens();
        } catch (refreshError) {
          console.error('Preventive token refresh failed:', refreshError);
          // Verwende alten Token und lass Backend entscheiden
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

      // Response durch Interceptor leiten
      return await AuthInterceptor.handleResponse(response, { url, options });
    } catch (error) {
      console.error('UserService request error:', error);
      throw error;
    }
  }

  // Eigenes Profil abrufen
  static async getUserProfile() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/profile`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Öffentliches Profil abrufen
  static async getPublicUserProfile(username) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/profile/${username}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get public user profile error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // User Settings abrufen
  static async getUserSettings() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/settings`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Profil aktualisieren
  static async updateUserProfile(profileData) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Settings aktualisieren
  static async updateUserSettings(settingsData) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/settings`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update user settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Password ändern
  static async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Geo-Tracking Settings abrufen
  static async getGeoTrackingSettings() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/geo-settings`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get geo tracking settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Geo-Tracking Settings aktualisieren
  static async updateGeoTrackingSettings(settingsData) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/geo-settings`, {
        method: 'PUT',
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update geo tracking settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Standort aktualisieren
  static async updateUserLocation(locationData) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/users/location`, {
        method: 'PUT',
        body: JSON.stringify(locationData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update user location error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Browser-Geolocation abrufen
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 Minuten Cache
        }
      );
    });
  }
}

export default UserService;