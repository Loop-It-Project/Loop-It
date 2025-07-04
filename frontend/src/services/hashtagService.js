const API_URL = '';

class HashtagService {
  // Universe für Hashtag finden
  static async findUniverseByHashtag(hashtag) {
    try {
      // # entfernen falls vorhanden
      const cleanHashtag = hashtag.replace('#', '').toLowerCase();
      
      const response = await fetch(
        `${API_URL}/api/hashtags/${cleanHashtag}/universe`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          universe: data.data
        };
      } else {
        return {
          success: false,
          error: data.error,
          hashtag: cleanHashtag
        };
      }
    } catch (error) {
      console.error('Error finding universe by hashtag:', error);
      return {
        success: false,
        error: error.message,
        hashtag: hashtag
      };
    }
  }

  // Hashtag-Suche für Autocomplete
  static async searchHashtags(query) {
    try {
      const response = await fetch(
        `${API_URL}/api/hashtags/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          hashtags: data.data || []
        };
      } else {
        return {
          success: false,
          error: data.error
        };
      }
    } catch (error) {
      console.error('Error searching hashtags:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Hashtag aus Text extrahieren
  static extractHashtagsFromText(text) {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  }

  // ✅ NEU: Hashtag validieren
  static isValidHashtag(hashtag) {
    const cleanHashtag = hashtag.replace('#', '');
    return /^[a-zA-Z0-9_]+$/.test(cleanHashtag) && cleanHashtag.length > 0;
  }
}

export default HashtagService;