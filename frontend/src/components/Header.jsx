import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Users, Settings, Plus, Hash, Search, Shield, Bell } from 'lucide-react';
import CreateUniverse from './CreateUniverse'; 
import FeedService from '../services/feedServices';
import AdminService from '../services/adminService';
import useEscapeKey from '../hooks/useEscapeKey';
import PendingFriendRequests from './PendingFriendRequests';
import FriendshipService from '../services/friendshipService';

// Header-Komponente für die Navigation und Aktionen im Dashboard
// Importiere die benötigten Icons von Lucide
// Verwende React Router für Navigation und Links

const Header = ({ user, setUser, onLogout, refreshUserData }) => { 
  const navigate = useNavigate();
  const [showCreateUniverse, setShowCreateUniverse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // States für Friendship Requests
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);

  // Enhanced Admin Check mit Debug-Logs
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        // console.log('🔍 Header: No user, skipping admin check');
        return;
      }
      
      // console.log('🔍 Header: Checking admin access for user:', {
      //   id: user.id,
      //   username: user.username,
      //   email: user.email
      // });
      
      try {
        const result = await AdminService.checkAdminPermissions();
        // console.log('🔍 Header: Admin check result:', result);
        
        setIsAdmin(result.success && result.isAdmin);
        
        if (result.success && result.isAdmin) {
          // console.log('✅ Header: Admin access granted - showing Shield button');
        } else {
          console.log('❌ Header: Admin access denied - hiding Shield button');
        }
      } catch (error) {
        console.error('❌ Header: Admin permission check failed:', error);
        setIsAdmin(false);
      }
    };

    checkAdminAccess();
  }, [user]);

  // Pending Friend Requests laden
  useEffect(() => {
    if (user) {
      loadPendingRequestsCount();
      
      // Auto-refresh alle 30 Sekunden
      const interval = setInterval(loadPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Pending Requests Count laden
  const loadPendingRequestsCount = async () => {
    try {
      setFriendRequestsLoading(true);
      const response = await FriendshipService.getPendingRequests();
      
      if (response.success) {
        const totalCount = response.data.received.length + response.data.sent.length;
        setPendingRequestsCount(totalCount);
        
        console.log('🔔 Friend requests loaded:', {
          received: response.data.received.length,
          sent: response.data.sent.length,
          total: totalCount
        });
      }
    } catch (error) {
      console.error('Error loading pending requests count:', error);
    } finally {
      setFriendRequestsLoading(false);
    }
  };

  // Friend Request Handler
  const handleFriendRequestUpdate = () => {
    console.log('🔄 Friend request handled, refreshing data...');
    
    // Requests neu laden
    loadPendingRequestsCount();
    
    // User-Daten refresh (für Friend Count etc.)
    refreshUserDataInternal();
  };

  // User Data Refresh
  const refreshUserDataInternal = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      
      if (refreshUserData && typeof refreshUserData === 'function') {
        // Verwende die übergebene Funktion aus App.jsx
        await refreshUserData();
      } else {
        // Fallback: Lokaler Refresh
        console.log('✅ User data refresh completed (no external function provided)');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // ESC-Key Handler
  useEscapeKey(() => {
    if (showSearchResults) {
      setShowSearchResults(false);
      setSearchQuery('');
    }
    if (showCreateUniverse) {
      setShowCreateUniverse(false);
    }
  }, showSearchResults || showCreateUniverse);

  // Handle Universe Click Function
  const handleUniverseClick = (universeSlug) => {
    navigate(`/universe/${universeSlug}`);
  };

  // Handle Hashtag Click Function
  const handleHashtagClick = async (universeSlug, hashtag) => {
    navigate(`/universe/${universeSlug}?hashtag=${hashtag}`);
  };

  // Handle Universe Created
  const handleUniverseCreated = async (newUniverse) => {
    setShowCreateUniverse(false);
    navigate(`/universe/${newUniverse.slug}`);
  };

  // Handle Search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await FeedService.searchUniversesAndHashtags(query);
      if (response.success) {
        setSearchResults(response.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <>
      <header className="bg-card shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-4 hover:opacity-80 hover:cursor-pointer transition-opacity group">
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="Loop-It Logo"
                    className="h-8 w-8 transition-transform group-hover:scale-110"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  Loop<span className="group-hover:text-purple-400">-It</span>
                </span>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-secondary bg-input text-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Universes oder Hashtags suchen..."
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-primary rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        if (result.type === 'universe') {
                          handleUniverseClick(result.slug);
                        } else if (result.type === 'hashtag') {
                          handleHashtagClick(result.universeSlug, result.hashtag);
                        }
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-secondary hover:cursor-pointer flex items-center space-x-3"
                    >
                      {result.type === 'universe' ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Hash className="text-white" size={14} />
                        </div>
                      ) : (
                        <Hash className="text-purple-500" size={20} />
                      )}
                      <div>
                        <p className="font-medium text-primary">
                          {result.type === 'universe' ? result.name : `#${result.hashtag}`}
                        </p>
                        <p className="text-sm text-tertiary">
                          {result.type === 'universe' 
                            ? `${result.memberCount} Mitglieder` 
                            : `Universe: ${result.universeName}`
                          }
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-muted" />
                <span className="text-secondary">Hallo, {user.displayName || user.username}!</span>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:opacity-80 hover:cursor-pointer transition-opacity"
                >
                  Dashboard
                </button>
              </div>

              {/* Create Universe Button */}
              <button
                onClick={() => setShowCreateUniverse(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors"
              >
                <Plus size={20} />
                <span>Universe</span>
              </button>

              {/* Admin Panel Button - NUR für Admins sichtbar */}
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate('/admin');
                  }}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 hover:scale-110 hover:cursor-pointer transition-all duration-200 rounded-lg"
                  title="Admin Panel"
                >
                  <Shield size={20} />
                </button>
              )}

              {/* Friend Requests Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFriendRequests(!showFriendRequests)}
                  className="relative p-2 text-blue-600 cursor-pointer hover:text-blue-700 hover:scale-110 hover:bg-blue-50 rounded-lg transition-all"
                  title="Freundschaftsanfragen"
                >
                  <Users size={20} />
                  
                  {/* Notification Badge */}
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse">
                      {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                    </span>
                  )}
                  
                  {/* Loading Indicator */}
                  {friendRequestsLoading && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>

                {/* Friend Requests Dropdown */}
                {showFriendRequests && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-primary rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-primary bg-card">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-primary">Freundschaftsanfragen</h3>
                        <button
                          onClick={loadPendingRequestsCount}
                          disabled={friendRequestsLoading}
                          className="text-blue-600 cursor-pointer hover:text-blue-700 transition-colors disabled:opacity-50"
                        >
                          {friendRequestsLoading ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '🔄'
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      <PendingFriendRequests 
                        currentUser={user}
                        onRequestHandled={handleFriendRequestUpdate}
                      />
                    </div>
                    
                    {pendingRequestsCount === 0 && (
                      <div className="p-6 text-center text-tertiary">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Keine ausstehenden Anfragen</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Button */}
              <Link
                to={`/profile/${user.username}`}
                className="p-2 text-purple-600 cursor-pointer hover:text-purple-700 hover:scale-110 hover:bg-purple-50 rounded-lg transition-all"
                title="Mein Profil"
              >
                <User size={20} />
              </Link>

              {/* Notifications Button (für später) */}
              <button
                className="p-2 text-gray-500 cursor-pointer hover:text-gray-700 hover:scale-110 hover:bg-gray-50 rounded-lg transition-all"
                title="Benachrichtigungen"
              >
                <Bell size={20} />
              </button>
              
              {/* Settings Button */}
              <button 
                onClick={() => navigate('/settings')}
                className="p-2 text-muted hover:text-primary hover:bg-hover hover:bg-purple-50 hover:scale-110 hover:cursor-pointer transition-all duration-200 rounded-lg"
              >
                <Settings size={20} />
              </button>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:scale-110 hover:bg-red-600 hover:cursor-pointer transition"
              >
                <LogOut size={16} />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </div>

      {/* Click-away Handler für Friend Requests */}
        {showFriendRequests && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowFriendRequests(false)}
          />
        )}
      </header>

      {/* CreateUniverse Modal */}
      {showCreateUniverse && (
        <CreateUniverse
          onClose={() => setShowCreateUniverse(false)}
          onUniverseCreated={handleUniverseCreated}
        />
      )}
    </>
  );
};

export default Header;