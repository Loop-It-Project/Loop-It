class AuthInterceptor {
  static handleLogout = null; // Wird von App.jsx gesetzt
  static isRefreshing = false;
  static refreshPromise = null;

    // Token automatisch erneuern
  static async refreshTokens() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Neue Tokens speichern
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          console.log('✅ Tokens erfolgreich erneuert');
          resolve(data.token);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        
        // Cleanup bei Fehler
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (this.handleLogout) {
          this.handleLogout();
        }
        
        reject(error);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }

  // Token-Validation und automatisches Logout
  static async handleResponse(response, originalRequest) {
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      
      // Wenn Token abgelaufen, versuche Refresh
      if (data.errorCode === 'TOKEN_EXPIRED') {
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
            this.handleLogout();
          }
          throw new Error('Session abgelaufen. Bitte melde dich erneut an.');
        }
      } else {
        // Anderer 401 Fehler
        if (this.handleLogout) {
          this.handleLogout();
        }
        throw new Error('Authentifizierung fehlgeschlagen.');
      }
    }
    
    return response;
  }

  // Prüfe ob Token noch gültig ist (optional - für zusätzliche Sicherheit)
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Token läuft in den nächsten 2 Minuten ab
      return payload.exp < (currentTime + 120);
    } catch (error) {
      return true;
    }
  }

  static setLogoutHandler(logoutHandler) {
    this.handleLogout = logoutHandler;
  }
}

export default AuthInterceptor;