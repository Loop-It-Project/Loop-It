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

const PostCard = ({ post, onUniverseClick, onHashtagClick, onLike, onComment }) => {
  const [isLiked, setIsLiked] = useState(post.isLikedByUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);


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

    // Hashtag Click Handler:
    const handleHashtagClick = async (hashtag) => {
      if (!onHashtagClick) return;

      try {
        const result = await HashtagService.findUniverseByHashtag(hashtag);

        if (result.success) {
          // Navigiere zu Universe
          onHashtagClick(result.universe.slug, hashtag);
        } else {
          // Hashtag existiert nicht
          alert(`Kein Universe für #${hashtag} gefunden`);
        }
      } catch (error) {
        console.error('Error handling hashtag click:', error);
      }
    };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            {post.authorAvatar ? (
              <img 
                src={`/api/media/${post.authorAvatar}`} 
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="text-white" size={20} />
            )}
          </div>
          
          {/* Author Info */}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">
                {post.authorName || post.authorUsername}
              </h3>
              <span className="text-gray-500 text-sm">@{post.authorUsername}</span>
            </div>
            
            {/* Universe & Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {post.universeName && (
                <>
                  <button
                    onClick={handleUniverseClick}
                    className="flex items-center space-x-1 hover:text-purple-600 transition-colors"
                  >
                    <Hash size={14} />
                    <span>{post.universeName}</span>
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
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && (
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {post.title}
          </h2>
        )}
        
        {post.content && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Media */}
        {post.mediaIds && post.mediaIds.length > 0 && (
          <div className="mt-3 rounded-lg overflow-hidden">
            {/* Placeholder für Media - später implementieren */}
            <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-500">
              Media wird bald unterstützt
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.map((hashtag, index) => (
              <button
                key={index}
                onClick={() => handleHashtagClick(hashtag)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded transition-colors text-sm font-medium"
              >
                #{hashtag}
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
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
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
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </button>

          {/* Share */}
          <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
            <Share2 size={20} />
            <span className="text-sm font-medium">{post.shareCount || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;