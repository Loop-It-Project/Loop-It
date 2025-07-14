import BaseService from './baseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ChatService extends BaseService {
  
  // Conversation erstellen oder abrufen
  static async getOrCreateConversation(targetUserId) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/chats/conversations`, {
        method: 'POST',
        body: JSON.stringify({ targetUserId })
      });

      const data = await response.json();
      return response.ok ? { success: true, ...data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get or create conversation error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // User's Conversations abrufen
  static async getUserConversations(page = 1, limit = 20) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations?page=${page}&limit=${limit}`
      );

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get user conversations error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachrichten einer Conversation abrufen
  static async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachricht senden
  static async sendMessage(conversationId, content, replyToId = null) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content, replyToId })
        }
      );

      const data = await response.json();
      return response.ok ? { success: true, message: data.message } : { success: false, error: data.error };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Nachrichten als gelesen markieren
  static async markMessagesAsRead(conversationId) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/read`,
        {
          method: 'PUT'
        }
      );

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Typing Indicator setzen
  static async setTyping(conversationId) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/typing`,
        {
          method: 'POST'
        }
      );

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      console.error('Set typing error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Typing Users abrufen
  static async getTypingUsers(conversationId) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/typing`
      );

      const data = await response.json();
      return response.ok ? { success: true, users: data.users } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get typing users error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Chat blockieren
  static async blockConversation(conversationId) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/chats/conversations/${conversationId}/block`,
        {
          method: 'PUT'
        }
      );

      const data = await response.json();
      return response.ok ? { success: true } : { success: false, error: data.error };
    } catch (error) {
      console.error('Block conversation error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default ChatService;