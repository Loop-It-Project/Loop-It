import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatService from '../services/chatService';

const ChatButton = ({ targetUser, currentUser, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!targetUser?.id || !currentUser?.id) {
      alert('User-Informationen fehlen');
      return;
    }

    if (targetUser.id === currentUser.id) {
      alert('Du kannst dir nicht selbst schreiben');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Starting chat with:', targetUser.username, 'ID:', targetUser.id);
      
      const response = await ChatService.getOrCreateConversation(targetUser.id);
      
      if (response.success) {
        // console.log('✅ Chat created/found:', response.conversation);
        // Chat Widget öffnet sich automatisch durch WebSocket Events
      } else {
        console.error('❌ Chat creation failed:', response.error);
        
        // User-freundliche Fehlermeldungen
        if (response.errorCode === 'PERMISSION_DENIED') {
          alert(`${targetUser.displayName || targetUser.username} akzeptiert keine Nachrichten von dir.`);
        } else {
          alert('Chat konnte nicht gestartet werden: ' + (response.error || 'Unbekannter Fehler'));
        }
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Fehler beim Starten des Chats');
    } finally {
      setLoading(false);
    }
  };

  // Nicht anzeigen für eigenes Profil
  if (!targetUser || !currentUser || targetUser.id === currentUser.id) {
    return null;
  }

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className={`flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Starte Chat...</span>
        </>
      ) : (
        <>
          <MessageCircle size={16} />
          <span>Nachricht</span>
        </>
      )}
    </button>
  );
};

export default ChatButton;