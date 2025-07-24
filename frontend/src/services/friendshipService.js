import BaseService from './baseService';

class FriendshipService extends BaseService {
  
  // Freundschaftsanfrage senden
  static async sendFriendRequest(username) {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/request`, {
        method: 'POST',
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Send friend request error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freundschaftsanfrage annehmen
  static async acceptFriendRequest(requestId) {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/request/${requestId}/accept`, {
        method: 'PUT'
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Accept friend request error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freundschaftsanfrage ablehnen
  static async declineFriendRequest(requestId) {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/request/${requestId}/decline`, {
        method: 'PUT'
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Decline friend request error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freund entfernen
  static async removeFriend(username) {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/${username}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Remove friend error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freunde eines Users abrufen
  static async getUserFriends(username, page = 1, limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(
        `/friendships/user/${username}?page=${page}&limit=${limit}`
      );

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user friends error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Ausstehende Anfragen abrufen
  static async getPendingRequests() {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/requests`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get pending requests error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Freundschaftsstatus prüfen
  static async getFriendshipStatus(username) {
    try {
      const response = await BaseService.fetchWithAuth(`/friendships/status/${username}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get friendship status error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default FriendshipService;