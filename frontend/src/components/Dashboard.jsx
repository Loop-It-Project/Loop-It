import { useState, useEffect } from 'react';
import { LogOut, User, Settings, Plus, Compass, TrendingUp, Hash, Search } from 'lucide-react';
import Feed from './feed/Feed';
import FeedService from '../services/feedServices';
import CreateUniverse from './CreateUniverse';
import CreatePost from './CreatePost';

const Dashboard = ({ user, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [userUniverses, setUserUniverses] = useState([]);
  const [loadingUniverses, setLoadingUniverses] = useState(true);
  const [showCreateUniverse, setShowCreateUniverse] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

// User's Universes laden für Sidebar
  useEffect(() => {
    const loadUserUniverses = async () => {
      try {
        // ✅ BEIDE laden - eigene UND beigetretene Universes
        const [ownedResponse, memberResponse] = await Promise.all([
          FeedService.getOwnedUniverses().catch(() => ({ success: false })), // Falls Methode fehlt
          FeedService.getUserUniverses(1, 50).catch(() => ({ success: false }))
        ]);
      
        const allUniverses = [];
        
        // Eigene Universes hinzufügen
        if (ownedResponse.success) {
          allUniverses.push(...ownedResponse.data.universes);
          console.log('Owned Universes:', ownedResponse.data.universes); // Debug
        }
        
        // Beigetretene Universes hinzufügen (ohne Duplikate)
        if (memberResponse.success) {
          const ownedIds = new Set(allUniverses.map(u => u.id));
          const memberUniverses = memberResponse.data.universes.filter(u => !ownedIds.has(u.id));
          allUniverses.push(...memberUniverses);
          console.log('Member Universes:', memberUniverses); // Debug
        }
      
        console.log('All Universes combined:', allUniverses); // Debug
        setUserUniverses(allUniverses);
        
      } catch (error) {
        console.error('Error loading user universes:', error);
        // Fallback: Nur Member-Universes laden
        try {
          const response = await FeedService.getUserUniverses(1, 50);
          if (response.success) {
            setUserUniverses(response.data.universes || []);
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
        }
      } finally {
        setLoadingUniverses(false);
      }
    };
  
    loadUserUniverses();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const handleUniverseClick = (universeSlug) => {
    // Navigate to universe page
    onNavigate('universe', { universeSlug });
  };

  const handleHashtagClick = (universeSlug, originalHashtag) => {
    onNavigate('universe', { 
      universeSlug, 
      fromHashtag: originalHashtag 
    });
  };

const handleUniverseCreated = async (newUniverse) => {
  // Universe zur Liste hinzufügen
  setUserUniverses(prev => [newUniverse, ...prev]);
  
  // Modal schließen
  setShowCreateUniverse(false);
  
  // Kurz warten und dann neu laden
  setTimeout(async () => {
    try {
      const response = await FeedService.getUserUniverses(1, 10);
      if (response.success) {
        setUserUniverses(response.data.universes || []);
      }
    } catch (error) {
      console.error('Error reloading user universes:', error);
    }
  }, 500);

  // Zur neuen Universe-Seite navigieren
  onNavigate('universe', { universeSlug: newUniverse.slug });
};

  // Search Handler
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    try {
      // TODO: Implement search in FeedService
      const response = await FeedService.searchUniversesAndHashtags(query);
      if (response.success) {
        setSearchResults(response.data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const tabs = [
    { id: 'feed', label: 'Dein Feed', icon: User },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'discover', label: 'Entdecken', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="Loop-It Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-purple-600">Loop-It</h1>
            </div>
            
            {/* Search Bar - MITTIG */}
            <div className="flex-1 max-w-md mx-8 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Universes oder Hashtags suchen..."
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
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
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      {result.type === 'universe' ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Hash className="text-white" size={14} />
                        </div>
                      ) : (
                        <Hash className="text-purple-500" size={20} />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {result.type === 'universe' ? result.name : `#${result.hashtag}`}
                        </p>
                        <p className="text-sm text-gray-500">
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
                <User size={20} className="text-gray-400" />
                <span className="text-gray-700">Hallo, {user.displayName || user.username}!</span>
              </div>

              <button
                onClick={() => setShowCreateUniverse(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Universe</span>
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                <Settings size={20} />
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                <LogOut size={16} />
                <span>Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meine Universes */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Meine Universes</h3>
                <button 
                  onClick={() => setActiveTab('discover')}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {loadingUniverses ? (
                <div className="text-center py-4 text-gray-500">
                  Lädt...
                </div>
              ) : userUniverses.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm mb-2">Noch keine Universes</p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Universes entdecken
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {userUniverses.slice(0, 8).map((universe) => (
                    <button
                      key={universe.id}
                      onClick={() => handleUniverseClick(universe.slug)}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Hash className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {universe.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {universe.memberCount} Mitglieder
                        </p>
                      </div>
                    </button>
                  ))}
                  
                  {userUniverses.length > 8 && (
                    <button
                      onClick={() => {/* TODO: Show all universes */}}
                      className="w-full text-sm text-purple-600 hover:text-purple-700 py-2"
                    >
                      Alle anzeigen ({userUniverses.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Welcome Message (nur beim ersten Besuch) */}
            {activeTab === 'feed' && userUniverses.length === 0 && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Willkommen bei Loop-It! 🎉</h2>
                <p className="mb-4">
                  Entdecke Universes zu deinen Hobbys und verbinde dich mit Gleichgesinnten!
                </p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Universes entdecken
                </button>
              </div>
            )}

            {/* Feed Content */}
            {activeTab === 'feed' && (
              <Feed
                type="personal"
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
              />
            )}

            {activeTab === 'trending' && (
              <Feed
                type="trending"
                timeframe="24h"
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverUniverses onUniverseClick={handleUniverseClick} />
            )}
          </div>
        </div>
      </div>

      {/* CreateUniverse Modal */}
      {showCreateUniverse && (
        <CreateUniverse
          onClose={() => setShowCreateUniverse(false)}
          onUniverseCreated={handleUniverseCreated}
        />
      )}
    </div>
  );
};

// Discover Universes Component
const DiscoverUniverses = ({ onUniverseClick }) => {
  const [universes, setUniverses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUniverses = async () => {
      try {
        const response = await FeedService.discoverUniverses(null, 1, 12);
        if (response.success) {
          setUniverses(response.data.universes || []);
        } else {
          throw new Error(response.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUniverses();
  }, []);

  const handleJoinUniverse = async (universeSlug) => {
    try {
      await FeedService.joinUniverse(universeSlug);
      // Update UI
      setUniverses(prev => 
        prev.map(universe => 
          universe.slug === universeSlug 
            ? { ...universe, isMember: true, memberCount: universe.memberCount + 1 }
            : universe
        )
      );
    } catch (error) {
      console.error('Error joining universe:', error);
      alert('Fehler beim Beitreten des Universe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Universes werden geladen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          <p className="font-semibold">Fehler beim Laden</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Universes entdecken</h2>
        <p className="text-gray-600">Finde Communities zu deinen Hobbys und Interessen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universes.map((universe) => (
          <div key={universe.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Hash className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{universe.name}</h3>
                  <p className="text-sm text-gray-500">{universe.memberCount} Mitglieder</p>
                </div>
              </div>
            </div>

            {universe.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {universe.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => onUniverseClick(universe.slug)}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Ansehen
              </button>
              
              {universe.isMember ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  Mitglied
                </span>
              ) : (
                <button
                  onClick={() => handleJoinUniverse(universe.slug)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                >
                  Beitreten
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;