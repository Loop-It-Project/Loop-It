import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, User, Settings, Plus, Compass, TrendingUp, Hash, Search, Crown } from 'lucide-react';
import Feed from '../components/feed/Feed';
import FeedService from '../services/feedServices';
import HashtagService from '../services/hashtagService';
import UniverseService from '../services/universeService';
import CreateUniverse from '../components/CreateUniverse';
import useEscapeKey from '../hooks/useEscapeKey';
import DiscoverUniverses from '../components/DiscoverUniverses';

// Dashboard Component
// Zeigt den Haupt-Dashboard-Bereich mit Feed, Universes und Navigation
const Dashboard = ({ user, onLogout, refreshTrigger }) => {
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

  // Reload universes wenn refresh trigger sich ändert
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Dashboard: Refreshing due to trigger:', refreshTrigger);
      loadUserUniverses();
    }
  }, [refreshTrigger]);

  // ESC-Key Handler für Modals
  useEscapeKey(() => {
    if (showCreateUniverse) {
      setShowCreateUniverse(false);
    }
  }, showCreateUniverse);

  // User's Universes laden für Sidebar
  const loadUserUniverses = async () => {
    try {
      setLoadingUniverses(true);

      console.log('🔄 Loading user universes...');

      const [ownedResponse, memberResponse] = await Promise.all([
      UniverseService.getOwnedUniverses(1, 50).catch((error) => {
        console.error('getOwnedUniverses error:', error);
        return { success: false, error: error.message };
      }),
      UniverseService.getUserUniverses(1, 50).catch((error) => {
        console.error('getUserUniverses error:', error);
        return { success: false, error: error.message };
      })
    ]);
    
      const ownedUniverses = ownedResponse.success ? ownedResponse.data.universes || [] : [];
      const memberUniverses = memberResponse.success ? memberResponse.data.universes || [] : [];

      console.log('📊 API Responses:', {
        owned: {
          success: ownedResponse.success,
          count: ownedResponse.success ? ownedResponse.data?.universes?.length || 0 : 0,
          error: ownedResponse.error
        },
        member: {
          success: memberResponse.success,
          count: memberResponse.success ? memberResponse.data?.universes?.length || 0 : 0,
          error: memberResponse.error
        }
      });

      // Duplikate entfernen (falls User Owner und Member ist)
      const allUniversesMap = new Map();
      
      // Owned universes mit Owner-Flag markieren
      ownedUniverses.forEach(universe => {
        allUniversesMap.set(universe.id, { ...universe, isOwner: true });
      });
      
      // Member universes hinzufügen (überschreibt nicht owned universes)
      memberUniverses.forEach(universe => {
        if (!allUniversesMap.has(universe.id)) {
          allUniversesMap.set(universe.id, { ...universe, isOwner: false });
        }
      });
    
      const allUniverses = Array.from(allUniversesMap.values());
      console.log('✅ Final universes list:', allUniverses);
      setUserUniverses(allUniverses);

    } catch (error) {
      console.error('Error loading user universes:', error);
    } finally {
      setLoadingUniverses(false);
    }
  };

  // User's Universes laden für Sidebar
  useEffect(() => {
    loadUserUniverses();
  }, [user?.id]); // Re-load wenn User sich ändert

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

  // Universe List nach Join/Leave aktualisieren
  const handleUniverseJoined = async (universeSlug) => {
    console.log('🚀 Dashboard: Universe joined:', universeSlug);
    
    // Sofort reload der Universe-Liste
    await loadUserUniverses();
  };

  // Universe aus User's List entfernen
  const handleUniverseLeft = async (universeSlug) => {
    console.log('🚪 Dashboard: Universe left:', universeSlug);
    
    // Sofort reload der Universe-Liste
    await loadUserUniverses();
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
    <div className="min-h-screen bg-primary">

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
                  <h3 className="font-semibold text-primary">{user?.username}</h3>
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
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-primary truncate">
                            {universe.slug}
                          </p>
                          {/* Owner/Member Indikator - Crown Icon ist jetzt verfügbar */}
                          {universe.isOwner && (
                            <Crown size={12} className="text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
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
                currentUser={user}
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
              />
            )}

            {activeTab === 'trending' && (
              <Feed
                key={`trending-feed-${trendingTimeframe}`}
                type="trending"
                timeframe={trendingTimeframe}
                currentUser={user}
                onUniverseClick={handleUniverseClick}
                onHashtagClick={handleHashtagClick}
                onTimeframeChange={handleTrendingTimeframeChange}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverUniverses 
                key="discover-universes"
                onUniverseClick={handleUniverseClick}
                onUniverseJoined={async (universeSlug) => {
                  console.log('🚀 Dashboard: Universe joined from Discover:', universeSlug);

                  // Sofort Universe-Liste neu laden
                  await loadUserUniverses();
                }}
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

export default Dashboard;