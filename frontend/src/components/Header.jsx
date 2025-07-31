import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, 
  User, 
  Users, 
  Settings, 
  Plus, 
  Hash, 
  Search, 
  Shield, 
  Bell,
  Clock,
  X,
  Trash2,
  Zap
} from 'lucide-react';
import CreateUniverse from './CreateUniverse'; 
import FeedService from '../services/feedServices';
import SearchService from '../services/searchService';
import AdminService from '../services/adminService';
import useEscapeKey from '../hooks/useEscapeKey';
import PendingFriendRequests from './PendingFriendRequests';
import FriendshipService from '../services/friendshipService';
import SwipeGame from './SwipeGame';
import WebSocketService from '../services/websocketService';
import FirstUniverses from '../pages/Hobbies';

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
  const [showSwipeGame, setShowSwipeGame] = useState(false);
  const [matchNotifications, setMatchNotifications] = useState([]);
  const [unreadMatchCount, setUnreadMatchCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search History States
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // States für Friendship Requests
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [friendRequestsLoading, setFriendRequestsLoading] = useState(false);

  // Refs für Search Dropdown
  const searchRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const friendRequestsRef = useRef(null);

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

  // Search History laden
  useEffect(() => {
    if (user && searchFocused) {
      loadSearchHistory();
    }
  }, [user, searchFocused]);

  // Search History laden
  const loadSearchHistory = async () => {
    try {
      setSearchHistoryLoading(true);
      console.log('🔍 Loading search history for user:', user.id);
      
      const response = await SearchService.getSearchHistory(10);
      console.log('🔍 Search history response:', response);
      
      if (response.success) {
        setSearchHistory(response.data.history);
        console.log('✅ Search history loaded:', response.data.history.length, 'items');
      } else {
        console.error('❌ Failed to load search history:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading search history:', error);
    } finally {
      setSearchHistoryLoading(false);
    }
  };

  // Search History Item löschen
  const handleDeleteHistoryItem = async (historyId, event) => {
    event.stopPropagation();
    
    try {
      console.log('🗑️ Deleting search history item:', historyId);
      const response = await SearchService.deleteSearchHistoryItem(historyId);
      
      if (response.success) {
        setSearchHistory(prev => prev.filter(item => item.id !== historyId));
        console.log('✅ Search history item deleted');
      } else {
        console.error('❌ Failed to delete search history item:', response.error);
      }
    } catch (error) {
      console.error('❌ Error deleting search history item:', error);
    }
  };

  // Komplette Search History löschen
  const handleClearSearchHistory = async () => {
    try {
      console.log('🗑️ Clearing complete search history');
      const response = await SearchService.clearSearchHistory();
      
      if (response.success) {
        setSearchHistory([]);
        console.log('✅ Search history cleared');
      } else {
        console.error('❌ Failed to clear search history:', response.error);
      }
    } catch (error) {
      console.error('❌ Error clearing search history:', error);
    }
  };

  // Search History Item auswählen
  const handleSelectHistoryItem = (historyItem) => {
    setSearchQuery(historyItem.query);
    setShowSearchHistory(false);
    setShowSearchResults(false);
    handleSearch(historyItem.query);
  };

  // Click Outside Handler
  useEffect(() => {
    function handleClickOutside(event) {
      // Für Suche
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
        setShowSearchHistory(false);
      }

      // Für Notifications (neu)
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      // Für Friend Requests (falls nötig)
      if (friendRequestsRef.current && !friendRequestsRef.current.contains(event.target)) {
        setShowFriendRequests(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pending Friend Requests laden
  useEffect(() => {
    if (user) {
      loadPendingRequestsCount();
      
      // Auto-refresh alle 30 Sekunden
      const interval = setInterval(loadPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Add this useEffect to listen for match notifications
  useEffect(() => {
    const handleMatchNotification = (event) => {
      console.log('🎉 Header: Match notification received:', event);

      // Add to notifications list
      setMatchNotifications(prev => [{
        id: Date.now(),
        type: 'match',
        data: event.detail?.data || event.data,
        timestamp: new Date(),
        read: false
      }, ...prev]);

      // Increment unread count
      setUnreadMatchCount(prev => prev + 1);
    };

    // Listen for both custom events and WebSocket events
    window.addEventListener('match_notification', handleMatchNotification);
    WebSocketService.addEventListener('match_notification', handleMatchNotification);

    return () => {
      window.removeEventListener('match_notification', handleMatchNotification);
      WebSocketService.removeEventListener('match_notification', handleMatchNotification);
    };
  }, []);

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
    if (showSwipeGame) {
      setShowSwipeGame(false);
    }
    if (showSearchResults) {
      setShowSearchResults(false);
      setSearchQuery('');
    }
    if (showSearchHistory) {
      setShowSearchHistory(false);
    }
    if (showCreateUniverse) {
      setShowCreateUniverse(false);
    }
    if (showNotifications) {
      setShowNotifications(false);
    }
    if (showFriendRequests) {
      setShowFriendRequests(false);
    }
  }, showSwipeGame || showSearchResults || showSearchHistory || showCreateUniverse || showNotifications || showFriendRequests);

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
      setShowSearchHistory(false);
      return;
    }

    try {
      console.log('🔍 Searching for:', query);
      
      // Verwende SearchService statt FeedService für History-Logging
      const response = await SearchService.searchWithHistory(query);
      console.log('🔍 Search response:', response);
      
      if (response.success) {
        setSearchResults(response.data);
        setShowSearchResults(true);
        setShowSearchHistory(false);
        
        // Search History neu laden nach erfolgreicher Suche
        if (user) {
          console.log('🔍 Refreshing search history after search');
          setTimeout(() => loadSearchHistory(), 1000);
        }
      } else {
        console.error('❌ Search failed:', response.error);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
    }
  };

  // Search Input Focus Handler
  const handleSearchFocus = () => {
    console.log('🔍 Search input focused');
    setSearchFocused(true);
    if (user && searchQuery.trim() === '') {
      setShowSearchHistory(true);
      setShowSearchResults(false);
    }
  };

  // Search Input Change Handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim() === '') {
      setShowSearchResults(false);
      if (user && searchFocused) {
        setShowSearchHistory(true);
      }
    } else {
      setShowSearchHistory(false);
      handleSearch(value);
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
            <div className="flex-1 max-w-md mx-8 relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="w-full pl-10 pr-4 py-2 border border-secondary bg-input text-primary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Universes oder Hashtags suchen..."
                />
              </div>

              {/* Search History Dropdown */}
              {showSearchHistory && user && (
                <div 
                  ref={searchDropdownRef}
                  className="absolute top-full left-0 right-0 bg-card border border-primary rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50"
                >
                  <div className="p-3 border-b border-primary bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-tertiary" />
                        <h3 className="font-medium text-secondary text-sm">Letzte Suchen</h3>
                      </div>
                      {searchHistory.length > 0 && (
                        <button
                          onClick={handleClearSearchHistory}
                          className="text-red-500 cursor-pointer hover:text-red-600 text-sm flex items-center space-x-1 transition-colors"
                          title="Alle löschen"
                        >
                          <Trash2 size={14} />
                          <span>Alle löschen</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {searchHistoryLoading ? (
                    <div className="p-4 text-center text-tertiary">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm">Lade Suchverlauf...</p>
                    </div>
                  ) : searchHistory.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {searchHistory.map((historyItem) => (
                        <button
                          key={historyItem.id}
                          onClick={() => handleSelectHistoryItem(historyItem)}
                          className="w-full px-4 py-3 text-left hover:bg-secondary hover:cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {historyItem.queryType === 'hashtag' ? (
                                <Hash className="text-purple-500" size={16} />
                              ) : (
                                <Search className="text-tertiary" size={16} />
                              )}
                              <span className="font-medium text-primary">
                                {historyItem.query}
                              </span>
                            </div>
                            <span className="text-xs text-tertiary">
                              {historyItem.resultCount} Ergebnisse
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteHistoryItem(historyItem.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 cursor-pointer hover:text-red-600 p-1 transition-opacity"
                            title="Aus Verlauf entfernen"
                          >
                            <X size={14} />
                          </button>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-tertiary">
                      <Clock size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Noch keine Suchen vorhanden</p>
                    </div>
                  )}
                </div>
              )}
              
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
                        setShowSearchHistory(false);
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
                <span className="text-secondary">Hallo, {user.username}!</span>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:opacity-80 hover:cursor-pointer transition-opacity"
                >
                  Dashboard
                </button>
              </div>

              {/* Swipe Game Button */}
              <button
                onClick={() => setShowSwipeGame(true)}
                className="flex items-center space-x-2 px-4 py-2 cursor-pointer bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                title="Swipe Game - Finde neue Freunde!"
              >
                <Zap size={20} />
                <span>Swipe</span>
              </button>

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
                  <div 
                    ref={friendRequestsRef}
                    className="absolute right-0 top-full mt-2 w-80 bg-card border border-primary rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
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

              {/* Notifications Button */}
              <div className="relative">
                <button
                  className="p-2 text-gray-500 cursor-pointer hover:text-secondary hover:scale-110 hover:bg-gray-50 rounded-lg transition-all"
                  title="Benachrichtigungen"
                  onClick={() => {
                    // Wenn das Menü geöffnet wird, setze ungelesene Benachrichtigungen zurück
                    if (!showNotifications) {
                      setUnreadMatchCount(0);
                      // Alle als gelesen markieren
                      setMatchNotifications(prev => prev.map(n => ({...n, read: true})));
                    }
                    setShowNotifications(!showNotifications);
                  }}
                >
                  <Bell size={20} />
                  {(unreadMatchCount + pendingRequestsCount) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse">
                      {unreadMatchCount + pendingRequestsCount > 9 ? '9+' : unreadMatchCount + pendingRequestsCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications dropdown */}
                {showNotifications && (
                  <div 
                    ref={notificationsRef}
                    className="absolute right-0 top-full mt-2 w-80 bg-card border border-primary rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="p-3 border-b border-primary bg-card">
                      <h3 className="font-semibold text-primary">Benachrichtigungen</h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {matchNotifications.length > 0 ? (
                        <div>
                          {matchNotifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`p-3 border-b border-primary hover:bg-secondary cursor-pointer ${notification.read ? '' : 'bg-card'}`}
                              onClick={() => {
                                // Mark as read
                                setMatchNotifications(prev => prev.map(n => 
                                  n.id === notification.id ? {...n, read: true} : n
                                ));
                                setUnreadMatchCount(prev => prev > 0 ? prev - 1 : 0);

                                // Navigate to chat with the match
                                // You can implement this based on your routing
                              }}
                            >
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                                  {notification.data?.otherUser?.avatarId ? (
                                    <img 
                                      src={`/api/media/avatar/${notification.data.otherUser.avatarId}`} 
                                      alt="Avatar" 
                                      className="h-10 w-10 rounded-full" 
                                    />
                                  ) : (
                                    <User size={20} className="text-purple-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-secondary font-medium">
                                    Neues Match! 🎉
                                  </p>
                                  <p className="text-tertiary text-sm">
                                    Du hast ein Match mit {notification.data?.otherUser?.username || 'jemandem'}!
                                  </p>
                                  <p className="text-xs text-tertiary mt-1">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-tertiary">
                          <Bell size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Keine neuen Benachrichtigungen</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
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

      {/* Swipe Game Modal */}
      {showSwipeGame && (
        <SwipeGame
          currentUser={user}
          onClose={() => setShowSwipeGame(false)}
        />
      )}
    </>
  );
};

export default Header;