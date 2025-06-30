import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Hash, Settings, UserPlus, UserMinus } from 'lucide-react';
import Feed from './feed/Feed';
import FeedService from '../services/feedServices';

const UniversePage = ({ universeSlug, onNavigate, user }) => {
  const [universe, setUniverse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadUniverse = async () => {
      try {
        // TODO: Implement getUniverseDetails in FeedService
        // For now, we'll create a mock
        const mockUniverse = {
          id: '1',
          name: universeSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          slug: universeSlug,
          description: `Welcome to the ${universeSlug} universe! Connect with fellow enthusiasts and share your passion.`,
          memberCount: 1234,
          postCount: 567,
          isMember: false,
          membershipStatus: 'none',
          isPublic: true,
          requireApproval: false
        };
        
        setUniverse(mockUniverse);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUniverse();
  }, [universeSlug]);

  const handleJoinLeave = async () => {
    if (!universe) return;
    
    setActionLoading(true);
    try {
      if (universe.isMember) {
        await FeedService.leaveUniverse(universeSlug);
        setUniverse(prev => ({
          ...prev,
          isMember: false,
          membershipStatus: 'none',
          memberCount: prev.memberCount - 1
        }));
      } else {
        const result = await FeedService.joinUniverse(universeSlug);
        setUniverse(prev => ({
          ...prev,
          isMember: result.status === 'joined',
          membershipStatus: result.status === 'pending' ? 'pending' : 'member',
          memberCount: result.status === 'joined' ? prev.memberCount + 1 : prev.memberCount
        }));
      }
    } catch (error) {
      console.error('Error joining/leaving universe:', error);
      alert('Fehler bei der Aktion');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Universe wird geladen...</div>
      </div>
    );
  }

  if (error || !universe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <p className="font-semibold">Universe nicht gefunden</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('dashboard')}
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
                  {universe.description}
                </p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Users size={16} />
                    <span>{universe.memberCount.toLocaleString()} Mitglieder</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Hash size={16} />
                    <span>{universe.postCount} Posts</span>
                  </div>
                  {universe.requireApproval && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      Approval erforderlich
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
                      <span>Beitreten</span>
                    </>
                  )}
                </button>
              )}
              
              <button className="p-3 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Feed
          type="universe"
          universeSlug={universeSlug}
          onUniverseClick={(slug) => onNavigate('universe', { universeSlug: slug })}
        />
      </div>
    </div>
  );
};

export default UniversePage;