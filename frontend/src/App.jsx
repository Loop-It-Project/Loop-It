import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import UniversePage from './components/UniversePage';
import Hobbies from './components/Hobbies';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [viewData, setViewData] = useState({}); // Für zusätzliche Navigation-Daten
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
    setIsLoading(false);
  }, []);

  const handleNavigate = (view, data = {}) => {
    setCurrentView(view);
    setViewData(data);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setViewData({});
    setCurrentView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Lädt...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'landing' && (
        <LandingPage onNavigate={handleNavigate} />
      )}
      {currentView === 'login' && (
        <Login onNavigate={handleNavigate} onLogin={handleLogin} />
      )}
      {currentView === 'register' && (
        <Register onNavigate={handleNavigate} onLogin={handleLogin} />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onNavigate={handleNavigate}
        />
      )}
      {currentView === 'universe' && user && (
        <UniversePage
          universeSlug={viewData.universeSlug}
          user={user}
          onNavigate={handleNavigate}
        />
      )}
      {currentView === 'hobbies' && (
        <Hobbies onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;