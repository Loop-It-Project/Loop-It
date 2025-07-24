import BaseService from './baseService';

class SwipeService extends BaseService {

  // Potentielle Matches abrufen
  static async getPotentialMatches(limit = 20) {
    try {
      // console.log('🔍 SwipeService: Getting potential matches...');

      const response = await BaseService.fetchWithAuth(`/swipe/potential-matches?limit=${limit}`);

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: Potential matches loaded:', data.data.matches.length);
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to load potential matches:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Swipe-Aktion verarbeiten
  static async processSwipe(targetId, action) {
    try {
      // console.log('💫 SwipeService: Processing swipe:', { targetId, action });

      const response = await BaseService.fetchWithAuth(`/swipe/swipe`, {
        method: 'POST',
        body: JSON.stringify({ targetId, action })
      });

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: Swipe processed:', data.data);
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to process swipe:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // User-Matches abrufen
  static async getUserMatches(limit = 50) {
    try {
      // console.log('🔍 SwipeService: Getting user matches...');

      const response = await BaseService.fetchWithAuth(`/swipe/matches?limit=${limit}`);

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: User matches loaded:', data.data.matches.length);
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to load matches:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Swipe-Präferenzen abrufen
  static async getSwipePreferences() {
    try {
      // console.log('🔍 SwipeService: Getting swipe preferences...');

      const response = await BaseService.fetchWithAuth(`/swipe/preferences`);

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: Swipe preferences loaded');
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to load preferences:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Swipe-Präferenzen aktualisieren
  static async updateSwipePreferences(preferences) {
    try {
      // console.log('🔄 SwipeService: Updating swipe preferences...');

      const response = await BaseService.fetchWithAuth(`/swipe/preferences`, {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: Swipe preferences updated');
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to update preferences:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Swipe-Statistiken abrufen
  static async getSwipeStats() {
    try {
      // console.log('🔍 SwipeService: Getting swipe stats...');

      const response = await BaseService.fetchWithAuth(`/swipe/stats`);

      const data = await response.json();
      
      if (response.ok) {
        // console.log('✅ SwipeService: Swipe stats loaded');
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to load stats:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Ausstehende Likes abrufen
  static async getPendingLikes() {
    try {
      // console.log('🔍 SwipeService: Getting pending likes...');

      const response = await BaseService.fetchWithAuth(`/swipe/pending-likes`);

      const data = await response.json();

      if (response.ok) {
        // console.log('✅ SwipeService: Pending likes loaded:', data.data.length);
        return { success: true, data: data.data };
      } else {
        console.error('❌ SwipeService: Failed to load pending likes:', data.error);
        return { success: false, error: data.error };
      }

    } catch (error) {
      console.error('❌ SwipeService: Network error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default SwipeService;