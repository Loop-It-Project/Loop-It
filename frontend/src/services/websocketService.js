import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.currentUser = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // WebSocket-Verbindung initialisieren
  connect(token, user) {
    if (this.socket?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    this.currentUser = user;
    console.log('🔌 Connecting to WebSocket...', { 
      userId: user.id, 
      username: user.username 
    });

     // WebSocket URL für Production Environment
    const wsUrl = this.getWebSocketUrl();
    console.log('🔗 WebSocket URL:', wsUrl);

    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      extraHeaders: {
        'Origin': window.location.origin
      }
    });

    this.setupEventHandlers();
  }

  // WebSocket URL basierend auf Environment
  getWebSocketUrl() {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Für Production, entferne /api suffix für WebSocket
    const wsUrl = baseUrl.replace('/api', '');
    
    console.log('🔗 WebSocket URL calculation:', {
      originalBaseUrl: baseUrl,
      finalWsUrl: wsUrl,
      environment: import.meta.env.MODE
    });
    
    return wsUrl;
  }

  // Event-Handler für Socket.IO Events
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection Events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Clear any pending reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Trigger connect event for components
      this.emitToHandlers('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emitToHandlers('disconnected', reason);
      
      // Auto-reconnect nur bei unerwarteten Disconnects
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', {
        error: error.message,
        type: error.type,
        description: error.description,
        url: this.socket.io.uri
      });
      this.handleReconnect();
    });

    // Match Notification Handler
    this.socket.on('match_notification', (data) => {
      console.log('🎉 Match notification received:', data);
      this.handleMatchNotification(data);
    });

    // Chat Events
    this.socket.on('message_received', (data) => {
      console.log('📨 New message received:', data);
      this.emitToHandlers('message_received', data);
    });

    this.socket.on('conversation_refresh', () => {
      console.log('🔄 Conversation refresh requested');
      this.emit('conversation_refresh');
    });

    this.socket.on('new_conversation_created', (data) => {
      console.log('💬 New conversation created:', data);
      this.emit('new_conversation_created', data);
    });

    // Typing Events
    this.socket.on('user_typing', (data) => {
      console.log(`✏️ User typing: ${data.username} in ${data.conversationId}`);
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log(`✏️ User stopped typing: ${data.userId} in ${data.conversationId}`);
      this.emit('user_stopped_typing', data);
    });

    // Read Status Events
    this.socket.on('message_read_by', (data) => {
      console.log(`👁️ Message read by: ${data.readBy.username}`);
      this.emit('message_read_by', data);
    });

    // Conversation Events
    this.socket.on('conversation_joined', (data) => {
      console.log(`🏠 Successfully joined conversation: ${data.conversationId}`);
      this.emit('conversation_joined', data);
    });

    this.socket.on('conversation_left', (data) => {
      console.log(`🚪 Successfully left conversation: ${data.conversationId}`);
      this.emit('conversation_left', data);
    });
  }

  // Reconnection Logic
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    // Clear any existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUser) {
        const token = localStorage.getItem('accessToken');
        if (token) {
          this.connect(token, this.currentUser);
        } else {
          console.error('❌ No access token available for reconnection');
        }
      }
    }, delay);
  }

  // Conversations beitreten
  joinConversations(conversationIds) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot join conversations: not connected');
      return;
    }

    console.log('🏠 Joining conversations:', conversationIds);
    this.socket.emit('join_conversations', conversationIds);
  }

  // Einzelne Conversation beitreten
  joinConversation(conversationId) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot join conversation: not connected');
      return;
    }

    console.log('🏠 Joining conversation:', conversationId);
    this.socket.emit('join_conversation', conversationId);
  }

  // Conversation verlassen
  leaveConversation(conversationId) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot leave conversation: not connected');
      return;
    }

    console.log('🚪 Leaving conversation:', conversationId);
    this.socket.emit('leave_conversation', conversationId);
  }

  // Neue Nachricht senden (Broadcasting)
  sendMessage(conversationId, message) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot send message: not connected');
      return;
    }

    console.log('📨 Broadcasting message:', { conversationId, message });
    this.socket.emit('new_message', { conversationId, message });
  }

  // Typing Indicator senden
  startTyping(conversationId) {
    if (!this.socket?.connected) return;
    
    console.log(`✏️ Started typing in ${conversationId}`);
    this.socket.emit('typing_start', conversationId);
  }

  stopTyping(conversationId) {
    if (!this.socket?.connected) return;
    
    console.log(`✏️ Stopped typing in ${conversationId}`);
    this.socket.emit('typing_stop', conversationId);
  }

  // Message Read Status
  markMessageAsRead(conversationId, messageId) {
    if (!this.socket?.connected) return;
    
    this.socket.emit('message_read', { conversationId, messageId });
  }

  // Event Listener Management
  addEventListener(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  removeEventListener(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  // Emit zu Event Handlers (nicht Socket.IO)
  emitToHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Socket.IO Event senden
  emitToSocket(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`❌ Cannot emit ${event}: WebSocket not connected`);
    }
  }

  // Connection Status
  isWebSocketConnected() {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      
      // Clear reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Cleanup für alle aktiven Universe Chats
      this.emitToHandlers('before_disconnect');
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUser = null;
      this.reconnectAttempts = 0;
    }
  }

  // Match Notification Handler
  handleMatchNotification(data) {
    // Browser-Benachrichtigung anzeigen
    if (Notification.permission === 'granted') {
      new Notification('Neues Match! 🎉', {
        body: `Du hast ein Match mit ${data.data.otherUser.displayName || data.data.otherUser.username}!`,
        icon: '/logo.png',
        tag: 'match-notification'
      });
    }

    // Toast-Benachrichtigung (falls Toast-System vorhanden)
    if (window.showToast) {
      window.showToast({
        type: 'success',
        title: 'Neues Match! 🎉',
        message: `Du hast ein Match mit ${data.data.otherUser.displayName || data.data.otherUser.username}!`,
        duration: 5000
      });
    }

    // Custom Event für App-weite Benachrichtigung
    window.dispatchEvent(new CustomEvent('match_notification', {
      detail: data
    }));
  }

  // Notification Permission anfordern
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  }

  // Reconnect manuell
  reconnect() {
    if (this.currentUser) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        this.disconnect();
        this.connect(token, this.currentUser);
      } else {
        console.error('❌ No access token available for manual reconnection');
      }
    }
  }

  // Universe Chat spezifische Disconnect-Methoden
  joinUniverseChat(universeId) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot join universe chat: not connected');
      return;
    }

    console.log('🏠 Joining universe chat:', universeId);
    this.socket.emit('join_universe_chat', { universeId });
  }

  leaveUniverseChat(universeId) {
    if (!this.socket?.connected) {
      console.log('❌ Cannot leave universe chat: not connected');
      return;
    }

    console.log('🚪 Leaving universe chat:', universeId);
    this.socket.emit('leave_universe_chat', { universeId });
  }

  // Universe Chat Typing Events
  startUniverseChatTyping(universeId) {
    if (!this.socket?.connected) return;
    
    console.log(`✏️ Started typing in universe chat ${universeId}`);
    this.socket.emit('universe_chat_typing_start', universeId);
  }

  stopUniverseChatTyping(universeId) {
    if (!this.socket?.connected) return;
    
    console.log(`✏️ Stopped typing in universe chat ${universeId}`);
    this.socket.emit('universe_chat_typing_stop', universeId);
  }

  // Debugging Helper für Production
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      url: this.socket?.io?.uri,
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts,
      hasCurrentUser: !!this.currentUser,
      hasToken: !!localStorage.getItem('accessToken')
    };
  }
}

// Singleton Instance
export default new WebSocketService();