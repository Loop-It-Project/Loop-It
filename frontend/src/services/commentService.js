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
  
  // Get comments preview (top comments)
  static async getCommentsPreview(postId, limit = 3) {
    try {
      const response = await BaseService.fetchWithAuth(`/posts/${postId}/comments?page=1&limit=${limit}&sort=top`);

      const data = await response.json();
      
      if (response.ok) {
        return { 
          success: true, 
          data: data.data, 
          totalComments: data.total || data.pagination?.total || 0,
          hasMore: (data.total || 0) > limit
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Get comments preview error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comment liken/unliken
  static async toggleCommentLike(commentId, postId = null) {
    try {
      console.log('🔍 CommentService.toggleCommentLike:', { commentId, postId });

      let endpoint;
      if (postId) {
        // Bevorzugte Route mit postId context
        endpoint = `/posts/${postId}/comments/${commentId}/like`;
      } else {
        // Fallback für backwards compatibility
        endpoint = `/posts/comments/${commentId}/like`;
      }

      console.log('🔍 Using endpoint:', endpoint);

      const response = await BaseService.fetchWithAuth(endpoint, {
        method: 'POST'
      });

      console.log('🔍 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Toggle comment like response:', data);
        
        return { 
          success: true, 
          data: {
            isLiked: data.data?.isLiked ?? data.isLiked,
            likeCount: data.data?.likeCount ?? data.likeCount
          }
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Toggle comment like failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        return { 
          success: false, 
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      console.error('❌ Toggle comment like error:', error);
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