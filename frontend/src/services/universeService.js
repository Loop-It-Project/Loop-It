import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class UniverseService {
  // User's Universes abrufen
  static async getUserUniverses(page = 1, limit = 20) {
    try {
      console.log('📡 UniverseService.getUserUniverses:', { page, limit });
      
      const response = await BaseService.fetchWithAuth(
        `${API_URL}/api/universes/user/my-universes?page=${page}&limit=${limit}`
      );

      console.log('getUserUniverses response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ getUserUniverses response:', data);
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('❌ getUserUniverses error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Owned Universes abrufen
  static async getOwnedUniverses(page = 1, limit = 20) {
    try {
      console.log('📡 UniverseService.getOwnedUniverses:', { page, limit });
      
      const response = await BaseService.fetchWithAuth(
        `${API_URL}/api/universes/user/owned?page=${page}&limit=${limit}`
      );

      console.log('getOwnedUniverses response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ getOwnedUniverses response:', data);
      
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('❌ getOwnedUniverses error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Universe beitreten
  static async joinUniverse(universeSlug) {
    try {
      console.log('🚀 Joining universe:', universeSlug);

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/universes/${universeSlug}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Join response status:', response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP Error ${response.status}`;
        }

        console.error('Join universe error response:', errorMessage);
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      console.log('✅ Join universe success:', data);

      return { 
        success: true, 
        data: {
          membership: data.data?.membership || data.membership,
          universe: data.data?.universe || data.universe,
          // ✅ Membership status für UI
          isMember: true,
          membershipStatus: 'member'
        },
        message: data.message || 'Universe erfolgreich beigetreten'
      };

    } catch (error) {
      console.error('Join universe network error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Verbindung zum Server fehlgeschlagen' };
      }

      return { 
        success: false, 
        error: error.message || 'Netzwerkfehler beim Beitreten' 
      };
    }
  }

  // Universe verlassen
  static async leaveUniverse(universeSlug) {
    try {
      console.log('🚪 Leaving universe:', universeSlug);

      const response = await BaseService.fetchWithAuth(`${API_URL}/api/universes/${universeSlug}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Leave response status:', response.status);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch (jsonError) {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP Error ${response.status}`;
        }

        console.error('Leave universe error response:', errorMessage);
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      console.log('✅ Leave universe success:', data);

      return { 
        success: true, 
        data: {
          removedMembership: data.data?.removedMembership || data.removedMembership,
          universe: data.data?.universe || data.universe,
          // ✅ Membership status für UI
          isMember: false,
          membershipStatus: 'none'
        },
        message: data.message || 'Universe erfolgreich verlassen'
      };

    } catch (error) {
      console.error('Leave universe network error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Verbindung zum Server fehlgeschlagen' };
      }

      return { 
        success: false, 
        error: error.message || 'Netzwerkfehler beim Verlassen' 
      };
    }
  }

  // Universes entdecken - erweiterte Methode
  static async discoverUniverses(category = null, page = 1, limit = 20, sortBy = 'popular') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy
      });
    
      if (category) {
        params.append('category', category);
      }
    
      const response = await BaseService.fetchWithAuth(
        `${API_URL}/api/universes/discover?${params}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to discover universes' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error discovering universes:', error);
      return { success: false, error: 'Network error' };
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