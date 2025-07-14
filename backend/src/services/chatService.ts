import { db } from '../db/connection';
import { 
  conversationsTable, 
  messagesTable, 
  typingIndicatorsTable 
} from '../db/Schemas';
import { usersTable, profilesTable } from '../db/Schemas';
import { eq, and, or, desc, sql, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketService } from './websocketService';
import { ChatPermissionService } from './chatPermissionService';

// Aliases für bessere Lesbarkeit
const p1 = alias(usersTable, 'p1');
const p2 = alias(usersTable, 'p2');
const pr1 = alias(profilesTable, 'pr1');
const pr2 = alias(profilesTable, 'pr2');
const lm = alias(messagesTable, 'lm');

export class ChatService {
  
  // Conversation zwischen zwei Usern finden oder erstellen
  static async getOrCreateConversation(user1Id: string, user2Id: string) {
    try {
      console.log(`🔍 Getting/Creating conversation between ${user1Id} and ${user2Id}`);

      // Chat-Berechtigung
      const permissionCheck = await ChatPermissionService.canUserSendMessage(user1Id, user2Id);
      if (!permissionCheck.canMessage) {
        return { 
          success: false, 
          error: permissionCheck.reason || 'You are not allowed to message this user',
          errorCode: 'PERMISSION_DENIED'
        };
      }

      // Prüfe ob Conversation bereits existiert (beide Richtungen)
      const existingConversation = await db
        .select({
          id: conversationsTable.id,
          participant1Id: conversationsTable.participant1Id,
          participant2Id: conversationsTable.participant2Id,
          isActive: conversationsTable.isActive,
          isBlocked: conversationsTable.isBlocked,
          blockedBy: conversationsTable.blockedBy,
          lastMessageAt: conversationsTable.lastMessageAt,
          createdAt: conversationsTable.createdAt
        })
        .from(conversationsTable)
        .where(
          or(
            and(
              eq(conversationsTable.participant1Id, user1Id),
              eq(conversationsTable.participant2Id, user2Id)
            ),
            and(
              eq(conversationsTable.participant1Id, user2Id),
              eq(conversationsTable.participant2Id, user1Id)
            )
          )
        )
        .limit(1);

      if (existingConversation.length > 0) {
        console.log(`✅ Found existing conversation: ${existingConversation[0].id}`);
        return { 
          success: true, 
          conversation: existingConversation[0],
          isNew: false 
        };
      }

      // Neue Conversation erstellen
      const conversationId = uuidv4();
      const now = new Date();

      console.log(`🆕 Creating new conversation: ${conversationId}`);

      await db.insert(conversationsTable).values({
        id: conversationId,
        type: 'direct',
        participant1Id: user1Id < user2Id ? user1Id : user2Id, // Konsistente Sortierung
        participant2Id: user1Id < user2Id ? user2Id : user1Id,
        isActive: true,
        isBlocked: false,
        requiresMatch: false, // Temporär deaktiviert für Tests
        createdAt: now,
        updatedAt: now
      });

      const newConversation = await db
        .select()
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId))
        .limit(1);

      // WebSocket-Benachrichtigung für neue Conversation
      const websocketService = getWebSocketService();
      if (websocketService) {
        console.log(`📡 Broadcasting new conversation to users: ${user1Id}, ${user2Id}`);
        
        // Sende an beide Teilnehmer
        websocketService.sendToUser(user1Id, 'new_conversation_created', {
          conversation: newConversation[0]
        });
        websocketService.sendToUser(user2Id, 'new_conversation_created', {
          conversation: newConversation[0]
        });
      }

