import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader } from 'lucide-react';
import PostCard from './PostCard';
import FeedService from '../../services/feedServices';
import PostComposer from './PostComposer';

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
          response = await FeedService.getPersonalFeed(pageNum, 20);
          break;
        case 'universe':
          if (!universeSlug) throw new Error('Universe slug required for universe feed');
          response = await FeedService.getUniverseFeed(universeSlug, pageNum, 20);
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
  }, [type, universeSlug, timeframe]);

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
    // console.log('⚠️ Fallback: Post wird manuell hinzugefügt');
    setPosts(prev => [newPost, ...prev]);
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await FeedService.deletePost(postId);
      
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
  const handleLike = async (postId, liked) => {
    // TODO: Implement like functionality
    console.log(`${liked ? 'Liked' : 'Unliked'} post:`, postId);
  };

  const handleComment = async (postId) => {
    // TODO: Implement comment functionality
    console.log('Comment on post:', postId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
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
        onPostCreated={handlePostCreated}    // Fallback
        onFeedReload={handleFeedReload}      // Hauptmethode
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
        <h2 className="text-xl font-bold text-gray-900">
          {type === 'personal' && 'Dein Feed'}
          {type === 'universe' && `${universeSlug} Universe`}
          {type === 'trending' && 'Trending Posts'}
        </h2>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 text-gray-500 hover:text-purple-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-sm">Aktualisieren</span>
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-gray-500">
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
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
              onHashtagClick={onHashtagClick}
              onLike={handleLike}
              onComment={handleComment}
              onDelete={handleDeletePost}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
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
    </div>
  );
};

export default Feed;