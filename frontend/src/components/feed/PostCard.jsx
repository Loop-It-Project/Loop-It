import { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  User,
  Clock,
  Hash
} from 'lucide-react';
import HashtagService from '../../services/hashtagService';
import useEscapeKey from '../../hooks/useEscapeKey';

const PostCard = ({ post, onUniverseClick, onHashtagClick, onLike, onComment, onDelete }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(null);

  // Escape Key Handler:
  useEscapeKey(() => setShowMoreMenu(false), showMoreMenu);

  // Debug: Schaue was im Post-Objekt steht
  console.log('Post data in PostCard:', post);

  // Like Handler:
  // Hier wird der Like-Status geändert und die Anzahl aktualisiert
  // Bei Fehlern wird der Status revertiert
  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
      
      if (onLike) {
        await onLike(post.id, newLikedState);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Error liking post:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Gerade eben';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Universe Click Handler:
  const handleUniverseClick = () => {
    if (onUniverseClick && post.universeSlug) {
      onUniverseClick(post.universeSlug);
    }
  };

  // Hashtag Click Handler mit besserer Fehlerbehandlung
  const handleHashtagClick = async (hashtag) => {
    if (!onHashtagClick) return;

    try {
      const result = await HashtagService.findUniverseByHashtag(hashtag);

      if (result.success) {
        // Navigiere zu Universe
        onHashtagClick(result.universe.slug, hashtag);
      } else {
        // Bessere Fehlerbehandlung
        console.log(`Kein Universe für #${hashtag} gefunden`);
        
        // Optional: User benachrichtigen
        if (window.confirm(`Kein Universe für #${hashtag} gefunden. Möchtest du ein neues Universe erstellen?`)) {
          // Navigiere zu Universe-Erstellung mit vorausgefülltem Hashtag
          // Das müsste in der Parent-Komponente implementiert werden
          console.log('Navigate to create universe with hashtag:', hashtag);
        }
      }
    } catch (error) {
      console.error('Error handling hashtag click:', error);
      alert('Fehler beim Suchen des Hashtags. Bitte versuche es später erneut.');
    }
  };

    // Delete Post Handler:
    const handleDeletePost = async () => {
      if (!window.confirm('Möchtest du diesen Post wirklich löschen?')) {
        return;
      }

      try {
        if (onDelete) {
            await onDelete(post.id);
        } else {
            console.error('onDelete handler is not provided');
            alert('Delete-Funktion ist nicht verfügbar');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Fehler beim Löschen des Posts');
      } finally {
        setShowMoreMenu(false);
      }
    };

    const authorName = post.author?.displayName || post.author?.username || post.authorDisplayName || post.authorUsername || 'Unbekannt';
    const authorUsername = post.author?.username || post.authorUsername || 'unknown';
    const universeName = post.universe?.name || post.universeName || 'Unbekannt';
    const authorAvatar = post.author?.profileImage || post.authorAvatar;

  return (
    <div className="bg-card rounded-lg shadow-sm border border-primary p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            {authorAvatar ? (
              <img 
                src={`/api/media/${authorAvatar}`} 
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="text-white" size={20} />
            )}
          </div>
          
          {/* Author Info */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-primary">
                {authorName || authorUsername}
              </h3>
              <span className="text-tertiary text-sm">@{authorUsername}</span>
            </div>
            
            {/* Universe & Time */}
            <div className="flex items-center space-x-2 text-sm text-tertiary">
              {universeName && (
                <>
                  <button
                    onClick={handleUniverseClick}
                    className="flex items-center space-x-1 hover:text-purple-600 hover:cursor-pointer transition-colors"
                  >
                    <Hash size={14} />
                    <span>{universeName}</span>
                  </button>
                  <span>•</span>
                </>
              )}
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* More Options */}
        <div className="relative">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="text-muted hover:text-secondary transition-colors p-1 rounded-lg hover:bg-hover hover:cursor-pointer"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Dropdown Menu */}
          {showMoreMenu && (
            <div className="absolute right-0 top-8 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[120px] z-10">
              <button
                onClick={handleDeletePost}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:cursor-pointer transition-colors text-sm"
              >
                Post löschen
              </button>
              {/* Weitere Optionen können hier hinzugefügt werden */}
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-4 py-2 text-left text-secondary hover:bg-secondary hover:cursor-pointer transition-colors text-sm"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && (
          <h2 className="text-lg font-semibold text-primary mb-2">
            {post.title}
          </h2>
        )}
        
        {post.content && (
          <p className="text-secondary whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.mediaIds && post.mediaIds.length > 0 && (
          <div className="mt-3 rounded-lg overflow-hidden">
            {/* Placeholder für Media - später implementieren */}
            <div className="bg-hover h-48 flex items-center justify-center text-tertiary">
              Media wird bald unterstützt
            </div>
          </div>
        )}

      {/* Hashtags mit Loading-State */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.hashtags.map((hashtag, index) => (
            <button
              key={index}
              onClick={() => handleHashtagClick(hashtag)}
              disabled={hashtagLoading === hashtag}
              className={`text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:cursor-pointer px-2 py-1 rounded transition-colors text-sm font-medium flex items-center space-x-1 ${
                hashtagLoading === hashtag ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={`Zum #${hashtag} Universe`}
            >
              <span>#{hashtag}</span>
              {hashtagLoading === hashtag && (
                <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 hover:cursor-pointer transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-tertiary hover:text-red-500'
            }`}
          >
            <Heart 
              size={20} 
              className={isLiked ? 'fill-current' : ''} 
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => onComment && onComment(post.id)}
            className="flex items-center space-x-2 text-tertiary hover:text-blue-500 hover:cursor-pointer transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </button>

          {/* Share */}
          <button className="flex items-center space-x-2 text-tertiary hover:text-green-500 hover:cursor-pointer transition-colors">
            <Share2 size={20} />
            <span className="text-sm font-medium">{post.shareCount || 0}</span>
          </button>
        </div>
      </div>

      {/* Click away to close menu */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </div>
  );
};

export default PostCard;