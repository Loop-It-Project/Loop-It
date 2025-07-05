import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class UniverseService {
  // User's Universes abrufen
  static async getUserUniverses(page = 1, limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(
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

  // Owned Universes abrufen
  static async getOwnedUniverses(page = 1, limit = 20) {
    try {
      const response = await BaseService.fetchWithAuth(
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

  // Universe beitreten
  static async joinUniverse(universeSlug) {
    try {
      const response = await fetch(
        `${API_URL}/api/universes/${universeSlug}/join`,
        {
          method: 'POST',
          headers: BaseService.getAuthHeaders(),
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
          headers: BaseService.getAuthHeaders(),
        }
      );
    
      const data = await response.json();
    
      if (response.ok) {
        return { success: true, ...data };
      } else {
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
        headers: BaseService.getAuthHeaders(),
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

  // Universe Details abrufen
  static async getUniverseDetails(universeSlug) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

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
          headers: BaseService.getAuthHeaders(),
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
          headers: BaseService.getAuthHeaders(),
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
          headers: BaseService.getAuthHeaders(),
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

export default UniverseService;