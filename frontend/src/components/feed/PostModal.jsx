import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PostCard from './PostCard';
import CommentSection from './CommentSection';
import useEscapeKey from '../../hooks/useEscapeKey';

const PostModal = ({ 
  post, 
  isOpen, 
  onClose, 
  currentUser,
  onLike,
  onComment,
  onDelete,
  onShare,
  onUniverseClick,
  onHashtagClick 
}) => {
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);

  // Close on Escape key
  useEscapeKey(() => {
    if (isOpen) onClose();
  }, isOpen);

  // Handle comment added
  const handleCommentAdded = (postId) => {
    setCommentCount(prev => prev + 1);
    if (onComment) {
      onComment(postId);
    }
  };

  // Update comment count when post changes
  useEffect(() => {
    if (post) {
      setCommentCount(post.commentCount || 0);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Post</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary hover:cursor-pointer p-1 rounded-full hover:bg-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Post Card */}
          <div className="p-6 border-b border-primary">
            <PostCard
              post={{
                ...post,
                commentCount // Use local state for updated count
              }}
              currentUser={currentUser}
              onLike={onLike}
              onComment={handleCommentAdded}
              onDelete={onDelete}
              onShare={onShare}
              onUniverseClick={onUniverseClick}
              onHashtagClick={onHashtagClick}
              showUserInfo={true}
            />
          </div>

          {/* Comment Section (inline, not modal) */}
          <div className="p-6">
            <CommentSection
              postId={post.id}
              isOpen={true} // Always open in modal
              onClose={() => {}} // No close needed
              onCommentAdded={handleCommentAdded}
              currentUser={currentUser}
              isInline={true} // Flag to indicate inline usage
            />
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};

export default PostModal;