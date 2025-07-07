import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, User, Settings, Plus, Compass, TrendingUp, Hash, Search } from 'lucide-react';
import Feed from '../components/feed/Feed';
import FeedService from '../services/feedServices';
import HashtagService from '../services/hashtagService';
import CreateUniverse from '../components/CreateUniverse';
import useEscapeKey from '../hooks/useEscapeKey';

// Dashboard Component
// Zeigt den Haupt-Dashboard-Bereich mit Feed, Universes und Navigation
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // URL parameter lesen
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'feed');
  const [trendingTimeframe, setTrendingTimeframe] = useState(searchParams.get('timeframe') || '7d');
  const [userUniverses, setUserUniverses] = useState([]);
  const [loadingUniverses, setLoadingUniverses] = useState(true);
  const [showCreateUniverse, setShowCreateUniverse] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // DEBUGGING: Tab und URL Changes verfolgen
  useEffect(() => {
    console.log('🔄 Dashboard: URL changed:', {
      tab: searchParams.get('tab'),
      timeframe: searchParams.get('timeframe'),
      activeTab,
      trendingTimeframe
    });
  }, [searchParams, activeTab, trendingTimeframe]);

  // ESC-Key Handler für Modals
  useEscapeKey(() => {
    if (showCreateUniverse) {
      setShowCreateUniverse(false);
    }
  }, showCreateUniverse);

  // User's Universes laden für Sidebar
  useEffect(() => {
    const loadUserUniverses = async () => {
      try {
        setLoadingUniverses(true);

        const [ownedResponse, memberResponse] = await Promise.all([
          FeedService.getOwnedUniverses().catch(() => ({ success: false })),
          FeedService.getUserUniverses(1, 50).catch(() => ({ success: false }))
        ]);
      
        const ownedUniverses = ownedResponse.success ? ownedResponse.data.universes || [] : [];
        const memberUniverses = memberResponse.success ? memberResponse.data.universes || [] : [];

        // Duplikate entfernen (falls User Owner und Member ist)
        const allUniversesMap = new Map();
        
        [...ownedUniverses, ...memberUniverses].forEach(universe => {
          if (!allUniversesMap.has(universe.id)) {
            allUniversesMap.set(universe.id, universe);
          }
        });
      
        const allUniverses = Array.from(allUniversesMap.values());
        setUserUniverses(allUniverses);

      } catch (error) {
        console.error('Error loading user universes:', error);
      } finally {
        setLoadingUniverses(false);
      }
    };

    loadUserUniverses();
  }, []);

  // Universe Click Handler
  const handleUniverseClick = (universeSlug) => {
    // console.log('Dashboard handleUniverseClick:', universeSlug);
    navigate(`/universe/${universeSlug}`);
  };

  // Hashtag Click Handler hinzufügen
  const handleHashtagClick = (targetUniverseSlug, hashtag) => {
    // console.log('Dashboard handleHashtagClick:', { targetUniverseSlug, hashtag });
    
    if (targetUniverseSlug && hashtag) {
      navigate(`/universe/${targetUniverseSlug}?hashtag=${hashtag}`);
    } else {
      console.error('Invalid hashtag click data:', { targetUniverseSlug, hashtag });
    }
  };

  // Universe Created Handler
  const handleUniverseCreated = (newUniverse) => {
    setUserUniverses(prev => [newUniverse, ...prev]);
    setShowCreateUniverse(false);
    setActiveTab('feed');
    navigate('/dashboard');
  };

  // Tab change mit URL update
  const handleTabChange = (tabId) => {
    console.log('🔄 Dashboard: Tab change from', activeTab, 'to', tabId);
    
    // State sofort aktualisieren
    setActiveTab(tabId);
    
    // URL entsprechend aktualisieren
    if (tabId === 'trending') {
      navigate(`/dashboard?tab=trending&timeframe=${trendingTimeframe}`, { replace: true });
    } else if (tabId === 'discover') {
      navigate('/dashboard?tab=discover', { replace: true });
    } else {
      // 'feed' oder andere Tabs - entferne alle Query-Parameter
      navigate('/dashboard', { replace: true });
    }
  };

  // URL-SYNC FÜR TIMEFRAME
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const urlTimeframe = searchParams.get('timeframe');
    
    if (urlTab !== activeTab) {
      console.log('🔄 Dashboard: Syncing tab from URL:', urlTab || 'feed');
      setActiveTab(urlTab || 'feed');
    }
    
    if (urlTimeframe && urlTimeframe !== trendingTimeframe) {
      console.log('🔄 Dashboard: Syncing timeframe from URL:', urlTimeframe);
      setTrendingTimeframe(urlTimeframe);
    }
  }, [searchParams]);

  // TIMEFRAME CHANGE HANDLER
  const handleTrendingTimeframeChange = (newTimeframe) => {
    console.log('🔄 Dashboard: Changing timeframe from', trendingTimeframe, 'to', newTimeframe);
    
    setTrendingTimeframe(newTimeframe);
    navigate(`/dashboard?tab=trending&timeframe=${newTimeframe}`, { replace: true });
  };

  const tabs = [
    { id: 'feed', label: 'Dein Feed', icon: User },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'discover', label: 'Entdecken', icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-secondary">

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">

            {/* User Profile Card */}
            <div className="bg-card rounded-lg shadow-sm border p-4 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{user?.displayName || user?.username}</h3>
                  <p className="text-sm text-tertiary">@{user?.username}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCreateUniverse(true)}
                  className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:cursor-pointer hover:bg-purple-700 transition text-sm font-medium"
                >
                  <Plus size={16} className="inline mr-1" />
                  Universe erstellen
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-card rounded-lg shadow-sm border p-4 mb-6">
              <h3 className="font-semibold text-primary mb-4">Navigation</h3>
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:cursor-pointer transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-secondary hover:bg-hover'
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
            <div className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary">Meine Universes</h3>
                <button 
                  onClick={() => handleTabChange('discover')}
                  className="text-purple-600 hover:text-purple-700 hover:cursor-pointer"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              {loadingUniverses ? (
                <div className="text-center py-4 text-tertiary">
                  Lädt...
                </div>
              ) : userUniverses.length === 0 ? (
                <div className="text-center py-4 text-tertiary">
                  <p className="text-sm mb-2">Noch keine Universes</p>
                  <button
                    onClick={() => handleTabChange('discover')}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium hover:cursor-pointer transition"
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
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-hover hover:cursor-pointer transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Hash className="text-white" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {universe.slug}
                        </p>
                        <p className="text-xs text-tertiary">
                          {universe.memberCount} Mitglieder
                        </p>
                      </div>
                    </button>
                  ))}
                  
                  {userUniverses.length > 8 && (
                    <button
                      onClick={() => {/* TODO: Show all universes */}}
                      className="w-full text-sm text-purple-600 hover:text-purple-700 hover:cursor-pointer py-2"
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
                  onClick={() => handleTabChange('discover')}
                  className="bg-card text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-hover hover:cursor-pointer transition"
                >
                  Universes entdecken
                </button>
              </div>
            )}

            {/* Feed Content */}
            {activeTab === 'feed' && (
              <Feed
                key="personal-feed"
                type="personal"
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
              />
            )}

            {activeTab === 'trending' && (
              <Feed
                key={`trending-feed-${trendingTimeframe}`}
                type="trending"
                timeframe={trendingTimeframe}
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
                onTimeframeChange={handleTrendingTimeframeChange}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverUniverses 
                key="discover-universes"
                onUniverseClick={handleUniverseClick} 
              />
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUniverses = async () => {
      try {
        setLoading(true);
        const response = await FeedService.getDiscoverUniverses();
        
        if (response.success) {
          setUniverses(response.data.universes || []);
        }
      } catch (error) {
        console.error('Error loading discover universes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUniverses();
  }, []);

  const filteredUniverses = universes.filter(universe =>
    universe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    universe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center space-x-2 text-tertiary">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span>Universes werden geladen...</span>
        </div>
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">Universes entdecken</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={20} />
          <input
            type="text"
            placeholder="Universes durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredUniverses.map((universe) => (
          <div key={universe.id} className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-primary mb-1">#{universe.slug}</h3>
                <p className="text-sm text-secondary mb-2">{universe.description}</p>
                <div className="flex items-center space-x-4 text-sm text-tertiary">
                  <span>{universe.memberCount} Mitglieder</span>
                  <span>{universe.postCount} Posts</span>
                </div>
              </div>
              <button
                onClick={() => onUniverseClick(universe.slug)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
              >
                Besuchen
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUniverses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-tertiary">
            <p className="text-lg font-medium mb-2">Keine Universes gefunden</p>
            <p className="text-sm">
              {searchTerm ? 'Versuche einen anderen Suchbegriff.' : 'Momentan sind keine Universes verfügbar.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;