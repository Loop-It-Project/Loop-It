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

const CommentSection = ({ postId, isOpen, onClose, onCommentAdded }) => {
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

      const response = await commentService.getPostComments(postId, pageNum, 10);
      
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

      const response = await commentService.toggleCommentLike(commentId);

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
        console.error('Comment like failed:', response.error);
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
      console.error('Comment like error:', error);
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

      const response = await commentService.toggleCommentLike(replyId);

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
        console.error('Reply like failed:', response.error);
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
      console.error('Reply like error:', error);
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
      console.log('❌ Empty comment content');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      console.log('🔄 Submitting comment:', { 
        postId, 
        content: newComment.trim(),
        length: newComment.trim().length 
      }); 

      const response = await commentService.addComment(postId, newComment.trim());

      console.log('📥 Comment response:', response); 

      if (response.success) {
        // Neuen Kommentar an den Anfang der Liste hinzufügen
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
        
        // Parent-Komponente über neuen Comment informieren
        if (onCommentAdded && typeof onCommentAdded === 'function') {
          onCommentAdded(postId);
        }
        
        console.log('✅ Comment added successfully'); 
      } else {
        console.error('❌ Comment failed:', response.error); 
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">Kommentare</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-secondary hover:cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Comment Form */}
        <div className="p-4 border-b border-primary">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
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
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
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
                    
                        {/* Enhanced Comment Actions */}
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
                          
                          {/* Reply Button */}
                          <button 
                            onClick={() => toggleReplyForm(comment.id)}
                            className="text-xs text-tertiary hover:text-blue-500 hover:cursor-pointer transition-colors"
                          >
                            Antworten
                          </button>
                          
                          {/* Show Replies Button */}
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

                        {/* Replies List */}
                        {commentState.showReplies && commentState.replies && (
                          <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-100 pl-3">
                            {commentState.replies.map((reply) => (
                              <div key={reply.id} className="flex space-x-3">
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="text-white" size={12} />
                                </div>
                                <div className="flex-1">
                                  <div className="bg-hover border border-primary rounded-lg p-3 hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-primary text-sm">
                                        {reply.author?.displayName || reply.author?.username}
                                      </span>
                                      <span className="text-xs text-tertiary">
                                        {formatTimeAgo(reply.createdAt)}
                                      </span>
                                      {reply.isEdited && (
                                        <span className="text-xs text-tertiary">(bearbeitet)</span>
                                      )}
                                    </div>
                                    <p className="text-secondary text-xs whitespace-pre-wrap leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                  
                                  {/* Reply Actions (optional) */}
                                  <div className="flex items-center space-x-3 mt-1 ml-2">
                                    <button 
                                      onClick={() => handleReplyLike(reply.id, reply.isLikedByUser, reply.likeCount)}
                                      disabled={isLikingReply(reply.id)}
                                      className={`flex items-center space-x-1 text-xs transition-colors hover:cursor-pointer ${
                                        reply.isLikedByUser 
                                          ? 'text-red-500 hover:text-red-600' 
                                          : 'text-tertiary hover:text-red-500'
                                      } ${isLikingReply(reply.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <Heart 
                                        size={12} 
                                        className={`transition-all duration-200 ${
                                          reply.isLikedByUser ? 'fill-current' : ''
                                        } ${isLikingReply(reply.id) ? 'animate-pulse' : ''}`}
                                      />
                                      <span>{isLikingReply(reply.id) ? '...' : (reply.likeCount || 0)}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
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
    </div>
  );
};

export default CommentSection;