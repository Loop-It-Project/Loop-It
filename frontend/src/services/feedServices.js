const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class FeedService {
  // Helper für authentifizierte Requests
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Personal Feed abrufen
  static async getPersonalFeed(page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/personal?page=${page}&limit=${limit}`,
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
  static async getUniverseFeed(universeSlug, page = 1, limit = 20) {
    try {
      const response = await fetch(
        `${API_URL}/api/feed/universe/${universeSlug}?page=${page}&limit=${limit}`,
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error leaving universe:', error);
      throw error;
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

  // Post liken (für später)
  static async likePost(postId) {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      return response.ok ? { success: true, data } : { success: false, error: data.error };
    } catch (error) {
      console.error('Like post error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Universe Details abrufen
  static async getUniverseDetails(universeSlug) {
    try {
      console.log('🔍 FeedService: Getting universe details for:', universeSlug);
      
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
      
      console.log('🔍 FeedService: Response status:', response.status);
      
      const data = await response.json();
      
      console.log('🔍 FeedService: Response data:', data);
      
      if (response.ok) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || 'Failed to get universe details' };
      }
    } catch (error) {
      console.error('❌ FeedService: Error fetching universe details:', error);
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
      return response.ok ? { success: true, data } : { success: false, error: data.error };
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
      return response.ok ? { success: true, data } : { success: false, error: data.error };
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
      return response.ok ? { success: true, data } : { success: false, error: data.error };
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