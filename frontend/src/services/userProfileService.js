import BaseService from './baseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class UserProfileService extends BaseService {
  
  // User's Posts abrufen
  static async getUserPosts(username, page = 1, limit = 20, sortBy = 'newest') {
    try {
      const response = await BaseService.fetchWithAuth(`/users/profile/${username}/posts?page=${page}&limit=${limit}&sortBy=${sortBy}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user posts error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // User-Statistiken
  static async getUserStats(username) {
    try {
      const response = await BaseService.fetchWithAuth(`/users/profile/${username}/stats`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user stats error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freunde mit gemeinsamen Interessen
  static async getFriendsWithCommonInterests(limit = 10) {
    try {
      const response = await BaseService.fetchWithAuth(`/users/friends/common-interests?limit=${limit}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get friends with common interests error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Profil aktualisieren
  static async updateProfile(profileData) {
      try {
        // console.log('🔍 UserProfileService - Sending data:', profileData);

        const response = await BaseService.fetchWithAuth(`/users/profile`, {
          method: 'PUT',
          body: JSON.stringify(profileData)
        });

        const data = await response.json();

        // console.log('🔍 UserProfileService - Response status:', response.status);
        // console.log('🔍 UserProfileService - Response data:', data);

        if (response.ok) {
          return { success: true, data: data.data };
        } else {
          // Error-Weiterleitung
          return { 
            success: false, 
            error: data.error || data.message,
            errors: data.errors, // ← Validierungsfehler weiterleiten
            status: response.status
          };
        }
      } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: 'Network error' };
      }
    }
}

export default UserProfileService;