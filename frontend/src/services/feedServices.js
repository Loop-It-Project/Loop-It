import AuthInterceptor from '../utils/authInterceptor';

// API_URL korrekt definieren
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class FeedService {
  // Erweiterte Auth-Headers mit Token-Validation
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    
    // Prüfe Token vor jeder Request
    if (AuthInterceptor.isTokenExpired(token)) {
      console.warn('🔒 Token ist abgelaufen - initiiere Logout');
      AuthInterceptor.handleLogout?.();
      throw new Error('Session abgelaufen');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Wrapper für fetch mit automatischem Token-Handling
  static async fetchWithAuth(url, options = {}) {
    try {
      let token = localStorage.getItem('token');
      
      // Prüfe ob Token erneuert werden muss
      if (AuthInterceptor.isTokenExpired(token)) {
        console.log('🔄 Token läuft bald ab - erneuere präventiv...');
        try {
          token = await AuthInterceptor.refreshTokens();
        } catch (refreshError) {
          console.error('Preventive token refresh failed:', refreshError);
          // Verwende alten Token und lass Backend entscheiden
        }
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers
        }
      });

      // Response durch Interceptor leiten
      return await AuthInterceptor.handleResponse(response, { url, options });
      
    } catch (error) {
      throw error;
    }
  }

  // Beispiel-Methode mit neuem fetchWithAuth
  static async getUserUniverses(page = 1, limit = 20) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/universes/user/my-universes?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user universes:', error);
      throw error;
    }
  }

  // Weitere Methoden mit fetchWithAuth aktualisieren
  static async getOwnedUniverses(page = 1, limit = 20) {
    try {
      const response = await this.fetchWithAuth(
        `${API_URL}/api/universes/user/owned?page=${page}&limit=${limit}`
      );
    
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    
      return await response.json();
    } catch (error) {
      console.error('Error fetching owned universes:', error);
      throw error;
    }
  }

  // Personal Feed abrufen
  static async getPersonalFeed(page = 1, limit = 20, sortBy = 'newest') {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/personal?page=${page}&limit=${limit}&sortBy=${sortBy}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
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
            // Optional auth header für bessere Experience
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
  static async getTrendingFeed(timeframe = '24h', limit = 10) {
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

  // User's Universes abrufen
  static async getUserUniverses(page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/user/my-universes?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user universes:', error);
      throw error;
    }
  }

  // Universe beitreten
  static async joinUniverse(universeSlug) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/join`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining universe:', error);
      throw error;
    }
  }

  // Universe verlassen
  static async leaveUniverse(universeSlug) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/leave`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );
    
      const data = await response.json();
    
      if (response.ok) {
        return { success: true, ...data };
      } else {
        // ✅ Erweiterte Error-Information weiterleiten
        return { 
          success: false, 
          error: data.error || 'Failed to leave universe',
          errorCode: data.errorCode || null
        };
      }
    } catch (error) {
      console.error('Error leaving universe:', error);
      return { 
        success: false, 
        error: 'Network error' 
      };
    }
  }

  // Universes entdecken
  static async discoverUniverses(category = null, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (category) {
        params.append('category', category);
      }

      const response = await fetch(
        `${API_URL}/api/universes/discover?${params}`,
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
      console.error('Error discovering universes:', error);
      throw error;
    }
  }

  // Universe erstellen
  static async createUniverse(universeData) {
    try {
      const response = await fetch(`${API_URL}/api/universes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(universeData)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to create universe' };
      }
    } catch (error) {
      console.error('Create universe error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Post erstellen
  static async createPost(postData) {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(postData)
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Create post error:', error);
      return { success: false, error: 'Network error' };
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

  // User's eigene Universes abrufen (erstellt)
  static async getOwnedUniverses(page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/user/owned?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );
    
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    
      return await response.json();
    } catch (error) {
      console.error('Error fetching owned universes:', error);
      throw error;
    }
  }

  // Post löschen
  static async deletePost(postId) {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
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
      const response = await this.fetchWithAuth(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST'
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Toggle like error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Like-Status abrufen
  static async getLikeStatus(postId) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/posts/${postId}/like-status`);

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get like status error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comment hinzufügen
  static async addComment(postId, content, parentId = null) {
    try {
      console.log('🔄 Adding comment:', { postId, content, parentId }); 

      // Sicherstellen dass parentId nur UUID oder undefined ist
      const requestBody = { 
        content, 
        ...(parentId && { parentId }) // Nur hinzufügen wenn parentId truthy ist
      };

      console.log('📤 Request body:', requestBody);

      const response = await this.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status); 

      const data = await response.json();
      console.log('📥 Response data:', data); 

      // Backend gibt { success: true, data: comment } zurück
      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Comments abrufen
  static async getPostComments(postId, page = 1, limit = 20) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments?page=${page}&limit=${limit}`);

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
      console.log('🔄 Toggle comment like:', commentId);

      const response = await this.fetchWithAuth(`${API_URL}/api/posts/comments/${commentId}/like`, {
        method: 'POST'
      });

      const data = await response.json();
      console.log('📥 Comment like response:', data);

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Toggle comment like error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Reply zu Comment hinzufügen
  static async addCommentReply(postId, commentId, content) {
    try {
      console.log('🔄 Adding comment reply:', { postId, commentId, content });

      const response = await this.fetchWithAuth(`${API_URL}/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      console.log('📥 Comment reply response:', data);

      return response.ok ? { success: true, data: data.data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Add comment reply error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Replies für Comment abrufen
  static async getCommentReplies(commentId, page = 1, limit = 10) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/posts/comments/${commentId}/replies?page=${page}&limit=${limit}`);

      const data = await response.json();
      return response.ok ? { success: true, data: data.data, pagination: data.pagination } : { success: false, error: data.error };
    } catch (error) {
      console.error('Get comment replies error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Universe Details abrufen
  static async getUniverseDetails(universeSlug) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      // Token hinzufügen falls vorhanden (für Membership-Status)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/details`,
        { 
          method: 'GET',
          headers 
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data || data };
      } else {
        return { success: false, error: data.error || 'Failed to get universe details' };
      }
    } catch (error) {
      console.error('Error fetching universe details:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Universe Members abrufen
  static async getUniverseMembers(universeSlug, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/members?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.data || data };
      } else {
        return { success: false, error: data.error || 'Failed to get universe members' };
      }
    } catch (error) {
      console.error('Error fetching universe members:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Universe löschen
  static async deleteUniverse(universeSlug) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to delete universe' };
      }
    } catch (error) {
      console.error('Error deleting universe:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Eigentümerschaft übertragen
  static async transferUniverseOwnership(universeSlug, newOwnerId) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/transfer-ownership`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ newOwnerId })
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Failed to transfer ownership' };
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
      return { success: false, error: 'Network error' };
    }
  }
  
  // Universe-Name prüfen
  static async checkUniverseName(name) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/check-name?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    
      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Error checking universe name:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default FeedService;