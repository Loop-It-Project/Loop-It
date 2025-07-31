import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trash2,
  MoreHorizontal,
  Edit,
  Flag,
  Eye,
  EyeOff,
  User,
  Clock,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BaseService from '../../services/baseService';
import HashtagService from '../../services/hashtagService';
import PostService from '../../services/postService';
import ShareButton from './ShareButton';
import MediaGallery from '../MediaGallery';
import InlineCommentPreview from './InlineCommentPreview';
import PostModal from './PostModal';
import useEscapeKey from '../../hooks/useEscapeKey';
import ReportModal from '../ReportModal';

const PostCard = ({ 
  post, 
  onUniverseClick, 
  onHashtagClick, 
  onLike, 
  onComment, 
  onDelete, 
  onShare, 
  currentUser, 
  showUserInfo = true 
}) => {
  const navigate = useNavigate();
  const [showUserPreview, setShowUserPreview] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [shareCount, setShareCount] = useState(post.shareCount || 0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(null);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // NEW: Comment preview states
  const [showCommentPreview, setShowCommentPreview] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  
  const moreMenuRef = useRef(null);
  const shareMenuRef = useRef(null);

  // Check if current user is post author
  const isAuthor = useMemo(() => {
    return currentUser?.id === post.author?.id || currentUser?.id === post.authorId;
  }, [currentUser?.id, post.author?.id, post.authorId]);

  // Escape Key Handler
  useEscapeKey(() => setShowMoreMenu(false), showMoreMenu);

  // Like Handler
  const handleLike = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Du musst angemeldet sein um Posts zu liken');
      return;
    }

    const prevLiked = isLiked;
    const prevCount = likeCount;

    try {
      // Optimistic Update
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

      console.log('🔍 Frontend: Attempting like toggle for post:', post.id);
      
      const response = await PostService.toggleLike(post.id);
      
      console.log('🔍 Frontend: Like toggle response:', response);
      
      if (response.success) {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likeCount);
        
        console.log('🔍 Frontend: Like updated successfully:', {
          isLiked: response.data.isLiked,
          likeCount: response.data.likeCount
        });
      } else {
        // Rollback bei Fehler
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
        console.error('Like toggle failed:', response.error);
      }
    } catch (error) {
      // Rollback bei Fehler
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      console.error('Like toggle error:', error);
    }
  };

  // Media URLs korrigieren vor der Anzeige
  const processedMedia = useMemo(() => {
    if (!post.media || post.media.length === 0) return [];
    
    return post.media.map(item => BaseService.processMediaObject(item));
  }, [post.media]);

  // NEW: Comment Handler - Toggle preview or show modal
  const handleComment = () => {
      // Show inline preview first
      setShowCommentPreview(true);
    // Modal wird nur über "Mehr anzeigen" Button geöffnet
  };

  // NEW: Handle showing more comments (open modal)
  const handleShowMoreComments = () => {
    setShowPostModal(true);
  };

  // NEW: Handle comment added
  const handleCommentAdded = (postId) => {
    setCommentCount(prev => prev + 1);
    if (onComment) {
      onComment(postId);
    }
  };

  // Props watcher für Updates
  useEffect(() => {
    const newIsLiked = typeof post.isLikedByUser === 'boolean' ? post.isLikedByUser : false;
    const newLikeCount = typeof post.likeCount === 'number' ? post.likeCount : 0;
    const newCommentCount = typeof post.commentCount === 'number' ? post.commentCount : 0;
    const newShareCount = typeof post.shareCount === 'number' ? post.shareCount : 0;

    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setCommentCount(newCommentCount);
    setShareCount(newShareCount);
  }, [post.isLikedByUser, post.likeCount, post.commentCount, post.shareCount, post.id]);

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
    if (onUniverseClick && post.universe?.slug) {
      onUniverseClick(post.universe.slug);
    } else {
      console.warn('⚠️ No universe slug or click handler available');
      alert(`Kann nicht zu Universe "${post.universe?.name}" navigieren - fehlende Daten.`);
    }
  };

  // Hashtag Click Handler
  const handleHashtagClick = async (hashtag) => {
    if (!onHashtagClick) {
      console.warn('⚠️ onHashtagClick handler not provided to PostCard');
      return;
    }

    if (!hashtag) {
      console.warn('⚠️ No hashtag provided');
      return;
    }

    try {
      setHashtagLoading(hashtag);

      const result = await HashtagService.findUniverseByHashtag(hashtag);

      if (result.success && result.universe) {
        onHashtagClick(result.universe.slug, hashtag);
      } else {
        const shouldCreate = window.confirm(
          `Für den Hashtag #${hashtag} wurde kein Universe gefunden.\n\n` +
          `Möchtest du ein neues Universe für #${hashtag} erstellen?`
        );

        if (shouldCreate) {
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

  // User Click Handler
  const handleUserClick = () => {
    console.log('🔍 User click:', post.author);
    if (post.author?.username) {
      navigate(`/profile/${post.author.username}`);
    } else {
      console.warn('⚠️ No username available for navigation');
    }
  };

  // User Info Component
  const UserInfo = ({ compact = false }) => (
    <div 
      className={`flex items-center space-x-3 relative`}
      onMouseEnter={() => setShowUserPreview(true)}
      onMouseLeave={() => setShowUserPreview(false)}
    >
      {/* Avatar */}
      <button
        onClick={handleUserClick}
        className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-all duration-200 cursor-pointer group"
      >
        <User className="text-white group-hover:scale-110 transition-transform" size={16} />
        <div className="absolute inset-0 rounded-full ring-2 ring-purple-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
      </button>

      <div className="flex-1 min-w-0">
        {/* Display Name */}
        <button
          onClick={handleUserClick}
          className="font-medium text-primary hover:text-purple-600 transition-colors cursor-pointer text-left block truncate group"
        >
          <span className="group-hover:underline">
            {post.author?.displayName || post.author?.username || 'Unbekannt'}
          </span>
        </button>

        {/* Username */}
        <button
          onClick={handleUserClick}
          className="text-sm text-tertiary hover:text-purple-600 transition-colors cursor-pointer text-left block truncate"
        >
          @{post.author?.username || 'unknown'}
        </button>
      </div>

      {/* Zeit & Universe */}
      <div className="flex items-center space-x-2 text-sm text-tertiary">
        <div className="flex items-center space-x-1">
          <Clock size={14} />
          <span>{formatTimeAgo(post.createdAt)}</span>
        </div>

        {post.universe && (
          <>
            <span>•</span>
            <button
              onClick={() => onUniverseClick?.(post.universe.slug)}
              className="flex items-center space-x-1 hover:text-purple-600 transition-colors"
            >
              <Hash size={14} />
              <span>{post.universe.name}</span>
            </button>
          </>
        )}
      </div>

      {/* User Preview on Hover */}
      {showUserPreview && (
        <div className="absolute z-20 bg-card border border-primary rounded-lg p-4 shadow-lg mt-2 min-w-[250px] top-full left-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
            <div>
              <p className="font-medium text-primary">
                {post.author?.displayName || post.author?.username}
              </p>
              <p className="text-sm text-tertiary">@{post.author?.username}</p>
            </div>
          </div>
          {post.author?.bio && (
            <p className="text-sm text-secondary mb-2 line-clamp-2">
              {post.author.bio}
            </p>
          )}
          <button
            onClick={handleUserClick}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Profil anzeigen →
          </button>
        </div>
      )}
    </div>
  );

  // Delete Post Handler
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
    if (typeof newShareCount === 'number') {
      setShareCount(newShareCount);
    } else {
      setShareCount(prev => prev + 1);
    }
    
    if (onShare) {
      onShare(post.id, platform, newShareCount || shareCount + 1);
    }
  };

  const authorName = post.author?.displayName || post.author?.username || post.authorDisplayName || post.authorUsername || 'Unbekannt';
  const authorUsername = post.author?.username || post.authorUsername || 'unknown';
  const universeName = post.universe?.name || post.universeName || 'Unbekannt';
  const universeSlug = post.universe?.slug || post.universeSlug;
  const authorAvatar = post.author?.profileImage || post.authorAvatar;

  const MAX_CONTENT_LENGTH = 500;
  const shouldTruncate = post.content && post.content.length > MAX_CONTENT_LENGTH;
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.substring(0, MAX_CONTENT_LENGTH) + '...'
    : post.content;

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-primary p-6 mb-4 hover:shadow-md transition-shadow">
        
        {/* User Info */}
        {showUserInfo && (
          <div className="flex items-center justify-between mb-4">
            <UserInfo />

            {/* More Options */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 text-muted hover:text-secondary rounded-full cursor-pointer hover:bg-hover transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 top-8 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[160px] z-10">
                  {!isAuthor && (
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 cursor-pointer hover:bg-red-50 transition-colors text-sm flex items-center space-x-2"
                    >
                      <Flag size={14} />
                      <span>Post melden</span>
                    </button>
                  )}

                  {isAuthor && (
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDeletePost();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 cursor-pointer hover:bg-red-50 transition-colors text-sm flex items-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>Post löschen</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="w-full px-4 py-2 text-left cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                  >
                    Abbrechen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mb-4">
          {post.title && (
            <h2 className="text-lg font-semibold text-primary mb-2">
              {post.title}
            </h2>
          )}
          
          {post.content && (
            <p className="text-secondary whitespace-pre-wrap">
              {displayContent}
            </p>
          )}

          {/* Media Gallery */}
          {processedMedia && processedMedia.length > 0 && (
            <div className="mb-3">
              <MediaGallery media={processedMedia} />
            </div>
          )}

          {/* Expand/Collapse Button */}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 flex items-center space-x-1 hover:cursor-pointer"
            >
              {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
            </button>
          )}

          {/* Hashtags */}
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
              className={`flex items-center space-x-2 transition-colors hover:cursor-pointer ${
                showCommentPreview 
                  ? 'text-blue-500 hover:text-blue-600' 
                  : 'text-tertiary hover:text-blue-500'
              }`}
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
              <button
                onClick={handleShowMoreComments}
                className="hover:text-secondary hover:cursor-pointer transition-colors"
                title="Details anzeigen"
              >
                {likeCount > 0 && `${likeCount} ${likeCount === 1 ? 'Like' : 'Likes'}`}
                {likeCount > 0 && (commentCount > 0 || shareCount > 0) && ' • '}
                {commentCount > 0 && `${commentCount} ${commentCount === 1 ? 'Kommentar' : 'Kommentare'}`}
                {commentCount > 0 && shareCount > 0 && ' • '}
                {shareCount > 0 && `${shareCount} ${shareCount === 1 ? 'Share' : 'Shares'}`}
              </button>
            )}
          </div>
        </div>

        {/* Inline Comment Preview */}
        <InlineCommentPreview
          postId={post.id}
          isVisible={showCommentPreview}
          onShowMore={handleShowMoreComments}
          onCommentAdded={handleCommentAdded}
          currentUser={currentUser}
          limit={3}
        />

        {/* Click away to close menu */}
        {showMoreMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowMoreMenu(false)}
          />
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          postId={post.id}
          postAuthor={post.author}
        />
      </div>

      {/* NEW: Post Modal for full comment view */}
      <PostModal
        post={post}
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        currentUser={currentUser}
        onLike={onLike}
        onComment={onComment}
        onDelete={onDelete}
        onShare={onShare}
        onUniverseClick={onUniverseClick}
        onHashtagClick={onHashtagClick}
      />
    </>
  );
};

export default PostCard;