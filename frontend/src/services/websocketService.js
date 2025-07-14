import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.currentUser = null;
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

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.setupEventHandlers();
  }

  // Event-Handler für Socket.IO Events
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection Events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Triggere connect Event für andere Components
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Chat Events
    this.socket.on('message_received', (data) => {
      console.log('📨 New message received:', data);
      this.emit('message_received', data);
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
    
    setTimeout(() => {
      if (this.currentUser) {
        const token = localStorage.getItem('token');
        if (token) {
          this.connect(token, this.currentUser);
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
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
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
      
      // Cleanup für alle aktiven Universe Chats
      this.emit('before_disconnect'); // Ermögliche Components cleanup
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentUser = null;
    }
  }

  // Reconnect manuell
  reconnect() {
    if (this.currentUser) {
      const token = localStorage.getItem('token');
      if (token) {
        this.disconnect();
        this.connect(token, this.currentUser);
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
}

// Singleton Instance
export default new WebSocketService();