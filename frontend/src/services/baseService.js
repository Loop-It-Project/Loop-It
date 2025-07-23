class BaseService {
  static getApiUrl() {
    // Base URL from environment (should be http://loadbalancer without /api)
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Add /api suffix here
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    
    console.log('BaseService API URL:', apiUrl);
    return apiUrl;
  }

  // Fix Media URLs vom Backend
  static fixMediaUrl(url) {
    if (!url) return null;
    
    // Falls URL localhost:3000 enthält, ersetze mit korrekter Base URL
    if (url.includes('localhost:3000')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const correctedUrl = url.replace('http://localhost:3000', baseUrl);
      console.log('🔧 Fixed media URL:', { original: url, corrected: correctedUrl });
      return correctedUrl;
    }
    
    return url;
  }

  // Process Media Object
  static processMediaObject(mediaItem) {
    if (!mediaItem) return null;
    
    return {
      ...mediaItem,
      url: this.fixMediaUrl(mediaItem.url),
      thumbnailUrl: this.fixMediaUrl(mediaItem.thumbnailUrl)
    };
  }

  static async fetchWithAuth(endpoint, options = {}) {
    // endpoint should NOT include /api prefix
    // e.g., endpoint = '/auth/register'
    const baseApiUrl = this.getApiUrl();
    const url = `${baseApiUrl}${endpoint}`;
    
    console.log('🔗 API Request URL:', url);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });
      
      console.log('📡 API Response:', response.status, response.url);
      return response;
    } catch (error) {
      console.error('❌ API Request Error:', error);
      throw error;
    }
  }

  static async fetch(endpoint, options = {}) {
    return this.fetchWithAuth(endpoint, options);
  }
}

export default BaseService;
