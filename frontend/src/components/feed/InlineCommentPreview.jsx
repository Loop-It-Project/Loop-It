import { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  User,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import commentService from '../../services/commentService';

const InlineCommentPreview = ({ 
  postId, 
  isVisible, 
  onShowMore, 
  onCommentAdded,
  limit = 3,
  currentUser
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likingComments, setLikingComments] = useState(new Set());
  const [totalComments, setTotalComments] = useState(0);

  // Comment Input States
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reply States
  const [replyStates, setReplyStates] = useState({});
  const [likingReplies, setLikingReplies] = useState(new Set());

  // Comments laden wenn sichtbar
  useEffect(() => {
    if (isVisible && postId) {
      loadComments();
    }
  }, [isVisible, postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getPostComments(postId, 1, limit);

      console.log('🔍 InlineCommentPreview: Comments response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        paginationTotal: response.pagination?.total,
        total: response.total,
        hasMore: response.pagination?.hasMore,
        limit,
        postId
      });

      if (response.success) {
        setComments(response.data);
        const total = Number(response.pagination?.total) || Number(response.total) || response.data.length;
        setTotalComments(total);

        console.log('✅ InlineCommentPreview: Updated state:', {
          commentsLoaded: response.data.length,
          totalCommentsSet: total,
          totalType: typeof total,
          limitType: typeof limit,
          shouldShowButton: total > limit
        });
      }
    } catch (error) {
      console.error('Load comments preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Comment Submit Handler
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    if (!currentUser) {
      setError('Du musst angemeldet sein, um zu kommentieren');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await commentService.addComment(postId, newComment.trim());

      if (response.success) {
        // Neuen Comment zur Liste hinzufügen (am Anfang)
        setComments(prev => [response.data, ...prev]);
        setTotalComments(prev => prev + 1);
        setNewComment('');
        
        // Parent Component benachrichtigen (aber KEIN Modal öffnen)
        if (onCommentAdded) {
          onCommentAdded(postId);
        }

        // console.log('✅ InlineCommentPreview: Comment added successfully - NO MODAL OPENING');
      } else {
        setError(response.error || 'Fehler beim Hinzufügen des Kommentars');
      }
    } catch (error) {
      console.error('❌ Submit comment error:', error);
      setError('Netzwerkfehler beim Hinzufügen des Kommentars');
    } finally {
      setSubmitting(false);
    }
  };

  // Comment Like Handler
  const handleCommentLike = async (commentId, currentIsLiked, currentLikeCount) => {
    if (likingComments.has(commentId)) return;

    setLikingComments(prev => new Set(prev).add(commentId));

    try {
      // Optimistic Update
      setComments(prev => prev.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              isLikedByUser: !currentIsLiked,
              likeCount: currentIsLiked ? currentLikeCount - 1 : currentLikeCount + 1
            }
          : comment
      ));

      const response = await commentService.toggleCommentLike(commentId, postId);

      if (response.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLikedByUser: response.data.isLiked,
                likeCount: response.data.likeCount
              }
            : comment
        ));
      } else {
        // Revert on error
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLikedByUser: currentIsLiked,
                likeCount: currentLikeCount
              }
            : comment
        ));
      }
    } catch (error) {
      console.error('Comment like error:', error);
      // Revert on error
      setComments(prev => prev.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              isLikedByUser: currentIsLiked,
              likeCount: currentLikeCount
            }
          : comment
      ));
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  // Reply Toggle Handler
  const toggleReplies = async (commentId) => {
    const currentState = replyStates[commentId] || {};
    
    if (currentState.showReplies) {
      // Replies verstecken
      setReplyStates(prev => ({
        ...prev,
        [commentId]: { ...currentState, showReplies: false }
      }));
    } else {
      // Replies laden und anzeigen
      if (!currentState.replies) {
        try {
          const response = await commentService.getCommentReplies(commentId, 1, 10);
          if (response.success) {
            setReplyStates(prev => ({
              ...prev,
              [commentId]: {
                ...currentState,
                replies: response.data,
                showReplies: true
              }
            }));
          }
        } catch (error) {
          console.error('Load replies error:', error);
        }
      } else {
        setReplyStates(prev => ({
          ...prev,
          [commentId]: { ...currentState, showReplies: true }
        }));
      }
    }
  };

  // Reply Form Toggle
  const toggleReplyForm = (commentId) => {
    const currentState = replyStates[commentId] || {};
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...currentState,
        showReplyForm: !currentState.showReplyForm,
        newReply: currentState.showReplyForm ? '' : (currentState.newReply || '')
      }
    }));
  };

  // Reply Submit Handler
  const handleSubmitReply = async (commentId) => {
    const currentState = replyStates[commentId] || {};
    const replyContent = currentState.newReply?.trim();

    if (!replyContent) return;

    try {
      const response = await commentService.addCommentReply(postId, commentId, replyContent);

      if (response.success) {
        // Reply zur Liste hinzufügen
        setReplyStates(prev => ({
          ...prev,
          [commentId]: {
            ...currentState,
            newReply: '',
            showReplyForm: false,
            replies: [response.data, ...(currentState.replies || [])],
            showReplies: true
          }
        }));

        // Reply-Count im Haupt-Comment erhöhen
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? { ...comment, replyCount: comment.replyCount + 1 }
            : comment
        ));

        if (onCommentAdded) {
          onCommentAdded(postId);
        }
      } else {
        console.error('Reply failed:', response.error);
      }
    } catch (error) {
      console.error('Submit reply error:', error);
    }
  };

  // Reply Input Handler
  const handleReplyChange = (commentId, value) => {
    const currentState = replyStates[commentId] || {};
    setReplyStates(prev => ({
      ...prev,
      [commentId]: { ...currentState, newReply: value }
    }));
  };

  // Reply Like Handler
  const handleReplyLike = async (replyId, currentIsLiked, currentLikeCount) => {
    if (likingReplies.has(replyId)) return;

    setLikingReplies(prev => new Set(prev).add(replyId));

    try {
      // Optimistic Update für Replies
      setReplyStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(commentId => {
          if (newStates[commentId].replies) {
            newStates[commentId].replies = newStates[commentId].replies.map(reply =>
              reply.id === replyId
                ? {
                    ...reply,
                    isLikedByUser: !currentIsLiked,
                    likeCount: currentIsLiked ? currentLikeCount - 1 : currentLikeCount + 1
                  }
                : reply
            );
          }
        });
        return newStates;
      });

      const response = await commentService.toggleCommentLike(replyId, postId);

      if (response.success) {
        setReplyStates(prev => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach(commentId => {
            if (newStates[commentId].replies) {
              newStates[commentId].replies = newStates[commentId].replies.map(reply =>
                reply.id === replyId
                  ? {
                      ...reply,
                      isLikedByUser: response.data.isLiked,
                      likeCount: response.data.likeCount
                    }
                  : reply
              );
            }
          });
          return newStates;
        });
      } else {
        // Revert bei Fehler
        setReplyStates(prev => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach(commentId => {
            if (newStates[commentId].replies) {
              newStates[commentId].replies = newStates[commentId].replies.map(reply =>
                reply.id === replyId
                  ? {
                      ...reply,
                      isLikedByUser: currentIsLiked,
                      likeCount: currentLikeCount
                    }
                  : reply
              );
            }
          });
          return newStates;
        });
      }
    } catch (error) {
      console.error('Reply like error:', error);
      // Revert bei Fehler
      setReplyStates(prev => {
        const newStates = { ...prev };
        Object.keys(newStates).forEach(commentId => {
          if (newStates[commentId].replies) {
            newStates[commentId].replies = newStates[commentId].replies.map(reply =>
              reply.id === replyId
                ? {
                    ...reply,
                    isLikedByUser: currentIsLiked,
                    likeCount: currentLikeCount
                  }
                : reply
            );
          }
        });
        return newStates;
      });
    } finally {
      setLikingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(replyId);
        return newSet;
      });
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

  // Reload when new comment is added
  useEffect(() => {
    if (onCommentAdded) {
      loadComments();
    }
  }, [onCommentAdded]);

  if (!isVisible) return null;

  // Show More Button Logik
  const shouldShowMoreButton = totalComments > 0; // Zeigt Button bereits ab 1 Comment
  const hasRepliesOverLimit = comments.some(c => (replyStates[c.id]?.replies?.length || 0) > 2);

