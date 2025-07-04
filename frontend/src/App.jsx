import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthInterceptor from './utils/authInterceptor';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UniversePage from './components/UniversePage';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced Login Handler mit Token-Monitoring
  const handleLogin = (userData, tokens) => {
    setUser(userData);
    
    // Tokens speichern
    localStorage.setItem('token', tokens.token);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('✅ User eingeloggt:', userData.username || userData.email);
  };

  // Enhanced Logout Handler
  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Backend über Logout informieren
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ refreshToken })
        }).catch(() => {}); // Ignoriere Fehler beim Logout
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Cleanup immer ausführen
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      
      const reason = localStorage.getItem('logoutReason') || 'Abgemeldet';
      localStorage.removeItem('logoutReason');
      
      if (reason === 'tokenExpired') {
        alert('Deine Session ist abgelaufen. Bitte melde dich erneut an.');
      }
    }
  };

  // Token-Validation beim App-Start
  useEffect(() => {
    const validateAndRestoreSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const savedUser = localStorage.getItem('user');
        
        if (token && refreshToken && savedUser) {
          // Prüfe Token-Gültigkeit
          if (AuthInterceptor.isTokenExpired(token)) {
            console.log('🔄 Gespeicherter Token ist abgelaufen - versuche Refresh...');
            try {
              await AuthInterceptor.refreshTokens();
              setUser(JSON.parse(savedUser));
              console.log('✅ Session wiederhergestellt');
            } catch (refreshError) {
              console.warn('Session konnte nicht wiederhergestellt werden');
              handleLogout();
            }
          } else {
            setUser(JSON.parse(savedUser));
            console.log('✅ Session wiederhergestellt');
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };

    // Auth-Interceptor konfigurieren
    AuthInterceptor.setLogoutHandler(() => {
      localStorage.setItem('logoutReason', 'tokenExpired');
      handleLogout();
    });

    validateAndRestoreSession();
  }, []);

  // Token-Refresh-Timer (optional)
  const startTokenRefreshTimer = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = (payload.exp * 1000) - Date.now();

      // Refresh 5 Minuten vor Ablauf
      const refreshTime = expiresIn - (5 * 60 * 1000);

      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            // API-Call für Token-Refresh
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('token', data.token);
              console.log('✅ Token erfolgreich erneuert');
              startTokenRefreshTimer(); // Nächsten Timer starten
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            handleLogout();
          }
        }, refreshTime);
      }
    } catch (error) {
      console.error('Token refresh timer error:', error);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-xl">Session wird validiert...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes - nur für nicht-eingeloggte User */}
          <Route 
            path="/" 
            element={
              <PublicRoute user={user}>
                <LandingPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute user={user}>
                <Login onLogin={handleLogin} />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute user={user}>
                <Register onLogin={handleLogin} />
              </PublicRoute>
            } 
          />

          {/* Protected Routes - nur für eingeloggte User */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/universe/:universeSlug" 
            element={
              <ProtectedRoute user={user}>
                <UniversePage user={user} />
              </ProtectedRoute>
            } 
          />
          {/* Settings Route hinzufügen */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute user={user}>
                <Settings user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Route */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;