      console.log(`✅ New conversation created: ${conversationId}`);
      return { 
        success: true, 
        conversation: newConversation[0],
        isNew: true 
      };

    } catch (error) {
      console.error('❌ Error getting or creating conversation:', error);
      return { success: false, error: 'Failed to create conversation' };
    }
  }

  // Nachrichten senden mit optimiertem WebSocket-Broadcasting
  static async sendMessage(conversationId: string, senderId: string, content: string, replyToId?: string) {
    try {
      console.log(`📨 Sending message to conversation ${conversationId} from ${senderId}`);

      // Prüfe Conversation-Berechtigung
      const conversation = await db
        .select({
          id: conversationsTable.id,
          participant1Id: conversationsTable.participant1Id,
          participant2Id: conversationsTable.participant2Id,
          isBlocked: conversationsTable.isBlocked,
          blockedBy: conversationsTable.blockedBy
        })
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId))
        .limit(1);

      if (conversation.length === 0) {
        console.log(`❌ Conversation ${conversationId} not found`);
        return { success: false, error: 'Conversation not found' };
      }

      const conv = conversation[0];

      // Finde Empfänger
      const recipientId = conv.participant1Id === senderId ? conv.participant2Id : conv.participant1Id;

      // Prüfe Chat-Berechtigung bei jeder Nachricht
      const permissionCheck = await ChatPermissionService.canUserSendMessage(senderId, recipientId);
      if (!permissionCheck.canMessage) {
        return { 
          success: false, 
          error: permissionCheck.reason || 'You are not allowed to message this user',
          errorCode: 'PERMISSION_DENIED'
        };
      }
      
      // Prüfe Berechtigung
      if (conv.participant1Id !== senderId && conv.participant2Id !== senderId) {
        console.log(`❌ User ${senderId} not authorized for conversation ${conversationId}`);
        return { success: false, error: 'Unauthorized' };
      }

      // Prüfe Blockierung
      if (conv.isBlocked) {
        console.log(`❌ Conversation ${conversationId} is blocked`);
        return { success: false, error: 'Chat is blocked' };
      }

      // Nachricht in Datenbank speichern
      const messageId = uuidv4();
      const now = new Date();

      await db.insert(messagesTable).values({
        id: messageId,
        conversationId,
        senderId,
        content: content.trim(),
        messageType: 'text',
        replyToId: replyToId || null,
        isRead: false,
        createdAt: now,
        updatedAt: now
      });

      // Conversation aktualisieren
      await db
        .update(conversationsTable)
        .set({
          lastMessageId: messageId,
          lastMessageAt: now,
          updatedAt: now
        })
        .where(eq(conversationsTable.id, conversationId));

      // Vollständige Nachricht mit Sender-Info laden
      const fullMessage = await db
        .select({
          id: messagesTable.id,
          conversationId: messagesTable.conversationId,
          content: messagesTable.content,
          messageType: messagesTable.messageType,
          replyToId: messagesTable.replyToId,
          isRead: messagesTable.isRead,
          createdAt: messagesTable.createdAt,
          sender: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          }
        })
        .from(messagesTable)
        .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(eq(messagesTable.id, messageId))
        .limit(1);

      const message = fullMessage[0];

      // WebSocket-Broadcasting an alle Conversation-Teilnehmer
      const websocketService = getWebSocketService();
      if (websocketService) {
        console.log(`📡 Broadcasting message via WebSocket to conversation ${conversationId}`);
        
        // Sende an alle Teilnehmer der Conversation (außer Sender)
        websocketService.sendMessageToConversation(conversationId, message, senderId);
        
        // Benachrichtige über Conversation-Update für Listen-Refresh
        websocketService.notifyConversationUpdate(conversationId);
      }

      console.log(`✅ Message sent successfully: ${messageId}`);
      return { 
        success: true, 
        message 
      };

    } catch (error) {
      console.error('❌ Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  // Nachrichten einer Conversation abrufen
  static async getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50) {
    try {
      console.log(`📜 Getting messages for conversation ${conversationId}, user ${userId}`);

      // Prüfe Berechtigung
      const conversation = await db
        .select({
          participant1Id: conversationsTable.participant1Id,
          participant2Id: conversationsTable.participant2Id
        })
        .from(conversationsTable)
        .where(eq(conversationsTable.id, conversationId))
        .limit(1);

      if (conversation.length === 0) {
        console.log(`❌ Conversation ${conversationId} not found`);
        return { success: false, error: 'Conversation not found' };
      }

      const conv = conversation[0];
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        console.log(`❌ User ${userId} not authorized for conversation ${conversationId}`);
        return { success: false, error: 'Unauthorized' };
      }

      const offset = (page - 1) * limit;

      // Nachrichten mit Sender-Info laden
      const messages = await db
        .select({
          id: messagesTable.id,
          conversationId: messagesTable.conversationId,
          content: messagesTable.content,
          messageType: messagesTable.messageType,
          replyToId: messagesTable.replyToId,
          isRead: messagesTable.isRead,
          isEdited: messagesTable.isEdited,
          isDeleted: messagesTable.isDeleted,
          createdAt: messagesTable.createdAt,
          sender: {
            id: usersTable.id,
            username: usersTable.username,
            displayName: usersTable.displayName,
            avatarId: profilesTable.avatarId
          }
        })
        .from(messagesTable)
        .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
        .leftJoin(profilesTable, eq(usersTable.id, profilesTable.userId))
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            eq(messagesTable.isDeleted, false)
          )
        )
        .orderBy(desc(messagesTable.createdAt))
        .offset(offset)
        .limit(limit);

      console.log(`✅ Found ${messages.length} messages for conversation ${conversationId}`);

      return {
        success: true,
        data: {
          messages: messages.reverse(), // Chronologische Reihenfolge
          pagination: {
            page,
            limit,
            hasMore: messages.length === limit
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  // User's Conversations abrufen
  static async getUserConversations(userId: string, page: number = 1, limit: number = 20) {
    try {
      console.log(`📋 Getting conversations for user ${userId}`);

      const offset = (page - 1) * limit;

      const conversations = await db
        .select({
          id: conversationsTable.id,
          type: conversationsTable.type,
          isActive: conversationsTable.isActive,
          isBlocked: conversationsTable.isBlocked,
          lastMessageAt: conversationsTable.lastMessageAt,
          createdAt: conversationsTable.createdAt,
          participant1: {
            id: p1.id,
            username: p1.username,
            displayName: p1.displayName,
            avatarId: pr1.avatarId
          },
          participant2: {
            id: p2.id,
            username: p2.username,
            displayName: p2.displayName,
            avatarId: pr2.avatarId
          },
          lastMessage: {
            content: lm.content,
            senderId: lm.senderId,
            createdAt: lm.createdAt
          },
          unreadCount: sql<number>`
            (SELECT COUNT(*) FROM messages m 
             WHERE m."conversationId" = ${conversationsTable.id} 
             AND m."senderId" != ${userId} 
             AND m."isRead" = false 
             AND m."isDeleted" = false)
          `
        })
        .from(conversationsTable)
        .leftJoin(p1, eq(conversationsTable.participant1Id, p1.id))
        .leftJoin(p2, eq(conversationsTable.participant2Id, p2.id))
        .leftJoin(pr1, eq(p1.id, pr1.userId))
        .leftJoin(pr2, eq(p2.id, pr2.userId))
        .leftJoin(lm, eq(conversationsTable.lastMessageId, lm.id))
        .where(
          and(
            or(
              eq(conversationsTable.participant1Id, userId),
              eq(conversationsTable.participant2Id, userId)
            ),
            eq(conversationsTable.isActive, true)
          )
        )
        .orderBy(desc(conversationsTable.lastMessageAt))
        .offset(offset)
        .limit(limit);

      // Transform für Frontend
      const transformedConversations = conversations.map(conv => {
        const isUser1 = conv.participant1?.id === userId;
        const chatPartner = isUser1 ? conv.participant2 : conv.participant1;

        return {
          id: conv.id,
          type: conv.type,
          isActive: conv.isActive,
          isBlocked: conv.isBlocked,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
          chatPartner: {
            id: chatPartner?.id,
            username: chatPartner?.username,
            displayName: chatPartner?.displayName,
            avatarId: chatPartner?.avatarId
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            senderId: conv.lastMessage.senderId,
            createdAt: conv.lastMessage.createdAt,
            isFromMe: conv.lastMessage.senderId === userId
          } : null,
          unreadCount: conv.unreadCount || 0
        };
      });

      console.log(`✅ Found ${transformedConversations.length} conversations for user ${userId}`);

      return {
        success: true,
        data: {
          conversations: transformedConversations,
          pagination: {
            page,
            limit,
            hasMore: conversations.length === limit
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      return { success: false, error: 'Failed to get conversations' };
    }
  }

  // Nachrichten als gelesen markieren mit WebSocket-Update
  static async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      console.log(`👁️ Marking messages as read in conversation ${conversationId} for user ${userId}`);

      const result = await db
        .update(messagesTable)
        .set({
          isRead: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            eq(messagesTable.isRead, false),
            sql`${messagesTable.senderId} != ${userId}` // Nur fremde Nachrichten
          )
        )
        .returning({ id: messagesTable.id });

      if (result.length > 0) {
        console.log(`✅ Marked ${result.length} messages as read`);

        // WebSocket-Benachrichtigung für Read-Status
        const websocketService = getWebSocketService();
        if (websocketService) {
          websocketService.notifyConversationUpdate(conversationId);
        }
      }

      return { success: true, markedCount: result.length };
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }
  }

  // Typing Indicator - Optimiert für WebSocket
  static async setTyping(conversationId: string, userId: string) {
    try {
      // Direkte WebSocket-Übertragung statt Datenbank
      const websocketService = getWebSocketService();
      if (websocketService) {
        console.log(`✏️ User ${userId} typing in conversation ${conversationId}`);
        
        // Direktes Broadcasting über WebSocket (viel schneller als DB)
        websocketService.sendToConversation(conversationId, 'user_typing', {
          userId,
          conversationId,
          timestamp: new Date().toISOString()
        }, userId); // Exclude sender
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error setting typing indicator:', error);
      return { success: false, error: 'Failed to set typing indicator' };
    }
  }

  // Typing Stop - Optimiert für WebSocket
  static async stopTyping(conversationId: string, userId: string) {
    try {
      const websocketService = getWebSocketService();
      if (websocketService) {
        console.log(`✏️ User ${userId} stopped typing in conversation ${conversationId}`);
        
        websocketService.sendToConversation(conversationId, 'user_stopped_typing', {
          userId,
          conversationId,
          timestamp: new Date().toISOString()
        }, userId); // Exclude sender
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error stopping typing indicator:', error);
      return { success: false, error: 'Failed to stop typing indicator' };
    }
  }

  // Chat blockieren/entblockieren
  static async toggleBlockConversation(conversationId: string, userId: string, block: boolean) {
    try {
      console.log(`🚫 ${block ? 'Blocking' : 'Unblocking'} conversation ${conversationId} by user ${userId}`);

      await db
        .update(conversationsTable)
        .set({
          isBlocked: block,
          blockedBy: block ? userId : null,
          updatedAt: new Date()
        })
        .where(eq(conversationsTable.id, conversationId));

      // WebSocket-Benachrichtigung
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.notifyConversationUpdate(conversationId);
      }

      console.log(`✅ Conversation ${conversationId} ${block ? 'blocked' : 'unblocked'}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error toggling block conversation:', error);
      return { success: false, error: 'Failed to toggle block' };
    }
  }

  // Cleanup-Methoden (können periodisch aufgerufen werden)
  static async cleanupTypingIndicators() {
    try {
      const now = new Date();
      const result = await db
        .delete(typingIndicatorsTable)
        .where(lt(typingIndicatorsTable.expiresAt, now))
        .returning({ id: typingIndicatorsTable.conversationId });

      console.log(`🧹 Cleaned up ${result.length} expired typing indicators`);
      return { success: true, cleanedCount: result.length };
    } catch (error) {
      console.error('❌ Error cleaning up typing indicators:', error);
      return { success: false };
    }
  }

  // Conversation-Statistiken
  static async getConversationStats(conversationId: string, userId: string) {
    try {
      const stats = await db
        .select({
          totalMessages: sql<number>`COUNT(*)`,
          unreadMessages: sql<number>`COUNT(CASE WHEN "isRead" = false AND "senderId" != ${userId} THEN 1 END)`
        })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            eq(messagesTable.isDeleted, false)
          )
        );

      return {
        success: true,
        stats: stats[0] || { totalMessages: 0, unreadMessages: 0 }
      };
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error);
      return { success: false, error: 'Failed to get conversation stats' };
    }
  }
}