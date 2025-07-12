import { db } from '../db/connection';
import { 
  universeChatRoomsTable, 
  universeChatMessagesTable,
  universeChatParticipantsTable,
  universeChatModerationTable,
  universesTable,
  universeMembersTable,
  usersTable,
  profilesTable
} from '../db/Schemas';
import { eq, and, desc, lt, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketService } from './websocketService';
import { ModerationService } from './moderationService';

// Aliases für bessere Lesbarkeit
const sender = alias(usersTable, 'sender');
const senderProfile = alias(profilesTable, 'senderProfile');

export class UniverseChatService {

  // Universe Chat Room abrufen oder erstellen
  static async getOrCreateChatRoom(universeId: string) {
    try {
      console.log(`🏠 Getting chat room for universe: ${universeId}`);

      // Prüfe ob Chat Room bereits existiert
      const existingRoom = await db
        .select()
        .from(universeChatRoomsTable)
        .where(eq(universeChatRoomsTable.universeId, universeId))
        .limit(1);

      if (existingRoom.length > 0) {
        console.log(`✅ Found existing chat room: ${existingRoom[0].id}`);
        return { success: true, chatRoom: existingRoom[0] };
      }

      // Erstelle neuen Chat Room
      const newRoom = await db
        .insert(universeChatRoomsTable)
        .values({
          universeId,
          isActive: true,
          isLocked: false,
          slowMode: false,
          autoModeration: true
        })
        .returning();

      console.log(`✅ Created new chat room: ${newRoom[0].id}`);
      return { success: true, chatRoom: newRoom[0] };

    } catch (error) {
      console.error('❌ Error getting/creating chat room:', error);
      return { success: false, error: 'Failed to get chat room' };
    }
  }

