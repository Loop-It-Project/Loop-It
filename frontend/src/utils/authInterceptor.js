// authInterceptor.js
class AuthInterceptor {
  static handleLogout = null; // Wird von App.jsx gesetzt

  // Check if token is expired
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Token läuft in den nächsten 5 Minuten ab
      return payload.exp < (currentTime + 300);
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  }

  // Refresh tokens
  static async refreshTokens() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        // Update tokens
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        console.log('✅ Token erfolgreich erneuert');
        return data.token;
      } else {
        throw new Error(data.error || 'Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      
      // Cleanup bei fehlgeschlagenem Refresh
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      throw error;
    }
  }

  // Token-Validation und automatisches Logout
  static async handleResponse(response, originalRequest) {
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      
      // Wenn Token abgelaufen, versuche Refresh
      if (data.errorCode === 'TOKEN_EXPIRED' || data.error?.includes('expired')) {
        try {
          console.log('🔄 Token abgelaufen - versuche Refresh...');
          const newToken = await this.refreshTokens();
          
          // Original Request mit neuem Token wiederholen
          const retryResponse = await fetch(originalRequest.url, {
            ...originalRequest.options,
            headers: {
              ...originalRequest.options.headers,
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          return retryResponse;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Fallback: User ausloggen
          if (this.handleLogout) {
            this.handleLogout('token_expired');
          }
          throw new Error('Session abgelaufen. Bitte melde dich erneut an.');
        }
      } else {
        // Anderer 401 Fehler
        if (this.handleLogout) {
          this.handleLogout('unauthorized');
        }
        throw new Error('Authentifizierung fehlgeschlagen.');
      }
    }
    
    return response;
  }

  // Setup logout handler
  static setLogoutHandler(logoutFunction) {
    this.handleLogout = logoutFunction;
  }
}

export default AuthInterceptor;