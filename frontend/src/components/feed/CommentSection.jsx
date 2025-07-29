import { useState, useEffect } from 'react';
import { 
  Send,
  Heart, 
  MessageCircle, 
  User, 
  Clock, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import commentService from '../../services/commentService';

const CommentSection = ({ postId, isOpen, onClose, onCommentAdded, currentUser, isInline = false }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Reply-spezifische States
  const [replyStates, setReplyStates] = useState({}); // { commentId: { showReplies, showReplyForm, newReply, replies, etc. } }
  const [likingComments, setLikingComments] = useState(new Set()); // Currently liking comments
  const [likingReplies, setLikingReplies] = useState(new Set()); // Currently liking replies

  // Comments laden
  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError('');

      const response = await commentService.getPostComments(postId, pageNum, 20);
      
      if (response.success) {
        if (append) {
          setComments(prev => [...prev, ...response.data]);
        } else {
          setComments(response.data);
        }
        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } else {
        setError(response.error || 'Fehler beim Laden der Kommentare');
      }
    } catch (error) {
      console.error('Load comments error:', error);
      setError('Netzwerkfehler beim Laden der Kommentare');
    } finally {
      setLoading(false);
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
        // Server-Response anwenden
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLikedByUser: response.data.isLiked,
                likeCount: response.data.likeCount
              }
            : comment
        ));
        
        // console.log('✅ Comment like updated successfully');
      } else {
        // Revert bei Fehler
        setComments(prev => prev.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                isLikedByUser: currentIsLiked,
                likeCount: currentLikeCount
              }
            : comment
        ));
        console.error('❌ Comment like failed:', response.error);
        
        // Optional: User feedback
        setError(`Failed to ${currentIsLiked ? 'unlike' : 'like'} comment: ${response.error}`);
        setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      }
    } catch (error) {
      // Revert bei Fehler
      setComments(prev => prev.map(comment => 
        comment.id === commentId
          ? {
              ...comment,
              isLikedByUser: currentIsLiked,
              likeCount: currentLikeCount
            }
          : comment
      ));
      console.error('❌ Comment like error:', error);
      setError('Network error occurred while liking comment');
      setTimeout(() => setError(''), 3000);
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
                showReplies: true,
                replies: response.data,
                repliesPagination: response.pagination
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

        // Parent über neuen Comment informieren
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
        // Server-Response anwenden
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
        
        // console.log('✅ Reply like updated successfully');
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
        console.error('❌ Reply like failed:', response.error);
      }
    } catch (error) {
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
      console.error('❌ Reply like error:', error);
    } finally {
      setLikingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(replyId);
        return newSet;
      });
    }
  };

  const isLikingReply = (replyId) => likingReplies.has(replyId);

  // Kommentar absenden
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await commentService.addComment(postId, newComment.trim());

      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        
        // Nur callback, KEIN Modal öffnen
        if (onCommentAdded) {
          onCommentAdded(postId);
        }

        // console.log('✅ CommentSection: Comment added - staying inline');
      } else {
        setError(response.error || 'Fehler beim Hinzufügen des Kommentars');
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      setError('Netzwerkfehler beim Hinzufügen des Kommentars');
    } finally {
      setSubmitting(false);
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

  if (!isOpen) return null;

  // NEW: Render different layouts based on isInline flag
  if (isInline) {
    // Inline layout for PostModal
    return (
      <div className="space-y-6">
        {/* Comment Form */}
        {currentUser && (
          <div>
            <h4 className="text-lg font-semibold text-primary mb-4">Kommentare</h4>
            <form onSubmit={handleSubmitComment} className="flex space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Schreibe einen Kommentar..."
                  className="w-full p-3 border border-secondary rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  maxLength={1000}
                  disabled={submitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-tertiary">
                    {newComment.length}/1000
                  </span>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                    <span>{submitting ? 'Sende...' : 'Kommentieren'}</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Anzeige wenn nicht eingeloggt */}
        {!currentUser && (
          <div className="text-center py-4 text-tertiary">
            <p className="text-sm">Du musst angemeldet sein, um zu kommentieren</p>
          </div>
        )}

        {/* Comments List */}
        <div>
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-tertiary">Lade Kommentare...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-tertiary">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Noch keine Kommentare.</p>
              <p className="text-sm mt-1">Sei der Erste, der kommentiert!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const commentState = replyStates[comment.id] || {};
                const isLikingComment = likingComments.has(comment.id);

                return (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="bg-hover rounded-lg p-3">
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
                          <p className="text-secondary text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                    
                        {/* Comment Actions */}
                        <div className="flex items-center space-x-4 mt-2 ml-3">
                          {/* Like Button */}
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
                              size={14} 
                              className={`transition-all duration-200 ${
                                comment.isLikedByUser ? 'fill-current' : ''
                              } ${isLikingComment ? 'animate-pulse' : ''}`}
                            />
                            <span>{isLikingComment ? '...' : (comment.likeCount || 0)}</span>
                          </button>
                          
                          <button 
                            onClick={() => toggleReplyForm(comment.id)}
                            className="text-xs text-tertiary hover:text-blue-500 hover:cursor-pointer transition-colors"
                          >
                            Antworten
                          </button>
                          
                          {comment.replyCount > 0 && (
                            <button 
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 hover:cursor-pointer transition-colors"
                            >
                              {commentState.showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                              <textarea
                                value={commentState.newReply || ''}
                                onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                placeholder="Schreibe eine Antwort..."
                                className="w-full p-2 border border-secondary rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                rows={2}
                                maxLength={1000}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-tertiary">
                                  {(commentState.newReply || '').length}/1000
                                </span>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleReplyForm(comment.id)}
                                    className="px-3 py-1 text-xs text-tertiary hover:text-secondary hover:cursor-pointer transition-colors"
                                  >
                                    Abbrechen
                                  </button>
                                  <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={!(commentState.newReply?.trim())}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Antworten
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => loadComments(page + 1, true)}
                    disabled={loading}
                    className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Lade...' : 'Mehr Kommentare laden'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default CommentSection;