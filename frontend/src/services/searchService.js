import BaseService from './baseService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SearchService extends BaseService {
  
  // Search History abrufen
  static async getSearchHistory(limit = 10) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/search/history?limit=${limit}`, {
        method: 'GET'
      });

      const data = await response.json();
      return response.ok 
        ? { success: true, data: data.data } 
        : { success: false, error: data.error };
    } catch (error) {
      console.error('Get search history error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Search History Item löschen
  static async deleteSearchHistoryItem(historyId) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/search/history/${historyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      return response.ok 
        ? { success: true, message: data.message } 
        : { success: false, error: data.error };
    } catch (error) {
      console.error('Delete search history item error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Komplette Search History löschen
  static async clearSearchHistory() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/api/search/history`, {
        method: 'DELETE'
      });

      const data = await response.json();
      return response.ok 
        ? { success: true, message: data.message } 
        : { success: false, error: data.error };
    } catch (error) {
      console.error('Clear search history error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Search with History (verwendet existing FeedService.searchUniversesAndHashtags)
  static async searchWithHistory(query) {
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      return response.ok 
        ? { success: true, data: data.results || [] } 
        : { success: false, error: data.error };
    } catch (error) {
      console.error('Search with history error:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export default SearchService;