import BaseService from './baseService';
import PostService from './postService';
import UniverseService from './universeService';

const API_URL = BaseService.getApiUrl();

class FeedService {

  // Universe-Methoden weiterleiten an UniverseService
  static async getUniverseDetails(universeSlug) {
    return UniverseService.getUniverseDetails(universeSlug);
  }

  static async joinUniverse(universeSlug) {
    return UniverseService.joinUniverse(universeSlug);
  }

  static async leaveUniverse(universeSlug) {
    return UniverseService.leaveUniverse(universeSlug);
  }

  static async getUniverseMembers(universeSlug, page = 1, limit = 20) {
    return UniverseService.getUniverseMembers(universeSlug, page, limit);
  }

  static async getUserUniverses(page = 1, limit = 20) {
    return UniverseService.getUserUniverses(page, limit);
  }

  static async getOwnedUniverses(page = 1, limit = 20) {
    return UniverseService.getOwnedUniverses(page, limit);
  }

  static async createUniverse(universeData) {
    return UniverseService.createUniverse(universeData);
  }

  static async deleteUniverse(universeSlug) {
    return UniverseService.deleteUniverse(universeSlug);
  }

  static async transferUniverseOwnership(universeSlug, newOwnerId) {
    return UniverseService.transferUniverseOwnership(universeSlug, newOwnerId);
  }

  static async checkUniverseName(name) {
    return UniverseService.checkUniverseName(name);
  }

  static async discoverUniverses(category = null, page = 1, limit = 20) {
    return UniverseService.discoverUniverses(category, page, limit);
  }

  // Post-Methoden weiterleiten an PostService
  static async createPost(postData) {
    return PostService.createPost(postData);
  }

  static async deletePost(postId) {
    return PostService.deletePost(postId);
  }

  static async toggleLike(postId) {
    return PostService.toggleLike(postId);
  }

  static async getLikeStatus(postId) {
    return PostService.getLikeStatus(postId);
  }

  // Personal Feed abrufen
  static async getPersonalFeed(page = 1, limit = 20, sortBy = 'newest') {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/personal?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          method: 'GET',
          headers: BaseService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching personal feed:', error);
      throw error;
    }
  }

  // Universe Feed abrufen
  static async getUniverseFeed(universeSlug, page = 1, limit = 20, sortBy = 'newest') {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/universe/${universeSlug}?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching universe feed:', error);
      throw error;
    }
  }

  // Trending Feed abrufen
  static async getTrendingFeed(timeframe = '7d', page = 1, limit = 20) {
    try {
      console.log(`🔥 Frontend: Requesting trending feed:`, { timeframe, page, limit });

      const params = new URLSearchParams({
        timeframe: timeframe.toString(),
        page: page.toString(),
        limit: limit.toString()
      });

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/feed/trending?${params}`,
        {
          method: 'GET',
          headers
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log(`✅ Frontend: Trending feed received:`, {
        success: result.success,
        postsCount: result.data?.posts?.length || 0,
        hasMore: result.data?.pagination?.hasMore
      });

      return result;
    } catch (error) {
      console.error('❌ Frontend: Error fetching trending feed:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  static async getTrendingFeedLegacy(timeframe = '24h', limit = 10) {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/trending?timeframe=${timeframe}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trending feed:', error);
      throw error;
    }
  }

  // Suche nach Universes und Hashtags
  static async searchUniversesAndHashtags(query) {
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      return response.ok ? { success: true, data: data.results || [] } : { success: false, error: data.error };
    } catch (error) {
      console.error('Search error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default FeedService;