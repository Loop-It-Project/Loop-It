import BaseService from './baseService';

class ChatPermissionService extends BaseService {
  
  // Prüfe ob User angeschrieben werden kann
  static async canMessageUser(targetUserId) {
    try {
      const response = await BaseService.fetchWithAuth(`/users/can-message/${targetUserId}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Can message user check error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default ChatPermissionService;