console.log('🔍 Show More Button Final Check:', {
  totalComments,
  limit,
  commentsLength: comments.length,
  shouldShowMoreButton,
  hasRepliesOverLimit,
  finalCondition: shouldShowMoreButton || hasRepliesOverLimit,
  postId
});

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
       {/* Comment Input Form */}
      {currentUser && (
        <div className="mb-4">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={14} />
            </div>

            {/* Input Area */}
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Schreibe einen Kommentar..."
                  className="w-full p-3 pr-12 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  rows={2}
                  maxLength={1000}
                  disabled={submitting}
                />
                
                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="absolute right-2 bottom-2 p-1.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} className={submitting ? 'animate-pulse' : ''} />
                </button>
              </div>

              {/* Character Count & Error */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-tertiary">
                  {newComment.length}/1000
                </span>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="text-tertiary text-sm">Lade Kommentare...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-tertiary">
          <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Noch keine Kommentare</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Comments List */}
          {comments.map((comment) => {
            const isLikingComment = likingComments.has(comment.id);
            const commentState = replyStates[comment.id] || {};

            return (
              <div key={comment.id} className="space-y-3">
                {/* Main Comment */}
                <div className="flex space-x-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-white" size={14} />
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-card border-1 border-primary rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-primary text-sm">
                          {comment.author?.displayName || comment.author?.username}
                        </span>
                        <span className="text-xs text-tertiary">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                        {comment.isEdited && (
                          <span className="text-xs text-tertiary">(bearbeitet)</span>
                        )}
                      </div>
                      <p className="text-secondary text-sm whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center space-x-4 mt-2 ml-3">
                      <button 
                        onClick={() => handleCommentLike(comment.id, comment.isLikedByUser, comment.likeCount)}
                        disabled={isLikingComment}
                        className={`flex items-center space-x-1 text-xs transition-colors hover:cursor-pointer ${
                          comment.isLikedByUser 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-tertiary hover:text-red-500'
                        } ${isLikingComment ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Heart 
                          size={12} 
                          className={`transition-all duration-200 ${
                            comment.isLikedByUser ? 'fill-current' : ''
                          } ${isLikingComment ? 'animate-pulse' : ''}`}
                        />
                        <span>{isLikingComment ? '...' : (comment.likeCount || 0)}</span>
                      </button>

                      {/* Reply Button */}
                      {currentUser && (
                        <button 
                          onClick={() => toggleReplyForm(comment.id)}
                          className="text-xs text-tertiary hover:text-blue-500 hover:cursor-pointer transition-colors"
                        >
                          Antworten
                        </button>
                      )}

                      {/* Show Replies Button */}
                      {comment.replyCount > 0 && (
                        <button 
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 hover:cursor-pointer transition-colors"
                        >
                          {commentState.showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span>
                            {comment.replyCount} {comment.replyCount === 1 ? 'Antwort' : 'Antworten'}
                            {commentState.showReplies ? ' ausblenden' : ' anzeigen'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Reply Form */}
                    {commentState.showReplyForm && (
                      <div className="mt-3 ml-3 flex space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-white" size={12} />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <textarea
                              value={commentState.newReply || ''}
                              onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                              placeholder="Schreibe eine Antwort..."
                              className="w-full p-2 pr-10 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              rows={2}
                              maxLength={1000}
                            />
                            <button
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!(commentState.newReply?.trim())}
                              className="absolute right-2 bottom-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-tertiary">
                              {(commentState.newReply || '').length}/1000
                            </span>
                            <button
                              onClick={() => toggleReplyForm(comment.id)}
                              className="text-xs text-tertiary hover:text-secondary hover:cursor-pointer transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies List */}
                    {commentState.showReplies && commentState.replies && (
                      <div className="mt-3 ml-6 space-y-2 border-l-2 border-gray-100 pl-3">
                        {commentState.replies.slice(0, 2).map((reply) => { // Nur 2 Replies in Preview
                          const isLikingReply = likingReplies.has(reply.id);
                          
                          return (
                            <div key={reply.id} className="flex space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="text-white" size={10} />
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-card border-1 border-primary rounded-lg p-2">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-primary text-xs">
                                      {reply.author?.displayName || reply.author?.username}
                                    </span>
                                    <span className="text-xs text-tertiary">
                                      {formatTimeAgo(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-secondary text-xs whitespace-pre-wrap leading-relaxed">
                                    {reply.content}
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-1 ml-2">
                                  <button 
                                    onClick={() => handleReplyLike(reply.id, reply.isLikedByUser, reply.likeCount)}
                                    disabled={isLikingReply}
                                    className={`flex items-center space-x-1 text-xs transition-colors hover:cursor-pointer ${
                                      reply.isLikedByUser 
                                        ? 'text-red-500 hover:text-red-600' 
                                        : 'text-tertiary hover:text-red-500'
                                    } ${isLikingReply ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <Heart 
                                      size={10} 
                                      className={`transition-all duration-200 ${
                                        reply.isLikedByUser ? 'fill-current' : ''
                                      } ${isLikingReply ? 'animate-pulse' : ''}`}
                                    />
                                    <span>{isLikingReply ? '...' : (reply.likeCount || 0)}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Show more replies hint */}
                        {commentState.replies.length > 2 && (
                          <button
                            onClick={onShowMore}
                            className="text-xs text-purple-600 hover:text-purple-700 ml-8 hover:cursor-pointer transition-colors"
                          >
                            +{commentState.replies.length - 2} weitere Antworten anzeigen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show More Button */}
          {(shouldShowMoreButton || hasRepliesOverLimit) && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={onShowMore}
                className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 transition-colors hover:cursor-pointer bg-primary hover:bg-hover px-3 py-2 rounded-lg"
                title="Post im Detail anzeigen"
              >
                <MessageCircle size={16} />
                <span>
                  {totalComments === 1 
                    ? 'Kommentar im Detail anzeigen'
                    : totalComments > 1 
                    ? `Alle ${totalComments} Kommentare im Detail anzeigen`
                    : 'Im Detail anzeigen'
                  }
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineCommentPreview;