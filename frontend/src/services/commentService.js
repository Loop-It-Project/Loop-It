import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class CommentService {
  // Comment hinzufügen
  static async addComment(postId, content, parentId = null) {
    try {
      // console.log('🔄 Adding comment:', { postId, content, parentId }); 

      const requestBody = { 
        content, 
        ...(parentId && { parentId })
      };

      // console.log('📤 Request body:', requestBody);

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // console.log('📥 Response status:', response.status); 

      const data = await response.json();
      // console.log('📥 Response data:', data); 

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comments abrufen
  static async getPostComments(postId, page = 1, limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments?page=${page}&limit=${limit}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data, pagination: data.pagination } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get comments error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comment liken/unliken
  static async toggleCommentLike(commentId) {
    try {
      // console.log('🔄 Toggle comment like:', commentId);

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/comments/${commentId}/like`, {
        method: 'POST'
      });

      const data = await response.json();
      // console.log('📥 Comment like response:', data);

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Toggle comment like error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reply zu Comment hinzufügen
  static async addCommentReply(postId, commentId, content) {
    try {
      // console.log('🔄 Adding comment reply:', { postId, commentId, content });

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      // console.log('📥 Comment reply response:', data);

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment reply error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Replies für Comment abrufen
  static async getCommentReplies(commentId, page = 1, limit = 10) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data, pagination: data.pagination } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get comment replies error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default CommentService;