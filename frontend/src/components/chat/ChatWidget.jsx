import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Send, MoreHorizontal, User, ChevronDown } from 'lucide-react';
import ChatService from '../../services/chatService';
import WebSocketService from '../../services/websocketService';

const ChatWidget = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

  // Scroll-Management States hinzufügen
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const widgetRef = useRef(null);

  // WebSocket-Verbindung beim Öffnen
  useEffect(() => {
    if (currentUser && isOpen) {
      const token = localStorage.getItem('token');
      if (token && !WebSocketService.isWebSocketConnected()) {
        console.log('🔌 Connecting WebSocket for chat...');
        WebSocketService.connect(token, currentUser);
      }
      
      // EINMALIG laden - KEIN Intervall
      loadConversations();
    }
  }, [currentUser, isOpen]);

  // WebSocket Event Listeners
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 Setting up WebSocket event listeners...');

    const handleMessageReceived = (data) => {
      console.log('📨 ChatWidget: Message received:', data);
      
      const { conversationId, message } = data;
      
      // Duplikat-Prävention: Prüfe ob Nachricht bereits verarbeitet wurde
      if (processedMessageIds.has(message.id)) {
        console.log('⚠️ Duplicate message detected, skipping:', message.id);
        return;
      }

      // Prüfe ob es für die aktuelle Conversation ist
      if (activeConversation && conversationId === activeConversation.id) {
        console.log('📨 Adding message to current conversation');

        const isOwnMessage = message.sender.id === currentUser.id;
        
        // Nachricht zur aktuellen Conversation hinzufügen
        setMessages(prev => {
          // Prüfe ob Nachricht bereits in der Liste ist
          const existingMessage = prev.find(msg => msg.id === message.id);
          if (existingMessage) {
            console.log('⚠️ Message already in list, skipping:', message.id);
            return prev;
          }

          return [...prev, {
            id: message.id,
            content: message.content,
            senderId: message.sender.id,
            isFromMe: message.sender.id === currentUser.id,
            createdAt: message.createdAt,
            sender: message.sender
          }];
        });

        // Markiere Nachricht als verarbeitet
        setProcessedMessageIds(prev => new Set([...prev, message.id]));

        // NUR bei eigenen Nachrichten automatisch scrollen
        if (isOwnMessage || shouldAutoScroll) {
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
        }

        // Als gelesen markieren wenn Chat offen ist
        if (document.hasFocus()) {
          setTimeout(() => markAsRead(), 500);
        }
      }
      
      // Conversation-Liste aktualisieren
      loadConversations();
    };

    const handleConversationRefresh = () => {
      console.log('🔄 ChatWidget: Conversation refresh requested');
      loadConversations();
    };

    const handleNewConversation = (data) => {
      console.log('💬 ChatWidget: New conversation created:', data);
      loadConversations();
      setIsOpen(true);
    };

    // Typing Indicators
    const handleUserTyping = (data) => {
      console.log('✏️ ChatWidget: User typing:', data);
      if (activeConversation && data.conversationId === activeConversation.id) {
        setTypingUsers(prev => {
          const newTypingUsers = prev.filter(user => user !== data.username);
          return [...newTypingUsers, data.username];
        });

        // Automatisches Entfernen nach 5 Sekunden
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user !== data.username));
        }, 5000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      console.log('✏️ ChatWidget: User stopped typing:', data);
      if (activeConversation && data.conversationId === activeConversation.id) {
        setTypingUsers(prev => prev.filter(user => user !== data.username));
      }
    };

    // Event Listener registrieren
    WebSocketService.on('message_received', handleMessageReceived);
    WebSocketService.on('conversation_refresh', handleConversationRefresh);
    WebSocketService.on('new_conversation_created', handleNewConversation);
    WebSocketService.on('user_typing', handleUserTyping);
    WebSocketService.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      console.log('🧹 Cleaning up WebSocket event listeners...');
      WebSocketService.off('message_received', handleMessageReceived);
      WebSocketService.off('conversation_refresh', handleConversationRefresh);
      WebSocketService.off('new_conversation_created', handleNewConversation);
      WebSocketService.off('user_typing', handleUserTyping);
      WebSocketService.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [currentUser, activeConversation, processedMessageIds, shouldAutoScroll]);

  // Conversation beitreten wenn gewechselt wird
  useEffect(() => {
    if (activeConversation && WebSocketService.isWebSocketConnected()) {
      console.log('🏠 Joining conversation:', activeConversation.id);
      WebSocketService.joinConversation(activeConversation.id);
      markAsRead();
    }
  }, [activeConversation]);

  // Conversations beitreten beim Laden
  useEffect(() => {
    if (conversations.length > 0 && WebSocketService.isWebSocketConnected()) {
      const conversationIds = conversations.map(conv => conv.id);
      console.log('🏠 Joining conversations:', conversationIds);
      WebSocketService.joinConversations(conversationIds);
    }
  }, [conversations]);

  // Processed Message IDs zurücksetzen beim Conversation-Wechsel
  useEffect(() => {
    if (activeConversation) {
      console.log('🔄 Switching to conversation:', activeConversation.id);
      
      // Reset states
      setProcessedMessageIds(new Set());
      setMessages([]);
      setShouldAutoScroll(true);
      setIsUserNearBottom(true);
      setTypingUsers([]);
      
      // Load messages
      loadMessages();
      markAsRead();
    }
  }, [activeConversation?.id]);

  // Intelligentes Scroll-Management
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Nur scrollen wenn es unsere eigene Nachricht ist
      if (lastMessage.isFromMe) {
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      }
    }
  }, [messages.length]); 

  // Unread Count berechnen
  useEffect(() => {
    const unreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    setTotalUnreadCount(unreadCount);
  }, [conversations]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        // Optional: Chat minimieren statt schließen
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await ChatService.getUserConversations();
      if (response.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lade Nachrichten für die aktive Conversation
  const loadMessages = async () => {
    if (!activeConversation) return;
    
    try {
      setMessageLoading(true);
      const response = await ChatService.getMessages(activeConversation.id);
      if (response.success) {
        setMessages(response.data.messages);
        
        // Beim ersten Laden - direkter Scroll ohne Animation
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
          setShouldAutoScroll(true);
          setIsUserNearBottom(true);
        }, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  // sendMessage Funktion
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || messageLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setMessageLoading(true);

    // Stoppe Typing-Indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (WebSocketService.isWebSocketConnected()) {
      WebSocketService.stopTyping(activeConversation.id);
    }

    try {
      const response = await ChatService.sendMessage(activeConversation.id, messageContent);
      
      if (response.success) {
        // Optimistic Update
        const localMessage = {
          id: response.message.id,
          content: messageContent,
          senderId: currentUser.id,
          isFromMe: true,
          createdAt: new Date().toISOString(),
          sender: {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName
          }
        };

        setMessages(prev => {
          const existingMessage = prev.find(msg => msg.id === localMessage.id);
          if (existingMessage) {
            return prev;
          }
          return [...prev, localMessage];
        });

        // Markiere als verarbeitet
        setProcessedMessageIds(prev => new Set([...prev, response.message.id]));

        // Scroll-Management für eigene Nachrichten
        setShouldAutoScroll(true);
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);

        // WebSocket Broadcasting
        if (WebSocketService.isWebSocketConnected()) {
          WebSocketService.sendMessage(activeConversation.id, response.message);
        }

        setTimeout(() => loadConversations(), 100);
      } else {
        console.error('❌ Failed to send message:', response.error);
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    } finally {
      setMessageLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!activeConversation) return;

    try {
      await ChatService.markMessagesAsRead(activeConversation.id);
      
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Typing Handler
  const handleTyping = async () => {
    if (!activeConversation || !WebSocketService.isWebSocketConnected()) return;

    if (!isTyping) {
      setIsTyping(true);
      WebSocketService.startTyping(activeConversation.id);
    }

    // Reset Timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      WebSocketService.stopTyping(activeConversation.id);
    }, 3000);
  };

  // Scroll-Position überwachen
  const handleScroll = (e) => {
    const container = e.target;
    const threshold = 50; // Reduziert von 100px auf 50px
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;
    
    // Nur State ändern wenn sich tatsächlich was ändert
    if (isUserNearBottom !== isNearBottom) {
      setIsUserNearBottom(isNearBottom);
    }
    
    if (shouldAutoScroll !== (isNearBottom || isAtBottom)) {
      setShouldAutoScroll(isNearBottom || isAtBottom);
    }
  };

  // Scroll-Management
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return;
    
    if (force || shouldAutoScroll) {
      console.log('📜 Scrolling to bottom...', { force, shouldAutoScroll });
      
      // Direkte Scroll-Methode statt scrollIntoView
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  if (!currentUser) return null;

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Render-Optimierung: Unique Keys für Messages
  const renderMessages = () => {
    return messages.map((message, index) => (
      <div
        key={`message-${message.id}-${index}`} // Unique key mit Index
        className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div className={`max-w-xs px-3 py-2 rounded-lg ${
          message.isFromMe
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}>
          {!message.isFromMe && (
            <div className="text-xs text-gray-500 mb-1">
              {message.sender?.displayName || message.sender?.username || 'Unknown'}
            </div>
          )}
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${
            message.isFromMe ? 'text-purple-200' : 'text-gray-500'
          }`}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    ));
  };

  // Render-Optimierung: Unique Keys für Conversations
  const renderConversations = () => {
    return conversations.map((conversation, index) => (
      <div
        key={`conversation-${conversation.id}-${index}`} // Unique key mit Index
        onClick={() => setActiveConversation(conversation)}
        className={`flex items-center p-3 cursor-pointer transition-colors ${
          activeConversation?.id === conversation.id
            ? 'bg-purple-100 border-l-4 border-purple-600'
            : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
          {conversation.chatPartner?.displayName?.[0] || 
           conversation.chatPartner?.username?.[0] || 
           '?'}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900 truncate">
              {conversation.chatPartner?.displayName || conversation.chatPartner?.username || 'Unknown User'}
            </div>
            {conversation.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <div className="text-xs text-gray-500 truncate">
              {conversation.lastMessage.isFromMe ? 'Du: ' : ''}
              {conversation.lastMessage.content}
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
  <div ref={widgetRef} className="fixed bottom-4 right-4 z-50">
    {/* Chat Toggle Button */}
    {!isOpen && (
      <button
        onClick={() => setIsOpen(true)}
        className="relative bg-purple-600 text-white rounded-full p-4 shadow-lg cursor-pointer hover:bg-purple-700 transition-all hover:scale-110"
      >
        <MessageCircle size={24} />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-bold animate-pulse">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
    )}

    {/* Chat Window */}
    {isOpen && (
      <div className="bg-card rounded-lg shadow-2xl border border-primary w-80 h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary bg-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} />
            <h3 className="font-semibold">
              {activeConversation ? activeConversation.chatPartner?.displayName || activeConversation.chatPartner?.username : 'Chats'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {activeConversation && (
              <button
                onClick={() => setActiveConversation(null)}
                className="hover:bg-purple-700 p-1 rounded cursor-pointer transition-colors"
              >
                <Minimize2 size={16} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-purple-700 p-1 rounded cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {!activeConversation ? (
            /* Conversation List */
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-tertiary p-4">
                  <MessageCircle size={48} className="mb-2 opacity-50" />
                  <p className="text-sm text-center">Noch keine Chats</p>
                  <p className="text-xs text-center mt-1">Starte einen Chat über das Freunde-Profil</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation, index) => (
                    <button
                      key={`conversation-${conversation.id}-${index}`}
                      onClick={() => setActiveConversation(conversation)}
                      className="w-full flex items-center space-x-3 p-3 cursor-pointer hover:bg-hover rounded-lg transition-colors text-left"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="text-white" size={16} />
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-primary truncate">
                            {conversation.chatPartner?.displayName || conversation.chatPartner?.username}
                          </p>
                          {conversation.lastMessage && (
                            <span className="text-xs text-tertiary">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-secondary truncate">
                            {conversation.lastMessage ? (
                              <>
                                {conversation.lastMessage.isFromMe && 'Du: '}
                                {conversation.lastMessage.content}
                              </>
                            ) : (
                              'Noch keine Nachrichten'
                            )}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold ml-2">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Chat */
            <>
              {/* Messages Container mit Scroll-Handler */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
                onScroll={handleScroll}
                style={{ scrollBehavior: 'auto' }}
              >
                {messageLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-tertiary">
                    <MessageCircle size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Noch keine Nachrichten</p>
                    <p className="text-xs mt-1">Sende die erste Nachricht!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isFromMe = message.sender.id === currentUser.id;
                      const showDate = index === 0 || 
                        new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                      return (
                        <div key={`message-${message.id}-${index}`}>
                          {/* Date Separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <span className="bg-hover text-tertiary text-xs px-3 py-1 rounded-full">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          )}

                          {/* Message */}
                          <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                isFromMe
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-hover text-primary'
                              }`}
                            >
                              <p className="text-sm break-words">{message.content}</p>
                              <p className={`text-xs mt-1 ${isFromMe ? 'text-purple-200' : 'text-tertiary'}`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-hover text-primary rounded-lg px-3 py-2 max-w-[80%]">
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-tertiary ml-2">tippt...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll-Anker am Ende */}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Scroll-to-Bottom Button */}
              {!shouldAutoScroll && (
                <div className="absolute bottom-20 right-4 z-10">
                  <button
                    onClick={() => scrollToBottom(true)}
                    className="bg-purple-600 text-white rounded-full p-2 shadow-lg hover:bg-purple-700 transition-colors"
                    title="Zu den neuesten Nachrichten"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}

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
                    disabled={messageLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || messageLoading}
                    className="bg-purple-600 text-white p-2 rounded-lg cursor-pointer hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);
};

export default ChatWidget;