import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TokenService } from './tokenService';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('🔌 WebSocket auth attempt:', { 
          hasToken: !!token,
          socketId: socket.id 
        });

        if (!token) {
          console.log('❌ WebSocket: No token provided');
          return next(new Error('Authentication failed: No token'));
        }

        const decoded = TokenService.verifyAccessToken(token);
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
        socket.data.email = decoded.email;
        
        console.log('✅ WebSocket: User authenticated:', {
          userId: decoded.id,
          username: decoded.username,
          socketId: socket.id
        });
        
        next();
      } catch (error) {
        console.error('❌ WebSocket auth error:', error);
        next(new Error('Authentication failed: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      const username = socket.data.username;

      console.log(`🔌 User connected: ${username} (${userId}) - Socket: ${socket.id}`);

      // User als online markieren
      this.addUserSocket(userId, socket.id);

      // Typing Management
      let typingTimeout: NodeJS.Timeout | null = null;

      // Join user's conversations
      socket.on('join_conversations', async (conversationIds: string[]) => {
        console.log(`🏠 User ${username} joining conversations:`, conversationIds);
        
        for (const conversationId of conversationIds) {
          await socket.join(`conversation:${conversationId}`);
          console.log(`  ✅ Joined conversation: ${conversationId}`);
        }
      });

      // Join specific conversation
      socket.on('join_conversation', async (conversationId: string) => {
        console.log(`🏠 User ${username} joining conversation: ${conversationId}`);
        await socket.join(`conversation:${conversationId}`);
        
        // Bestätige dem Client dass er beigetreten ist
        socket.emit('conversation_joined', { conversationId });
      });

      // Leave conversation
      socket.on('leave_conversation', async (conversationId: string) => {
        console.log(`🚪 User ${username} leaving conversation: ${conversationId}`);
        await socket.leave(`conversation:${conversationId}`);
        
        socket.emit('conversation_left', { conversationId });
      });

      // Neue Nachricht empfangen
      socket.on('new_message', (data) => {
        const { conversationId, message } = data;
        console.log(`📨 Broadcasting message from ${username} to conversation ${conversationId}`);

        // Stoppe Typing wenn Nachricht gesendet wird
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          typingTimeout = null;
        }

        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          userId,
          conversationId
        });

        // Nachricht an andere senden (nicht an Sender)
        socket.to(`conversation:${conversationId}`).emit('message_received', {
          conversationId,
          message
        });
      });

      // Typing Indicator Start mit Auto-Stop
    socket.on('typing_start', (conversationId: string) => {
      console.log(`✏️ User ${username} started typing in ${conversationId}`);
      
      // Sende Typing-Event an andere
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        username,
        conversationId
      });

      // Auto-Stop nach 5 Sekunden
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      typingTimeout = setTimeout(() => {
        console.log(`✏️ Auto-stopping typing for ${username} in ${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          userId,
          conversationId
        });
      }, 5000);
    });

      // Typing Indicator Stop
    socket.on('typing_stop', (conversationId: string) => {
      console.log(`✏️ User ${username} stopped typing in ${conversationId}`);
      
      // Stoppe Timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId,
        conversationId
      });
    });

      // Message Read Status
      socket.on('message_read', (data) => {
        const { conversationId, messageId } = data;
        console.log(`👁️ User ${username} read message ${messageId} in ${conversationId}`);
        
        socket.to(`conversation:${conversationId}`).emit('message_read_by', {
          messageId,
          conversationId,
          readBy: { userId, username }
        });
      });

      // Conversation Updated (für neue Conversations)
      socket.on('conversation_updated', (conversationId: string) => {
        console.log(`🔄 Conversation ${conversationId} updated by ${username}`);
        socket.to(`conversation:${conversationId}`).emit('conversation_refresh');
      });

      // Disconnect Handler
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User ${username} disconnected: ${reason}`);
        
        // Cleanup Typing-Timeout
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          typingTimeout = null;
        }

        this.removeUserSocket(userId, socket.id);
      });

      // Error Handler
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${username}:`, error);
      });
    });
  }

  // User Socket Management
  private addUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.connectedUsers.set(socketId, userId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.connectedUsers.delete(socketId);
  }

  // Public Methods für andere Services
  public sendMessageToConversation(conversationId: string, message: any, senderId?: string) {
    console.log(`📡 Broadcasting message to conversation ${conversationId}`);
    this.io.to(`conversation:${conversationId}`).emit('message_received', {
      conversationId,
      message
    });
  }

  public sendToUser(userId: string, event: string, data: any) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
      console.log(`📤 Sent ${event} to user ${userId} (${userSocketSet.size} connections)`);
    } else {
      console.log(`📤 User ${userId} not connected, message queued`);
    }
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  public notifyConversationUpdate(conversationId: string, excludeUserId?: string) {
    console.log(`🔄 Notifying conversation update: ${conversationId}`);
    this.io.to(`conversation:${conversationId}`).emit('conversation_refresh');
  }

  // Cleanup für Typing Indicators
  public cleanupTypingIndicators() {
    this.io.emit('cleanup_typing');
  }

  // Nachricht an Conversation senden (mit Sender-Ausschluss)
  public sendToConversation(conversationId: string, event: string, data: any, excludeUserId?: string) {
    console.log(`📡 Sending ${event} to conversation ${conversationId}${excludeUserId ? ` (excluding ${excludeUserId})` : ''}`);

    if (excludeUserId) {
      // Sende an alle in der Conversation außer dem Sender
      this.io.to(`conversation:${conversationId}`).except(
        Array.from(this.userSockets.get(excludeUserId) || [])
      ).emit(event, data);
    } else {
      // Sende an alle in der Conversation
      this.io.to(`conversation:${conversationId}`).emit(event, data);
    }
  }
}

// Singleton Instance
let websocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService | null => {
  return websocketServiceInstance;
};

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  websocketServiceInstance = new WebSocketService(httpServer);
  return websocketServiceInstance;
};