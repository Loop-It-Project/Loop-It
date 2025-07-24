import BaseService from './baseService';

class UserService {

  // Eigenes Profil abrufen
  static async getUserProfile() {
    try {
      const response = await BaseService.fetchWithAuth(`/users/profile`);
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
      const response = await BaseService.fetchWithAuth(`/users/profile/${username}`);
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
      const response = await BaseService.fetchWithAuth(`/users/settings`);

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
      const response = await BaseService.fetchWithAuth(`/users/profile`, {
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
      const response = await BaseService.fetchWithAuth(`/users/settings`, {
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
      const response = await BaseService.fetchWithAuth(`/users/change-password`, {
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
      const response = await BaseService.fetchWithAuth(`/users/geo-settings`);

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
      const response = await BaseService.fetchWithAuth(`/users/geo-settings`, {
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
      const response = await BaseService.fetchWithAuth(`/users/location`, {
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

  // Message Settings abrufen
  static async getMessageSettings() {
    try {
      const response = await BaseService.fetchWithAuth(`/users/message-settings`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get message settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Message Settings aktualisieren
  static async updateMessageSettings(allowMessagesFrom) {
    try {
      const response = await BaseService.fetchWithAuth(`/users/message-settings`, {
        method: 'PUT',
        body: JSON.stringify({ allowMessagesFrom })
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Update message settings error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default UserService;