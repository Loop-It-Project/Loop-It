import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RefreshCw, Loader, Filter, ChevronDown } from 'lucide-react';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import CommentSection from './CommentSection';
import FeedService from '../../services/feedServices';
import PostService from '../../services/postService';
import HashtagService from '../../services/hashtagService';
import useEscapeKey from '../../hooks/useEscapeKey';

const Feed = ({ 
  type = 'personal', // 'personal', 'universe', 'trending'
  universeSlug = null,
  timeframe = '7d',
  onUniverseClick,
  onHashtagClick,
  onTimeframeChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Filter States
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Filter Optionen
  const filterOptions = [
    { value: 'newest', label: 'Neueste zuerst', icon: '🆕' },
    { value: 'oldest', label: 'Älteste zuerst', icon: '📅' },
    { value: 'trending', label: 'Trending', icon: '🔥' },
  ];

  // ERWEITERTE TIMEFRAME OPTIONS
  const trendingFilterOptions = [
    { value: '1h', label: 'Letzte Stunde', icon: '⚡' },
    { value: '6h', label: 'Letzte 6 Stunden', icon: '🔥' },
    { value: '24h', label: 'Heute', icon: '📅' },
    { value: '7d', label: 'Diese Woche', icon: '📊' },
    { value: '30d', label: 'Dieser Monat', icon: '📈' },
  ];

  // Conditional filter options based on feed type
  const getFilterOptions = () => {
    if (type === 'trending') {
      return trendingFilterOptions;
    }
    return filterOptions;
  };

  // ESC-Key Handler für Filter Dropdown
  useEscapeKey(() => {
    if (showFilterDropdown) {
      setShowFilterDropdown(false);
    }
  }, showFilterDropdown);

  // Click-Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown && !event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  // Share Handler
  const handleShare = (postId, platform, newShareCount) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, shareCount: newShareCount || (post.shareCount || 0) + 1 }
        : post
    ));
  };

  // Feed laden
  const loadFeed = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(pageNum === 1);
        setLoadingMore(pageNum > 1);
      }

      let response;
      
      switch (type) {
        case 'personal':
          response = await FeedService.getPersonalFeed(pageNum, 20, sortBy);
          break;
          
        case 'universe':
          if (!universeSlug) throw new Error('Universe slug required');
          response = await FeedService.getUniverseFeed(universeSlug, pageNum, 20, sortBy);
          break;
          
        case 'trending':
          console.log('🔥 Loading trending feed with timeframe:', timeframe);
          response = await FeedService.getTrendingFeed(timeframe, pageNum, 20);
          break;
          
        default:
          throw new Error('Invalid feed type');
      }

      if (response.success) {
        const newPosts = response.data.posts || [];
        
        if (pageNum === 1 || isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setHasMore(response.data.pagination?.hasMore || false);
        setPage(pageNum);

        console.log(`✅ Feed loaded (${type}):`, {
          page: pageNum,
          postsCount: newPosts.length,
          timeframe: type === 'trending' ? timeframe : 'N/A'
        });

      } else {
        throw new Error(response.error || 'Failed to load feed');
      }
    } catch (err) {
      console.error('Feed loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [type, universeSlug, timeframe, sortBy]);

  // TIMEFRAME CHANGE HANDLER (nur für Trending)
  const handleTimeframeChange = (newTimeframe) => {
    if (type === 'trending' && onTimeframeChange) {
      console.log('🔄 Feed: Changing timeframe from', timeframe, 'to', newTimeframe);
      onTimeframeChange(newTimeframe);
    }
  };

  // Filter ändern
  const handleFilterChange = (newValue) => {
    console.log('🔄 Filter change:', { type, newValue, currentValue: type === 'trending' ? timeframe : sortBy });
    
    if (type === 'trending') {
      handleTimeframeChange(newValue);
    } else {
      setSortBy(newValue);
    }
    
    setShowFilterDropdown(false);
  };

  // INITIAL LOAD UND RE-LOAD BEI DEPENDENCY CHANGES
  useEffect(() => {
    // console.log('🔄 Feed: Dependencies changed, reloading...', { type, timeframe, sortBy });
    loadFeed(1, true);
  }, [type, timeframe, sortBy, universeSlug]); // Reagiert auf alle wichtigen Änderungen

  // Refresh
  const handleRefresh = () => {
    loadFeed(1, true);
  };

  // Load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadFeed(page + 1);
    }
  };

  // Feed-Reload Funktion nach Post-Erstellung
  const handleFeedReload = useCallback(async () => {
    setIsCreatingPost(true);
    try {
      await loadFeed(1, true);
    } catch (error) {
      console.error('❌ Feed-Reload Fehler:', error);
    } finally {
      setIsCreatingPost(false);
    }
  }, [loadFeed]);

  const handlePostCreated = (newPost) => {
    console.log('⚠️ Fallback: Post wird manuell hinzugefügt');
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await PostService.deletePost(postId);
      
      if (response.success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
      } else {
        throw new Error(response.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  // Post Actions
  // Comment Modal Handler
  const handleComment = (postId) => {
    setSelectedPostId(postId);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedPostId(null);
  };

  // Comment Count erhöhen
  const handleCommentAdded = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, commentCount: (post.commentCount || 0) + 1 }
        : post
    ));
  };

  // Like Handler
  const handleLike = (postId, isLiked, newLikeCount) => {
    if (isLiked === undefined || newLikeCount === undefined) {
      console.warn('⚠️ Ungültige Like-Daten erhalten:', { isLiked, newLikeCount });
      return;
    }

    setPosts(prev => {
      const updated = prev.map(post => 
        post.id === postId 
          ? { ...post, isLikedByUser: isLiked, likeCount: newLikeCount }
          : post
      );
      return updated;
    });
  };

  // Hashtag Click Handler sicherstellen
  const handleHashtagClick = (targetUniverseSlug, hashtag) => {
    if (onHashtagClick && typeof onHashtagClick === 'function') {
      onHashtagClick(targetUniverseSlug, hashtag);
    } else {
      console.warn('⚠️ onHashtagClick prop not provided to Feed');
      if (window.confirm(`Möchtest du zum Universe #${targetUniverseSlug} wechseln?`)) {
        window.location.href = `/universe/${targetUniverseSlug}?hashtag=${hashtag}`;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-tertiary">
          <Loader className="animate-spin" size={20} />
          <span>Feed wird geladen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <p className="text-lg font-semibold">Fehler beim Laden des Feeds</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post Composer - nur bei personal und universe feed */}
      {(type === 'personal' || type === 'universe') && (
        <PostComposer 
          onPostCreated={handlePostCreated}
          onFeedReload={handleFeedReload}
        />
      )}

      {/* Loading-Feedback anzeigen */}
      {isCreatingPost && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">
              Post wird erstellt und Feed aktualisiert...
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">
          {type === 'personal' && 'Dein Feed'}
          {type === 'universe' && `${universeSlug} Universe`}
          {type === 'trending' && (
            <div className="flex items-center gap-2">
              <span>Trending Posts</span>
              <span className="text-sm font-normal text-secondary">
                ({getFilterOptions().find(opt => opt.value === timeframe)?.label || 'Diese Woche'})
              </span>
            </div>
          )}
        </h2>

        <div className="flex items-center space-x-3">
          {/* Filter Dropdown */}
          <div className="relative filter-dropdown">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-card border border-secondary rounded-lg hover:bg-secondary hover:cursor-pointer transition-colors"
            >
              <Filter size={16} />
              <span className="text-sm font-medium">
                {type === 'trending' 
                  ? trendingFilterOptions.find(opt => opt.value === timeframe)?.label || 'Diese Woche'
                  : filterOptions.find(opt => opt.value === sortBy)?.label
                }
              </span>
              <ChevronDown size={14} />
            </button>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-secondary z-10">
                {getFilterOptions().map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary hover:cursor-pointer transition-colors ${
                      (type === 'trending' ? timeframe : sortBy) === option.value 
                        ? 'bg-purple-50 text-purple-700' 
                        : ''
                    }`}
                  >
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        
        {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 text-tertiary hover:text-purple-600 transition-colors hover:cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            <span className="text-sm">Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-tertiary">
            <Loader className="animate-spin" size={20} />
            <span>Feed wird geladen...</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold">Fehler beim Laden des Feeds</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 hover:cursor-pointer transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-tertiary">
            <p className="text-lg font-medium mb-2">Keine Posts gefunden</p>
            <p className="text-sm">
              {type === 'personal' && 'Folge einigen Universes um Posts in deinem Feed zu sehen!'}
              {type === 'universe' && 'In diesem Universe wurden noch keine Posts erstellt.'}
              {type === 'trending' && 'Momentan sind keine Posts im Trend.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUniverseClick={onUniverseClick}
              onHashtagClick={handleHashtagClick}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDeletePost}
              onShare={handleShare}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-hover text-secondary px-6 py-3 rounded-lg hover:bg-tertiary hover:cursor-pointer transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span>Lade mehr...</span>
                  </>
                ) : (
                  <span>Mehr Posts laden</span>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Comment Section Modal */}
      <CommentSection
        postId={selectedPostId}
        isOpen={showComments}
        onClose={handleCloseComments}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
};

export default Feed;