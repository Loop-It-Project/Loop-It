import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class CommentService {
  // Comment hinzufügen
  static async addComment(postId, content, parentId = null) {
    try {

      const requestBody = { 
        content, 
        ...(parentId && { parentId })
      };

      const response = await BaseService.fetchWithAuth(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comments abrufen
  static async getPostComments(postId, page = 1, limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(`/posts/${postId}/comments?page=${page}&limit=${limit}`);

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
      const response = await BaseService.fetchWithAuth(`/comments/${commentId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data: {
            isLiked: data.data?.isLiked || data.isLiked,
            likeCount: data.data?.likeCount || data.likeCount
          }
        };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to toggle comment like' };
      }
    } catch (error) {
      console.error('Toggle comment like error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reply zu Comment hinzufügen
  static async addCommentReply(postId, commentId, content) {
    try {

      const response = await BaseService.fetchWithAuth(`/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment reply error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Replies für Comment abrufen
  static async getCommentReplies(commentId, page = 1, limit = 10) {
    try {
      const response = await BaseService.fetchWithAuth(`/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data, pagination: data.pagination } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get comment replies error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default CommentService;