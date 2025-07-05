import BaseService from './baseService';

const API_URL = BaseService.getApiUrl();

class HashtagService {
  // Universe für Hashtag finden
  static async findUniverseByHashtag(hashtag) {
    try {
      console.log('🔄 Looking for universe with hashtag:', hashtag);
      
      // # entfernen falls vorhanden
      const cleanHashtag = hashtag.replace('#', '').toLowerCase();
      console.log('🔍 Clean hashtag:', cleanHashtag);
      
      const url = `${API_URL}/api/hashtags/${cleanHashtag}/universe`;
      console.log('🌐 Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      const data = await response.json();
      console.log('📥 Hashtag API response:', data);
      
      if (response.ok && data.success) {
        return {
          success: true,
          universe: data.data
        };
      } else {
        return {
          success: false,
          error: data.error || 'Universe not found',
          hashtag: cleanHashtag
        };
      }
    } catch (error) {
      console.error('❌ Error finding universe by hashtag:', error);
      return {
        success: false,
        error: error.message || 'Network error',
        hashtag: hashtag
      };
    }
  }

  // Hashtag-Suche für Autocomplete
  static async searchHashtags(query) {
    try {
      const response = await fetch(
        `${API_URL}/api/hashtags/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      return response.ok ? { success: true, data: data.hashtags || [] } : { success: false, error: data.error };
    } catch (error) {
      console.error('Hashtag search error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Hashtag aus Text extrahieren
  static extractHashtagsFromText(text) {
    if (!text) return [];
    
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    
    return matches ? matches.map(match => match.slice(1)) : [];
  }

  // Hashtag validieren
  static isValidHashtag(hashtag) {
    if (!hashtag) return false;
    
    const cleanHashtag = hashtag.replace('#', '');
    return /^[a-zA-Z0-9_]+$/.test(cleanHashtag) && cleanHashtag.length >= 2 && cleanHashtag.length <= 50;
  }
}

export default HashtagService;