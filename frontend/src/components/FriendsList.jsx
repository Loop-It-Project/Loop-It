import { useState, useEffect } from 'react';
import { User, Hash, MessageCircle, MoreHorizontal } from 'lucide-react';
import FriendshipService from '../services/friendshipService';

const FriendsList = ({ username, currentUser, showAllFriends = false, onFriendClick, onShowAllClick }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedFriend, setExpandedFriend] = useState(null);

  useEffect(() => {
    if (username) {
      loadFriends(1, true);
    }
  }, [username]);

  const loadFriends = async (pageNum = 1, reset = false) => {
    try {
      setLoading(pageNum === 1);
      
      const response = await FriendshipService.getUserFriends(username, pageNum, showAllFriends ? 20 : 6);
      
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
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadFriends(page + 1);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading && friends.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-primary">
        <div className="animate-pulse">
          <div className="h-6 bg-hover rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-hover rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-hover rounded mb-1"></div>
                  <div className="h-3 bg-hover rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-primary">
        <h3 className="font-semibold text-primary mb-4">
          {showAllFriends ? 'Alle Freunde' : 'Freunde'}
        </h3>
        <div className="text-center py-8 text-tertiary">
          <User size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {username === currentUser?.username 
              ? 'Du hast noch keine Freunde hinzugefügt' 
              : 'Noch keine Freunde'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-primary">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onShowAllClick?.()}
          className="flex items-center space-x-2 cursor-pointer hover:bg-hover rounded-lg p-2 -ml-2 transition-colors group"
        >
          <h3 className="font-semibold text-primary group-hover:text-purple-600 transition-colors">
            {showAllFriends ? `Alle Freunde (${friends.length})` : `Freunde (${friends.length})`}
          </h3>
          {!showAllFriends && (
            <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </div>
          )}
        </button>
        
        {!showAllFriends && friends.length > 5 && (
          <button
            onClick={() => onShowAllClick?.()}
            className="text-purple-600 cursor-pointer hover:text-purple-700 text-sm font-medium"
          >
            Alle anzeigen
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-hover transition-colors"
          >
            {/* Avatar */}
            <button
              onClick={() => onFriendClick?.(friend.username)}
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full cursor-pointer flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
            >
              <User className="text-white" size={16} />
            </button>

            {/* Friend Info */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onFriendClick?.(friend.username)}
                className="block w-full text-left cursor-pointer"
              >
                <h4 className="font-medium text-primary truncate hover:text-purple-600 transition-colors">
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
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {friend.commonInterests?.slice(0, 2).map((interest, index) => (
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
                        className="inline-flex items-center space-x-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs"
                      >
                        <Hash size={8} />
                        <span>{hobby}</span>
                      </span>
                    ))}
                    
                    {/* Weitere anzeigen */}
                    {(friend.commonInterests?.length + friend.commonHobbies?.length) > 4 && (
                      <span className="text-xs text-tertiary">
                        +{(friend.commonInterests?.length + friend.commonHobbies?.length) - 4} weitere
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Freunde seit */}
              {showAllFriends && friend.friendsSince && (
                <p className="text-xs text-tertiary mt-1">
                  Freunde seit {formatDate(friend.friendsSince)}
                </p>
              )}
            </div>

            {/* Action Menu */}
            {showAllFriends && (
              <div className="relative">
                <button
                  onClick={() => setExpandedFriend(expandedFriend === friend.id ? null : friend.id)}
                  className="p-1 text-tertiary hover:text-secondary rounded-full hover:bg-secondary transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>

                {expandedFriend === friend.id && (
                  <div className="absolute right-0 top-8 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[160px] z-10">
                    <button
                      onClick={() => {
                        onFriendClick?.(friend.username);
                        setExpandedFriend(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-hover transition-colors"
                    >
                      Profil besuchen
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Message functionality
                        setExpandedFriend(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-hover transition-colors flex items-center space-x-2"
                    >
                      <MessageCircle size={14} />
                      <span>Nachricht senden</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Load More Button */}
        {showAllFriends && hasMore && (
          <div className="text-center pt-3">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Lädt...' : 'Mehr laden'}
            </button>
          </div>
        )}
      </div>

      {/* Click away to close menu */}
      {expandedFriend && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setExpandedFriend(null)}
        />
      )}
    </div>
  );
};

export default FriendsList;