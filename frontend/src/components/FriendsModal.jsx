import { useState, useEffect } from 'react';
import { X, User, MessageCircle, UserMinus, AlertTriangle } from 'lucide-react';
import FriendshipService from '../services/friendshipService';
import ChatService from '../services/chatService';
import { useNavigate } from 'react-router-dom';

const FriendsModal = ({ 
  isOpen, 
  onClose, 
  username, 
  currentUser, 
  isOwnProfile = false 
}) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removingFriend, setRemovingFriend] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  // Modal schließen bei ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Scrolling verhindern
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Freunde laden
  useEffect(() => {
    if (isOpen && username) {
      loadFriends(1, true);
    }
  }, [isOpen, username]);

  const loadFriends = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await FriendshipService.getUserFriends(username, pageNum, 20);
      
      if (response.success) {
        const newFriends = response.data.friends;
        
        if (reset) {
          setFriends(newFriends);
          setPage(1);
        } else {
          setFriends(prev => [...prev, ...newFriends]);
        }
        
        setHasMore(response.data.pagination.hasMore);
        if (!reset) setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadFriends(page + 1);
    }
  };

  const handleRemoveFriend = async (friendUsername) => {
    if (!isOwnProfile) return;

    setRemovingFriend(friendUsername);
    try {
      const response = await FriendshipService.removeFriend(friendUsername);
      if (response.success) {
        // Freund aus der Liste entfernen
        setFriends(prev => prev.filter(friend => friend.username !== friendUsername));
        setShowConfirmDialog(null);
      } else {
        alert(response.error || 'Fehler beim Entfernen des Freundes');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Fehler beim Entfernen des Freundes');
    } finally {
      setRemovingFriend(null);
    }
  };

  const handleProfileClick = (friendUsername) => {
    navigate(`/profile/${friendUsername}`);
    onClose(); // Modal schließen nach Navigation
  };

  const handleStartChat = async (friend) => {
    try {
      console.log('🔄 Starting chat with:', friend.username, 'ID:', friend.id);
      
      const response = await ChatService.getOrCreateConversation(friend.id);
      
      if (response.success) {
        console.log('✅ Chat created/found:', response.conversation);
        onClose();
      } else {
        console.error('❌ Chat creation failed:', response.error);
        alert('Chat konnte nicht gestartet werden: ' + response.error);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Fehler beim Starten des Chats');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border border-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary bg-card">
          <h2 className="text-xl font-bold text-primary">
            Freunde von {username}
            {friends.length > 0 && (
              <span className="text-sm font-normal text-secondary ml-2">
                ({friends.length})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-tertiary cursor-pointer hover:text-secondary hover:bg-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            // Loading State
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-hover rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-hover rounded mb-2"></div>
                    <div className="h-3 bg-hover rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <User size={48} className="mx-auto mb-4 text-tertiary opacity-50" />
              <h3 className="text-lg font-medium text-primary mb-2">Keine Freunde</h3>
              <p className="text-secondary">
                {isOwnProfile 
                  ? 'Du hast noch keine Freunde hinzugefügt' 
                  : `${username} hat noch keine Freunde`
                }
              </p>
            </div>
          ) : (
            // Friends List
            <div className="space-y-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-hover transition-colors"
                >
                  {/* Avatar */}
                  <button
                    onClick={() => handleProfileClick(friend.username)}
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <User className="text-white" size={20} />
                  </button>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleProfileClick(friend.username)}
                      className="block w-full text-left cursor-pointer group"
                    >
                      <h4 className="font-medium text-primary truncate group-hover:text-purple-600 transition-colors">
                        {friend.displayName || friend.username}
                      </h4>
                      <p className="text-sm text-tertiary truncate">
                        @{friend.username}
                      </p>
                    </button>

                    {/* Bio */}
                    {friend.bio && (
                      <p className="text-xs text-secondary mt-1 line-clamp-2">
                        {friend.bio}
                      </p>
                    )}

                    {/* Gemeinsame Interessen */}
                    {(friend.commonInterests?.length > 0 || friend.commonHobbies?.length > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {friend.commonInterests?.slice(0, 3).map((interest, index) => (
                          <span
                            key={`interest-${index}`}
                            className="inline-flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                        {friend.commonHobbies?.slice(0, 2).map((hobby, index) => (
                          <span
                            key={`hobby-${index}`}
                            className="inline-flex items-center bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs"
                          >
                            #{hobby}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Freunde seit */}
                    {friend.friendsSince && (
                      <p className="text-xs text-tertiary mt-1">
                        Freunde seit {formatDate(friend.friendsSince)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Message Button (für alle) */}
                    <button
                      onClick={() => handleStartChat(friend)}
                      className="p-2 text-blue-600 cursor-pointer hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Nachricht senden"
                    >
                      <MessageCircle size={16} />
                    </button>

                    {/* Remove Friend Button (nur für eigenes Profil) */}
                    {isOwnProfile && (
                      <button
                        onClick={() => setShowConfirmDialog(friend.username)}
                        disabled={removingFriend === friend.username}
                        className="p-2 text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Freundschaft beenden"
                      >
                        {removingFriend === friend.username ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserMinus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingMore ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Lädt mehr...</span>
                      </div>
                    ) : (
                      'Weitere Freunde laden'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-75" onClick={() => setShowConfirmDialog(null)} />
          <div className="relative bg-card rounded-lg p-6 max-w-md mx-4 shadow-2xl border border-primary">
            <div className="flex items-center space-x-3 mb-4 text-amber-600">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold">Freundschaft beenden</h3>
            </div>
            
            <p className="text-secondary mb-6">
              Möchtest du die Freundschaft mit <strong>@{showConfirmDialog}</strong> wirklich beenden? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 border border-secondary text-secondary rounded-lg cursor-pointer hover:bg-hover transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleRemoveFriend(showConfirmDialog)}
                disabled={removingFriend}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {removingFriend ? 'Entferne...' : 'Freundschaft beenden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsModal;