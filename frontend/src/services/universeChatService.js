import BaseService from './baseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class UniverseChatService extends BaseService {
  
  // Chat Room beitreten
  static async joinUniverseChat(universeId) {
    try {
      const response = await BaseService.fetchWithAuth(`/universe-chat/${universeId}/join`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to join universe chat' };
      }

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Join universe chat error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Chat Room verlassen
  static async leaveUniverseChat(universeId) {
    try {
      const response = await BaseService.fetchWithAuth(`/universe-chat/${universeId}/leave`, {
        method: 'POST'
      });

        if (!response.ok) {
          const errorData = await response.json();
            return { success: false, error: errorData.error || 'Failed to leave universe chat' };
        };

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Leave universe chat error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachricht senden
  static async sendMessage(universeId, content) {
    try {
      const response = await BaseService.fetchWithAuth(`/universe-chat/${universeId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Failed to send message' };
        };

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Send universe chat message error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachrichten abrufen
  static async getMessages(universeId, page = 1, limit = 50) {
    try {
      const response = await BaseService.fetchWithAuth(
        `/universe-chat/${universeId}/messages?page=${page}&limit=${limit}`
      );

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get universe chat messages error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Teilnehmer abrufen
  static async getParticipants(universeId) {
    try {
      const response = await BaseService.fetchWithAuth(`/universe-chat/${universeId}/participants`);

      const data = await response.json();
      return response.ok ? { success: true, participants: data.participants } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get universe chat participants error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachricht löschen (Moderation)
  static async deleteMessage(messageId, reason) {
    try {
      const response = await BaseService.fetchWithAuth(`/universe-chat/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      console.error('Delete universe chat message error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default UniverseChatService;