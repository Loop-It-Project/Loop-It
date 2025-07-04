const API_URL = import.meta.env.VITE_API_URL;

class UserService {
  
  // Auth Headers
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Eigenes Profil abrufen
  static async getUserProfile() {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
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
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/users/profile/${username}`, {
        method: 'GET',
        headers,
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
      const response = await fetch(`${API_URL}/api/users/settings`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
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
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
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
      const response = await fetch(`${API_URL}/api/users/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
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
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default UserService;