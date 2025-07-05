import { useState, useEffect } from 'react';
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
import PostService from '../../services/postService';
import ShareButton from './ShareButton';
import useEscapeKey from '../../hooks/useEscapeKey';

const PostCard = ({ post, onUniverseClick, onHashtagClick, onLike, onComment, onDelete, onShare }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(null);
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Escape Key Handler:
  useEscapeKey(() => setShowMoreMenu(false), showMoreMenu);

  // Debug: Schaue was im Post-Objekt steht
  console.log('PostCard rendered:', {
    postId: post.id,
    localLikeCount: likeCount,
    postLikeCount: post.likeCount,
    localIsLiked: isLiked,
    postIsLiked: post.isLikedByUser,
    onLikeAvailable: !!onLike
  });

  // Like Handler:
  // Hier wird der Like-Status geändert und die Anzahl aktualisiert
  // Bei Fehlern wird der Status revertiert
  const handleLike = async () => {
    if (likingInProgress) return;

    try {
      setLikingInProgress(true);

      console.log('🔄 Starting like action:', { isLiked, likeCount });

      // Sicherheitsprüfung für likeCount
      const currentLikeCount = typeof likeCount === 'number' ? likeCount : (post.likeCount || 0);
      const currentIsLiked = typeof isLiked === 'boolean' ? isLiked : (post.isLikedByUser || false);

      // Optimistisches Update mit korrigierten Werten
      const newLikedState = !currentIsLiked;
      const newLikeCount = newLikedState ? currentLikeCount + 1 : currentLikeCount - 1;

      console.log('🔧 Corrected values:', { currentLikeCount, currentIsLiked, newLikedState, newLikeCount });

      setIsLiked(newLikedState);
      setLikeCount(newLikeCount);

      console.log('⚡ Optimistic update:', { newLikedState, newLikeCount });

      // Server-Request
      const response = await PostService.toggleLike(post.id);

      console.log('📥 Server response:', response);

      if (response.success && response.data) {
        // Server-Response Validierung
        const serverIsLiked = typeof response.data.isLiked === 'boolean' ? response.data.isLiked : newLikedState;
        const serverLikeCount = typeof response.data.likeCount === 'number' ? response.data.likeCount : newLikeCount;

        console.log('✅ Validated server data:', { serverIsLiked, serverLikeCount });

        // Update mit validierten Server-Daten
        setIsLiked(serverIsLiked);
        setLikeCount(serverLikeCount);

        // Parent-Komponente nur mit gültigen Daten benachrichtigen
        if (onLike && typeof onLike === 'function') {
          console.log('📢 Notifying parent component with validated data:', {
            postId: post.id,
            isLiked: serverIsLiked,
            likeCount: serverLikeCount
          });
          onLike(post.id, serverIsLiked, serverLikeCount);
        }
      } else {
        // Revert bei fehlerhafter Server-Response
        setIsLiked(currentIsLiked);
        setLikeCount(currentLikeCount);
        console.error('❌ Invalid server response:', response);
      }
    } catch (error) {
      // Revert bei Fehler - mit korrigierten Original-Werten
      const originalLikeCount = typeof likeCount === 'number' ? likeCount : (post.likeCount || 0);
      const originalIsLiked = typeof isLiked === 'boolean' ? isLiked : (post.isLikedByUser || false);

      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
      console.error('❌ Error liking post:', error);
    } finally {
      setLikingInProgress(false);
    }
  };

  // Comment Handler
  const handleComment = () => {
    if (onComment) {
      onComment(post.id);
    }
  };

  // Props watcher für Updates
  useEffect(() => {
    // Validierung der eingehenden Props
    const newIsLiked = typeof post.isLikedByUser === 'boolean' ? post.isLikedByUser : false;
    const newLikeCount = typeof post.likeCount === 'number' ? post.likeCount : 0;
    const newCommentCount = typeof post.commentCount === 'number' ? post.commentCount : 0;
    const newShareCount = typeof post.shareCount === 'number' ? post.shareCount : 0;

    console.log('📝 Props update:', {
      postId: post.id,
      newIsLiked,
      newLikeCount,
      newCommentCount,
      newShareCount,
      originalProps: {
        isLikedByUser: post.isLikedByUser,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount
      }
    });

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setCommentCount(newCommentCount);
    setShareCount(newShareCount);
  }, [post.isLikedByUser, post.likeCount, post.commentCount, post.id]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Gerade eben';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Universe-Hashtag Click Handler
  const handleUniverseHashtagClick = () => {
    console.log('🔄 Universe hashtag click:', { universeName, universeSlug });

    // Direkte Navigation zum Universe
    if (onUniverseClick && universeSlug) {
      console.log('✅ Direct navigation to universe:', universeSlug);
      onUniverseClick(universeSlug);
    } else {
      console.warn('⚠️ No universe slug or click handler available', {
        onUniverseClick: !!onUniverseClick,
        universeSlug,
        universe: post.universe
      });
      alert(`Kann nicht zu Universe "${universeName}" navigieren - fehlende Daten.`);
    }
  };

  // Hashtag Click Handler mit besserer Fehlerbehandlung
  const handleHashtagClick = async (hashtag) => {
    console.log('🔄 PostCard handleHashtagClick called with:', hashtag);
    console.log('🔄 onHashtagClick handler available:', !!onHashtagClick);
    
    if (!onHashtagClick) {
      console.warn('⚠️ onHashtagClick handler not provided to PostCard');
      return;
    }

    if (!hashtag) {
      console.warn('⚠️ No hashtag provided');
      return;
    }

    try {
      console.log('🔄 Looking up hashtag:', hashtag);
      setHashtagLoading(hashtag);

      const result = await HashtagService.findUniverseByHashtag(hashtag);
      console.log('📥 HashtagService result:', result);

      if (result.success && result.universe) {
        console.log('✅ Universe found for hashtag:', result.universe);
        console.log('🔄 Calling onHashtagClick with:', { slug: result.universe.slug, hashtag });

        // Navigiere zu Universe mit Hashtag-Parameter
        onHashtagClick(result.universe.slug, hashtag);
      } else {
        console.log('❌ No universe found for hashtag:', hashtag);

        // Benutzerfreundliche Fehlermeldung
        const shouldCreate = window.confirm(
          `Für den Hashtag #${hashtag} wurde kein Universe gefunden.\n\n` +
          `Möchtest du ein neues Universe für #${hashtag} erstellen?`
        );

        if (shouldCreate) {
          console.log('User wants to create universe for:', hashtag);
          alert(`Universe-Erstellung für #${hashtag} wird bald verfügbar sein!`);
        }
      }
    } catch (error) {
      console.error('❌ Error handling hashtag click:', error);
      alert(`Fehler beim Suchen des Hashtags #${hashtag}. Bitte versuche es später erneut.`);
    } finally {
      setHashtagLoading(null);
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

  // Share Handler
  const handleShare = (platform, newShareCount) => {
    console.log('PostCard handleShare called:', { platform, newShareCount });
    
    // Update local share count
    if (typeof newShareCount === 'number') {
      setShareCount(newShareCount);
    } else {
      setShareCount(prev => prev + 1);
    }
    
    // Notify parent component
    if (onShare) {
      onShare(post.id, platform, newShareCount || shareCount + 1);
    }
  };

    const authorName = post.author?.displayName || post.author?.username || post.authorDisplayName || post.authorUsername || 'Unbekannt';
    const authorUsername = post.author?.username || post.authorUsername || 'unknown';
    const universeName = post.universe?.name || post.universeName || 'Unbekannt';
    const universeSlug = post.universe?.slug || post.universeSlug;
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
                    onClick={handleUniverseHashtagClick}
                    disabled={false}
                    className="flex items-center space-x-1 hover:text-purple-600 hover:cursor-pointer transition-colors"
                    title={`Zum Universe ${universeName}`}
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
          {post.hashtags.map((hashtag, index) => {
            console.log('🏷️ Rendering hashtag button:', hashtag); // Debug Log

            return (
              <button
                key={index}
                onClick={() => {
                  console.log('🔄 Hashtag button clicked:', hashtag); // Debug Log
                  handleHashtagClick(hashtag);
                }}
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
            );
          })}
        </div>
      )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={likingInProgress}
            className={`flex items-center space-x-2 hover:cursor-pointer transition-all duration-200 ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-tertiary hover:text-red-500'
            } ${likingInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart 
              size={20} 
              className={`transition-all duration-200 ${
                isLiked ? 'fill-current scale-110' : ''
              } ${likingInProgress ? 'animate-pulse' : ''}`}
            />
            <span className="text-sm font-medium">
              {likingInProgress ? '...' : likeCount}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleComment}
            className="flex items-center space-x-2 text-tertiary hover:text-blue-500 hover:cursor-pointer transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>

          {/* Share Button */}
          <ShareButton 
            post={{
              ...post,
              shareCount
            }} 
            onShareComplete={handleShare}
            compact={true}
          />
        </div>

        {/* Engagement Summary */}
        <div className="text-xs text-tertiary">
          {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
            <span>
              {likeCount > 0 && `${likeCount} ${likeCount === 1 ? 'Like' : 'Likes'}`}
              {likeCount > 0 && (commentCount > 0 || shareCount > 0) && ' • '}
              {commentCount > 0 && `${commentCount} ${commentCount === 1 ? 'Kommentar' : 'Kommentare'}`}
              {commentCount > 0 && shareCount > 0 && ' • '}
              {shareCount > 0 && `${shareCount} ${shareCount === 1 ? 'Share' : 'Shares'}`} {/* ✅ Hinzufügen */}
            </span>
          )}
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