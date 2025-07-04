import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, Hash, Settings, UserPlus, UserMinus, Trash2, Crown, X } from 'lucide-react';
import Feed from '../components/feed/Feed';
import FeedService from '../services/feedServices';
import useEscapeKey from '../hooks/useEscapeKey';

const UniversePage = ({ user }) => {
  const { universeSlug } = useParams(); // URL Parameter aus Router
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Query Parameter aus Router
  const fromHashtag = searchParams.get('hashtag'); // Optional: Hashtag aus URL
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Load Universe details on mount
  // and whenever universeSlug or user changes
  // Added user?.id to dependencies to ensure it reloads when user changes
  useEffect(() => {
    const loadUniverse = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Loading universe:', universeSlug); // Debug

        // API Call to get Universe details
        const response = await FeedService.getUniverseDetails(universeSlug);
        
        console.log('🔍 API Response:', response); // Debug

        if (response.success) {
          console.log('✅ Universe Details loaded:', response.data); // Debug
          setUniverse(response.data);
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

  // Handle Join/Leave Universe
  const handleJoinLeave = async () => {
    if (!universe) return;
    
    setActionLoading(true);
    try {
      if (universe.isMember) {
        // User is Owner and cannot Leave as Owner if correctly set
        if (isOwner) {
          alert('Als Creator/Owner kannst du das Universe nicht verlassen. Übertrage zuerst die Eigentümerschaft oder lösche das Universe.');
          return;
        }

        const result = await FeedService.leaveUniverse(universeSlug);

        if (result.success) {
          setUniverse(prev => ({
            ...prev,
            isMember: false,
            membershipStatus: 'none',
            memberCount: prev.memberCount - 1
          }));
        } else {
          if (result.errorCode === 'CREATOR_CANNOT_LEAVE') {
            alert('Als Creator/Owner kannst du das Universe nicht verlassen. Nutze die Einstellungen um die Eigentümerschaft zu übertragen oder das Universe zu löschen.');
          } else {
            alert(result.error || 'Fehler beim Verlassen des Universes');
          }
        }
      } else {
        const result = await FeedService.joinUniverse(universeSlug);
        if (result.success) {
          setUniverse(prev => ({
            ...prev,
            isMember: result.data.status === 'joined',
            membershipStatus: result.data.status === 'pending' ? 'pending' : 'member',
            memberCount: result.data.status === 'joined' ? prev.memberCount + 1 : prev.memberCount
          }));
        } else {
          throw new Error(result.error || 'Failed to join universe');
        }
      }
    } catch (error) {
      console.error('❌ Error joining/leaving universe:', error);
      alert('Fehler bei der Aktion: ' + error.message);
    } finally {
      setActionLoading(false);
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
        onNavigate('/dashboard');
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
    universeSlug
  });

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Universe wird geladen...</div>
      </div>
    );
  }

  // Render error state
  if (error || !universe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <p className="font-semibold">Universe nicht gefunden</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render Universe Page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')} // Router Navigation
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Loop-It Logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold text-purple-600">Loop-It</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Universe Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Hash className="text-white" size={32} />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {universe.name}
                </h1>
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {universe.description || 'Keine Beschreibung verfügbar'}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
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
              {user && (
                <button
                  onClick={handleJoinLeave}
                  disabled={actionLoading}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50 ${
                    universe.isMember
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : universe.membershipStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {universe.isMember ? (
                    <>
                      <UserMinus size={20} />
                      <span>Verlassen</span>
                    </>
                  ) : universe.membershipStatus === 'pending' ? (
                    <span>Anfrage gesendet</span>
                  ) : (
                    <>
                      <UserPlus size={20} />
                      <span>{actionLoading ? 'Trete bei...' : 'Beitreten'}</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Settings Button - nur für Owner */}
              {isOwner && (
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-3 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
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
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-900">Universe-Einstellungen</h3>
                        </div>

                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              setShowTransferOwnership(true);
                              loadMembers();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Crown className="text-purple-600" size={20} />
                            <div>
                              <div className="font-medium text-gray-900">Eigentümerschaft übertragen</div>
                              <div className="text-sm text-gray-500">Einem anderen Mitglied die Kontrolle geben</div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowSettings(false);
                              handleDeleteUniverse();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 className="text-red-600" size={20} />
                            <div>
                              <div className="font-medium">Universe löschen</div>
                              <div className="text-sm text-gray-500">Permanent aus der Anwendung entfernen</div>
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
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Eigentümerschaft übertragen</h3>
              <button
                onClick={() => setShowTransferOwnership(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">
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
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {(member.displayName || member.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.displayName || member.username || 'Unbekannt'}</div>
                        <div className="text-sm text-gray-500">@{member.username || 'unknown'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Feed
          type="universe"
          universeSlug={universeSlug}
          fromHashtag={fromHashtag} // Optional: Hashtag Filter
          onUniverseClick={(slug) => navigate(`/universe/${slug}`)} // Router Navigation
        />
      </div>
    </div>
  );
};

export default UniversePage;