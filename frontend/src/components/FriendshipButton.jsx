import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Clock, Trash2 } from 'lucide-react';
import FriendshipService from '../services/friendshipService';

const FriendshipButton = ({ targetUsername, currentUser, onStatusChange }) => {
  const [status, setStatus] = useState('none');
  const [loading, setLoading] = useState(false);
  const [friendshipId, setFriendshipId] = useState(null);

  // Freundschaftsstatus laden
  useEffect(() => {
    if (targetUsername && currentUser && targetUsername !== currentUser.username) {
      loadFriendshipStatus();
    }
  }, [targetUsername, currentUser]);

  const loadFriendshipStatus = async () => {
    try {
      const response = await FriendshipService.getFriendshipStatus(targetUsername);
      if (response.success) {
        setStatus(response.data.status);
        setFriendshipId(response.data.friendshipId);
      }
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const response = await FriendshipService.sendFriendRequest(targetUsername);
      if (response.success) {
        setStatus('pending_sent');
        onStatusChange?.('pending_sent');
      } else {
        alert(response.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipId) return;
    
    setLoading(true);
    try {
      const response = await FriendshipService.acceptFriendRequest(friendshipId);
      if (response.success) {
        setStatus('accepted');
        onStatusChange?.('accepted');
      } else {
        alert(response.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!friendshipId) return;
    
    setLoading(true);
    try {
      const response = await FriendshipService.declineFriendRequest(friendshipId);
      if (response.success) {
        setStatus('none');
        onStatusChange?.('none');
      } else {
        alert(response.error || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm('Möchtest du diese Freundschaft wirklich beenden?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await FriendshipService.removeFriend(targetUsername);
      if (response.success) {
        setStatus('none');
        onStatusChange?.('none');
      } else {
        alert(response.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  // Nicht anzeigen für eigenes Profil
  if (!targetUsername || !currentUser || targetUsername === currentUser.username) {
    return null;
  }

  const getButtonConfig = () => {
    switch (status) {
      case 'none':
        return {
          label: 'Freund hinzufügen',
          icon: UserPlus,
          className: 'bg-purple-600 text-white hover:bg-purple-700',
          onClick: handleSendRequest
        };
      
      case 'pending_sent':
        return {
          label: 'Anfrage gesendet',
          icon: Clock,
          className: 'bg-gray-500 text-white cursor-not-allowed',
          onClick: null,
          disabled: true
        };
      
      case 'pending_received':
        return {
          label: 'Anfrage annehmen',
          icon: UserCheck,
          className: 'bg-green-600 text-white hover:bg-green-700',
          onClick: handleAcceptRequest,
          showDecline: true
        };
      
      case 'accepted':
        return {
          label: 'Freunde',
          icon: UserCheck,
          className: 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700',
          onClick: handleRemoveFriend,
          showAsRemove: true
        };
      
      default:
        return null;
    }
  };

  const buttonConfig = getButtonConfig();
  
  if (!buttonConfig) return null;

  const ButtonIcon = buttonConfig.icon;

  return (
    <div className="flex items-center space-x-2">
      {/* Hauptbutton */}
      <button
        onClick={buttonConfig.onClick}
        disabled={loading || buttonConfig.disabled}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
          buttonConfig.className
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <ButtonIcon size={16} />
        )}
        <span>
          {buttonConfig.showAsRemove && !loading ? 'Freundschaft beenden' : buttonConfig.label}
        </span>
      </button>

      {/* Ablehnen Button (nur bei erhaltenen Anfragen) */}
      {buttonConfig.showDecline && (
        <button
          onClick={handleDeclineRequest}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-secondary rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <UserX size={14} />
          <span>Ablehnen</span>
        </button>
      )}
    </div>
  );
};

export default FriendshipButton;