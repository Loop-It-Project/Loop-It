import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Hash, Settings, UserPlus, UserMinus, Trash2, Crown, X, MessageCircle } from 'lucide-react';
import Feed from '../components/feed/Feed';
import FeedService from '../services/feedServices';
import UniverseService from '../services/universeService';
import useEscapeKey from '../hooks/useEscapeKey';
import UniverseChatWidget from '../components/chat/UniverseChatWidget';

const UniversePage = ({ user, onUniverseJoined, onUniverseLeft }) => {
  const { universeSlug } = useParams(); // URL Parameter aus Router
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Query Parameter aus Router
  const fromHashtag = searchParams.get('hashtag'); // Optional: Hashtag aus URL
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); 
  const [actionLoading, setActionLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showUniverseChat, setShowUniverseChat] = useState(false);

  // Load Universe details on mount
  // and whenever universeSlug or user changes
  // Added user?.id to dependencies to ensure it reloads when user changes
  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading universe:', universeSlug);

        const response = await FeedService.getUniverseDetails(universeSlug);
        
        console.log('🔍 API Response:', response);

        if (response.success) {
          console.log('✅ Universe Details loaded:', response.data);
          setUniverse(response.data);
          
          // Set membership status from API response
          setIsJoined(response.data.isMember || response.data.membershipStatus === 'member');
        } else {
          console.error('❌ API Error:', response.error);
          throw new Error(response.error || 'Universe not found');
        }
      } catch (err) {
        console.error('❌ Error loading universe:', err);
        setError(err.message || 'Failed to load universe');
      } finally {
        setLoading(false);
      }
    };

    if (universeSlug) {
      loadUniverse();
    }
  }, [universeSlug, user?.id]);

  // ESC-Key Handler
  useEscapeKey(() => {
    if (showSettings) {
      setShowSettings(false);
    }
    if (showTransferOwnership) {
      setShowTransferOwnership(false);
    }
  }, showSettings || showTransferOwnership);

  // Hashtag Click Handler
  const handleHashtagClick = (targetUniverseSlug, hashtag) => {
    console.log('UniversePage handleHashtagClick:', { targetUniverseSlug, hashtag });
    
    if (targetUniverseSlug === universeSlug) {
      // Bereits im richtigen Universe - zeige nur Hashtag-gefilterte Posts
      console.log('Already in target universe, filtering by hashtag');
      // Optional: Seite mit Hashtag-Filter neu laden
      window.location.href = `/universe/${universeSlug}?hashtag=${hashtag}`;
    } else {
      // Navigiere zu anderem Universe mit Hashtag-Filter
      navigate(`/universe/${targetUniverseSlug}?hashtag=${hashtag}`);
    }
  };

  // Handle Join/Leave Universe
  const handleJoinLeave = async () => {
    if (!user) {
      alert('Du musst angemeldet sein um einem Universe beizutreten');
      return;
    }

    try {
      setIsJoining(true);
      setError('');
      setMessage('');

      console.log('🌌 Join/Leave action:', { 
        universeSlug, 
        isJoined, 
        userId: user.id 
      });

      let result;

      if (isJoined) {
        // Universe verlassen
        result = await UniverseService.leaveUniverse(universeSlug);
        console.log('🚪 Leave universe result:', result);

        if (result.success) {
          // UI SOFORT aktualisieren
          setIsJoined(false);
          setUniverse(prev => prev ? {
            ...prev,
            isMember: false,
            membershipStatus: 'none',
            memberCount: Math.max(0, (prev.memberCount || 0) - 1)
          } : null);
          setMessage('Du hast das Universe erfolgreich verlassen');
          
          // Dashboard über Universe Leave informieren
          if (onUniverseLeft) {
            onUniverseLeft(universeSlug);
          }
        } else {
          throw new Error(result.error || 'Failed to leave universe');
        }
      } else {
        // Universe beitreten
        result = await UniverseService.joinUniverse(universeSlug);
        console.log('🚀 Join universe result:', result);

        if (result.success) {
          // UI SOFORT aktualisieren
          setIsJoined(true);
          setUniverse(prev => prev ? {
            ...prev,
            isMember: true,
            membershipStatus: 'member',
            memberCount: (prev.memberCount || 0) + 1
          } : null);
          setMessage('Du bist dem Universe erfolgreich beigetreten!');
        
          // Dashboard über Universe Join informieren
          if (onUniverseJoined) {
            onUniverseJoined(universeSlug);
          }
        } else {
          throw new Error(result.error || 'Failed to join universe');
        }
      }

      // Success message nach 3 Sekunden ausblenden
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('❌ Error joining/leaving universe:', error);

      // Bei Fehler - UI State zurücksetzen
      // Reload universe data um sicherzustellen, dass UI korrekt ist
      try {
        const response = await FeedService.getUniverseDetails(universeSlug);
        if (response.success) {
          setUniverse(response.data);
          setIsJoined(response.data.isMember || response.data.membershipStatus === 'member');
        }
      } catch (reloadError) {
        console.error('Error reloading universe after failure:', reloadError);
      }

      let errorMessage = 'Unbekannter Fehler';

      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        errorMessage = 'Verbindung zum Server fehlgeschlagen';
      } else if (error.message.includes('401')) {
        errorMessage = 'Du musst angemeldet sein';
      } else if (error.message.includes('403')) {
        errorMessage = 'Du hast keine Berechtigung für diese Aktion';
      } else if (error.message.includes('404')) {
        errorMessage = 'Universe nicht gefunden';
      } else if (error.message.includes('409')) {
        errorMessage = 'Du bist bereits Mitglied dieses Universe';
      } else {
        errorMessage = error.message || 'Aktion fehlgeschlagen';
      }

      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Delete Universe
  const handleDeleteUniverse = async () => {
    if (!window.confirm(`Möchtest du das Universe "${universe.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      const response = await FeedService.deleteUniverse(universeSlug);
      if (response.success) {
        alert('Universe wurde erfolgreich gelöscht.');
        navigate('/dashboard');
      } else {
        throw new Error(response.error || 'Failed to delete universe');
      }
    } catch (error) {
      console.error('❌ Error deleting universe:', error);
      alert('Fehler beim Löschen des Universe: ' + error.message);
    }
  };

  // Handle Show Settings
  const loadMembers = async () => {
    if (loadingMembers) return;
    
    setLoadingMembers(true);
    try {
      const response = await FeedService.getUniverseMembers(universeSlug);
      if (response.success) {
        console.log('✅ Members loaded:', response.data); // Debug
        setMembers(response.data.members || []);
      } else {
        throw new Error(response.error || 'Failed to load members');
      }
    } catch (error) {
      console.error('❌ Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Handle Transfer Ownership
  const handleTransferOwnership = async (newOwnerId) => {
    try {
      setLoadingMembers(true);
      
      const result = await FeedService.transferUniverseOwnership(universeSlug, newOwnerId);
      
      if (result.success) {
        // Nach erfolgreichem Transfer ist User kein Owner mehr
        setUniverse(prev => ({
          ...prev,
          creatorId: newOwnerId,
          userRole: 'member' // User wird zu normalem Member
        }));
        
        setShowTransferOwnership(false);
        alert('Eigentümerschaft erfolgreich übertragen!');
        
        // Seite neu laden um korrekte Permissions zu zeigen
        window.location.reload();
      } else {
        alert(result.error || 'Fehler beim Übertragen der Eigentümerschaft');
      }
    } catch (error) {
      console.error('Transfer ownership error:', error);
      alert('Fehler beim Übertragen der Eigentümerschaft');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Page cleanup beim Verlassen
  useEffect(() => {
    return () => {
      // Cleanup beim Verlassen der Universe Page
      if (showUniverseChat && universe?.id) {
        console.log(`🔌 Leaving UniversePage - cleanup universe chat: ${universe.id}`);
        // Informiere Chat Widget über cleanup
        setShowUniverseChat(false);
      }
    };
  }, [showUniverseChat, universe?.id]);

  // beforeunload Event für Browser-Close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (showUniverseChat && universe?.id && WebSocketService.isWebSocketConnected()) {
        console.log(`🔌 Page unloading - leaving universe chat: ${universe.id}`);
        WebSocketService.socket?.emit('leave_universe_chat', { universeId: universe.id });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showUniverseChat, universe?.id]);

  // Check if user is the owner
  const isOwner = user && universe && (
    universe.creatorId === user.id || 
    universe.userRole === 'creator' ||
    universe.userRole === 'owner'
  );

  // Debugging information
  console.log('🔍 Debug Info:', {
    user: user?.id,
    universe: {
      id: universe?.id,
      name: universe?.name,
      creatorId: universe?.creatorId,
      userRole: universe?.userRole,
      membershipStatus: universe?.membershipStatus,
      isMember: universe?.isMember,
      memberCount: universe?.memberCount,
      postCount: universe?.postCount
    },
    isOwner,
    universeSlug,
    isJoined,
    isJoining
  });

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-tertiary">Universe wird geladen...</div>
      </div>
    );
  }

  // Render error state
  if (error || !universe) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <p className="font-semibold">Universe nicht gefunden</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 hover:cursor-pointer transition-colors"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Universe Page
  return (
    <div className="min-h-screen bg-primary">

      {/* Universe Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Hash className="text-white" size={32} />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  {universe.name}
                </h1>
                <p className="text-secondary mb-4 max-w-2xl">
                  {universe.description || 'Keine Beschreibung verfügbar'}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-tertiary">
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{universe.memberCount?.toLocaleString() || 0} Mitglieder</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Hash size={16} />
                    <span>{universe.postCount?.toLocaleString() || 0} Posts</span>
                  </div>
                  
                  {/* Status Badges */}
                  {universe.requireApproval && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Approval erforderlich
                    </span>
                  )}
                  {isOwner && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center space-x-1">
                      <Crown size={12} />
                      <span>Besitzer</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* CHAT BUTTON - für alle Mitglieder */}
              {user && isJoined && (
                <button
                  onClick={() => setShowUniverseChat(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  title="Universe Chat öffnen"
                >
                  <MessageCircle size={16} />
                  <span>Chat</span>
                </button>
              )}

              {user && !isOwner && (
                <button
                  onClick={handleJoinLeave}
                  disabled={isJoining}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isJoined
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isJoining ? (
                    // Loading Spinner mit dynamischem Text
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent hover:cursor-pointer rounded-full animate-spin" />
                      <span>{isJoined ? 'Verlasse...' : 'Trete bei...'}</span>
                    </>
                  ) : (
                    // Statischer Button basierend auf isJoined
                    <>
                      {isJoined ? (
                        <>
                          <UserMinus size={16} />
                          <span>Verlassen</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          <span>Beitreten</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              )}
              
              {/* Settings Button - nur für Owner */}
              {isOwner && (
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 text-muted hover:text-secondary rounded-lg hover:bg-hover hover:cursor-pointer transition-colors"
                  >
                    <Settings size={20} />
                  </button>

                  {/* Settings Dropdown Menu */}
                  {showSettings && (
                    <>
                      {/* Unsichtbarer Overlay zum Wegklicken */}
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowSettings(false)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full mt-2 w-72 bg-card rounded-lg shadow-lg border border-primary z-20">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="font-semibold text-primary">Universe-Einstellungen</h3>
                        </div>

                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              setShowTransferOwnership(true);
                              loadMembers();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-secondary rounded-lg hover:cursor-pointer transition-colors"
                          >
                            <Crown className="text-purple-600" size={20} />
                            <div>
                              <div className="font-medium text-primary">Eigentümerschaft übertragen</div>
                              <div className="text-sm text-tertiary">Einem anderen Mitglied die Kontrolle geben</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              handleDeleteUniverse();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-red-50 rounded-lg hover:cursor-pointer transition-colors text-red-600"
                          >
                            <Trash2 className="text-red-600" size={20} />
                            <div>
                              <div className="font-medium">Universe löschen</div>
                              <div className="text-sm text-tertiary">Permanent aus der Anwendung entfernen</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferOwnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold">Eigentümerschaft übertragen</h3>
              <button
                onClick={() => setShowTransferOwnership(false)}
                className="text-muted hover:text-secondary hover:cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-secondary mb-4">
                Wähle ein Mitglied aus, das die neue Eigentümerschaft des Universe übernehmen soll:
              </p>

              {loadingMembers ? (
                <div className="text-center py-4">Lade Mitglieder...</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {members.filter(member => member.userId !== user.id).map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => handleTransferOwnership(member.userId)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary rounded-lg hover:cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.displayName || member.username || 'Unbekannt'}</div>
                        <div className="text-sm text-tertiary">@{member.username || 'unknown'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSE CHAT WIDGET */}
      {showUniverseChat && (
        <UniverseChatWidget
          universe={universe}
          currentUser={user}
          isVisible={showUniverseChat}
          onToggle={() => setShowUniverseChat(false)}
        />
      )}

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Feed
          type="universe"
          universeSlug={universeSlug}
          currentUser={user}
          fromHashtag={fromHashtag} // Optional: Hashtag Filter
          onUniverseClick={(slug) => navigate(`/universe/${slug}`)} // Router Navigation
          onHashtagClick={handleHashtagClick} // Pass Hashtag Click Handler
        />
      </div>
    </div>
  );
};

export default UniversePage;