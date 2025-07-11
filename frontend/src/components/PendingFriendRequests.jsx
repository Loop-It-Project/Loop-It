import { useState, useEffect } from 'react';
import { User, Check, X, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FriendshipService from '../services/friendshipService';

const PendingFriendRequests = ({ currentUser, onRequestHandled, compact = true }) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await FriendshipService.getPendingRequests();
      
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setProcessingId(requestId);
    try {
      const response = await FriendshipService.acceptFriendRequest(requestId);
      if (response.success) {
        // Entferne aus received requests
        setRequests(prev => ({
          ...prev,
          received: prev.received.filter(req => req.id !== requestId)
        }));
        onRequestHandled?.();
      } else {
        alert(response.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId) => {
    setProcessingId(requestId);
    try {
      const response = await FriendshipService.declineFriendRequest(requestId);
      if (response.success) {
        // Entferne aus received requests
        setRequests(prev => ({
          ...prev,
          received: prev.received.filter(req => req.id !== requestId)
        }));
        onRequestHandled?.();
      } else {
        alert(response.error || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request');
    } finally {
      setProcessingId(null);
    }
  };

  // Navigation zu User-Profil
  const handleUserClick = (username) => {
    console.log('🔄 Navigating to user profile:', username);
    navigate(`/profile/${username}`);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'bg-card rounded-lg p-6 border border-primary'}`}>
        <div className="animate-pulse">
          <div className={`h-6 bg-hover rounded ${compact ? 'mb-3' : 'mb-4'}`}></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-hover rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-hover rounded mb-1"></div>
                  <div className="h-3 bg-hover rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRequests = requests.received.length + requests.sent.length;

  if (totalRequests === 0) {
    return null;
  }

  return (
    <div className={compact ? '' : 'bg-card rounded-lg p-6 border border-primary'}>
      {!compact && (
        <h3 className="font-semibold text-primary mb-4">
          Freundschaftsanfragen ({totalRequests})
        </h3>
      )}

      {/* Erhaltene Anfragen */}
      {requests.received.length > 0 && (
        <div className={compact ? 'mb-4' : 'mb-6'}>
          {!compact && (
            <h4 className="text-sm font-medium text-secondary mb-3">
              Erhalten ({requests.received.length})
            </h4>
          )}
          <div className="space-y-2">
            {requests.received.map((request) => (
              <div key={request.id} className={`flex items-center space-x-3 p-3 rounded-lg ${compact ? 'bg-card hover:bg-blue-100' : 'bg-blue-50'} transition-colors`}>
                {/* Anklickbarer Avatar */}
                <button
                  onClick={() => handleUserClick(request.user.username)}
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                  title={`Profil von ${request.user.displayName || request.user.username} besuchen`}
                >
                  <User className="text-white" size={14} />
                </button>

                <div className="flex-1 min-w-0">
                  {/* Anklickbarer Display Name */}
                  <button
                    onClick={() => handleUserClick(request.user.username)}
                    className="font-medium text-primary truncate text-sm hover:text-purple-600 transition-colors cursor-pointer block w-full text-left hover:underline"
                    title={`Profil von ${request.user.displayName || request.user.username} besuchen`}
                  >
                    {request.user.displayName || request.user.username}
                  </button>
                  
                  <div className="flex items-center space-x-2 text-xs text-tertiary">
                    {/* Anklickbarer Username */}
                    <button
                      onClick={() => handleUserClick(request.user.username)}
                      className="hover:text-purple-600 transition-colors cursor-pointer hover:underline"
                      title={`Profil von @${request.user.username} besuchen`}
                    >
                      @{request.user.username}
                    </button>
                    <span>•</span>
                    <span>{formatTimeAgo(request.requestedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleAccept(request.id)}
                    disabled={processingId === request.id}
                    className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check size={12} />
                    {!compact && <span>OK</span>}
                  </button>
                  <button
                    onClick={() => handleDecline(request.id)}
                    disabled={processingId === request.id}
                    className="flex items-center space-x-1 bg-gray-500 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <X size={12} />
                    {!compact && <span>Nein</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gesendete Anfragen */}
      {requests.sent.length > 0 && (
        <div>
          {!compact && (
            <h4 className="text-sm font-medium text-secondary mb-3">
              Gesendet ({requests.sent.length})
            </h4>
          )}
          <div className="space-y-2">
            {requests.sent.map((request) => (
              <div key={request.id} className={`flex items-center space-x-3 p-3 rounded-lg ${compact ? 'bg-gray-50' : 'bg-gray-50'}`}>
                {/* Anklickbarer Avatar */}
                <button
                  onClick={() => handleUserClick(request.user.username)}
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                  title={`Profil von ${request.user.displayName || request.user.username} besuchen`}
                >
                  <User className="text-white" size={14} />
                </button>

                <div className="flex-1 min-w-0">
                  {/* Anklickbarer Display Name */}
                  <button
                    onClick={() => handleUserClick(request.user.username)}
                    className="font-medium text-primary truncate text-sm hover:text-purple-600 transition-colors cursor-pointer block w-full text-left hover:underline"
                    title={`Profil von ${request.user.displayName || request.user.username} besuchen`}
                  >
                    {request.user.displayName || request.user.username}
                  </button>
                  
                  <div className="flex items-center space-x-2 text-xs text-tertiary">
                    {/* Anklickbarer Username */}
                    <button
                      onClick={() => handleUserClick(request.user.username)}
                      className="hover:text-purple-600 transition-colors cursor-pointer hover:underline"
                      title={`Profil von @${request.user.username} besuchen`}
                    >
                      @{request.user.username}
                    </button>
                    <span>•</span>
                    <span>{formatTimeAgo(request.requestedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock size={12} />
                  {!compact && <span className="text-xs">Ausstehend</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingFriendRequests;