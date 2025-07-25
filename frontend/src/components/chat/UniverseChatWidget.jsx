import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Users, 
  Minus,
  MoreVertical,
  AlertTriangle,
  Shield
} from 'lucide-react';
import UniverseChatService from '../../services/universeChatService';
import WebSocketService from '../../services/websocketService';

const UniverseChatWidget = ({ 
  universe, 
  currentUser, 
  isVisible, 
  onToggle 
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isJoinedRef = useRef(false);

  // Sync isJoined state mit ref
  useEffect(() => {
    isJoinedRef.current = isJoined;
  }, [isJoined]);

  // WebSocket Event Listeners
  useEffect(() => {
      if (!currentUser || !universe) return;

      const handleUniverseChatMessage = (data) => {
        if (data.universeId === universe.id) {
          console.log('📨 Universe chat message received:', data.message);
        
          setMessages(prev => {
            // Prüfe sowohl echte als auch optimistische Nachrichten
            const existingMessage = prev.find(msg => 
              msg.id === data.message.id || 
              (msg.sender?.id === data.message.sender?.id && 
               msg.content === data.message.content &&
               Math.abs(new Date(msg.createdAt).getTime() - new Date(data.message.createdAt).getTime()) < 5000)
            );

            if (existingMessage) {
              // Ersetze optimistische Nachricht oder ignoriere Duplikat
              return prev.map(msg => 
                msg.id === existingMessage.id ? {
                  ...data.message,
                  isOptimistic: false
                } : msg
              );
            }

            // Neue Nachricht von anderem User
            return [...prev, data.message];
          });

          scrollToBottom();
        }
      };

      const handleUserTyping = (data) => {
        if (data.universeId === universe.id && data.username !== currentUser.username) {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user !== data.username);
            return [...filtered, data.username];
          });

          setTimeout(() => {
            setTypingUsers(prev => prev.filter(user => user !== data.username));
          }, 3000);
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.universeId === universe.id) {
          setTypingUsers(prev => prev.filter(user => user !== data.username));
        }
      };

      const handleMessageDeleted = (data) => {
        if (data.universeId === universe.id) {
          setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
        }
      };

      // Handler für System-Nachrichten
      const handleSystemMessage = (data) => {
        if (data.universeId === universe.id) {
          console.log('📢 System message received:', data);
          // Optional: System-Nachrichten anzeigen
        }
      };

      // WebSocket confirmation handlers
      // Bestätigungs-Handler für Join/Leave Events
      const handleUniverseChatJoined = (data) => {
        if (data.universeId === universe.id) {
          console.log('✅ Successfully joined universe chat via WebSocket');
        }
      };
  
      const handleUniverseChatLeft = (data) => {
        if (data.universeId === universe.id) {
          console.log('✅ Successfully left universe chat via WebSocket');
        }
      };

      WebSocketService.addEventListener('universe_chat_message', handleUniverseChatMessage);
      WebSocketService.addEventListener('universe_chat_user_typing', handleUserTyping);
      WebSocketService.addEventListener('universe_chat_user_stopped_typing', handleUserStoppedTyping);
      WebSocketService.addEventListener('universe_chat_message_deleted', handleMessageDeleted);
      WebSocketService.addEventListener('universe_chat_system', handleSystemMessage);
      WebSocketService.addEventListener('universe_chat_joined', handleUniverseChatJoined);
      WebSocketService.addEventListener('universe_chat_left', handleUniverseChatLeft);

    return () => {
      WebSocketService.removeEventListener('universe_chat_message', handleUniverseChatMessage);
      WebSocketService.removeEventListener('universe_chat_user_typing', handleUserTyping);
      WebSocketService.removeEventListener('universe_chat_user_stopped_typing', handleUserStoppedTyping);
      WebSocketService.removeEventListener('universe_chat_message_deleted', handleMessageDeleted);
      WebSocketService.removeEventListener('universe_chat_system', handleSystemMessage);
      WebSocketService.removeEventListener('universe_chat_joined', handleUniverseChatJoined);
      WebSocketService.removeEventListener('universe_chat_left', handleUniverseChatLeft);
    };
    }, [currentUser, universe]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join Chat
  const handleJoinChat = async () => {
    if (!universe?.id) return;

    setLoading(true);
    try {
      const response = await UniverseChatService.joinUniverseChat(universe.id);
      
      if (response.success) {
        setIsJoined(true);
        
        // WebSocket beitreten
        if (WebSocketService.isWebSocketConnected()) {
          console.log(`🔌 Joining WebSocket room: universe_chat:${universe.id}`);
          WebSocketService.joinUniverseChat(universe.id);
        }

        // Nachrichten und Teilnehmer laden
        await Promise.all([
          loadMessages(),
          loadParticipants()
        ]);
      } else {
        alert(response.error || 'Fehler beim Beitreten des Chats');
      }
    } catch (error) {
      console.error('Error joining chat:', error);
      alert('Fehler beim Beitreten des Chats');
    } finally {
      setLoading(false);
    }
  };

  // Leave Chat
  const handleLeaveChat = async () => {
    if (!universe?.id) return;

    try {
      const response = await UniverseChatService.leaveUniverseChat(universe.id);
      
      if (response.success) {
        setIsJoined(false);
        setMessages([]);
        setParticipants([]);
        setTypingUsers([]);

        // WebSocket verlassen
        if (WebSocketService.isWebSocketConnected()) {
          console.log(`🔌 Leaving WebSocket room: universe_chat:${universe.id}`);
          WebSocketService.leaveUniverseChat(universe.id);
        }
      }
    } catch (error) {
      console.error('Error leaving chat:', error);
    }
  };

  // Typing Handler
  const handleTyping = () => {
    if (!universe?.id || !WebSocketService.isWebSocketConnected()) return;

    // Start typing
    WebSocketService.startUniverseChatTyping(universe.id);

    // Stop typing nach 3 Sekunden
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      WebSocketService.stopUniverseChatTyping(universe.id);
    }, 3000);
  };

  // Load Messages
  const loadMessages = async () => {
    if (!universe?.id) return;

    try {
      setMessageLoading(true);
      const response = await UniverseChatService.getMessages(universe.id);
      
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  // Load Participants
  const loadParticipants = async () => {
    if (!universe?.id) return;

    try {
      const response = await UniverseChatService.getParticipants(universe.id);
      
      if (response.success) {
        setParticipants(response.participants);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  // Send Message
  const sendMessage = async () => {
      if (!newMessage.trim() || messageLoading || !universe?.id) return;

      const messageContent = newMessage.trim();
      const tempMessageId = `temp-${Date.now()}`; // Temporäre ID
    
      // Optimistische Nachricht erstellen
      const optimisticMessage = {
        id: tempMessageId,
        content: messageContent,
        messageType: 'text',
        isSystemMessage: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.username
        },
        senderRole: universe.userRole || 'member',
        isOptimistic: true // Flag für optimistische Nachricht
      };

      // Nachricht sofort zur UI hinzufügen
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (WebSocketService.isWebSocketConnected()) {
        WebSocketService.stopUniverseChatTyping(universe.id);
      }

      try {
        const response = await UniverseChatService.sendMessage(universe.id, messageContent);

        if (response.success && response.message) {
          // Ersetze optimistische Nachricht mit echter Nachricht
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId ? {
              ...response.message,
              isOptimistic: false
            } : msg
          ));

          console.log('✅ Message sent successfully:', response.message.id);
        } else {
          // Entferne optimistische Nachricht bei Fehler
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
          setNewMessage(messageContent); // Restore message
          alert(response.error || 'Fehler beim Senden der Nachricht');
        }
      } catch (error) {
        console.error('Error sending message:', error);

        // Entferne optimistische Nachricht bei Fehler
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        setNewMessage(messageContent); // Restore message
        alert('Fehler beim Senden der Nachricht');
      }
    };

  // Format time
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user role badge
  const getRoleBadge = (role) => {
    switch (role) {
      case 'creator':
        return <span className="text-purple-600 text-xs">👑</span>;
      case 'moderator':
        return <span className="text-blue-600 text-xs">🛡️</span>;
      default:
        return null;
    }
  };

  // Check if user can moderate
  const canModerate = () => {
    return universe && currentUser && (
      universe.creatorId === currentUser.id ||
      universe.userRole === 'moderator' ||
      universe.userRole === 'creator'
    );
  };

  // Delete Message (Moderation)
  const handleDeleteMessage = async (messageId) => {
    if (!canModerate()) return;

    const reason = prompt('Grund für Löschung (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await UniverseChatService.deleteMessage(messageId, reason);
      
      if (response.success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        alert('Fehler beim Löschen der Nachricht');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Fehler beim Löschen der Nachricht');
    }
  };

  // Cleanup beim Component Unmount
  useEffect(() => {
    return () => {
      if (isJoinedRef.current && universe?.id && WebSocketService.isWebSocketConnected()) {
        console.log(`🔌 UniverseChatWidget unmounting - leaving universe chat: ${universe.id}`);
        WebSocketService.leaveUniverseChat(universe.id);
      }
      
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [universe?.id]);

  // Browser/Tab close cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isJoinedRef.current && universe?.id && WebSocketService.isWebSocketConnected()) {
        console.log(`🔌 Page unloading - leaving universe chat: ${universe.id}`);
        WebSocketService.leaveUniverseChat(universe.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [universe?.id]);

  // onToggle (X-Button) macht keinen WebSocket cleanup
  const handleClose = async () => {
    if (isJoined && universe?.id) {
      console.log(`🔌 Chat closing - leaving universe chat: ${universe.id}`);
      
      // WebSocket cleanup
      if (WebSocketService.isWebSocketConnected()) {
        WebSocketService.leaveUniverseChat(universe.id);
      }
      
      // Backend cleanup
      try {
        await UniverseChatService.leaveUniverseChat(universe.id);
      } catch (error) {
        console.error('Error leaving universe chat:', error);
      }
      
      // UI cleanup
      setIsJoined(false);
      setMessages([]);
      setParticipants([]);
      setTypingUsers([]);
    }
    
    onToggle(); // Schließe Widget
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-140 h-[600px] bg-card rounded-lg shadow-2xl border border-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary bg-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} />
          <h3 className="font-semibold truncate">
            {universe?.name} Chat
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isJoined && (
            <div className="relative">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="cursor-pointer hover:bg-purple-700 p-1 rounded transition-colors flex items-center space-x-1"
                title="Teilnehmer anzeigen"
              >
                <Users size={16} />
                <span className="text-xs">{participants.length}</span>
              </button>

              {/* Teilnehmer-Liste nach links ausklappen */}
              {showParticipants && (
                <>
                  {/* Unsichtbarer Overlay zum Wegklicken */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowParticipants(false)}
                  />

                  {/* Participants Dropdown - Links positioniert */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-primary rounded-lg shadow-xl z-20 max-h-60 overflow-hidden">
                    <div className="p-3 border-b border-primary bg-secondary">
                      <h4 className="font-semibold text-sm text-primary flex items-center space-x-2">
                        <Users size={14} />
                        <span>Online ({participants.length})</span>
                      </h4>
                    </div>
                    
                    <div className="overflow-y-auto max-h-48">
                      {participants.length === 0 ? (
                        <div className="p-4 text-center text-tertiary text-sm">
                          Keine aktiven Teilnehmer
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {participants.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                              {/* Avatar */}
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-semibold">
                                  {(participant.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-primary truncate">
                                    {participant.username}
                                  </span>
                                  {getRoleBadge(participant.role)}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-tertiary">Online</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <button
              onClick={handleClose}
              className="cursor-pointer hover:bg-purple-700 p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!isJoined ? (
          /* Join Chat */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                Universe Chat
              </h3>
              <p className="text-secondary text-sm mb-4">
                Chatte mit anderen Mitgliedern von {universe?.name}
              </p>
              <button
                onClick={handleJoinChat}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Beitrete...' : 'Chat beitreten'}
              </button>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <>
            {/* Participants Sidebar */}
            {showParticipants && (
              <div className="absolute right-0 top-full w-full bg-card border border-primary rounded-b-lg z-10 max-h-40 overflow-y-auto">
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-primary mb-2">
                    Online ({participants.length})
                  </h4>
                  <div className="space-y-1">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-primary">
                          {participant.username}
                        </span>
                        {getRoleBadge(participant.role)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messageLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-tertiary">
                  <MessageSquare size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Nachrichten</p>
                  <p className="text-xs mt-1">Starte das Gespräch!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className="group">
                      {message.isSystemMessage ? (
                        /* System Message */
                        <div className="text-center text-xs text-tertiary py-1">
                          {/* Handle system messages */}
                          System-Nachricht
                        </div>
                      ) : (
                        /* Regular Message */
                        <div className="flex items-start space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-semibold">
                              {(message.sender?.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-primary">
                                {message.sender?.username}
                              </span>
                              {getRoleBadge(message.senderRole)}
                              <span className="text-xs text-tertiary">
                                {formatTime(message.createdAt)}
                              </span>

                              {/* OPTIMISTIC INDICATOR */}
                                {message.isOptimistic && (
                                  <span className="text-xs text-tertiary">📤</span>
                                )}
                              
                              {canModerate() && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="opacity-0 cursor-pointer group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                  title="Nachricht löschen"
                                >
                                  <MoreVertical size={12} />
                                </button>
                              )}
                            </div>
                            
                            <p className="text-sm text-primary break-words">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-tertiary">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'tippt' : 'tippen'}...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-primary">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 px-3 py-2 border border-secondary rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  maxLength={500}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 text-white p-2 rounded-lg cursor-pointer hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              
              {/* Character Count */}
              {newMessage.length > 400 && (
                <div className="text-xs text-tertiary mt-1 text-right">
                  {newMessage.length}/500
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UniverseChatWidget;