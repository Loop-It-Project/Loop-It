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
      console.log('📸 FeedService: Requesting personal feed...', { page, limit, sortBy });

      const response = await fetch(
        `${API_URL}/api/feed/personal?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          method: 'GET',
          headers: BaseService.getAuthHeaders(),
        }
      );

      console.log('📸 FeedService: Personal feed response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📸 FeedService: Personal feed RAW response:', result);
      
      // ✅ ERWEITERT: Flexible Response-Struktur
      const posts = result.posts || result.data?.posts || [];
      
      console.log('📸 FeedService: Personal feed processed:', {
        success: result.success,
        postsCount: posts.length,
        hasResultPosts: !!result.posts,
        hasDataPosts: !!result.data?.posts,
        resultStructure: Object.keys(result),
        samplePost: posts[0] ? {
          id: posts[0].id,
          title: posts[0].title,
          hasMedia: !!posts[0].media,
          mediaCount: posts[0].media?.length || 0,
          mediaIds: posts[0].mediaIds,
          mediaData: posts[0].media
        } : null
      });

      // ✅ ERWEITERT: Jeder Post mit Media-Daten loggen
      if (posts && posts.length > 0) {
        posts.forEach((post, index) => {
          if (post.media && post.media.length > 0) {
            console.log(`📸 FeedService: Post ${index + 1} (${post.id}) has media:`, {
              mediaCount: post.media.length,
              mediaUrls: post.media.map(m => ({ id: m.id, url: m.url, thumbnailUrl: m.thumbnailUrl }))
            });
          }
        });
      }

      // ✅ KORRIGIERT: Return normalisierte Response
      return {
        success: result.success,
        posts: posts,
        pagination: result.pagination || result.data?.pagination || {
          page,
          limit,
          hasMore: false
        }
      };

    } catch (error) {
      console.error('❌ FeedService: Error fetching personal feed:', error);
      throw error;
    }
  }

  // Universe Feed laden
  static async getUniverseFeed(slug, page = 1, limit = 20, sortBy = 'newest') {
    try {
      console.log('📸 FeedService: Requesting universe feed...', { slug, page, limit, sortBy });

      const response = await fetch(
        `${API_URL}/api/feed/universe/${slug}?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          method: 'GET',
          headers: BaseService.getAuthHeaders(),
        }
      );

      console.log('📸 FeedService: Universe feed response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📸 FeedService: Universe feed RAW response:', result);
      
      // ✅ ERWEITERT: Flexible Response-Struktur
      const posts = result.posts || result.data?.posts || [];
      
      console.log('📸 FeedService: Universe feed processed:', {
        success: result.success,
        postsCount: posts.length,
        slug,
        samplePost: posts[0] ? {
          id: posts[0].id,
          title: posts[0].title,
          hasMedia: !!posts[0].media,
          mediaCount: posts[0].media?.length || 0
        } : null
      });

      // ✅ KORRIGIERT: Return normalisierte Response
      return {
        success: result.success,
        posts: posts,
        pagination: result.pagination || result.data?.pagination || {
          page,
          limit,
          hasMore: false
        }
      };

    } catch (error) {
      console.error('❌ FeedService: Error fetching universe feed:', error);
      throw error;
    }
  }

  // Trending Feed abrufen
  static async getTrendingFeed(timeframe = '7d', page = 1, limit = 20) {
    try {
      console.log('📸 FeedService: Requesting trending feed...', { timeframe, page, limit });

      const response = await fetch(
        `${API_URL}/api/feed/trending?timeframe=${timeframe}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: BaseService.getAuthHeaders(),
        }
      );

      console.log('📸 FeedService: Trending feed response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📸 FeedService: Trending feed RAW response:', result);
      
      // ✅ ERWEITERT: Flexible Response-Struktur
      const posts = result.posts || result.data?.posts || [];
      
      console.log('📸 FeedService: Trending feed processed:', {
        success: result.success,
        postsCount: posts.length,
        timeframe,
        samplePost: posts[0] ? {
          id: posts[0].id,
          title: posts[0].title,
          hasMedia: !!posts[0].media,
          mediaCount: posts[0].media?.length || 0
        } : null
      });

      // ✅ KORRIGIERT: Return normalisierte Response
      return {
        success: result.success,
        posts: posts,
        pagination: result.pagination || result.data?.pagination || {
          page,
          limit,
          hasMore: false
        }
      };

    } catch (error) {
      console.error('❌ FeedService: Error fetching trending feed:', error);
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