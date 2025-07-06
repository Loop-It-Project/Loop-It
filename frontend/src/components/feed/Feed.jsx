import { useState, useEffect, useCallback } from 'react';
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
  timeframe = '24h',
  onUniverseClick,
  onHashtagClick
}) => {
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
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'trending'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Filter Optionen
  const filterOptions = [
    { value: 'newest', label: 'Neueste zuerst', icon: '🆕' },
    { value: 'oldest', label: 'Älteste zuerst', icon: '📅' },
    { value: 'trending', label: 'Trending', icon: '🔥' },
  ];

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
    // console.log('Feed handleShare called:', { postId, platform, newShareCount });
    
    // Update Post in der lokalen Liste
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
      } else if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let response;
      
      switch (type) {
        case 'personal':
          response = await FeedService.getPersonalFeed(pageNum, 20, sortBy);
          break;
        case 'universe':
          if (!universeSlug) throw new Error('Universe slug required for universe feed');
          response = await FeedService.getUniverseFeed(universeSlug, pageNum, 20, sortBy); 
          break;
        case 'trending':
          response = await FeedService.getTrendingFeed(timeframe, 20);
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

  // Filter ändern
  const handleFilterChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowFilterDropdown(false);
    // Feed neu laden mit neuem Filter
    loadFeed(1, true);
  };

  // Initial load
  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

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
    // console.log('🔄 Feed wird nach Post-Erstellung neu geladen...');
    setIsCreatingPost(true);
    try {
      await loadFeed(1, true); // Seite 1, Refresh-Modus
      // console.log('✅ Feed-Reload erfolgreich');
    } catch (error) {
      // console.error('❌ Feed-Reload Fehler:', error);
    } finally {
      setIsCreatingPost(false);
    }
  }, [loadFeed]);

  // Fallback: Post manuell hinzufügen
  const handlePostCreated = (newPost) => {
    console.log('⚠️ Fallback: Post wird manuell hinzugefügt');
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await PostService.deletePost(postId);
      
      if (response.success) {
        // Post aus der Liste entfernen
        setPosts(prev => prev.filter(post => post.id !== postId));
      } else {
        throw new Error(response.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error; // Re-throw für PostCard error handling
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
    // console.log('Feed handleLike called:', { postId, isLiked, newLikeCount }); 
    
    // NULL/UNDEFINED Check hinzufügen
    if (isLiked === undefined || newLikeCount === undefined) {
      console.warn('⚠️ Ungültige Like-Daten erhalten:', { isLiked, newLikeCount });
      return; // Früh beenden wenn Daten ungültig sind
    }

    // Update Post in der lokalen Liste
    setPosts(prev => {
      const updated = prev.map(post => 
        post.id === postId 
          ? { ...post, isLikedByUser: isLiked, likeCount: newLikeCount }
          : post
      );

      // console.log('Posts updated in Feed:', updated.find(p => p.id === postId)); 
      return updated;
    });
  };

  // Hashtag Click Handler sicherstellen
  const handleHashtagClick = (targetUniverseSlug, hashtag) => {
    // console.log('Feed handleHashtagClick called:', { targetUniverseSlug, hashtag });
    
    if (onHashtagClick && typeof onHashtagClick === 'function') {
      onHashtagClick(targetUniverseSlug, hashtag);
    } else {
      console.warn('⚠️ onHashtagClick prop not provided to Feed');
      // Fallback: Direct navigation if no handler provided
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
          {type === 'trending' && 'Trending Posts'}
        </h2>

        <div className="flex items-center space-x-3">
          {/* Filter Dropdown - nur wenn nicht bereits trending */}
          {type !== 'trending' && (
            <div className="relative filter-dropdown">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-card border border-secondary rounded-lg hover:bg-secondary hover:cursor-pointer transition-colors"
              >
                <Filter size={16} />
                <span className="text-sm font-medium">
                  {filterOptions.find(opt => opt.value === sortBy)?.label}
                </span>
                <ChevronDown size={14} />
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-card border border-primary rounded-lg shadow-lg py-2 min-w-[160px] z-50">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange(option.value)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-secondary hover:cursor-pointer transition-colors ${
                        sortBy === option.value ? 'bg-purple-50 text-purple-700' : 'text-secondary'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span className="text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        
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