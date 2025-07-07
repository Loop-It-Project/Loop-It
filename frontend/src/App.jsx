import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthInterceptor from './utils/authInterceptor';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UniversePage from './pages/UniversePage';
import AdminPanel from './pages/AdminPanelDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Hobbies from './pages/Hobbies';
import Header from './components/Header';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Imprint from './pages/Imprint';

// API_URL für die gesamte App definieren
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced Login Handler mit Token-Monitoring
  const handleLogin = async (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Optional: Check for admin permissions after login
    try {
      // This will be used later for admin access verification
      console.log('✅ User logged in:', userData.username);
    } catch (error) {
      console.error('Post-login admin check failed:', error);
    }
  };

  // Enhanced Logout Handler
  const handleLogout = async (reason = 'manual') => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && reason === 'manual') {
        // Bei manuellem Logout Backend informieren
        await fetch(`${API_URL}/api/auth/logout`, {
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
      
      // User-freundliche Nachrichten je nach Grund
      if (reason === 'tokenExpired') {
        console.log('🔒 Session expired - user will be redirected to login');
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
              handleLogout('tokenExpired');
            }
          } else {
            setUser(JSON.parse(savedUser));
            console.log('✅ Session wiederhergestellt');
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        handleLogout('sessionError');
      } finally {
        setIsLoading(false);
      }
    };

    // Auth-Interceptor konfigurieren
    AuthInterceptor.setLogoutHandler(() => {
      handleLogout('tokenExpired');
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
      {/* Header nur für eingeloggte User anzeigen */}
      {user && <Header user={user} setUser={setUser} onLogout={handleLogout} />}
      
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
          <Route 
            path="/hobbies"
            element={
              <PublicRoute user={user}>
                <Hobbies />
              </PublicRoute>
            }
          />
          <Route 
            path="/privacypolicy"
            element={
              <PublicRoute user={user}>
                <PrivacyPolicy />
              </PublicRoute>
            }
          />
          <Route 
            path="/imprint"
            element={
              <PublicRoute user={user}>
                <Imprint />
              </PublicRoute>
            }
          />


          {/* Protected Routes - nur für eingeloggte User */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard user={user} onLogout={() => handleLogout('manual')} />
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
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute user={user}>
                <Settings user={user} onLogout={() => handleLogout('manual')} />
              </ProtectedRoute>
            } 
          />

          {/* Admin Route */}
          <Route 
          path="/admin" 
          element={user ? 
          <AdminPanel user={user} onLogout={() => handleLogout('manual')} /> : 
          <Navigate to="/login" />} />

          {/* Fallback Route */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
          />
        </Routes>
      </div>
      
      <Footer />
    </Router>
  );
}

export default App;