import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TokenService } from './tokenService';
import { ModerationService } from './moderationService';
import { UniverseChatService } from './universeChatService';
import { db } from '../db/connection';
import { 
  usersTable, 
  profilesTable,
} from '../db/Schemas';
import { eq } from 'drizzle-orm';
import type { AuthenticatedSocket } from '../types/socket';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  // Universe Chat Rooms
  private universeRooms: Map<string, Set<string>> = new Map();

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
        // console.log('🔌 WebSocket auth attempt:', { 
        //   hasToken: !!token,
        //   socketId: socket.id 
        // });

        if (!token) {
          console.log('❌ WebSocket: No token provided');
          return next(new Error('Authentication failed: No token'));
        }

        const decoded = TokenService.verifyAccessToken(token);
        socket.data.userId = decoded.id;
        socket.data.username = decoded.username;
        socket.data.email = decoded.email;
        
        // console.log('✅ WebSocket: User authenticated:', {
          // userId: decoded.id,
          // username: decoded.username,
          // socketId: socket.id
        // });
        
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

      // console.log(`🔌 User connected: ${username} (${userId}) - Socket: ${socket.id}`);

      // User als online markieren
      this.addUserSocket(userId, socket.id);

      // Typing Management
      let typingTimeout: NodeJS.Timeout | null = null;

      // Join user's conversations
      socket.on('join_conversations', async (conversationIds: string[]) => {
        // console.log(`🏠 User ${username} joining conversations:`, conversationIds);
        
        for (const conversationId of conversationIds) {
          await socket.join(`conversation:${conversationId}`);
          // console.log(`  ✅ Joined conversation: ${conversationId}`);
        }
      });

      // Join specific conversation
      socket.on('join_conversation', async (conversationId: string) => {
        // console.log(`🏠 User ${username} joining conversation: ${conversationId}`);
        await socket.join(`conversation:${conversationId}`);
        
        // Bestätige dem Client dass er beigetreten ist
        socket.emit('conversation_joined', { conversationId });
      });

      // Leave conversation
      socket.on('leave_conversation', async (conversationId: string) => {
        // console.log(`🚪 User ${username} leaving conversation: ${conversationId}`);
        await socket.leave(`conversation:${conversationId}`);
        
        socket.emit('conversation_left', { conversationId });
      });

      // Neue Nachricht empfangen
      socket.on('new_message', (data) => {
        const { conversationId, message } = data;
        // console.log(`📨 Broadcasting message from ${username} to conversation ${conversationId}`);

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
      // console.log(`✏️ User ${username} started typing in ${conversationId}`);
      
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
        // console.log(`✏️ Auto-stopping typing for ${username} in ${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
          userId,
          conversationId
        });
      }, 5000);
    });

      // Typing Indicator Stop
    socket.on('typing_stop', (conversationId: string) => {
      // console.log(`✏️ User ${username} stopped typing in ${conversationId}`);
      
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
        // console.log(`👁️ User ${username} read message ${messageId} in ${conversationId}`);
        
        socket.to(`conversation:${conversationId}`).emit('message_read_by', {
          messageId,
          conversationId,
          readBy: { userId, username }
        });
      });

      // Conversation Updated (für neue Conversations)
      socket.on('conversation_updated', (conversationId: string) => {
        // console.log(`🔄 Conversation ${conversationId} updated by ${username}`);
        socket.to(`conversation:${conversationId}`).emit('conversation_refresh');
      });

      // Disconnect Handler
      socket.on('disconnect', (reason) => {
        // console.log(`🔌 User ${username} disconnected: ${reason}`);
        
        // Comprehensive cleanup
        this.handleComprehensiveDisconnect(userId, socket.id, username);
      });

      // Match-Notification Handler
      socket.on('match_notification_received', (data) => {
        // console.log('📱 Match notification received by user:', userId);
      });

      // Error Handler
      socket.on('error', (error) => {
        console.error(`❌ Socket error for user ${username}:`, error);
      });

      // Universe Chat Events
      socket.on('join_universe_chat', async (data) => {
        try {
          const { universeId } = data;
          const userId = socket.data.userId;
        
          if (!userId || !universeId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
          }
        
          // Check if user is banned
          const isBanned = await ModerationService.isUserBanned(userId, universeId);
          if (isBanned) {
            socket.emit('error', { message: 'You are banned from this universe chat' });
            return;
          }
        
          // Join socket room
          const roomName = `universe_chat:${universeId}`;
          await socket.join(roomName);
        
          // Track user in universe room
          if (!this.universeRooms.has(universeId)) {
            this.universeRooms.set(universeId, new Set());
          }
          this.universeRooms.get(universeId)?.add(userId);
          
          // BESTÄTIGUNG an Client senden
          socket.emit('universe_chat_joined', { universeId });
        
          // Get user info
          const user = await this.getUserInfo(userId);
        
          // Notify others about user joining
          socket.to(roomName).emit('universe_user_joined', {
            universeId,
            user
          });
        
          // console.log(`👋 User ${userId} joined universe chat ${universeId}`);
        } catch (error) {
          console.error('Error joining universe chat:', error);
          socket.emit('error', { message: 'Failed to join universe chat' });
        }
      });

      socket.on('leave_universe_chat', async (data) => {
        try {
          const { universeId } = data;
          const userId = socket.data.userId;
        
          if (!userId || !universeId) return;
        
          // Leave socket room 
          const roomName = `universe_chat:${universeId}`;
          await socket.leave(roomName);
        
          // Remove user from universe room tracking
          this.universeRooms.get(universeId)?.delete(userId);

          // console.log(`👋 User ${userId} left universe chat ${universeId}`);
          
          // BESTÄTIGUNG an Client senden
          socket.emit('universe_chat_left', { universeId });
        
          // Notify others about user leaving
          socket.to(roomName).emit('universe_user_left', {
            universeId,
            userId
          });
        
          // console.log(`👋 User ${userId} left universe chat ${universeId}`);
        } catch (error) {
          console.error('Error leaving universe chat:', error);
        }
      });

      // Universe Chat Typing
      socket.on('universe_chat_typing_start', (universeId: string) => {
        const roomName = `universe_chat:${universeId}`;
        // console.log(`✏️ User ${username} typing in universe chat: ${universeId} (room: ${roomName})`);

        socket.to(roomName).emit('universe_chat_user_typing', {
          userId,
          username,
          universeId
        });
      });

      socket.on('universe_chat_typing_stop', (universeId: string) => {
        const roomName = `universe_chat:${universeId}`;
        // console.log(`✏️ User ${username} stopped typing in universe chat: ${universeId} (room: ${roomName})`);

        socket.to(roomName).emit('universe_chat_user_stopped_typing', {
          userId,
          universeId
        });
      });

      socket.on('universe_message', async (data) => {
        try {
          const { universeId, message } = data;
          const userId = socket.data.userId;

          if (!userId || !universeId || !message) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
          }

          // Check if user is banned
          const isBanned = await ModerationService.isUserBanned(userId, universeId);
          if (isBanned) {
            socket.emit('error', { message: 'You are banned from this universe chat' });
            return;
          }

          // Check rate limiting
          const isRateLimited = await ModerationService.isRateLimited(userId, universeId);
          if (isRateLimited) {
            socket.emit('error', { message: 'You are sending messages too fast' });
            return;
          }

          // Moderate message
          const moderation = ModerationService.moderateMessage(message.content);
          if (!moderation.isAllowed) {
            socket.emit('error', { message: moderation.reason || 'Message not allowed' });
            return;
          }

          // Broadcast message to all users in the universe chat
          this.io.to(`universe_chat_${universeId}`).emit('universe_message_received', {
            universeId,
            message: {
              ...message,
              content: moderation.filteredContent || message.content
            }
          });

          // console.log(`📨 Universe message broadcasted to ${universeId}`);
        } catch (error) {
          console.error('Error handling universe message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Message deletion
      socket.on('delete_universe_message', async (data) => {
        try {
          const { universeId, messageId } = data;
          const userId = socket.data.userId;

          if (!userId || !universeId || !messageId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
          }

          // Check if user is moderator
          const isModerator = await UniverseChatService.isModerator(userId, universeId);
          if (!isModerator) {
            socket.emit('error', { message: 'Insufficient permissions' });
            return;
          }

          // Broadcast message deletion
          this.io.to(`universe_chat_${universeId}`).emit('universe_message_deleted', {
            universeId,
            messageId
          });

          // console.log(`🗑️ Message ${messageId} deleted in universe ${universeId}`);
        } catch (error) {
          console.error('Error deleting universe message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });
    });
  }

  // Match-Notification senden
  public sendMatchNotification(userId: string, data: any) {
    if (!this.io) return;
  
    this.io.to(`user_${userId}`).emit('match_notification', {
      type: 'match',
      timestamp: new Date().toISOString(),
      ...data
    });
  
    // console.log('📱 Match notification sent to user:', userId);
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
    // console.log(`📡 Broadcasting message to conversation ${conversationId}`);
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
      // console.log(`📤 Sent ${event} to user ${userId} (${userSocketSet.size} connections)`);
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
    // console.log(`🔄 Notifying conversation update: ${conversationId}`);
    this.io.to(`conversation:${conversationId}`).emit('conversation_refresh');
  }

  // Cleanup für Typing Indicators
  public cleanupTypingIndicators() {
    this.io.emit('cleanup_typing');
  }

  // Public Broadcasting Methods für Universe Chat
  public broadcastToUniverseChat(universeId: string, event: string, data: any) {
    // console.log(`📡 Broadcasting ${event} to universe_chat:${universeId}`);
    this.io.to(`universe_chat:${universeId}`).emit(event, data);
  }

  public broadcastUniverseChatMessage(universeId: string, message: any) {
    const roomName = `universe_chat:${universeId}`;
    // console.log(`📡 Broadcasting message to ${roomName}`);
    this.io.to(roomName).emit('universe_chat_message', {
      universeId,
      message
    });
  }

  public broadcastUniverseChatSystemMessage(universeId: string, systemData: any) {
    const roomName = `universe_chat:${universeId}`;
    // console.log(`📡 Broadcasting system message to ${roomName}`);
    this.io.to(roomName).emit('universe_chat_system', {
      universeId,
      systemData
    });
  }

  public broadcastUniverseChatMessageDeleted(universeId: string, messageId: string, moderatorId: string, reason?: string) {
    const roomName = `universe_chat:${universeId}`;
    // console.log(`📡 Broadcasting message deletion to ${roomName}`);
    this.io.to(roomName).emit('universe_chat_message_deleted', {
      universeId,
      messageId,
      moderatorId,
      reason
    });
  }

  public broadcastUniverseChatTyping(universeId: string, userId: string, username: string, isTyping: boolean) {
    const event = isTyping ? 'universe_chat_user_typing' : 'universe_chat_user_stopped_typing';
    // console.log(`📡 Broadcasting typing status to universe_chat:${universeId}`);
    this.io.to(`universe_chat:${universeId}`).emit(event, {
      universeId,
      userId,
      username
    });
  }

  public broadcastUniverseChatUserJoined(universeId: string, user: any) {
    const roomName = `universe_chat:${universeId}`;
    // console.log(`📡 Broadcasting user joined to ${roomName}`);
    this.io.to(roomName).emit('universe_user_joined', {
      universeId,
      user
    });
  }

  public broadcastUniverseChatUserLeft(universeId: string, userId: string) {
    const roomName = `universe_chat:${universeId}`;
    // console.log(`📡 Broadcasting user left to ${roomName}`);
    this.io.to(roomName).emit('universe_user_left', {
      universeId,
      userId
    });
  }

  // General Broadcasting Method
  public broadcastToRoom(room: string, event: string, data: any) {
    // console.log(`📡 Broadcasting ${event} to room ${room}`);
    this.io.to(room).emit(event, data);
  }

  public broadcastToAllUsers(event: string, data: any) {
    // console.log(`📡 Broadcasting ${event} to all connected users`);
    this.io.emit(event, data);
  }

  // Connection Status Methods
  public getUserConnections(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  public getTotalConnections(): number {
    return this.io.sockets.sockets.size;
  }

  public getUniverseChatParticipants(universeId: string): string[] {
    return Array.from(this.universeRooms.get(universeId) || []);
  }

  // Nachricht an Conversation senden (mit Sender-Ausschluss)
  public sendToConversation(conversationId: string, event: string, data: any, excludeUserId?: string) {
    // console.log(`📡 Sending ${event} to conversation ${conversationId}${excludeUserId ? ` (excluding ${excludeUserId})` : ''}`);

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

  // Get online users in universe chat
  getOnlineUsersInUniverse(universeId: string): string[] {
    return Array.from(this.universeRooms.get(universeId) || []);
  }

  // Send system message to universe chat
  sendSystemMessageToUniverse(universeId: string, message: string) {
    this.broadcastToUniverseChat(`universe_chat:${universeId}`, 'universe_system_message', {
      universeId,
      message,
      timestamp: new Date().toISOString()
    });
  }

  // User Info Helper Method
  private async getUserInfo(userId: string): Promise<any> {
    try {
      const [user] = await db
        .select({
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
          displayName: usersTable.displayName,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName 
        })
        .from(usersTable)
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        firstName: user.firstName,
        lastName: user.lastName
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        id: userId,
        username: 'Unknown',
        displayName: 'Unknown User'
      };
    }
  }

  // Handle User Disconnect
  private handleUserDisconnect(userId: string, socketId: string) {
    // Remove from regular user tracking
    this.removeUserSocket(userId, socketId);

    // Remove from all universe rooms
    for (const [universeId, users] of this.universeRooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        
        // Notify others about user leaving
        this.io.to(`universe_chat_${universeId}`).emit('universe_user_left', {
          universeId,
          userId
        });

        // console.log(`👋 User ${userId} auto-left universe chat ${universeId} on disconnect`);
      }
    }
  }

  // Get online users in universe with user info
  async getOnlineUsersInUniverseWithInfo(universeId: string): Promise<any[]> {
    const userIds = Array.from(this.universeRooms.get(universeId) || []);
    const users = [];

    for (const userId of userIds) {
      const userInfo = await this.getUserInfo(userId);
      users.push({
        ...userInfo,
        isOnline: true
      });
    }

    return users;
  }

  // Check if user is moderator (delegated to UniverseChatService)
  async isUserModerator(userId: string, universeId: string): Promise<boolean> {
    try {
      return await UniverseChatService.isModerator(userId, universeId);
    } catch (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
  }

  // Comprehensive Disconnect Handler
  private handleComprehensiveDisconnect(userId: string, socketId: string, username: string) {
    // Regular user socket cleanup
    this.removeUserSocket(userId, socketId);

    // Universe chat cleanup mit KONSISTENTEN Room-Namen
    for (const [universeId, users] of this.universeRooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);

        // KONSISTENTER ROOM NAME
        const roomName = `universe_chat:${universeId}`;
        this.io.to(roomName).emit('universe_user_left', {
          universeId,
          userId,
          username
        });

        // console.log(`👋 User ${userId} auto-left universe chat ${universeId} from room ${roomName} on disconnect`);
      }
    }

    // Database cleanup für langfristige Disconnects
    setTimeout(async () => {
      try {
        // Check ob User noch andere aktive Verbindungen hat
        if (!this.userSockets.has(userId)) {
          // User ist komplett offline - markiere als inactive in DB
          // console.log(`🧹 User ${userId} completely offline - cleaning up database`);
          // Hier könntest du UniverseChatService.markUserInactive(userId) aufrufen
        }
      } catch (error) {
        console.error('Error in delayed disconnect cleanup:', error);
      }
    }, 30000); // 30 Sekunden delay
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