  // User dem Chat Room hinzufügen
  static async joinChatRoom(universeId: string, userId: string) {
    try {
      console.log(`👋 User ${userId} joining universe chat: ${universeId}`);

      // Prüfe Universe-Mitgliedschaft
      const membership = await db
        .select()
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.universeId, universeId),
            eq(universeMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return { success: false, error: 'Must be universe member to join chat' };
      }

      // Chat Room holen/erstellen
      const roomResult = await this.getOrCreateChatRoom(universeId);
      if (!roomResult.success || !roomResult.chatRoom) {
        return { success: false, error: 'Failed to get chat room' };
      }

      const chatRoom = roomResult.chatRoom;

      // Prüfe ob User bereits aktiver Teilnehmer ist
      const existingParticipant = await db
        .select()
        .from(universeChatParticipantsTable)
        .where(
          and(
            eq(universeChatParticipantsTable.universeId, universeId),
            eq(universeChatParticipantsTable.userId, userId),
            eq(universeChatParticipantsTable.isActive, true)
          )
        )
        .limit(1);

      if (existingParticipant.length > 0) {
        // Update last seen
        await db
          .update(universeChatParticipantsTable)
          .set({ lastSeenAt: new Date() })
          .where(eq(universeChatParticipantsTable.id, existingParticipant[0].id));

        return { success: true, chatRoom, alreadyJoined: true };
      }

      // Füge User als Teilnehmer hinzu
      await db
        .insert(universeChatParticipantsTable)
        .values({
          universeId,
          userId,
          isActive: true,
          joinedAt: new Date(),
          lastSeenAt: new Date()
        });

      // System-Nachricht senden
      await this.sendSystemMessage(chatRoom.id, universeId, {
        type: 'user_joined',
        userId,
        timestamp: new Date()
      });

      console.log(`✅ User ${userId} joined universe chat: ${universeId}`);
      return { success: true, chatRoom };

    } catch (error) {
      console.error('❌ Error joining chat room:', error);
      return { success: false, error: 'Failed to join chat room' };
    }
  }

  // User Chat Room verlassen
  static async leaveChatRoom(universeId: string, userId: string) {
    try {
      console.log(`👋 User ${userId} leaving universe chat: ${universeId}`);

      // Chat Room finden
      const chatRoom = await db
        .select()
        .from(universeChatRoomsTable)
        .where(eq(universeChatRoomsTable.universeId, universeId))
        .limit(1);

      if (chatRoom.length === 0) {
        return { success: false, error: 'Chat room not found' };
      }

      // Teilnehmer deaktivieren
      await db
        .update(universeChatParticipantsTable)
        .set({
          isActive: false,
          leftAt: new Date()
        })
        .where(
          and(
            eq(universeChatParticipantsTable.universeId, universeId),
            eq(universeChatParticipantsTable.userId, userId),
            eq(universeChatParticipantsTable.isActive, true)
          )
        );

      // System-Nachricht senden
      await this.sendSystemMessage(chatRoom[0].id, universeId, {
        type: 'user_left',
        userId,
        timestamp: new Date()
      });

      console.log(`✅ User ${userId} left universe chat: ${universeId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error leaving chat room:', error);
      return { success: false, error: 'Failed to leave chat room' };
    }
  }

  // Nachricht senden
  static async sendMessage(universeId: string, userId: string, content: string) {
    try {
      console.log(`📨 Sending universe chat message from ${userId} to ${universeId}`);

      // Validierung
      if (!content.trim()) {
        return { success: false, error: 'Message content is required' };
      }

      if (content.trim().length > 500) {
        return { success: false, error: 'Message too long (max 500 characters)' };
      }

      // Chat Room finden
      const chatRoom = await db
        .select()
        .from(universeChatRoomsTable)
        .where(eq(universeChatRoomsTable.universeId, universeId))
        .limit(1);

      if (chatRoom.length === 0) {
        return { success: false, error: 'Chat room not found' };
      }

      const room = chatRoom[0];

      // Prüfe ob Chat aktiv ist
      if (!room.isActive || room.isLocked) {
        return { success: false, error: 'Chat room is currently locked' };
      }

      // Prüfe Teilnehmer-Status
      const participant = await db
        .select()
        .from(universeChatParticipantsTable)
        .where(
          and(
            eq(universeChatParticipantsTable.universeId, universeId),
            eq(universeChatParticipantsTable.userId, userId),
            eq(universeChatParticipantsTable.isActive, true)
          )
        )
        .limit(1);

      if (participant.length === 0) {
        return { success: false, error: 'Must join chat room first' };
      }

      // Prüfe Mute-Status
      if (participant[0].isMuted) {
        const now = new Date();
        if (!participant[0].mutedUntil || participant[0].mutedUntil > now) {
          return { success: false, error: 'You are muted in this chat' };
        } else {
          // Mute ist abgelaufen - entferne es
          await db
            .update(universeChatParticipantsTable)
            .set({ isMuted: false, mutedUntil: null, mutedBy: null })
            .where(eq(universeChatParticipantsTable.id, participant[0].id));
        }
      }

      // Auto-Moderation (Basic)
      const moderatedContent = await this.moderateContent(content);
      if (moderatedContent.blocked) {
        return { success: false, error: 'Message blocked by auto-moderation' };
      }

      // Nachricht speichern
      const messageId = uuidv4();
      await db
        .insert(universeChatMessagesTable)
        .values({
          id: messageId,
          universeId,
          senderId: userId,
          content: moderatedContent.content,
          messageType: 'text',
          createdAt: new Date()
        });

      // Vollständige Nachricht mit Sender-Info laden
      const fullMessage = await this.getMessageWithDetails(messageId);

      if (!fullMessage.success || !fullMessage.message) {
        return { success: false, error: 'Failed to load message details' };
      }

      // WebSocket Broadcasting
      const websocketService = getWebSocketService();
      if (websocketService) {
        // Broadcast an alle Benutzer im Universe Chat
        websocketService.broadcastUniverseChatMessage(universeId, fullMessage.message);
        
        console.log(`📡 Message broadcasted to universe_chat:${universeId}`);
      }

        console.log(`✅ Universe chat message sent: ${messageId}`);
        return { success: true, message: fullMessage.message };

      } catch (error) {
        console.error('❌ Error sending universe chat message:', error);
        return { success: false, error: 'Failed to send message' };
      }
    }

  // Chat-Nachrichten abrufen
  static async getChatMessages(universeId: string, userId: string, page = 1, limit = 50) {
    try {
      console.log(`📜 Getting universe chat messages for ${universeId}, page ${page}`);

      // Prüfe Universe-Mitgliedschaft
      const membership = await db
        .select()
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.universeId, universeId),
            eq(universeMembersTable.userId, userId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return { success: false, error: 'Must be universe member to view chat' };
      }

      const offset = (page - 1) * limit;

      // Nachrichten mit Sender-Details laden
      const messages = await db
        .select({
          id: universeChatMessagesTable.id,
          content: universeChatMessagesTable.content,
          messageType: universeChatMessagesTable.messageType,
          isSystemMessage: universeChatMessagesTable.isSystemMessage,
          systemData: universeChatMessagesTable.systemData,
          isDeleted: universeChatMessagesTable.isDeleted,
          createdAt: universeChatMessagesTable.createdAt,
          sender: {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName
          },
          senderProfile: {
            avatarId: senderProfile.avatarId
          },
          senderRole: universeMembersTable.role // Universe-spezifische Rolle
        })
        .from(universeChatMessagesTable)
        .leftJoin(sender, eq(universeChatMessagesTable.senderId, sender.id))
        .leftJoin(senderProfile, eq(sender.id, senderProfile.userId))
        .leftJoin(universeMembersTable, and(
          eq(universeMembersTable.universeId, universeId),
          eq(universeMembersTable.userId, sender.id)
        ))
        .where(
          and(
            eq(universeChatMessagesTable.universeId, universeId),
            eq(universeChatMessagesTable.isDeleted, false)
          )
        )
        .orderBy(desc(universeChatMessagesTable.createdAt))
        .offset(offset)
        .limit(limit);

      console.log(`✅ Found ${messages.length} universe chat messages`);

      return {
        success: true,
        data: {
          messages: messages.reverse(), // Chronological order
          pagination: {
            page,
            limit,
            hasMore: messages.length === limit
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting universe chat messages:', error);
      return { success: false, error: 'Failed to get messages' };
    }
  }

  // Aktive Teilnehmer abrufen
  static async getActiveParticipants(universeId: string) {
    try {
      const participants = await db
        .select({
          id: universeChatParticipantsTable.id,
          userId: usersTable.id,
          username: usersTable.username,
          displayName: usersTable.displayName,
          role: universeMembersTable.role,
          joinedAt: universeChatParticipantsTable.joinedAt,
          lastSeenAt: universeChatParticipantsTable.lastSeenAt,
          isMuted: universeChatParticipantsTable.isMuted
        })
        .from(universeChatParticipantsTable)
        .innerJoin(usersTable, eq(universeChatParticipantsTable.userId, usersTable.id))
        .leftJoin(universeMembersTable, and(
          eq(universeMembersTable.universeId, universeId),
          eq(universeMembersTable.userId, usersTable.id)
        ))
        .where(
          and(
            eq(universeChatParticipantsTable.universeId, universeId),
            eq(universeChatParticipantsTable.isActive, true)
          )
        )
        .orderBy(desc(universeChatParticipantsTable.lastSeenAt));

      return { success: true, participants };

    } catch (error) {
      console.error('❌ Error getting active participants:', error);
      return { success: false, error: 'Failed to get participants' };
    }
  }

  // System-Nachricht senden
  private static async sendSystemMessage(chatRoomId: string, universeId: string, systemData: any) {
    try {
      await db
        .insert(universeChatMessagesTable)
        .values({
          universeId,
          senderId: null, // System message
          content: '',
          messageType: 'system',
          isSystemMessage: true,
          systemData: JSON.stringify(systemData),
          createdAt: new Date()
        });

      // WebSocket Broadcasting für System-Nachrichten
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastUniverseChatSystemMessage(universeId, systemData);
      }

    } catch (error) {
      console.error('❌ Error sending system message:', error);
    }
  }

  // Nachricht mit Details laden
  private static async getMessageWithDetails(messageId: string) {
    try {
      const message = await db
        .select({
          id: universeChatMessagesTable.id,
          content: universeChatMessagesTable.content,
          messageType: universeChatMessagesTable.messageType,
          isSystemMessage: universeChatMessagesTable.isSystemMessage,
          systemData: universeChatMessagesTable.systemData,
          createdAt: universeChatMessagesTable.createdAt,
          universeId: universeChatMessagesTable.universeId,
          sender: {
            id: sender.id,
            username: sender.username,
            displayName: sender.displayName
          },
          senderProfile: {
            avatarId: senderProfile.avatarId
          },
          senderRole: universeMembersTable.role
        })
        .from(universeChatMessagesTable)
        .leftJoin(sender, eq(universeChatMessagesTable.senderId, sender.id))
        .leftJoin(senderProfile, eq(sender.id, senderProfile.userId))
        .leftJoin(universeMembersTable, and(
          eq(universeMembersTable.universeId, universeChatMessagesTable.universeId),
          eq(universeMembersTable.userId, sender.id)
        ))
        .where(eq(universeChatMessagesTable.id, messageId))
        .limit(1);

      if (message.length === 0) {
        return { success: false, error: 'Message not found' };
      }

      return { success: true, message: message[0] };

    } catch (error) {
      console.error('❌ Error getting message details:', error);
      return { success: false, error: 'Failed to get message details' };
    }
  }

  // Content-Moderation (Basic)
  private static async moderateContent(content: string): Promise<{ content: string; blocked: boolean }> {
    const bannedWords = ['spam', 'scam', 'hack']; // Beispiel - sollte aus DB kommen
    
    let moderatedContent = content;
    let blocked = false;

    // Einfache Wortfilterung
    for (const word of bannedWords) {
      if (content.toLowerCase().includes(word.toLowerCase())) {
        blocked = true;
        break;
      }
    }

    return { content: moderatedContent, blocked };
  }

  // Check if user is moderator
  static async isModerator(userId: string, universeId: string): Promise<boolean> {
    try {
      // Check if user is universe creator
      const [universe] = await db
        .select({
          creatorId: universesTable.creatorId
        })
        .from(universesTable)
        .where(eq(universesTable.id, universeId))
        .limit(1);

      if (universe && universe.creatorId === userId) {
        return true;
      }

      // Check if user has moderator role in universe
      const [membership] = await db
        .select({
          role: universeMembersTable.role
        })
        .from(universeMembersTable)
        .where(
          and(
            eq(universeMembersTable.userId, userId),
            eq(universeMembersTable.universeId, universeId),
            eq(universeMembersTable.isActive, true)
          )
        )
        .limit(1);

      return membership?.role === 'moderator' || membership?.role === 'creator';
    } catch (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
  }

  // Moderation: Nachricht löschen
  static async deleteMessage(messageId: string, moderatorId: string, reason?: string) {
    try {
      console.log(`🗑️ Moderator ${moderatorId} deleting message ${messageId}`);

      // Prüfe Moderator-Berechtigung
      const message = await db
        .select({
          id: universeChatMessagesTable.id,
          universeId: universeChatMessagesTable.universeId,
          senderId: universeChatMessagesTable.senderId
        })
        .from(universeChatMessagesTable)
        .where(eq(universeChatMessagesTable.id, messageId))
        .limit(1);

      if (message.length === 0) {
        return { success: false, error: 'Message not found' };
      }

      const msg = message[0];

      // Prüfe Moderator-Rolle
      const isModerator = await this.isModerator(moderatorId, msg.universeId);
      if (!isModerator) {
        return { success: false, error: 'Insufficient permissions' };
      }

      // Nachricht als gelöscht markieren
      await db
        .update(universeChatMessagesTable)
        .set({
          isDeleted: true,
          deletedBy: moderatorId,
          deletedAt: new Date(),
          deletionReason: reason
        })
        .where(eq(universeChatMessagesTable.id, messageId));

      // Moderation-Log mit korrekten Parametern
      // Null-Check für senderId - System-Nachrichten haben senderId = null
      if (msg.senderId) {
        // Nur für User-Nachrichten loggen
        await ModerationService.logModerationAction(
          msg.universeId,
          moderatorId,
          msg.senderId,
          'delete_message',
          reason,
          messageId
        );
      } else {
        // Für System-Nachrichten separates Log
        console.log(`🗑️ System message ${messageId} deleted by moderator ${moderatorId}`);
        
        // Optional: Speichere System-Message-Deletion separat
        await ModerationService.logModerationAction(
          msg.universeId,
          moderatorId,
          moderatorId,
          'delete_system_message',
          reason || 'System message deleted',
          messageId
        );
      }

      // WebSocket notification
      const websocketService = getWebSocketService();
      if (websocketService) {
        websocketService.broadcastUniverseChatMessageDeleted(
          msg.universeId, 
          messageId, 
          moderatorId, 
          reason
        );
      }

      console.log(`✅ Message ${messageId} deleted by moderator ${moderatorId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  }

  // Cleanup: Inaktive Teilnehmer entfernen
  static async cleanupInactiveParticipants() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const result = await db
        .update(universeChatParticipantsTable)
        .set({
          isActive: false,
          leftAt: new Date()
        })
        .where(
          and(
            eq(universeChatParticipantsTable.isActive, true),
            lt(universeChatParticipantsTable.lastSeenAt, fiveMinutesAgo)
          )
        )
        .returning({ userId: universeChatParticipantsTable.userId });

      console.log(`🧹 Cleaned up ${result.length} inactive chat participants`);
      return { success: true, cleanedCount: result.length };

    } catch (error) {
      console.error('❌ Error cleaning up inactive participants:', error);
      return { success: false };
    }
  }
}