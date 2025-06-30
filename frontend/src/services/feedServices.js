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
}

export default FeedService;