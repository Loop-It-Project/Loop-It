import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class PostService {
  // Post erstellen
  static async createPost(postData) {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: BaseService.getAuthHeaders(),
        body: JSON.stringify(postData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Create post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Post löschen
  static async deletePost(postId) {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: BaseService.getAuthHeaders(),
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Delete post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Post liken/unliken
  static async toggleLike(postId) {
    try {
      console.log('🔍 Frontend toggleLike called for postId:', postId);
    
    // ERWEITERTE NETWORK DEBUG-INFO
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/posts/${postId}/like`;
    
    console.log('🔍 Frontend: Request details:', {
      url,
      method: 'POST',
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 30) + '...' : 'none',
      API_URL
    });
      
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Frontend: Raw response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

      const result = await response.json();
      console.log('🔍 Frontend toggleLike response:', result);
      
      if (response.ok && result.success) {
        // Konsistente Response-Struktur
        return { 
          success: true, 
          data: {
            isLiked: result.data.isLiked,
            likeCount: result.data.likeCount
          }
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to toggle like' 
        };
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }

  // Like-Status abrufen
  static async getLikeStatus(postId) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/like-status`);

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get like status error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Post Share tracken
  static async sharePost(postId, shareType, metadata = {}) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shareType, metadata })
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Share post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Share Statistics abrufen
  static async getShareStatistics(postId) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/${postId}/share-statistics`);
      const data = await response.json();
      
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get share statistics error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Trending Shares abrufen
  static async getTrendingShares(timeframe = '24h', limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(`${API_URL}/api/posts/trending-shares?timeframe=${timeframe}&limit=${limit}`);
      const data = await response.json();
      
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get trending shares error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default PostService;